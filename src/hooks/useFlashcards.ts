import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { db, queueSyncOperation } from '@/lib/db';
import { GeminiFlashcard, GeminiResponse } from '@/lib/gemini';
import { FlashcardSetInsert, FlashcardInsert, GeminiRequestInsert, Flashcard, FlashcardSet } from '@/lib/database.types';
import { buildFlashcardProgressReset, buildFlashcardSetProgressReset } from '@/lib/flashcardReset';

const supabase = createClient();

// ============================================
// Types
// ============================================

export interface StudySetData {
  set: FlashcardSet;
  cards: Flashcard[];
  progress: {
    total: number;
    mastered: number;
    percentage: number;
  };
}

export interface SaveFlashcardsOptions {
  noteId?: string;
  noteTitle?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  geminiResponse: GeminiResponse;
}

export interface ReforgeOptions {
  setId: string;
  action: 'add_more' | 'regenerate';
  flashcards: GeminiFlashcard[];
}

export interface UpdateStatusParams {
  flashcardId: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
  wasCorrect?: boolean;
}

// ============================================
// Query Keys
// ============================================

export const flashcardKeys = {
  all: ['flashcards'] as const,
  lists: () => [...flashcardKeys.all, 'list'] as const,
  detail: (setId: string) => [...flashcardKeys.all, 'detail', setId] as const,
  studyData: (setId: string) => [...flashcardKeys.all, 'study', setId] as const,
  publicSet: (setId: string) => [...flashcardKeys.all, 'public', setId] as const,
  publicCards: (setId: string) => [...flashcardKeys.all, 'public-cards', setId] as const,
};

// ============================================
// Utility Functions
// ============================================

function convertDifficultyToLevel(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy': return 1;
    case 'medium': return 2;
    case 'hard': return 3;
    default: return 2;
  }
}

// ============================================
// API Functions
// ============================================

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('verso_last_active_user_id', session.user.id);
    }
    return session;
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
    const lastId = localStorage.getItem('verso_last_active_user_id');
    if (lastId) return { user: { id: lastId } } as any;
  }

  return session;
}

