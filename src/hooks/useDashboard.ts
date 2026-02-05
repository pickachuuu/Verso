import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { startOfDay, subDays, format, differenceInDays, parseISO, addDays } from 'date-fns';
import { isCardDue, sortCardsByUrgency } from '@/lib/spacedRepetition';

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

export interface StudyStreakData {
  currentStreak: number;
  longestStreak: number;
  studiedToday: boolean;
  lastStudyDate: Date | null;
}

export interface CardsDueData {
  dueToday: number;
  dueTomorrow: number;
  overdue: number;
  newCards: number;
  nextReviewSet: {
    id: string;
    title: string;
    dueCount: number;
  } | null;
}

export interface MasteryData {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  masteredCards: number;
  masteryPercentage: number;
}

export interface WeeklyActivityData {
  day: string;
  shortDay: string;
  date: string;
  cardsStudied: number;
  minutesStudied: number;
  sessions: number;
}

export interface ContinueLearningData {
  hasActivity: boolean;
  lastStudiedSet: {
    id: string;
    title: string;
    progress: number;
    totalCards: number;
    masteredCards: number;
  } | null;
  suggestedAction: 'continue_set' | 'review_due' | 'start_new' | 'create_cards';
  dueCardsCount: number;
}

// ============================================
// Query Keys
// ============================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: () => [...dashboardKeys.all, 'activity'] as const,
  streak: () => [...dashboardKeys.all, 'streak'] as const,
  cardsDue: () => [...dashboardKeys.all, 'cardsDue'] as const,
  mastery: () => [...dashboardKeys.all, 'mastery'] as const,
  weeklyActivity: () => [...dashboardKeys.all, 'weeklyActivity'] as const,
  continueLearning: () => [...dashboardKeys.all, 'continueLearning'] as const,
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

