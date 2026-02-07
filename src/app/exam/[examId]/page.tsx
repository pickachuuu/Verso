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
} from "hugeicons-react";
import { ExamIcon } from '@/component/icons';

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

  const userName = userProfile?.full_name || '';

  const { mcQuestions, idQuestions, essayQuestions } = useMemo(() => {
    if (!exam?.questions) return { mcQuestions: [], idQuestions: [], essayQuestions: [] };
    return {
      mcQuestions: exam.questions.filter(q => q.question_type === 'multiple_choice'),
      idQuestions: exam.questions.filter(q => q.question_type === 'identification'),
      essayQuestions: exam.questions.filter(q => q.question_type === 'essay')
    };
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
    if (!exam?.questions) return { answered: 0, total: 0 };
    const answered = exam.questions.filter(q => answers.has(q.id) && answers.get(q.id)?.trim()).length;
    return { answered, total: exam.questions.length };
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
      <div className="h-screen flex items-center justify-center bg-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <Loading03Icon className="w-10 h-10 text-neutral-600 animate-spin" />
          <p className="text-neutral-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <p className="text-neutral-800 mb-4">Exam not found</p>
          <Link href="/exams" className="text-blue-600 underline">Back to Exams</Link>
        </div>
      </div>
    );
  }

  let questionNum = 0;
  let sectionNum = 0;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-surface border-border">
        <div className="flex items-center gap-3 px-4 py-2">
          <Link
            href="/exams"
            className="p-1.5 rounded transition-colors hover:bg-surface-elevated"
          >
            <ArrowLeft02Icon className="w-5 h-5 text-foreground-muted" />
          </Link>

          <div className="p-1 rounded bg-amber-100/50">
            <ExamIcon className="w-4 h-4 text-amber-700" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground">{exam.title}</span>
          </div>

          {timeRemaining !== null && (
            <div className={`flex items-center gap-1.5 text-sm font-mono ${timeRemaining <= 300 ? 'text-red-600' : 'text-foreground-muted'}`}>
              <Clock01Icon className="w-4 h-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}

          <span className="text-xs text-foreground-muted">{progress.answered}/{progress.total}</span>

          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="px-4 py-1.5 rounded bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Submit
          </button>

          <Link
            href="/dashboard"
            className="p-1.5 rounded transition-colors hover:bg-surface-elevated"
          >
            <Home01Icon className="w-5 h-5 text-foreground-muted" />
          </Link>
        </div>
      </header>

      {/* Scrollable Exam Paper */}
      <main className="flex-1 pt-14 pb-8">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-surface shadow-sm rounded-sm">
            {/* Paper content */}
            <div className="px-10 py-12 sm:px-16">
              {/* Header */}
              <div className="text-center mb-10 pb-8 border-b-2 border-neutral-900">
                <h1 className="text-xl font-bold uppercase tracking-wider">{exam.title}</h1>
              </div>

              {/* Info row */}
              <div className="flex flex-wrap justify-between gap-4 text-sm mb-12">
                <div>Name: <span className="inline-block min-w-40 border-b border-neutral-400 ml-2 text-center">{userName || '_______________'}</span></div>
                <div>Date: <span className="inline-block min-w-28 border-b border-neutral-400 ml-2 text-center">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                <div>Score: <span className="inline-block w-16 border-b border-neutral-400 ml-2"></span></div>
              </div>

              {/* Multiple Choice Section */}
              {mcQuestions.length > 0 && (
                <section className="mb-12">
                  <h2 className="font-bold mb-2">{toRoman(++sectionNum)}. Multiple Choice</h2>
                  <p className="text-sm text-neutral-600 mb-6 italic">
                    Choose the correct answer. Encircle the letter of your choice.
                  </p>
                  <div className="space-y-8">
                    {mcQuestions.map((q) => {
                      questionNum++;
                      return (
                        <div key={q.id}>
                          <p className="mb-3">{questionNum}. {q.question}</p>
                          {q.options && (
                            <div className="ml-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                              {q.options.map((opt, optIdx) => {
                                const letter = String.fromCharCode(65 + optIdx);
                                const isSelected = answers.get(q.id)?.toUpperCase() === letter;
                                return (
                                  <label key={optIdx} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-neutral-50 px-2 rounded">
                                    <input
                                      type="radio"
                                      name={`mc-${q.id}`}
                                      checked={isSelected}
                                      onChange={() => handleAnswerChange(q.id, letter)}
                                      className="w-4 h-4"
                                    />
                                    <span>{letter}. {opt.replace(/^[A-D]\)\s*/, '')}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Identification Section */}
              {idQuestions.length > 0 && (
                <section className="mb-12">
                  <h2 className="font-bold mb-2">{toRoman(++sectionNum)}. Identification</h2>
                  <p className="text-sm text-neutral-600 mb-6 italic">
                    Write the correct answer on the blank provided.
                  </p>
                  <div className="space-y-6">
                    {idQuestions.map((q) => {
                      questionNum++;
                      return (
                        <div key={q.id} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <input
                            type="text"
                            value={answers.get(q.id) || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            onBlur={() => {
                              const answer = answers.get(q.id);
                              if (answer) saveAnswer(q.id, answer);
                            }}
                            className="w-full sm:w-40 border-b border-neutral-400 px-1 py-1 focus:outline-none focus:border-neutral-900"
                            placeholder="Answer"
                          />
                          <span className="flex-1">{questionNum}. {q.question}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Essay Section */}
              {essayQuestions.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-bold mb-2">{toRoman(++sectionNum)}. Essay</h2>
                  <p className="text-sm text-neutral-600 mb-6 italic">
                    Answer the following questions thoroughly.
                  </p>
                  <div className="space-y-10">
                    {essayQuestions.map((q) => {
                      questionNum++;
                      return (
                        <div key={q.id}>
                          <div className="flex justify-between items-baseline mb-3">
                            <p>{questionNum}. {q.question}</p>
                            <span className="text-xs text-neutral-500 ml-2 shrink-0">({q.points} pts)</span>
                          </div>
                          <textarea
                            value={answers.get(q.id) || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            onBlur={() => {
                              const answer = answers.get(q.id);
                              if (answer) saveAnswer(q.id, answer);
                            }}
                            className="w-full min-h-[200px] border border-neutral-300 p-4 resize-y focus:outline-none focus:border-neutral-500 rounded-sm"
                            placeholder="Write your answer here..."
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Submit button at bottom */}
              <div className="mt-12 pt-8 border-t border-neutral-200 text-center">
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="px-8 py-3 rounded bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
                >
                  Submit Exam
                </button>
                <p className="text-xs text-neutral-500 mt-3">
                  {progress.answered} of {progress.total} questions answered
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submit modal */}
      {showConfirmSubmit && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => !isSubmitting && setShowConfirmSubmit(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-lg p-6 w-full max-w-sm shadow-xl">
              {isSubmitting ? (
                <div className="text-center py-4">
                  <Loading03Icon className="w-8 h-8 text-neutral-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-neutral-600">{gradingStatus}</p>
                </div>
              ) : gradingError ? (
                <div>
                  <p className="text-red-600 text-sm mb-4">{gradingError}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowConfirmSubmit(false); setGradingError(null); }} className="flex-1 border border-neutral-300 py-2 text-sm hover:bg-neutral-50 rounded">Cancel</button>
                    <button onClick={handleSubmitExam} className="flex-1 bg-neutral-900 text-white py-2 text-sm hover:bg-neutral-800 rounded">Retry</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-bold mb-2">Submit Exam</p>
                  <p className="text-sm text-neutral-600 mb-4">Answered: {progress.answered} / {progress.total}</p>
                  {progress.answered < progress.total && (
                    <p className="text-sm text-red-600 mb-4">Warning: {progress.total - progress.answered} unanswered</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => setShowConfirmSubmit(false)} className="flex-1 border border-neutral-300 py-2 text-sm hover:bg-neutral-50 rounded">Cancel</button>
                    <button onClick={handleSubmitExam} className="flex-1 bg-neutral-900 text-white py-2 text-sm hover:bg-neutral-800 rounded">Submit</button>
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

function toRoman(num: number): string {
  const lookup: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let result = '';
  for (const [value, symbol] of lookup) {
    while (num >= value) { result += symbol; num -= value; }
  }
  return result;
}
