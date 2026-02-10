'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export type CommunityType = 'note' | 'flashcard' | 'exam';

export interface CommunityItem {
  id: string;
  type: CommunityType;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  updatedAt: string;
  href: string;
}

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

export const communityKeys = {
  all: ['community'] as const,
  items: () => [...communityKeys.all, 'items'] as const,
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

async function fetchCommunityItems(): Promise<CommunityItem[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id ?? null;

  const notesQuery = supabase
    .from('notes')
    .select('id, title, content, tags, user_id, updated_at, created_at')
    .eq('is_public', true);

  const flashcardsQuery = supabase
    .from('flashcard_sets')
    .select('id, title, description, total_cards, user_id, updated_at, created_at')
    .eq('is_public', true);

  const examsQuery = supabase
    .from('exam_sets')
    .select('id, title, description, total_questions, difficulty, user_id, updated_at, created_at')
    .eq('is_public', true);

  if (userId) {
    notesQuery.neq('user_id', userId);
    flashcardsQuery.neq('user_id', userId);
    examsQuery.neq('user_id', userId);
  }

  const [notesResult, flashcardsResult, examsResult] = await Promise.all([
    notesQuery,
    flashcardsQuery,
    examsQuery,
  ]);

  if (notesResult.error) {
    console.error('Error fetching public notes:', notesResult.error);
    throw notesResult.error;
  }
  if (flashcardsResult.error) {
    console.error('Error fetching public flashcards:', flashcardsResult.error);
    throw flashcardsResult.error;
  }
  if (examsResult.error) {
    console.error('Error fetching public exams:', examsResult.error);
    throw examsResult.error;
  }

  const notes = (notesResult.data || []) as PublicNoteRow[];
  const flashcardSets = (flashcardsResult.data || []) as PublicFlashcardSetRow[];
  const exams = (examsResult.data || []) as PublicExamSetRow[];

  const userIds = Array.from(new Set([
    ...notes.map((note) => note.user_id),
    ...flashcardSets.map((set) => set.user_id),
    ...exams.map((exam) => exam.user_id),
  ])).filter(Boolean);

  const authorMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.warn('Unable to load profile names for community items:', profilesError);
    } else {
      const profileRows = (profiles || []) as ProfileRow[];
      profileRows.forEach((profile) => {
        if (profile.full_name) {
          authorMap.set(profile.id, profile.full_name);
        }
      });
    }
  }

  const communityItems = [
    ...notes.map((note) => {
      const text = stripHtml(note.content || '');
      const summary = text ? truncateText(text) : 'No preview available yet.';
      const updatedAtRaw = note.updated_at || note.created_at;
      return {
        id: note.id,
        type: 'note' as const,
        title: note.title || 'Untitled Note',
        summary,
        tags: note.tags || [],
        author: (note.user_id ? authorMap.get(note.user_id) : undefined) || 'Community member',
        updatedAt: timeAgo(updatedAtRaw),
        href: `/public/notes/${note.id}`,
        updatedAtRaw,
      };
    }),
    ...flashcardSets.map((set) => {
      const summary = set.description?.trim()
        ? set.description.trim()
        : `${set.total_cards || 0} cards to study.`;
      const updatedAtRaw = set.updated_at || set.created_at;
      return {
        id: set.id,
        type: 'flashcard' as const,
        title: set.title || 'Flashcard Set',
        summary,
        tags: [],
        author: (set.user_id ? authorMap.get(set.user_id) : undefined) || 'Community member',
        updatedAt: timeAgo(updatedAtRaw),
        href: `/public/flashcards/${set.id}`,
        updatedAtRaw,
      };
    }),
    ...exams.map((exam) => {
      const summary = exam.description?.trim()
        ? exam.description.trim()
        : `${exam.total_questions || 0} questions (${exam.difficulty || 'mixed'}).`;
      const updatedAtRaw = exam.updated_at || exam.created_at;
      return {
        id: exam.id,
        type: 'exam' as const,
        title: exam.title || 'Exam',
        summary,
        tags: exam.difficulty ? [exam.difficulty] : [],
        author: (exam.user_id ? authorMap.get(exam.user_id) : undefined) || 'Community member',
        updatedAt: timeAgo(updatedAtRaw),
        href: `/public/exams/${exam.id}`,
        updatedAtRaw,
      };
    }),
  ];

  return communityItems
    .sort((a, b) => {
      const bTime = b.updatedAtRaw ? new Date(b.updatedAtRaw).getTime() : 0;
      const aTime = a.updatedAtRaw ? new Date(a.updatedAtRaw).getTime() : 0;
      return bTime - aTime;
    })
    .map(({ updatedAtRaw, ...item }) => item);
}

export function useCommunityItems() {
  return useQuery({
    queryKey: communityKeys.items(),
    queryFn: fetchCommunityItems,
    staleTime: 2 * 60 * 1000,
  });
}
