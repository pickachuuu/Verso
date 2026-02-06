import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { createGeminiService, ExamQuestionGenerated } from '@/lib/gemini';
import {
  ExamSet,
  ExamQuestion,
  ExamAttempt,
  ExamResponse,
  ExamSetInsert,
  ExamQuestionInsert,
  ExamAttemptInsert,
  ExamResponseInsert,
  ExamAttemptUpdate
} from '@/lib/database.types';
import { trackExamActivity, trackExamCreated } from './useActivityTracking';
import { dashboardKeys } from './useDashboard';

const supabase = createClient();

// ============================================
// Types
// ============================================

export interface ExamWithQuestions extends ExamSet {
  questions: ExamQuestion[];
}

export interface AttemptWithResponses extends ExamAttempt {
  responses: (ExamResponse & { question: ExamQuestion })[];
  exam: ExamSet;
}

export interface ExamListItem extends ExamSet {
  best_score: number | null;
  attempt_count: number;
  notes?: {
    id: string;
    title: string;
  } | null;
}

export interface CreateExamParams {
  noteId: string | null;
  title: string;
  config: {
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    timeLimitMinutes: number | null;
    includeMultipleChoice: boolean;
    includeIdentification: boolean;
    includeEssay: boolean;
    description?: string;
  };
  questions: ExamQuestionGenerated[];
}

export interface SaveResponseParams {
  attemptId: string;
  questionId: string;
  userAnswer: string;
}

export interface SubmitExamParams {
  attemptId: string;
  timeSpentSeconds: number;
}

// ============================================
// Query Keys
// ============================================

export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  detail: (examId: string) => [...examKeys.all, 'detail', examId] as const,
  attempt: (attemptId: string) => [...examKeys.all, 'attempt', attemptId] as const,
  attempts: (examId: string) => [...examKeys.all, 'attempts', examId] as const,
  inProgress: (examId: string) => [...examKeys.all, 'inProgress', examId] as const,
};

// ============================================
// API Functions
// ============================================

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function fetchExams(): Promise<ExamListItem[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  // Get exam sets
  const { data: exams, error } = await supabase
    .from('exam_sets')
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
    console.error('Error fetching exam sets:', error);
    throw error;
  }

  if (!exams || exams.length === 0) return [];

  // Get best scores for each exam
  const examIds = exams.map(e => e.id);
  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select('exam_id, percentage, status')
    .in('exam_id', examIds)
    .eq('status', 'completed');

  // Calculate best scores and attempt counts
  const examStats = new Map<string, { bestScore: number | null; attemptCount: number }>();

  for (const exam of exams) {
    const examAttempts = attempts?.filter(a => a.exam_id === exam.id) || [];
    const completedAttempts = examAttempts.filter(a => a.status === 'completed');
    const bestScore = completedAttempts.length > 0
      ? Math.max(...completedAttempts.map(a => a.percentage))
      : null;

    examStats.set(exam.id, {
      bestScore,
      attemptCount: completedAttempts.length
    });
  }

  return exams.map(exam => ({
    ...exam,
    best_score: examStats.get(exam.id)?.bestScore ?? null,
    attempt_count: examStats.get(exam.id)?.attemptCount ?? 0
  }));
}

async function fetchExam(examId: string): Promise<ExamWithQuestions | null> {
  const [examResult, questionsResult] = await Promise.all([
    supabase
      .from('exam_sets')
      .select(`
        *,
        notes (
          id,
          title
        )
      `)
      .eq('id', examId)
      .single(),
    supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('position', { ascending: true })
  ]);

  if (examResult.error || !examResult.data) {
    console.error('Error fetching exam:', examResult.error);
    return null;
  }

  if (questionsResult.error) {
    console.error('Error fetching questions:', questionsResult.error);
    return null;
  }

  return {
    ...examResult.data,
    questions: questionsResult.data || []
  };
}

