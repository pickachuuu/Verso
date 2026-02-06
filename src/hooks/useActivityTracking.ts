/**
 * Activity Tracking Hook
 *
 * Provides functions to track user study sessions across different activity types:
 * - Flashcard study sessions
 * - Note editing sessions
 * - Exam attempts
 *
 * This data powers the dashboard statistics (weekly activity, study streak, etc.)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { dashboardKeys } from './useDashboard';

const supabase = createClient();

export type ActivityType =
  | 'flashcard_study'
  | 'note_edit'
  | 'exam_attempt'
  | 'exam_created'
  | 'flashcard_created'
  | 'note_created';

export interface StartSessionParams {
  setId?: string;
  noteId?: string;
  examId?: string;
  sessionType: ActivityType;
}

export interface CompleteSessionParams {
  sessionId: string;
  cardsStudied?: number;
  correctAnswers?: number;
  durationMinutes?: number;
  questionsAnswered?: number;
  score?: number;
}

export interface TrackNoteActivityParams {
  noteId: string;
  activityType: 'note_edit' | 'note_created';
}

export interface TrackExamActivityParams {
  examId: string;
  score: number;
  questionsAnswered: number;
  durationMinutes: number;
}

// Get current authenticated user
async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Start a new study session
 * Returns the session ID for later completion
 */
async function startStudySession(params: StartSessionParams): Promise<string | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    console.warn('Cannot start study session: User not authenticated');
    return null;
  }

  const { setId, noteId, examId, sessionType } = params;

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: session.user.id,
      set_id: setId || null,
      note_id: noteId || null,
      exam_id: examId || null,
      session_type: sessionType,
      cards_studied: 0,
      correct_answers: 0,
      duration_minutes: 0,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error starting study session:', error);
    return null;
  }

  return data.id;
}

/**
 * Complete an active study session with final stats
 */
async function completeStudySession(params: CompleteSessionParams): Promise<boolean> {
  const {
    sessionId,
    cardsStudied = 0,
    correctAnswers = 0,
    durationMinutes,
    questionsAnswered = 0,
    score
  } = params;

  // Calculate duration if not provided
  let finalDuration = durationMinutes;
  if (finalDuration === undefined) {
    const { data: sessionData } = await supabase
      .from('study_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    if (sessionData?.started_at) {
      const startTime = new Date(sessionData.started_at);
      const endTime = new Date();
      finalDuration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    } else {
      finalDuration = 0;
    }
  }

  const updateData: Record<string, unknown> = {
    cards_studied: cardsStudied,
    correct_answers: correctAnswers,
    duration_minutes: finalDuration,
    completed_at: new Date().toISOString(),
  };

  // Add optional fields if provided
  if (questionsAnswered > 0) {
    updateData.questions_answered = questionsAnswered;
  }
  if (score !== undefined) {
    updateData.score = score;
  }

  const { error } = await supabase
    .from('study_sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) {
    console.error('Error completing study session:', error);
    return false;
  }

  return true;
}

/**
 * Track a note activity (edit or creation)
 * Creates a single session entry for the activity
 */
async function trackNoteActivity(params: TrackNoteActivityParams): Promise<string | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    console.warn('Cannot track note activity: User not authenticated');
    return null;
  }

  const { noteId, activityType } = params;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: session.user.id,
      note_id: noteId,
      session_type: activityType,
      cards_studied: 0,
      correct_answers: 0,
      duration_minutes: 0,
      started_at: now,
      completed_at: now, // Immediately complete for note activities
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error tracking note activity:', error);
    return null;
  }

  return data.id;
}

/**
 * Track an exam attempt completion
 * Creates a completed session entry for the exam
 */
async function trackExamActivity(params: TrackExamActivityParams): Promise<string | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    console.warn('Cannot track exam activity: User not authenticated');
    return null;
  }

  const { examId, score, questionsAnswered, durationMinutes } = params;
  const now = new Date();
  const startTime = new Date(now.getTime() - durationMinutes * 60000);

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: session.user.id,
      exam_id: examId,
      session_type: 'exam_attempt',
      cards_studied: 0,
      correct_answers: 0,
      questions_answered: questionsAnswered,
      score: score,
      duration_minutes: durationMinutes,
      started_at: startTime.toISOString(),
      completed_at: now.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error tracking exam activity:', error);
    return null;
  }

  return data.id;
}

/**
 * Track an exam creation event
 * Creates a completed session entry for the exam creation
 */
async function trackExamCreated(examId: string): Promise<string | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    console.warn('Cannot track exam creation: User not authenticated');
    return null;
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: session.user.id,
      exam_id: examId,
      session_type: 'exam_created',
      cards_studied: 0,
      correct_answers: 0,
      duration_minutes: 0,
      started_at: now,
      completed_at: now,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error tracking exam creation:', error);
    return null;
  }

  return data.id;
}

/**
 * Quick function to log a single card review
 * Useful for tracking individual card interactions
 */
async function logCardReview(
  sessionId: string,
  flashcardId: string,
  wasCorrect: boolean,
  responseTimeSeconds?: number
): Promise<boolean> {
  const { error } = await supabase
    .from('session_results')
    .insert({
      session_id: sessionId,
      flashcard_id: flashcardId,
      was_correct: wasCorrect,
      response_time_seconds: responseTimeSeconds || null,
    });

  if (error) {
    console.error('Error logging card review:', error);
    return false;
  }

  return true;
}

/**
 * Get or create today's study session for a flashcard set
 * Returns existing in-progress session or creates a new one
 */
async function getOrCreateFlashcardSession(setId: string): Promise<string | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  // Check for an existing uncompleted session from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existingSession } = await supabase
    .from('study_sessions')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('set_id', setId)
    .eq('session_type', 'flashcard_study')
    .is('completed_at', null)
    .gte('started_at', today.toISOString())
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (existingSession) {
    return existingSession.id;
  }

  // Create a new session
  return startStudySession({ setId, sessionType: 'flashcard_study' });
}

/**
 * Update session stats incrementally (useful during active study)
 */
async function incrementSessionStats(
  sessionId: string,
  cardsStudiedIncrement: number = 1,
  wasCorrect: boolean = true
): Promise<boolean> {
  // First get current values
  const { data: currentSession, error: fetchError } = await supabase
    .from('study_sessions')
    .select('cards_studied, correct_answers')
    .eq('id', sessionId)
    .single();

  if (fetchError || !currentSession) {
    console.error('Error fetching session for increment:', fetchError);
    return false;
  }

  const { error } = await supabase
    .from('study_sessions')
    .update({
      cards_studied: (currentSession.cards_studied || 0) + cardsStudiedIncrement,
      correct_answers: (currentSession.correct_answers || 0) + (wasCorrect ? 1 : 0),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error incrementing session stats:', error);
    return false;
  }

  return true;
}

// ============================================
// React Query Hooks
// ============================================

export function useStartStudySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startStudySession,
    onSuccess: () => {
      // Invalidate dashboard queries to reflect new activity
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useCompleteStudySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeStudySession,
    onSuccess: () => {
      // Invalidate all dashboard queries to update stats
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useTrackNoteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackNoteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.weeklyActivity() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.streak() });
    },
  });
}

export function useTrackExamActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackExamActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useTrackExamCreated() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackExamCreated,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

// Export utility functions for direct use
export {
  startStudySession,
  completeStudySession,
  trackNoteActivity,
  trackExamActivity,
  trackExamCreated,
  logCardReview,
  getOrCreateFlashcardSession,
  incrementSessionStats,
};
