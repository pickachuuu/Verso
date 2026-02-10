'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import {
  ExamQuestionInsert,
  ExamSetInsert,
  FlashcardInsert,
  FlashcardSetInsert,
  NoteInsert,
  SavedItemInsert,
} from '@/lib/database.types';
import { generateUniqueSlug } from '@/lib/slug';
import { noteKeys } from '@/hooks/useNotes';
import { flashcardKeys } from '@/hooks/useFlashcards';
import { examKeys } from '@/hooks/useExams';

const supabase = createClient();

export type SavedMaterialType = 'note' | 'flashcard' | 'exam';

export interface SavedMaterialItem {
  id: string;
  type: SavedMaterialType;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  updatedAt: string;
  savedAt: string;
  savedAtLabel: string;
  href: string;
}

type SavedItemRow = {
  item_id: string;
  item_type: SavedMaterialType;
  created_at: string | null;
};

type PublicNoteRow = {
  id: string;
  title: string | null;
  content: string | null;
  tags: string[] | null;
  user_id: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type PublicFlashcardSetRow = {
  id: string;
  title: string | null;
  description: string | null;
  total_cards: number | null;
  user_id: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type PublicExamSetRow = {
  id: string;
  title: string | null;
  description: string | null;
  total_questions: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed' | null;
  user_id: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type NotePageRow = {
  title: string | null;
  content: string | null;
  page_order: number | null;
};

type FlashcardRow = {
  question: string;
  answer: string;
  difficulty_level: FlashcardInsert['difficulty_level'];
  position: number | null;
};

type ExamQuestionRow = {
  question_type: ExamQuestionInsert['question_type'];
  question: string;
  correct_answer: string | null;
  options: string[] | null;
  points: number;
  position: number | null;
};

export const savedKeys = {
  all: ['saved-materials'] as const,
  list: () => [...savedKeys.all, 'list'] as const,
};

function timeAgo(dateString?: string | null): string {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(text: string, maxLength = 140): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function fetchSavedMaterials(): Promise<SavedMaterialItem[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const { data: savedRows, error: savedError } = await supabase
    .from('saved_items')
    .select('item_id, item_type, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (savedError) {
    console.error('Error fetching saved materials:', savedError);
    throw savedError;
  }

  const savedItems = (savedRows || []) as SavedItemRow[];
  if (savedItems.length === 0) return [];

  const noteIds = savedItems.filter((item) => item.item_type === 'note').map((item) => item.item_id);
  const flashcardIds = savedItems.filter((item) => item.item_type === 'flashcard').map((item) => item.item_id);
  const examIds = savedItems.filter((item) => item.item_type === 'exam').map((item) => item.item_id);

  const [notesResult, flashcardsResult, examsResult] = await Promise.all([
    noteIds.length > 0
      ? supabase.from('notes').select('id, title, content, tags, user_id, updated_at, created_at').in('id', noteIds)
      : Promise.resolve({ data: [], error: null }),
    flashcardIds.length > 0
      ? supabase.from('flashcard_sets').select('id, title, description, total_cards, user_id, updated_at, created_at').in('id', flashcardIds)
      : Promise.resolve({ data: [], error: null }),
    examIds.length > 0
      ? supabase.from('exam_sets').select('id, title, description, total_questions, difficulty, user_id, updated_at, created_at').in('id', examIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (notesResult.error) {
    console.error('Error fetching saved notes:', notesResult.error);
    throw notesResult.error;
  }
  if (flashcardsResult.error) {
    console.error('Error fetching saved flashcards:', flashcardsResult.error);
    throw flashcardsResult.error;
  }
  if (examsResult.error) {
    console.error('Error fetching saved exams:', examsResult.error);
    throw examsResult.error;
  }

  const notes = (notesResult.data || []) as PublicNoteRow[];
  const flashcardSets = (flashcardsResult.data || []) as PublicFlashcardSetRow[];
  const exams = (examsResult.data || []) as PublicExamSetRow[];

  const userIds = Array.from(new Set([
    ...notes.map((note) => note.user_id),
    ...flashcardSets.map((set) => set.user_id),
    ...exams.map((exam) => exam.user_id),
  ])).filter((id): id is string => Boolean(id));

  const authorMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.warn('Unable to load profile names for saved materials:', profilesError);
    } else {
      const profileRows = (profiles || []) as ProfileRow[];
      profileRows.forEach((profile) => {
        if (profile.full_name) {
          authorMap.set(profile.id, profile.full_name);
        }
      });
    }
  }

  const savedAtMap = new Map<string, string>();
  savedItems.forEach((item) => {
    savedAtMap.set(`${item.item_type}:${item.item_id}`, item.created_at || '');
  });

  const combinedItems = [
    ...notes.map((note) => {
      const text = stripHtml(note.content || '');
      const summary = text ? truncateText(text) : 'No preview available yet.';
      const updatedAtRaw = note.updated_at || note.created_at || '';
      const savedAt = savedAtMap.get(`note:${note.id}`) || updatedAtRaw;
      return {
        id: note.id,
        type: 'note' as const,
        title: note.title || 'Untitled Note',
        summary,
        tags: note.tags || [],
        author: (note.user_id ? authorMap.get(note.user_id) : undefined) || 'Community member',
        updatedAt: timeAgo(updatedAtRaw),
        savedAt,
        savedAtLabel: timeAgo(savedAt),
        href: `/public/notes/${note.id}`,
        savedAtRaw: savedAt,
      };
    }),
    ...flashcardSets.map((set) => {
      const summary = set.description?.trim()
        ? set.description.trim()
        : `${set.total_cards || 0} cards to study.`;
      const updatedAtRaw = set.updated_at || set.created_at || '';
      const savedAt = savedAtMap.get(`flashcard:${set.id}`) || updatedAtRaw;
      return {
        id: set.id,
        type: 'flashcard' as const,
        title: set.title || 'Flashcard Set',
        summary,
        tags: [],
        author: (set.user_id ? authorMap.get(set.user_id) : undefined) || 'Community member',
        updatedAt: timeAgo(updatedAtRaw),
        savedAt,
        savedAtLabel: timeAgo(savedAt),
        href: `/public/flashcards/${set.id}`,
        savedAtRaw: savedAt,
      };
    }),
    ...exams.map((exam) => {
      const summary = exam.description?.trim()
        ? exam.description.trim()
        : `${exam.total_questions || 0} questions (${exam.difficulty || 'mixed'}).`;
      const updatedAtRaw = exam.updated_at || exam.created_at || '';
      const savedAt = savedAtMap.get(`exam:${exam.id}`) || updatedAtRaw;
      return {
        id: exam.id,
        type: 'exam' as const,
        title: exam.title || 'Exam',
        summary,
        tags: exam.difficulty ? [exam.difficulty] : [],
        author: (exam.user_id ? authorMap.get(exam.user_id) : undefined) || 'Community member',
        updatedAt: timeAgo(updatedAtRaw),
        savedAt,
        savedAtLabel: timeAgo(savedAt),
        href: `/public/exams/${exam.id}`,
        savedAtRaw: savedAt,
      };
    }),
  ];

  return combinedItems
    .sort((a, b) => {
      const bTime = b.savedAtRaw ? new Date(b.savedAtRaw).getTime() : 0;
      const aTime = a.savedAtRaw ? new Date(a.savedAtRaw).getTime() : 0;
      return bTime - aTime;
    })
    .map(({ savedAtRaw, ...item }) => item);
}

async function saveReference(itemType: SavedMaterialType, itemId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('User not authenticated');

  const newItem: SavedItemInsert = {
    user_id: session.user.id,
    item_type: itemType,
    item_id: itemId,
  };

  const { error } = await supabase
    .from('saved_items')
    .upsert(newItem, { onConflict: 'user_id,item_type,item_id', ignoreDuplicates: true });

  if (error) {
    console.error('Error saving reference:', error);
    throw error;
  }
}

async function removeReference(itemType: SavedMaterialType, itemId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', session.user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId);

  if (error) {
    console.error('Error removing reference:', error);
    throw error;
  }
}

async function copyPublicNote(noteId: string): Promise<{ id: string; slug: string }> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('User not authenticated');

  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('id, title, content, tags, cover_color')
    .eq('id', noteId)
    .eq('is_public', true)
    .single();

  if (noteError || !note) {
    console.error('Error loading public note:', noteError);
    throw noteError || new Error('Note not found');
  }

  const titleBase = note.title?.trim() || 'Untitled Note';
  const newTitle = `${titleBase} (copy)`;

  const noteInsert: NoteInsert = {
    user_id: session.user.id,
    title: newTitle,
    content: note.content || '',
    tags: note.tags || [],
    cover_color: note.cover_color || 'royal',
    slug: null,
  };

  const { data: createdNote, error: createError } = await supabase
    .from('notes')
    .insert(noteInsert)
    .select('id')
    .single();

  if (createError || !createdNote) {
    console.error('Error creating note copy:', createError);
    throw createError || new Error('Failed to create note copy');
  }

  const slug = generateUniqueSlug(newTitle, createdNote.id);
  const { error: slugError } = await supabase
    .from('notes')
    .update({ slug, updated_at: new Date().toISOString() })
    .eq('id', createdNote.id);

  if (slugError) {
    console.error('Error updating note slug:', slugError);
    throw slugError;
  }

  const { data: pages, error: pagesError } = await supabase
    .from('note_pages')
    .select('title, content, page_order')
    .eq('note_id', noteId)
    .order('page_order', { ascending: true });

  if (pagesError) {
    console.error('Error fetching note pages:', pagesError);
  }

  const pageRows = (pages || []) as NotePageRow[];
  if (pageRows.length > 0) {
    const pageInserts = pageRows.map((page) => ({
      note_id: createdNote.id,
      title: page.title || 'Untitled Page',
      content: page.content || '',
      page_order: page.page_order ?? 0,
    }));

    const { error: insertPagesError } = await supabase
      .from('note_pages')
      .insert(pageInserts);

    if (insertPagesError) {
      console.error('Error copying note pages:', insertPagesError);
    }
  }

  return { id: createdNote.id, slug };
}

async function copyPublicFlashcardSet(setId: string): Promise<{ id: string }> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('User not authenticated');

  const { data: setData, error: setError } = await supabase
    .from('flashcard_sets')
    .select('id, title, description')
    .eq('id', setId)
    .eq('is_public', true)
    .single();

  if (setError || !setData) {
    console.error('Error loading public flashcard set:', setError);
    throw setError || new Error('Flashcard set not found');
  }

  const { data: cards, error: cardsError } = await supabase
    .from('flashcards')
    .select('question, answer, difficulty_level, position')
    .eq('set_id', setId)
    .order('position', { ascending: true });

  if (cardsError) {
    console.error('Error loading flashcards:', cardsError);
    throw cardsError;
  }

  const newTitle = `${setData.title || 'Flashcard Set'} (copy)`;
  const setInsert: FlashcardSetInsert = {
    user_id: session.user.id,
    title: newTitle,
    description: setData.description || null,
    total_cards: 0,
    mastered_cards: 0,
    is_public: false,
  };

  const { data: createdSet, error: createError } = await supabase
    .from('flashcard_sets')
    .insert(setInsert)
    .select('id')
    .single();

  if (createError || !createdSet) {
    console.error('Error creating flashcard set copy:', createError);
    throw createError || new Error('Failed to create flashcard set');
  }

  const cardRows = (cards || []) as FlashcardRow[];
  const cardInserts: FlashcardInsert[] = cardRows.map((card, index) => ({
    set_id: createdSet.id,
    question: card.question,
    answer: card.answer,
    status: 'new',
    difficulty_level: card.difficulty_level,
    position: card.position ?? index,
  }));

  if (cardInserts.length > 0) {
    const { error: insertCardsError } = await supabase
      .from('flashcards')
      .insert(cardInserts);

    if (insertCardsError) {
      console.error('Error copying flashcards:', insertCardsError);
      throw insertCardsError;
    }
  }

  return { id: createdSet.id };
}

async function copyPublicExam(examId: string): Promise<{ id: string }> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('User not authenticated');

  const { data: examData, error: examError } = await supabase
    .from('exam_sets')
    .select('id, title, description, difficulty, time_limit_minutes, include_multiple_choice, include_identification, include_essay')
    .eq('id', examId)
    .eq('is_public', true)
    .single();

  if (examError || !examData) {
    console.error('Error loading public exam:', examError);
    throw examError || new Error('Exam not found');
  }

  const { data: questions, error: questionsError } = await supabase
    .from('exam_questions')
    .select('question_type, question, correct_answer, options, points, position')
    .eq('exam_id', examId)
    .order('position', { ascending: true });

  if (questionsError) {
    console.error('Error loading exam questions:', questionsError);
    throw questionsError;
  }

  const newTitle = `${examData.title || 'Exam'} (copy)`;
  const questionRows = (questions || []) as ExamQuestionRow[];
  const examInsert: ExamSetInsert = {
    user_id: session.user.id,
    title: newTitle,
    description: examData.description || null,
    difficulty: examData.difficulty,
    time_limit_minutes: examData.time_limit_minutes,
    include_multiple_choice: examData.include_multiple_choice,
    include_identification: examData.include_identification,
    include_essay: examData.include_essay,
    total_questions: questionRows.length,
    is_public: false,
  };

  const { data: createdExam, error: createError } = await supabase
    .from('exam_sets')
    .insert(examInsert)
    .select('id')
    .single();

  if (createError || !createdExam) {
    console.error('Error creating exam copy:', createError);
    throw createError || new Error('Failed to create exam copy');
  }

  const questionInserts: ExamQuestionInsert[] = questionRows.map((question, index) => ({
    exam_id: createdExam.id,
    question_type: question.question_type,
    question: question.question,
    correct_answer: question.correct_answer ?? '',
    options: question.options || null,
    points: question.points,
    position: question.position ?? index,
  }));

  if (questionInserts.length > 0) {
    const { error: insertQuestionsError } = await supabase
      .from('exam_questions')
      .insert(questionInserts);

    if (insertQuestionsError) {
      console.error('Error copying exam questions:', insertQuestionsError);
      throw insertQuestionsError;
    }
  }

  return { id: createdExam.id };
}

export function useSavedMaterials() {
  return useQuery({
    queryKey: savedKeys.list(),
    queryFn: fetchSavedMaterials,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: SavedMaterialType; itemId: string }) =>
      saveReference(itemType, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}

export function useRemoveReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemType, itemId }: { itemType: SavedMaterialType; itemId: string }) =>
      removeReference(itemType, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
    },
  });
}

export function useCopyPublicNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => copyPublicNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useCopyPublicFlashcardSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (setId: string) => copyPublicFlashcardSet(setId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.all });
    },
  });
}

export function useCopyPublicExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => copyPublicExam(examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}
