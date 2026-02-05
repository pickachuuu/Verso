import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// ============================================
// Types
// ============================================

export interface DashboardStats {
  notesCount: number;
  totalFlashcards: number;
  totalSets: number;
  masteredCards: number;
  fullyMasteredSets: number;
}

export interface ActivityItem {
  id: string;
  type: 'note' | 'flashcard';
  title: string;
  description: string;
  time: string;
  updatedAt: Date;
  href: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  total_cards: number;
  mastered_cards: number;
  updated_at: string;
  flashcards: Array<{
    id: string;
    status: string;
  }>;
}

// ============================================
// Query Keys
// ============================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
};

// ============================================
// Utility Functions
// ============================================

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ============================================
// API Functions
// ============================================

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const session = await getSession();
  if (!session?.user?.id) {
    return {
      notesCount: 0,
      totalFlashcards: 0,
      totalSets: 0,
      masteredCards: 0,
      fullyMasteredSets: 0,
    };
  }

  const userId = session.user.id;

  // Fetch notes count
  const { count: notesCount } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Fetch flashcard sets and their data
  const { data: flashcardSets } = await supabase
    .from('flashcard_sets')
    .select(`
      id,
      total_cards,
      mastered_cards,
      flashcards (
        id,
        status
      )
    `)
    .eq('user_id', userId);

  let totalFlashcardSets = 0;
  let totalFlashcards = 0;
  let totalMasteredCards = 0;
  let fullyMasteredSets = 0;

  if (flashcardSets) {
    totalFlashcardSets = flashcardSets.length;

    flashcardSets.forEach((set: FlashcardSet) => {
      totalFlashcards += set.total_cards || 0;
      totalMasteredCards += set.mastered_cards || 0;

      if (set.flashcards && set.flashcards.length > 0) {
        const allMastered = set.flashcards.every((card) => card.status === 'mastered');
        if (allMastered) {
          fullyMasteredSets++;
        }
      }
    });
  }

  return {
    notesCount: notesCount || 0,
    totalFlashcards,
    totalSets: totalFlashcardSets,
    masteredCards: totalMasteredCards,
    fullyMasteredSets,
  };
}

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const items: ActivityItem[] = [];

  // Fetch recent notes
  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, slug, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(3);

  if (notes) {
    notes.forEach((note: { id: string; title: string; slug: string; updated_at: string }) => {
      items.push({
        id: note.id,
        type: 'note',
        title: note.title || 'Untitled Note',
        description: 'Updated note',
        time: note.updated_at ? timeAgo(note.updated_at) : '',
        updatedAt: new Date(note.updated_at),
        href: `/editor/${note.slug || note.id}`,
      });
    });
  }

  // Fetch recent flashcard sets
  const { data: flashcardSets } = await supabase
    .from('flashcard_sets')
    .select('id, title, updated_at, total_cards')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(2);

  if (flashcardSets) {
    flashcardSets.forEach((set: { id: string; title: string; updated_at: string; total_cards: number }) => {
      items.push({
        id: set.id,
        type: 'flashcard',
        title: set.title || 'Flashcard Set',
        description: `${set.total_cards || 0} cards`,
        time: set.updated_at ? timeAgo(set.updated_at) : '',
        updatedAt: new Date(set.updated_at),
        href: `/flashcards/${set.id}`,
      });
    });
  }

  // Sort by most recent
  items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return items.slice(0, 5);
}

// ============================================
// Query Hooks
// ============================================

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000, // 30 seconds - stats change frequently
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: dashboardKeys.activity(),
    queryFn: fetchRecentActivity,
    staleTime: 30 * 1000, // 30 seconds
  });
}
