import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { GeminiFlashcard, GeminiResponse } from '@/lib/gemini';
import { FlashcardSetInsert, FlashcardInsert, GeminiRequestInsert, Flashcard, FlashcardSet } from '@/lib/database.types';

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
  return session;
}

async function fetchFlashcardSets(): Promise<FlashcardSet[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from('flashcard_sets')
    .select(`
      *,
      notes (
        id,
        title
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching flashcard sets:', error);
    throw error;
  }

  return data || [];
}

async function fetchFlashcardSet(setId: string): Promise<FlashcardSet | null> {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .select(`
      *,
      notes (
        id,
        title
      )
    `)
    .eq('id', setId)
    .single();

  if (error) {
    console.error('Error fetching flashcard set:', error);
    return null;
  }

  return data;
}

async function fetchStudySetData(setId: string): Promise<StudySetData | null> {
  // Fetch set and cards in parallel
  const [setResult, cardsResult] = await Promise.all([
    supabase
      .from('flashcard_sets')
      .select(`
        *,
        notes (
          id,
          title
        )
      `)
      .eq('id', setId)
      .single(),
    supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', setId)
      .order('position', { ascending: true })
  ]);

  if (setResult.error || !setResult.data) {
    console.error('Error fetching flashcard set:', setResult.error);
    return null;
  }

  if (cardsResult.error) {
    console.error('Error fetching flashcards:', cardsResult.error);
    return null;
  }

  const cards = (cardsResult.data || []) as Flashcard[];
  const masteredCount = cards.filter((c: Flashcard) => c.status === 'mastered').length;

  return {
    set: setResult.data,
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

  const flashcardSet: FlashcardSetInsert = {
    user_id: session.user.id,
    note_id: noteId,
    title: setTitle,
    description: `AI-generated flashcards from note content`,
    total_cards: 0,
    mastered_cards: 0
  };

  const { data, error } = await supabase
    .from('flashcard_sets')
    .insert(flashcardSet)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating flashcard set:', error);
    throw error;
  }

  return data.id;
}

async function saveFlashcardsToSet(
  setId: string,
  noteId: string | null,
  flashcards: GeminiFlashcard[],
  startPosition: number = 0
): Promise<void> {
  const flashcardInserts: FlashcardInsert[] = flashcards.map((flashcard, index) => ({
    set_id: setId,
    note_id: noteId,
    question: flashcard.question,
    answer: flashcard.answer,
    status: 'new',
    difficulty_level: convertDifficultyToLevel(flashcard.difficulty),
    position: startPosition + index,
    review_count: 0,
    correct_count: 0
  }));

  const { error } = await supabase
    .from('flashcards')
    .insert(flashcardInserts);

  if (error) {
    console.error('Error saving flashcards:', error);
    throw error;
  }
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
    const { error: deleteError } = await supabase
      .from('flashcards')
      .delete()
      .eq('set_id', setId);

    if (deleteError) {
      console.error('Error deleting existing flashcards:', deleteError);
      throw deleteError;
    }
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

  await saveFlashcardsToSet(setId, null, flashcards, startPosition);

  const { data: cardCount } = await supabase
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('set_id', setId);

  const { error: updateError } = await supabase
    .from('flashcard_sets')
    .update({
      total_cards: cardCount || 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', setId);

  if (updateError) {
    console.error('Error updating flashcard set:', updateError);
    throw updateError;
  }
}

async function updateFlashcardStatus({ flashcardId, status, wasCorrect }: UpdateStatusParams): Promise<Flashcard | null> {
  const { data: currentCard, error: fetchError } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', flashcardId)
    .single();

  if (fetchError || !currentCard) {
    console.error('Error fetching current flashcard:', fetchError);
    return null;
  }

  const updateData: Partial<Flashcard> = {
    status,
    last_reviewed: new Date().toISOString()
  };

  if (wasCorrect !== undefined) {
    updateData.review_count = currentCard.review_count + 1;
    if (wasCorrect) {
      updateData.correct_count = currentCard.correct_count + 1;
    }
  }

  const { data, error } = await supabase
    .from('flashcards')
    .update(updateData)
    .eq('id', flashcardId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating flashcard status:', error);
    return null;
  }

  return data as Flashcard;
}

async function deleteFlashcardSet(setId: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('flashcard_sets')
    .delete()
    .eq('id', setId)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error deleting flashcard set:', error);
    throw error;
  }
}

async function togglePublicStatus({ setId, isPublic }: { setId: string; isPublic: boolean }): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('flashcard_sets')
    .update({ is_public: isPublic })
    .eq('id', setId)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error updating flashcard set public status:', error);
    throw error;
  }
}

// ============================================
// Query Hooks
// ============================================

export function useFlashcardSets() {
  return useQuery({
    queryKey: flashcardKeys.lists(),
    queryFn: fetchFlashcardSets,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useFlashcardSet(setId: string | undefined) {
  return useQuery({
    queryKey: flashcardKeys.detail(setId || ''),
    queryFn: () => fetchFlashcardSet(setId!),
    enabled: !!setId,
    staleTime: 60 * 1000,
  });
}

export function useStudySetData(setId: string | undefined) {
  return useQuery({
    queryKey: flashcardKeys.studyData(setId || ''),
    queryFn: () => fetchStudySetData(setId!),
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

// ============================================
// Re-export types for convenience
// ============================================

export type { Flashcard, FlashcardSet } from '@/lib/database.types';
