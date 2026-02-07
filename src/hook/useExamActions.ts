// @ts-nocheck
'use client';

import { useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createGeminiService, ExamQuestionGenerated, ExamGenerationResponse, ExamGenerationConfig } from '@/lib/gemini';
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

const supabase = createClient();

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

export function useExamActions() {
  return useMemo(() => {
    // Create a new exam set
    const createExamSet = async (
      noteId: string | null,
      title: string,
      config: {
        difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
        timeLimitMinutes: number | null;
        includeMultipleChoice: boolean;
        includeIdentification: boolean;
        includeEssay: boolean;
        description?: string;
      }
    ): Promise<string> => {
      const { data: { session } } = await supabase.auth.getSession();

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
        total_questions: 0
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

      return data.id;
    };

    // Save exam questions with proper positioning
    const saveExamQuestions = async (
      examId: string,
      questions: ExamQuestionGenerated[]
    ): Promise<void> => {
      // Sort questions by type to ensure proper order
      const typeOrder = { 'multiple_choice': 0, 'identification': 1, 'essay': 2 };
      const sortedQuestions = [...questions].sort((a, b) => {
        return (typeOrder[a.question_type] || 0) - (typeOrder[b.question_type] || 0);
      });

      const questionInserts: ExamQuestionInsert[] = sortedQuestions.map((q, index) => ({
        exam_id: examId,
        question_type: q.question_type,
        question: q.question,
        correct_answer: q.correct_answer,
        options: q.options || null,
        points: q.points,
        position: index
      }));

      const { error } = await supabase
        .from('exam_questions')
        .insert(questionInserts);

      if (error) {
        console.error('Error saving exam questions:', error);
        throw error;
      }
    };

    // Get user's exam sets with best scores
    const getUserExams = async (): Promise<ExamListItem[]> => {
      const { data: { session } } = await supabase.auth.getSession();

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
        return [];
      }

      // Get best scores for each exam
      const examIds = exams.map((e: { id: string }) => e.id);
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('exam_id, percentage, status')
        .in('exam_id', examIds)
        .eq('status', 'completed');

      // Calculate best scores and attempt counts
      const examStats = new Map<string, { bestScore: number | null; attemptCount: number }>();

      for (const exam of exams) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const examAttempts = attempts?.filter((a: any) => a.exam_id === exam.id) || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completedAttempts = examAttempts.filter((a: any) => a.status === 'completed');
        const bestScore = completedAttempts.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? Math.max(...completedAttempts.map((a: any) => a.percentage))
          : null;

        examStats.set(exam.id, {
          bestScore,
          attemptCount: completedAttempts.length
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return exams.map((exam: any) => ({
        ...exam,
        best_score: examStats.get(exam.id)?.bestScore ?? null,
        attempt_count: examStats.get(exam.id)?.attemptCount ?? 0
      }));
    };

    // Get exam by ID with all questions
    const getExamById = async (examId: string): Promise<ExamWithQuestions | null> => {
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
    };

    // Delete an exam set
    const deleteExam = async (examId: string): Promise<void> => {
      const { data: { session } } = await supabase.auth.getSession();

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
    };

    // Start a new exam attempt
    const startExamAttempt = async (examId: string): Promise<string> => {
      const { data: { session } } = await supabase.auth.getSession();

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
    };

    // Save a response for a question
    const saveResponse = async (
      attemptId: string,
      questionId: string,
      userAnswer: string
    ): Promise<void> => {
      // Check if response already exists
      const { data: existing } = await supabase
        .from('exam_responses')
        .select('id')
        .eq('attempt_id', attemptId)
        .eq('question_id', questionId)
        .single();

      if (existing) {
        // Update existing response
        const { error } = await supabase
          .from('exam_responses')
          .update({ user_answer: userAnswer })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating response:', error);
          throw error;
        }
      } else {
        // Create new response
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
    };

    // Grade and submit the exam
    const submitExam = async (
      attemptId: string,
      timeSpentSeconds: number
    ): Promise<AttemptWithResponses> => {
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
            id: response.id, // Use response ID as unique identifier
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
      // HARD LIMIT: Max 10 essays to prevent billing disasters
      const MAX_ESSAYS = 10;

      if (essays.length > MAX_ESSAYS) {
        console.error(`[Grading] BLOCKED: ${essays.length} essays is WAY too many! Max allowed: ${MAX_ESSAYS}`);
        console.error('[Grading] Your exam has bad data. Please delete this exam and create a new one.');
        console.error('[Grading] Giving partial credit to first 10 essays only.');

        // Only process first 10
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
              // Check if this is a fallback grade (exactly 50% with specific feedback)
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
          if (fallbackGraded > 0 && apiGraded === 0) {
            console.error('[Grading] ALL essays got fallback grades! API call likely failed.');
          }
        } else {
          console.log('[Grading] No API key - awarding partial credit');
          // No API key - give partial credit to all essays
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

      // Update the attempt
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
      return getAttemptResults(attemptId) as Promise<AttemptWithResponses>;
    };

    // Get attempt results
    const getAttemptResults = async (attemptId: string): Promise<AttemptWithResponses | null> => {
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
    };

    // Get in-progress attempt for an exam
    const getInProgressAttempt = async (examId: string): Promise<ExamAttempt | null> => {
      const { data: { session } } = await supabase.auth.getSession();

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
    };

    // Get saved responses for an attempt
    const getAttemptResponses = async (attemptId: string): Promise<Map<string, string>> => {
      const { data, error } = await supabase
        .from('exam_responses')
        .select('question_id, user_answer')
        .eq('attempt_id', attemptId);

      if (error) {
        console.error('Error fetching responses:', error);
        return new Map();
      }

      const responseMap = new Map<string, string>();
      for (const response of data || []) {
        if (response.user_answer) {
          responseMap.set(response.question_id, response.user_answer);
        }
      }

      return responseMap;
    };

    // Abandon an attempt
    const abandonAttempt = async (attemptId: string): Promise<void> => {
      const { error } = await supabase
        .from('exam_attempts')
        .update({ status: 'abandoned' })
        .eq('id', attemptId);

      if (error) {
        console.error('Error abandoning attempt:', error);
        throw error;
      }
    };

    // Get all attempts for an exam
    const getExamAttempts = async (examId: string): Promise<ExamAttempt[]> => {
      const { data: { session } } = await supabase.auth.getSession();

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
    };

    return {
      createExamSet,
      saveExamQuestions,
      getUserExams,
      getExamById,
      deleteExam,
      startExamAttempt,
      saveResponse,
      submitExam,
      getAttemptResults,
      getInProgressAttempt,
      getAttemptResponses,
      abandonAttempt,
      getExamAttempts
    };
  }, []);
}