async function fetchStudyStreak(): Promise<StudyStreakData> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { currentStreak: 0, longestStreak: 0, studiedToday: false, lastStudyDate: null };
  }

  const userId = session.user.id;
  const today = startOfDay(new Date());

  // Fetch study sessions from the last 365 days
  // Include all activity types that count toward streak
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('started_at, cards_studied, session_type, questions_answered')
    .eq('user_id', userId)
    .gte('started_at', subDays(today, 365).toISOString())
    .order('started_at', { ascending: false });

  if (!sessions || sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, studiedToday: false, lastStudyDate: null };
  }

  // Get unique study days - count any meaningful activity
  const studyDays = new Set<string>();
  sessions.forEach((s: {
    started_at: string;
    cards_studied: number;
    session_type: string;
    questions_answered: number | null;
  }) => {
    // Count activity as studying if:
    // - Flashcard study with cards studied
    // - Exam attempt with questions answered
    // - Note editing/creation (any completed session)
    const hasActivity =
      (s.session_type === 'flashcard_study' && s.cards_studied > 0) ||
      (s.session_type === 'exam_attempt' && (s.questions_answered || 0) > 0) ||
      s.session_type === 'note_edit' ||
      s.session_type === 'note_created' ||
      s.session_type === 'flashcard_created';

    if (hasActivity) {
      studyDays.add(format(parseISO(s.started_at), 'yyyy-MM-dd'));
    }
  });

  const sortedDays = Array.from(studyDays).sort().reverse();
  const lastStudyDate = sortedDays.length > 0 ? parseISO(sortedDays[0]) : null;
  const studiedToday = sortedDays.includes(format(today, 'yyyy-MM-dd'));

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = studiedToday ? today : subDays(today, 1);

  for (let i = 0; i < sortedDays.length; i++) {
    const dayStr = format(checkDate, 'yyyy-MM-dd');
    if (sortedDays.includes(dayStr)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const allDays = Array.from(studyDays).sort();

  for (let i = 0; i < allDays.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDay = parseISO(allDays[i - 1]);
      const currDay = parseISO(allDays[i]);
      if (differenceInDays(currDay, prevDay) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak, studiedToday, lastStudyDate };
}

async function fetchCardsDue(): Promise<CardsDueData> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { dueToday: 0, dueTomorrow: 0, overdue: 0, newCards: 0, nextReviewSet: null };
  }

  const userId = session.user.id;
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = addDays(todayEnd, 1);

  // Fetch all flashcards with their sets, including SM-2 fields
  const { data: flashcards } = await supabase
    .from('flashcards')
    .select(`
      id,
      status,
      next_review,
      set_id,
      ease_factor,
      interval_days,
      repetitions,
      flashcard_sets!inner (
        id,
        title,
        user_id
      )
    `)
    .eq('flashcard_sets.user_id', userId);

  if (!flashcards || flashcards.length === 0) {
    return { dueToday: 0, dueTomorrow: 0, overdue: 0, newCards: 0, nextReviewSet: null };
  }

  let dueToday = 0;
  let dueTomorrow = 0;
  let overdue = 0;
  let newCards = 0;
  const setDueCounts: Record<string, { id: string; title: string; count: number }> = {};

  flashcards.forEach((card: {
    id: string;
    status: string;
    next_review: string | null;
    set_id: string;
    flashcard_sets: { id: string; title: string }
  }) => {
    // Count new cards separately
    if (card.status === 'new') {
      newCards++;
      dueToday++; // New cards are always available to study
      // Track by set
      if (!setDueCounts[card.set_id]) {
        setDueCounts[card.set_id] = {
          id: card.flashcard_sets.id,
          title: card.flashcard_sets.title,
          count: 0
        };
      }
      setDueCounts[card.set_id].count++;
      return;
    }

    // Mastered cards that aren't due yet shouldn't be counted
    if (card.status === 'mastered' && !isCardDue(card.next_review)) {
      return;
    }

    // Check if card is due using the spaced repetition utility
    if (card.next_review) {
      const reviewDate = parseISO(card.next_review);
      const isDue = isCardDue(card.next_review);

      if (isDue) {
        // Card is overdue (past its review date)
        overdue++;
        dueToday++;
        // Track by set
        if (!setDueCounts[card.set_id]) {
          setDueCounts[card.set_id] = {
            id: card.flashcard_sets.id,
            title: card.flashcard_sets.title,
            count: 0
          };
        }
        setDueCounts[card.set_id].count++;
      } else if (reviewDate <= todayEnd) {
        // Due later today
        dueToday++;
        if (!setDueCounts[card.set_id]) {
          setDueCounts[card.set_id] = {
            id: card.flashcard_sets.id,
            title: card.flashcard_sets.title,
            count: 0
          };
        }
        setDueCounts[card.set_id].count++;
      } else if (reviewDate <= tomorrowEnd) {
        // Due tomorrow
        dueTomorrow++;
      }
    } else if (card.status === 'learning' || card.status === 'review') {
      // Cards without next_review but in learning/review are due now
      dueToday++;
      if (!setDueCounts[card.set_id]) {
        setDueCounts[card.set_id] = {
          id: card.flashcard_sets.id,
          title: card.flashcard_sets.title,
          count: 0
        };
      }
      setDueCounts[card.set_id].count++;
    }
  });

  // Find set with most due cards (prioritize for review suggestion)
  let nextReviewSet: CardsDueData['nextReviewSet'] = null;
  let maxDue = 0;
  Object.values(setDueCounts).forEach((set) => {
    if (set.count > maxDue) {
      maxDue = set.count;
      nextReviewSet = { id: set.id, title: set.title, dueCount: set.count };
    }
  });

  return { dueToday, dueTomorrow, overdue, newCards, nextReviewSet };
}

async function fetchMasteryData(): Promise<MasteryData> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { totalCards: 0, newCards: 0, learningCards: 0, reviewCards: 0, masteredCards: 0, masteryPercentage: 0 };
  }

  const userId = session.user.id;

  const { data: flashcards } = await supabase
    .from('flashcards')
    .select(`
      id,
      status,
      flashcard_sets!inner (user_id)
    `)
    .eq('flashcard_sets.user_id', userId);

  if (!flashcards || flashcards.length === 0) {
    return { totalCards: 0, newCards: 0, learningCards: 0, reviewCards: 0, masteredCards: 0, masteryPercentage: 0 };
  }

  let newCards = 0;
  let learningCards = 0;
  let reviewCards = 0;
  let masteredCards = 0;

  flashcards.forEach((card: { status: string }) => {
    switch (card.status) {
      case 'new': newCards++; break;
      case 'learning': learningCards++; break;
      case 'review': reviewCards++; break;
      case 'mastered': masteredCards++; break;
    }
  });

  const totalCards = flashcards.length;
  const masteryPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  return { totalCards, newCards, learningCards, reviewCards, masteredCards, masteryPercentage };
}

