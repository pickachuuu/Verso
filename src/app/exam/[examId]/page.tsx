'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useExamActions } from "@/hook/useExamActions";
import { useUserProfile } from "@/hooks/useAuth";
import {
  useStartExamAttempt,
  useSaveResponse,
  useSubmitExam,
  ExamWithQuestions
} from "@/hooks/useExams";
import {
  ArrowLeft02Icon,
  Clock01Icon,
  Home01Icon,
  Loading03Icon,
  CheckmarkCircle01Icon,
  Layout01Icon,
  Activity01Icon
} from "hugeicons-react";
import { motion } from "motion/react";
import { ExamIcon } from '@/component/icons';
import ExamQuestionStepper from '@/component/ui/ExamQuestionStepper';

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [exam, setExam] = useState<ExamWithQuestions | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime] = useState<number>(Date.now());
  const [gradingStatus, setGradingStatus] = useState<string>('');
  const [gradingError, setGradingError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<Map<string, string>>(new Map());

  // TanStack Query hooks
  const { data: userProfile } = useUserProfile();
  const startAttemptMutation = useStartExamAttempt();
  const saveResponseMutation = useSaveResponse();
  const submitExamMutation = useSubmitExam();

  // Keep old hook for utility functions not yet migrated
  const {
    getExamById,
    getInProgressAttempt,
    getAttemptResponses
  } = useExamActions();

  // Sort questions by position for a consistent order across all types
  const sortedQuestions = useMemo(() => {
    if (!exam?.questions) return [];
    return [...exam.questions].sort((a, b) => a.position - b.position);
  }, [exam?.questions]);

  // Load exam - only run once when examId changes
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double-loading
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadExam = async () => {
      setIsLoading(true);
      try {
        const examData = await getExamById(examId);
        if (!examData) {
          router.push('/exams');
          return;
        }
        setExam(examData);

        const existingAttempt = await getInProgressAttempt(examId);
        if (existingAttempt) {
          setAttemptId(existingAttempt.id);
          const responses = await getAttemptResponses(existingAttempt.id);
          setAnswers(responses);

          if (examData.time_limit_minutes) {
            const elapsed = Math.floor((Date.now() - new Date(existingAttempt.started_at).getTime()) / 1000);
            const remaining = examData.time_limit_minutes * 60 - elapsed;
            setTimeRemaining(Math.max(0, remaining));
          }
        } else {
          const newAttemptId = await startAttemptMutation.mutateAsync(examId);
          setAttemptId(newAttemptId);

          if (examData.time_limit_minutes) {
            setTimeRemaining(examData.time_limit_minutes * 60);
          }
        }
      } catch (error) {
        console.error('Error loading exam:', error);
        router.push('/exams');
      } finally {
        setIsLoading(false);
      }
    };

    loadExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  // Timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeRemaining]);

  const progress = useMemo(() => {
    if (!exam?.questions) return { answered: 0, total: 0, percent: 0 };
    const answered = exam.questions.filter(q => answers.has(q.id) && answers.get(q.id)?.trim()).length;
    const total = exam.questions.length;
    return { answered, total, percent: total > 0 ? (answered / total) * 100 : 0 };
  }, [exam?.questions, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  }, []);

  const saveAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!attemptId) return;
    if (lastSavedRef.current.get(questionId) === answer) return;

    try {
      await saveResponseMutation.mutateAsync({ attemptId, questionId, userAnswer: answer });
      lastSavedRef.current.set(questionId, answer);
    } catch (error) {
      console.error('Error saving response:', error);
    }
  }, [attemptId, saveResponseMutation]);

  const handleSubmitExam = useCallback(async () => {
    if (!attemptId || !exam) return;

    setIsSubmitting(true);
    setGradingError(null);
    setGradingStatus('Saving answers...');

    // Save all answers
    for (const question of exam.questions) {
      const answer = answers.get(question.id);
      if (answer !== undefined && lastSavedRef.current.get(question.id) !== answer) {
        try {
          await saveResponseMutation.mutateAsync({ attemptId, questionId: question.id, userAnswer: answer });
          lastSavedRef.current.set(question.id, answer);
        } catch (e) {
          console.error('Error saving answer:', e);
        }
      }
    }

    const essayCount = exam.questions.filter(q => q.question_type === 'essay').length;

    try {
      setGradingStatus('Grading exam...');
      if (essayCount > 0) {
        setGradingStatus('AI is grading essays...');
      }

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      await submitExamMutation.mutateAsync({ attemptId, timeSpentSeconds: timeSpent });

      if (timerRef.current) clearInterval(timerRef.current);

      router.push(`/exams/${examId}/results/${attemptId}`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      setGradingError(error instanceof Error ? error.message : 'Failed to grade exam.');
      setIsSubmitting(false);
    }
  }, [attemptId, exam, startTime, submitExamMutation, examId, router, answers, saveResponseMutation]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loading03Icon className="w-10 h-10 text-foreground-muted animate-spin" />
          <p className="text-foreground-muted">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-foreground mb-4">Exam not found</p>
          <Link href="/exams" className="text-primary underline">Back to Exams</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col pt-safe pb-safe overflow-hidden select-none">

      {/* 🏷️ TOP PROGRESS BAR */}
      <div className="h-1.5 w-full bg-background-muted/30 overflow-hidden shrink-0 z-[10]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          className="h-full bg-primary shadow-[0_0_10px_rgba(43,93,139,0.4)]"
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* 🏛️ HEADER */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-border/20 bg-white z-[10]">
        <div className="flex items-center gap-4 flex-1">
          <Link
            href="/exams"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-background-muted/30 border border-border/20 hover:bg-background-muted transition-all active:scale-90 group shrink-0"
          >
            <ArrowLeft02Icon className="w-5 h-5 text-foreground-muted group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="min-w-0 flex items-center gap-3">
            <div className="hidden sm:flex p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <ExamIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h1 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] truncate opacity-80">{exam.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {progress.answered} / {progress.total} ANSWERED
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 mr-4 border-r border-border/40 pr-6">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 opacity-40 mb-0.5">
                <Clock01Icon className="w-3 h-3" />
                <span className="text-[9px] font-black tracking-widest uppercase">TIMER</span>
              </div>
              <span className={`text-[14px] font-black tabular-nums ${timeRemaining !== null && timeRemaining <= 300 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
                {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="hidden sm:flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-foreground text-surface text-xs font-black uppercase tracking-widest hover:bg-foreground/90 transition-all active:scale-95 shrink-0 shadow-lg"
          >
            SUBMIT EXAM
          </button>

          <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-background-muted/30" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary transition-all duration-1000 drop-shadow-sm"
                strokeDasharray={126} strokeDashoffset={126 - (126 * progress.percent) / 100} strokeLinecap="round" />
            </svg>
            <span className="font-black text-[10px] text-primary relative z-10">{Math.round(progress.percent)}%</span>
          </div>
        </div>
      </header>

      {/* Main content - Stepper: flex-1 + min-h-0 gives it a bounded height */}
      <main className="flex-1 px-4 py-4 md:py-8 flex flex-col min-h-0 bg-white relative z-[5]">
        <div className="h-full w-full max-w-[min(100%,800px)] lg:max-w-4xl mx-auto flex flex-col min-h-0">
          <ExamQuestionStepper
            questions={sortedQuestions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSaveAnswer={saveAnswer}
            onSubmit={() => setShowConfirmSubmit(true)}
            isSubmitting={isSubmitting}
            className="flex-1 min-h-0 w-full"
          />
        </div>
      </main>

      {/* Submit confirmation modal */}
      {showConfirmSubmit && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => !isSubmitting && setShowConfirmSubmit(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border">
              {isSubmitting ? (
                <div className="text-center py-6">
                  <Loading03Icon className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-sm font-medium text-foreground">{gradingStatus}</p>
                  <p className="text-xs text-foreground-muted mt-1">Please wait...</p>
                </div>
              ) : gradingError ? (
                <div>
                  <p className="text-red-600 text-sm mb-4 font-medium">{gradingError}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowConfirmSubmit(false); setGradingError(null); }}
                      className="flex-1 border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-background-muted rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitExam}
                      className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 rounded-xl transition-all"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-2">Submit Exam?</h3>
                  <p className="text-sm text-foreground-muted mb-1">
                    You&apos;ve answered <span className="font-semibold text-foreground">{progress.answered}</span> of <span className="font-semibold text-foreground">{progress.total}</span> questions.
                  </p>
                  {progress.answered < progress.total && (
                    <p className="text-sm text-amber-600 mb-4 font-medium">
                      {progress.total - progress.answered} question{progress.total - progress.answered !== 1 ? 's' : ''} unanswered
                    </p>
                  )}
                  {progress.answered === progress.total && (
                    <p className="text-sm text-emerald-600 mb-4 font-medium">
                      All questions answered!
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmSubmit(false)}
                      className="flex-1 border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-background-muted rounded-xl transition-all"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleSubmitExam}
                      className="flex-1 bg-primary text-white py-2.5 text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 rounded-xl transition-all"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