async function fetchAttemptResults(attemptId: string): Promise<AttemptWithResponses | null> {
  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      exam_sets (*)
    `)
    .eq('id', attemptId)
    .single();

  if (attemptError || !attempt) {
    console.error('Error fetching attempt:', attemptError);
    return null;
  }

  const { data: responses, error: responsesError } = await supabase
    .from('exam_responses')
    .select(`
      *,
      exam_questions (*)
    `)
    .eq('attempt_id', attemptId)
    .order('exam_questions(position)', { ascending: true });

  if (responsesError) {
    console.error('Error fetching responses:', responsesError);
    return null;
  }

  return {
    ...attempt,
    exam: attempt.exam_sets,
    responses: (responses || []).map(r => ({
      ...r,
      question: r.exam_questions
    }))
  };
}

async function fetchInProgressAttempt(examId: string): Promise<ExamAttempt | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', session.user.id)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No in-progress attempt found is not an error
    return null;
  }

  return data;
}

async function fetchExamAttempts(examId: string): Promise<ExamAttempt[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const { data, error } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('user_id', session.user.id)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error fetching attempts:', error);
    return [];
  }

  return data || [];
}

// ============================================
// Mutation Functions
// ============================================

async function createExam({ noteId, title, config, questions }: CreateExamParams): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const examSet: ExamSetInsert = {
    user_id: session.user.id,
    note_id: noteId,
    title,
    description: config.description || `AI-generated exam from note content`,
    difficulty: config.difficulty,
    time_limit_minutes: config.timeLimitMinutes,
    include_multiple_choice: config.includeMultipleChoice,
    include_identification: config.includeIdentification,
    include_essay: config.includeEssay,
    total_questions: questions.length
  };

  const { data, error } = await supabase
    .from('exam_sets')
    .insert(examSet)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating exam set:', error);
    throw error;
  }

  // Save questions
  const typeOrder = { 'multiple_choice': 0, 'identification': 1, 'essay': 2 };
  const sortedQuestions = [...questions].sort((a, b) => {
    return (typeOrder[a.question_type] || 0) - (typeOrder[b.question_type] || 0);
  });

  const questionInserts: ExamQuestionInsert[] = sortedQuestions.map((q, index) => ({
    exam_id: data.id,
    question_type: q.question_type,
    question: q.question,
    correct_answer: q.correct_answer,
    options: q.options || null,
    points: q.points,
    position: index
  }));

  const { error: questionsError } = await supabase
    .from('exam_questions')
    .insert(questionInserts);

  if (questionsError) {
    console.error('Error saving exam questions:', questionsError);
    throw questionsError;
  }

  // Track exam creation as an activity (fire-and-forget — don't block on failure)
  trackExamCreated(data.id).catch(() => {});

  return data.id;
}

async function deleteExam(examId: string): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('exam_sets')
    .delete()
    .eq('id', examId)
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
}

async function startExamAttempt(examId: string): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  // Get total points for the exam
  const { data: questions } = await supabase
    .from('exam_questions')
    .select('points')
    .eq('exam_id', examId);

  const maxScore = questions?.reduce((sum, q) => sum + q.points, 0) || 0;

  const attempt: ExamAttemptInsert = {
    user_id: session.user.id,
    exam_id: examId,
    max_score: maxScore,
    status: 'in_progress'
  };

  const { data, error } = await supabase
    .from('exam_attempts')
    .insert(attempt)
    .select('id')
    .single();

  if (error) {
    console.error('Error starting exam attempt:', error);
    throw error;
  }

  return data.id;
}

async function saveResponse({ attemptId, questionId, userAnswer }: SaveResponseParams): Promise<void> {
  // Check if response already exists
  const { data: existing } = await supabase
    .from('exam_responses')
    .select('id')
    .eq('attempt_id', attemptId)
    .eq('question_id', questionId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('exam_responses')
      .update({ user_answer: userAnswer })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating response:', error);
      throw error;
    }
  } else {
    const response: ExamResponseInsert = {
      attempt_id: attemptId,
      question_id: questionId,
      user_answer: userAnswer
    };

    const { error } = await supabase
      .from('exam_responses')
      .insert(response);

    if (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  }
}

async function submitExam({ attemptId, timeSpentSeconds }: SubmitExamParams): Promise<AttemptWithResponses> {
  console.log('[Grading] ========== STARTING EXAM GRADING ==========');
  console.log('[Grading] Attempt ID:', attemptId);
  console.log('[Grading] Time spent:', timeSpentSeconds, 'seconds');

  // Get the attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .select(`*, exam_sets (*)`)
    .eq('id', attemptId)
    .single();

  if (attemptError || !attempt) {
    throw new Error('Attempt not found');
  }

  // Get all responses with their questions
  const { data: responses, error: responsesError } = await supabase
    .from('exam_responses')
    .select(`*, exam_questions (*)`)
    .eq('attempt_id', attemptId);

  if (responsesError) {
    throw new Error('Failed to fetch responses');
  }

  // Get all questions for max score calc
  const { data: allQuestions } = await supabase
    .from('exam_questions')
    .select('*')
    .eq('exam_id', attempt.exam_id);

  // Separate essays from other question types
  const essays: Array<{
    responseId: string;
    id: string;
    question: string;
    modelAnswer: string;
    userAnswer: string;
    maxPoints: number;
  }> = [];

  const gradedResponses: Array<{
    id: string;
    isCorrect: boolean | null;
    score: number;
    aiFeedback: string | null;
  }> = [];

  // Grade MC and ID instantly, collect essays for batch
  let mcCorrect = 0, mcTotal = 0, idCorrect = 0, idTotal = 0;

  console.log('[Grading] Total responses to grade:', responses?.length || 0);

  for (const response of responses || []) {
    const question = response.exam_questions;
    if (!question) {
      console.warn('[Grading] Response has no question!', response.id);
      continue;
    }

    console.log('[Grading] Processing:', question.question_type, '- Q:', question.question?.slice(0, 30));

    if (question.question_type === 'multiple_choice') {
      mcTotal++;
      const isCorrect = response.user_answer?.toUpperCase().trim() === question.correct_answer.toUpperCase().trim();
      if (isCorrect) mcCorrect++;
      gradedResponses.push({
        id: response.id,
        isCorrect,
        score: isCorrect ? question.points : 0,
        aiFeedback: null
      });
    } else if (question.question_type === 'identification') {
      idTotal++;
      const userAnswer = response.user_answer?.toLowerCase().trim() || '';
      const correctAnswer = question.correct_answer.toLowerCase().trim();
      const isCorrect = userAnswer === correctAnswer ||
                      correctAnswer.includes(userAnswer) ||
                      userAnswer.includes(correctAnswer);
      if (isCorrect) idCorrect++;
      gradedResponses.push({
        id: response.id,
        isCorrect,
        score: isCorrect ? question.points : 0,
        aiFeedback: null
      });
    } else if (question.question_type === 'essay') {
      essays.push({
        responseId: response.id,
        id: response.id,
        question: question.question,
        modelAnswer: question.correct_answer,
        userAnswer: response.user_answer || '',
        maxPoints: question.points
      });
    }
  }

  if (mcTotal > 0) console.log(`[Grading] MC: ${mcCorrect}/${mcTotal} correct`);
  if (idTotal > 0) console.log(`[Grading] ID: ${idCorrect}/${idTotal} correct`);

  // Batch grade all essays in ONE API call
  const MAX_ESSAYS = 10;

  if (essays.length > MAX_ESSAYS) {
    console.error(`[Grading] BLOCKED: ${essays.length} essays is WAY too many! Max allowed: ${MAX_ESSAYS}`);
    essays.length = MAX_ESSAYS;
  }

  if (essays.length > 0) {
    console.log(`[Grading] Processing ${essays.length} essays`);

    const perplexityKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (perplexityKey || geminiKey) {
      console.log('[Grading] Using', geminiKey ? 'Gemini' : 'Perplexity', 'API');
      const geminiService = createGeminiService(perplexityKey || '', geminiKey);

      console.log('[Grading] Sending batch request for', essays.length, 'essays...');
      const essayGrades = await geminiService.gradeAllEssays(essays);
      console.log('[Grading] API returned', essayGrades.size, 'grades');

      let apiGraded = 0, fallbackGraded = 0;
      for (const essay of essays) {
        const grade = essayGrades.get(essay.id);
        if (grade) {
          const isFallback = grade.feedback.includes('Unable to grade') ||
                             grade.feedback.includes('Partial credit') ||
                             grade.score === Math.round(essay.maxPoints * 0.5);
          if (isFallback) {
            fallbackGraded++;
            console.log(`[Grading] Essay ${essay.id.slice(0,8)}: ${grade.score}/${essay.maxPoints} pts (FALLBACK)`);
          } else {
            apiGraded++;
            console.log(`[Grading] Essay ${essay.id.slice(0,8)}: ${grade.score}/${essay.maxPoints} pts (AI graded)`);
          }
          gradedResponses.push({
            id: essay.responseId,
            isCorrect: grade.score >= essay.maxPoints * 0.6,
            score: grade.score,
            aiFeedback: grade.feedback
          });
        }
      }
      console.log(`[Grading] Summary: ${apiGraded} AI graded, ${fallbackGraded} fallback`);
    } else {
      console.log('[Grading] No API key - awarding partial credit');
      for (const essay of essays) {
        gradedResponses.push({
          id: essay.responseId,
          isCorrect: null,
          score: Math.round(essay.maxPoints * 0.5),
          aiFeedback: 'Essay grading unavailable. Partial credit awarded.'
        });
      }
    }
  }

  // Update all responses in database
  let totalScore = 0;
  for (const graded of gradedResponses) {
    totalScore += graded.score;
    await supabase
      .from('exam_responses')
      .update({
        is_correct: graded.isCorrect,
        score: graded.score,
        ai_feedback: graded.aiFeedback
      })
      .eq('id', graded.id);
  }

  // Calculate percentage
  const maxScore = attempt.max_score || allQuestions?.reduce((sum, q) => sum + q.points, 0) || 0;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  console.log(`[Grading] Final score: ${totalScore}/${maxScore} (${percentage}%)`);

  await supabase
    .from('exam_attempts')
    .update({
      completed_at: new Date().toISOString(),
      time_spent_seconds: timeSpentSeconds,
      total_score: totalScore,
      percentage,
      status: 'completed'
    } as ExamAttemptUpdate)
    .eq('id', attemptId);

  console.log('[Grading] ========== GRADING COMPLETE ==========');

  // Track exam attempt as an activity (fire-and-forget — don't block on failure)
  trackExamActivity({
    examId: attempt.exam_id,
    score: percentage,
    questionsAnswered: responses?.length || 0,
    durationMinutes: Math.max(1, Math.round(timeSpentSeconds / 60)),
  }).catch(() => {});

  const result = await fetchAttemptResults(attemptId);
  if (!result) {
    throw new Error('Failed to fetch graded results');
  }
  return result;
}

async function abandonAttempt(attemptId: string): Promise<void> {
  const { error } = await supabase
    .from('exam_attempts')
    .update({ status: 'abandoned' })
    .eq('id', attemptId);

  if (error) {
    console.error('Error abandoning attempt:', error);
    throw error;
  }
}

// ============================================
// Query Hooks
// ============================================

export function useExams() {
  return useQuery({
    queryKey: examKeys.lists(),
    queryFn: fetchExams,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useExam(examId: string | undefined) {
  return useQuery({
    queryKey: examKeys.detail(examId || ''),
    queryFn: () => fetchExam(examId!),
    enabled: !!examId,
    staleTime: 60 * 1000,
  });
}

export function useAttemptResults(attemptId: string | undefined) {
  return useQuery({
    queryKey: examKeys.attempt(attemptId || ''),
    queryFn: () => fetchAttemptResults(attemptId!),
    enabled: !!attemptId,
    staleTime: 5 * 60 * 1000, // 5 minutes - results don't change
  });
}

export function useInProgressAttempt(examId: string | undefined) {
  return useQuery({
    queryKey: examKeys.inProgress(examId || ''),
    queryFn: () => fetchInProgressAttempt(examId!),
    enabled: !!examId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useExamAttempts(examId: string | undefined) {
  return useQuery({
    queryKey: examKeys.attempts(examId || ''),
    queryFn: () => fetchExamAttempts(examId!),
    enabled: !!examId,
    staleTime: 60 * 1000,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() });
    },
  });
}

export function useStartExamAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startExamAttempt,
    onSuccess: (_, examId) => {
      queryClient.invalidateQueries({ queryKey: examKeys.inProgress(examId) });
      queryClient.invalidateQueries({ queryKey: examKeys.attempts(examId) });
    },
  });
}

export function useSaveResponse() {
  return useMutation({
    mutationFn: saveResponse,
    // No cache invalidation needed - responses are saved but not cached
  });
}

export function useSubmitExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitExam,
    onSuccess: (result) => {
      if (result?.exam_id) {
        queryClient.invalidateQueries({ queryKey: examKeys.inProgress(result.exam_id) });
        queryClient.invalidateQueries({ queryKey: examKeys.attempts(result.exam_id) });
        queryClient.invalidateQueries({ queryKey: examKeys.lists() });
      }
      if (result?.id) {
        queryClient.setQueryData(examKeys.attempt(result.id), result);
      }
      // Refresh dashboard to reflect new exam activity
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useAbandonAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: abandonAttempt,
    onSuccess: () => {
      // Invalidate all exam-related queries
      queryClient.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}

// ============================================
// Re-export types
// ============================================

export type { ExamSet, ExamQuestion, ExamAttempt, ExamResponse } from '@/lib/database.types';