async function fetchFlashcardSets(queryClient?: any): Promise<FlashcardSet[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const localSets = await db.flashcardSets
    .where('user_id').equals(session.user.id)
    .reverse()
    .sortBy('created_at');

  if (typeof window !== 'undefined' && navigator.onLine) {
    const fetchFromSupabase = async () => {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`*, notes (id, title)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        let updated = false;
        await db.transaction('rw', db.flashcardSets, async () => {
          for (const set of data) {
            const existing = await db.flashcardSets.get(set.id);
            if (!existing || existing.sync_status === 'synced' || existing.updated_at < set.updated_at) {
              await db.flashcardSets.put({ ...set, sync_status: 'synced' } as any);
              updated = true;
            }
          }
        });
        if (updated && queryClient) {
          queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
        }
        return data as FlashcardSet[];
      }
      return null;
    };

    if (localSets.length === 0) {
      const networkData = await fetchFromSupabase();
      if (networkData) return networkData;
    } else {
      fetchFromSupabase();
    }
  }

  return (localSets as unknown as FlashcardSet[]) || [];
}

async function fetchFlashcardSet(setId: string, queryClient?: any): Promise<FlashcardSet | null> {
  const localSet = await db.flashcardSets.get(setId);

  if (typeof window !== 'undefined' && navigator.onLine) {
    const fetchFromSupabase = async () => {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`*, notes (id, title)`)
        .eq('id', setId)
        .single();

      if (!error && data) {
        await db.flashcardSets.put({ ...data, sync_status: 'synced' } as any);
        if (queryClient) queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(setId) });
        return data as FlashcardSet;
      }
      return null;
    };

    if (!localSet) {
      const networkData = await fetchFromSupabase();
      if (networkData) return networkData;
    } else {
      fetchFromSupabase();
    }
  }

  return (localSet as unknown as FlashcardSet) || null;
}

async function fetchStudySetData(setId: string, queryClient?: any): Promise<StudySetData | null> {
  const localSet = await db.flashcardSets.get(setId);
  const localCards = await db.flashcards.where('set_id').equals(setId).sortBy('position');

  if (typeof window !== 'undefined' && navigator.onLine) {
    const fetchFromSupabase = async () => {
      const [setResult, cardsResult] = await Promise.all([
        supabase.from('flashcard_sets').select(`*, notes (id, title)`).eq('id', setId).single(),
        supabase.from('flashcards').select('*').eq('set_id', setId).order('position', { ascending: true })
      ]);

      if (!setResult.error && setResult.data && !cardsResult.error && cardsResult.data) {
        await db.transaction('rw', db.flashcardSets, db.flashcards, async () => {
          await db.flashcardSets.put({ ...setResult.data, sync_status: 'synced' } as any);
          for (const card of cardsResult.data) {
            const existing = await db.flashcards.get(card.id);
            if (!existing || existing.sync_status === 'synced' || existing.updated_at < card.updated_at) {
              await db.flashcards.put({ ...card, sync_status: 'synced' } as any);
            }
          }
        });
        if (queryClient) queryClient.invalidateQueries({ queryKey: flashcardKeys.studyData(setId) });
        
        const cards = cardsResult.data as Flashcard[];
        const masteredCount = cards.filter((c: Flashcard) => c.status === 'mastered').length;
        return {
          set: setResult.data as FlashcardSet,
          cards,
          progress: {
            total: cards.length,
            mastered: masteredCount,
            percentage: cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0
          }
        };
      }
      return null;
    };

    if (!localSet || localCards.length === 0) {
      const networkData = await fetchFromSupabase();
      if (networkData) return networkData;
    } else {
      fetchFromSupabase();
    }
  }

  if (!localSet) return null;

  const cards = localCards as unknown as Flashcard[];
  const masteredCount = cards.filter((c: Flashcard) => c.status === 'mastered').length;

  return {
    set: localSet as unknown as FlashcardSet,
    cards,
    progress: {
      total: cards.length,
      mastered: masteredCount,
      percentage: cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0
    }
  };
}

async function fetchPublicFlashcardSet(setId: string) {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .select(`
      id,
      title,
      description,
      total_cards,
      user_id,
      created_at,
      profiles!inner(full_name)
    `)
    .eq('id', setId)
    .eq('is_public', true)
    .single();

  if (error) {
    console.error('Error fetching public flashcard set:', error);
    throw error;
  }

  return data;
}

async function fetchPublicFlashcards(setId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('id, question, answer, difficulty_level, position')
    .eq('set_id', setId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching public flashcards:', error);
    throw error;
  }

  return (data || []) as Flashcard[];
}

// ============================================
// Mutation Functions
// ============================================

async function createFlashcardSet(noteId: string | null, noteTitle: string): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const setTitle = noteTitle ? `Flashcards from: ${noteTitle}` : 'Generated Flashcards';
  const setId = crypto.randomUUID();
  const now = new Date().toISOString();

  const flashcardSet: FlashcardSetInsert = {
    id: setId,
    user_id: session.user.id,
    note_id: noteId,
    title: setTitle,
    description: `AI-generated flashcards from note content`,
    total_cards: 0,
    mastered_cards: 0,
    is_public: false,
    created_at: now,
    updated_at: now
  };

  await db.flashcardSets.put({ ...flashcardSet, sync_status: 'pending' } as any);
  const outboxId = await queueSyncOperation('flashcard_sets', setId, 'create', { ...flashcardSet, sync_status: 'pending' } as any);

  supabase
    .from('flashcard_sets')
    .insert(flashcardSet)
    .then(({ error }: { error: any }) => {
      if (!error) {
        db.flashcardSets.update(setId, { sync_status: 'synced' }).catch(() => {});
        db.syncOutbox.get(outboxId)
          .then((item) => item?.operation === 'create' ? db.syncOutbox.delete(outboxId) : undefined)
          .catch(() => {});
      }
    })
    .catch(() => console.log("Offline mode: Flashcard set creation will sync later"));

  return setId;
}

async function saveFlashcardsToSet(
  setId: string,
  noteId: string | null,
  flashcards: GeminiFlashcard[],
  startPosition: number = 0
): Promise<void> {
  const now = new Date().toISOString();
  const flashcardInserts: FlashcardInsert[] & { id?: string }[] = flashcards.map((flashcard, index) => ({
    id: crypto.randomUUID(),
    set_id: setId,
    note_id: noteId,
    question: flashcard.question,
    answer: flashcard.answer,
    status: 'new' as const,
    difficulty_level: convertDifficultyToLevel(flashcard.difficulty),
    position: startPosition + index,
    review_count: 0,
    correct_count: 0,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    lapses: 0,
    created_at: now,
    updated_at: now
  }));

  const outboxIds: string[] = [];
  for (const fc of flashcardInserts) {
    await db.flashcards.put({ ...fc, sync_status: 'pending' } as any);
    outboxIds.push(await queueSyncOperation('flashcards', fc.id!, 'create', { ...fc, sync_status: 'pending' } as any));
  }

  supabase
    .from('flashcards')
    .insert(flashcardInserts)
    .then(({ error }: { error: any }) => {
      if (!error) {
        Promise.all(flashcardInserts.map(fc => db.flashcards.update(fc.id!, { sync_status: 'synced' }))).catch(() => {});
        Promise.all(outboxIds.map(async (id) => {
          const item = await db.syncOutbox.get(id);
          if (item?.operation === 'create') await db.syncOutbox.delete(id);
        })).catch(() => {});
      }
    })
    .catch(() => console.log("Offline mode: Flashcards save will sync later"));
}

async function logGeminiRequest(
  noteId: string | null,
  prompt: string,
  response: GeminiResponse,
  status: 'completed' | 'failed' = 'completed',
  errorMessage?: string
): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) return;

  const geminiRequest: GeminiRequestInsert = {
    user_id: session.user.id,
    note_id: noteId,
    request_type: 'flashcard_generation',
    prompt,
    response: JSON.stringify(response.flashcards),
    status,
    tokens_used: response.total_tokens,
    cost_cents: response.cost_cents,
    error_message: errorMessage || null,
    completed_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('gemini_requests')
    .insert(geminiRequest);

  if (error) {
    console.error('Error logging Gemini request:', error);
  }
}

async function saveGeneratedFlashcards(options: SaveFlashcardsOptions): Promise<string> {
  const { noteId, noteTitle, difficulty, geminiResponse } = options;

  try {
    const setId = await createFlashcardSet(noteId || null, noteTitle || 'Untitled Note');
    await saveFlashcardsToSet(setId, noteId || null, geminiResponse.flashcards, 0);
    
    const prompt = `Generate ${geminiResponse.flashcards.length} ${difficulty} flashcards from note content`;
    await logGeminiRequest(noteId || null, prompt, geminiResponse);

    return setId;
  } catch (error) {
    const prompt = `Generate ${geminiResponse.flashcards.length} ${difficulty} flashcards from note content`;
    await logGeminiRequest(noteId || null, prompt, geminiResponse, 'failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function reforgeFlashcards({ setId, action, flashcards }: ReforgeOptions): Promise<void> {
  let startPosition = 0;

  if (action === 'regenerate') {
    const relatedCards = await db.flashcards.where('set_id').equals(setId).toArray();
    for (const card of relatedCards) {
      await queueSyncOperation('flashcards', card.id, 'delete', null);
      await db.flashcards.delete(card.id);
    }
    
    supabase
      .from('flashcards')
      .delete()
      .eq('set_id', setId)
      .catch(() => console.log("Offline reforge regenerate."));
  } else {
    // Attempt local count first
    const maxLocal = await db.flashcards.where('set_id').equals(setId).sortBy('position');
    if (maxLocal.length > 0) {
      startPosition = maxLocal[maxLocal.length - 1].position + 1;
    } else {
      const { data: maxPosData } = await supabase
        .from('flashcards')
        .select('position')
        .eq('set_id', setId)
        .order('position', { ascending: false })
        .limit(1)
        .single();
      startPosition = (maxPosData?.position ?? -1) + 1;
    }
  }

  await saveFlashcardsToSet(setId, null, flashcards, startPosition);

  // Update set count optimistically
  const localCards = await db.flashcards.where('set_id').equals(setId).toArray();
  const setUpdate = { total_cards: localCards.length, updated_at: new Date().toISOString(), sync_status: 'pending' } as any;
  await db.flashcardSets.update(setId, setUpdate);
  const localSet = await db.flashcardSets.get(setId);
  if (localSet) {
    await queueSyncOperation('flashcard_sets', setId, 'update', localSet as any);
  }

  supabase
    .from('flashcard_sets')
    .update({
      total_cards: localCards.length,
      updated_at: new Date().toISOString()
    })
    .eq('id', setId)
    .then(({ error }: { error: any }) => {
      if (!error) {
        db.flashcardSets.update(setId, { sync_status: 'synced' }).catch(() => {});
        db.syncOutbox.where('[table_name+record_id]').equals(['flashcard_sets', setId] as any).first()
          .then((outboxItem) => outboxItem ? db.syncOutbox.delete(outboxItem.id) : undefined)
          .catch(() => {});
      }
    })
    .catch(() => console.log("Offline mode: reforge will sync later"));
}

async function updateFlashcardStatus({ flashcardId, status, wasCorrect }: UpdateStatusParams): Promise<Flashcard | null> {
  const localCard = await db.flashcards.get(flashcardId);
  if (!localCard) return null;

  const updateData: Partial<Flashcard> = {
    status,
    last_reviewed: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (wasCorrect !== undefined) {
    updateData.review_count = localCard.review_count + 1;
    if (wasCorrect) {
      updateData.correct_count = localCard.correct_count + 1;
    }
  }

  await db.flashcards.update(flashcardId, { ...updateData, sync_status: 'pending' } as any);
  await queueSyncOperation('flashcards', flashcardId, 'update', { ...localCard, ...updateData, sync_status: 'pending' } as any);

  supabase
    .from('flashcards')
    .update(updateData)
    .eq('id', flashcardId)
    .then(({ error }: { error: any }) => {
      if (!error) {
        db.flashcards.update(flashcardId, { sync_status: 'synced' }).catch(() => {});
        db.syncOutbox.where('[table_name+record_id]').equals(['flashcards', flashcardId] as any).first()
          .then((outboxItem) => outboxItem ? db.syncOutbox.delete(outboxItem.id) : undefined)
          .catch(() => {});
      }
    })
    .catch(() => console.log("Offline mode: status sync deferred"));

  return { ...(localCard as any), ...updateData };
}

async function deleteFlashcardSet(setId: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const outboxId = await queueSyncOperation('flashcard_sets', setId, 'delete', null);
  await db.transaction('rw', db.flashcardSets, db.flashcards, db.syncOutbox, async () => {
    await db.flashcardSets.delete(setId);
    const relatedCards = await db.flashcards.where('set_id').equals(setId).toArray();
    for (const card of relatedCards) {
      await db.flashcards.delete(card.id);
    }
  });

  supabase
    .from('flashcard_sets')
    .delete()
    .eq('id', setId)
    .eq('user_id', session.user.id)
    .then(({ error }: { error: any }) => {
      if (error) console.error('Error deleting flashcard set from server:', error);
      if (!error) db.syncOutbox.delete(outboxId).catch(() => {});
    })
    .catch(() => console.log("Offline mode: Flashcard set deleted locally. Will attempt delete on server later."));
}

async function togglePublicStatus({ setId, isPublic }: { setId: string; isPublic: boolean }): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  await db.flashcardSets.update(setId, { is_public: isPublic, sync_status: 'pending' } as any);
  const localSet = await db.flashcardSets.get(setId);
  if (localSet) {
    await queueSyncOperation('flashcard_sets', setId, 'update', localSet as any);
  }

  supabase
    .from('flashcard_sets')
    .update({ is_public: isPublic })
    .eq('id', setId)
    .eq('user_id', session.user.id)
    .then(({ error }: { error: any }) => {
      if (!error) {
        db.flashcardSets.update(setId, { sync_status: 'synced' }).catch(() => {});
        db.syncOutbox.where('[table_name+record_id]').equals(['flashcard_sets', setId] as any).first()
          .then((outboxItem) => outboxItem ? db.syncOutbox.delete(outboxItem.id) : undefined)
          .catch(() => {});
      }
    })
    .catch(() => console.log("Offline mode: Public status toggle will sync later"));
}

async function resetFlashcardSetProgress(setId: string): Promise<void> {
  const now = new Date().toISOString();
  const cardReset = buildFlashcardProgressReset(now);
  const setReset = buildFlashcardSetProgressReset(now);
  const localCards = await db.flashcards.where('set_id').equals(setId).toArray();

  await db.transaction('rw', db.flashcardSets, db.flashcards, db.syncOutbox, async () => {
    for (const card of localCards) {
      await db.flashcards.update(card.id, { ...cardReset, sync_status: 'pending' } as any);
      await queueSyncOperation('flashcards', card.id, 'update', { ...card, ...cardReset, sync_status: 'pending' } as any);
    }

    await db.flashcardSets.update(setId, { ...setReset, sync_status: 'pending' } as any);
    const localSet = await db.flashcardSets.get(setId);
    if (localSet) {
      await queueSyncOperation('flashcard_sets', setId, 'update', localSet as any);
    }
  });

  try {
    const { error: cardsError } = await supabase
      .from('flashcards')
      .update(cardReset)
      .eq('set_id', setId);

    if (cardsError) throw cardsError;

    const { error: setError } = await supabase
      .from('flashcard_sets')
      .update(setReset)
      .eq('id', setId);

    if (setError) throw setError;

    await db.transaction('rw', db.flashcardSets, db.flashcards, db.syncOutbox, async () => {
      for (const card of localCards) {
        await db.flashcards.update(card.id, { sync_status: 'synced' });
        const outboxItem = await db.syncOutbox.where('[table_name+record_id]').equals(['flashcards', card.id] as any).first();
        if (outboxItem) await db.syncOutbox.delete(outboxItem.id);
      }
      await db.flashcardSets.update(setId, { sync_status: 'synced' });
      const setOutboxItem = await db.syncOutbox.where('[table_name+record_id]').equals(['flashcard_sets', setId] as any).first();
      if (setOutboxItem) await db.syncOutbox.delete(setOutboxItem.id);
    });
  } catch (error) {
    console.log('Offline mode: flashcard progress reset will sync later', error);
  }
}

// ============================================
// Query Hooks
// ============================================

export function useFlashcardSets() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: flashcardKeys.lists(),
    queryFn: () => fetchFlashcardSets(queryClient),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useFlashcardSet(setId: string | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: flashcardKeys.detail(setId || ''),
    queryFn: () => fetchFlashcardSet(setId!, queryClient),
    enabled: !!setId,
    staleTime: 60 * 1000,
  });
}

export function useStudySetData(setId: string | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: flashcardKeys.studyData(setId || ''),
    queryFn: () => fetchStudySetData(setId!, queryClient),
    enabled: !!setId,
    staleTime: 30 * 1000, // 30 seconds - study data changes more frequently
  });
}

export function usePublicFlashcardSet(setId: string | undefined) {
  return useQuery({
    queryKey: flashcardKeys.publicSet(setId || ''),
    queryFn: () => fetchPublicFlashcardSet(setId!),
    enabled: !!setId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePublicFlashcards(setId: string | undefined) {
  return useQuery({
    queryKey: flashcardKeys.publicCards(setId || ''),
    queryFn: () => fetchPublicFlashcards(setId!),
    enabled: !!setId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useSaveGeneratedFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveGeneratedFlashcards,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
}

export function useReforgeFlashcards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reforgeFlashcards,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(variables.setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.studyData(variables.setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
}

export function useUpdateFlashcardStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFlashcardStatus,
    onSuccess: (data) => {
      if (data?.set_id) {
        queryClient.invalidateQueries({ queryKey: flashcardKeys.studyData(data.set_id) });
      }
    },
  });
}

export function useDeleteFlashcardSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFlashcardSet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
}

export function useTogglePublicStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePublicStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(variables.setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
}

export function useResetFlashcardProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetFlashcardSetProgress,
    onSuccess: (_, setId) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.studyData(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
}

// ============================================
// Re-export types for convenience
// ============================================

export type { Flashcard, FlashcardSet } from '@/lib/database.types';