async function fetchWeeklyActivity(): Promise<WeeklyActivityData[]> {
  const session = await getSession();
  if (!session?.user?.id) {
    return generateEmptyWeek();
  }

  const userId = session.user.id;
  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 6);

  // Fetch all sessions including different activity types
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('started_at, cards_studied, duration_minutes, session_type, questions_answered')
    .eq('user_id', userId)
    .gte('started_at', weekAgo.toISOString())
    .lte('started_at', new Date().toISOString());

  // Initialize week data
  const weekData: WeeklyActivityData[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    weekData.push({
      day: format(date, 'EEEE'),
      shortDay: format(date, 'EEE'),
      date: format(date, 'yyyy-MM-dd'),
      cardsStudied: 0,
      minutesStudied: 0,
      sessions: 0,
    });
  }

  // Aggregate session data
  if (sessions) {
    sessions.forEach((s: {
      started_at: string;
      cards_studied: number | null;
      duration_minutes: number | null;
      session_type: string;
      questions_answered: number | null;
    }) => {
      const dayStr = format(parseISO(s.started_at), 'yyyy-MM-dd');
      const dayData = weekData.find((d) => d.date === dayStr);
      if (dayData) {
        // Count cards/questions studied based on activity type
        if (s.session_type === 'flashcard_study') {
          dayData.cardsStudied += s.cards_studied || 0;
        } else if (s.session_type === 'exam_attempt') {
          // Count exam questions as activity
          dayData.cardsStudied += s.questions_answered || 0;
        }
        dayData.minutesStudied += s.duration_minutes || 0;
        dayData.sessions++;
      }
    });
  }

  return weekData;
}

function generateEmptyWeek(): WeeklyActivityData[] {
  const today = startOfDay(new Date());
  const weekData: WeeklyActivityData[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    weekData.push({
      day: format(date, 'EEEE'),
      shortDay: format(date, 'EEE'),
      date: format(date, 'yyyy-MM-dd'),
      cardsStudied: 0,
      minutesStudied: 0,
      sessions: 0,
    });
  }
  return weekData;
}

async function fetchContinueLearning(): Promise<ContinueLearningData> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { hasActivity: false, lastStudiedSet: null, suggestedAction: 'create_cards', dueCardsCount: 0 };
  }

  const userId = session.user.id;

  // Get most recent study session
  const { data: recentSession } = await supabase
    .from('study_sessions')
    .select('set_id, started_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  // Get due cards count
  const cardsDue = await fetchCardsDue();
  const dueCardsCount = cardsDue.dueToday;

  // Get flashcard sets
  const { data: sets } = await supabase
    .from('flashcard_sets')
    .select('id, title, total_cards, mastered_cards')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!sets || sets.length === 0) {
    return { hasActivity: false, lastStudiedSet: null, suggestedAction: 'create_cards', dueCardsCount };
  }

  let lastStudiedSet: ContinueLearningData['lastStudiedSet'] = null;

  if (recentSession?.set_id) {
    const setData = sets.find((s: { id: string; title: string; total_cards: number; mastered_cards: number }) => s.id === recentSession.set_id);
    if (setData) {
      lastStudiedSet = {
        id: setData.id,
        title: setData.title,
        progress: setData.total_cards > 0 ? Math.round((setData.mastered_cards / setData.total_cards) * 100) : 0,
        totalCards: setData.total_cards,
        masteredCards: setData.mastered_cards,
      };
    }
  }

  // Determine suggested action
  let suggestedAction: ContinueLearningData['suggestedAction'] = 'start_new';

  if (dueCardsCount > 0) {
    suggestedAction = 'review_due';
  } else if (lastStudiedSet && lastStudiedSet.progress < 100) {
    suggestedAction = 'continue_set';
  } else if (sets.some((s: { mastered_cards: number; total_cards: number }) => s.mastered_cards < s.total_cards)) {
    suggestedAction = 'start_new';
  } else {
    suggestedAction = 'create_cards';
  }

  return { hasActivity: true, lastStudiedSet, suggestedAction, dueCardsCount };
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

export function useStudyStreak() {
  return useQuery({
    queryKey: dashboardKeys.streak(),
    queryFn: fetchStudyStreak,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCardsDue() {
  return useQuery({
    queryKey: dashboardKeys.cardsDue(),
    queryFn: fetchCardsDue,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useMasteryData() {
  return useQuery({
    queryKey: dashboardKeys.mastery(),
    queryFn: fetchMasteryData,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useWeeklyActivity() {
  return useQuery({
    queryKey: dashboardKeys.weeklyActivity(),
    queryFn: fetchWeeklyActivity,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useContinueLearning() {
  return useQuery({
    queryKey: dashboardKeys.continueLearning(),
    queryFn: fetchContinueLearning,
    staleTime: 30 * 1000, // 30 seconds
  });
}
