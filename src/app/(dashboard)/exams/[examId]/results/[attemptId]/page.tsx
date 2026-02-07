'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { ClayCard, ClayButton, ClayBadge } from "@/component/ui/Clay";
import { useExamActions, AttemptWithResponses } from "@/hook/useExamActions";
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Award01Icon,
  Clock01Icon,
  Target01Icon,
  SparklesIcon,
  RotateClockwiseIcon
} from "hugeicons-react";
import { ExamIcon } from '@/component/icons';
import { clsx } from "clsx";

// Question type styles
const questionTypeStyles = {
  multiple_choice: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Multiple Choice'
  },
  identification: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    label: 'Identification'
  },
  essay: {
    bg: 'bg-primary-muted/50',
    border: 'border-primary/20',
    badge: 'bg-primary-muted text-primary-dark',
    label: 'Essay'
  }
};

// Score color based on percentage
const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 70) return 'text-blue-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBg = (percentage: number) => {
  if (percentage >= 90) return 'from-green-500 to-emerald-500';
  if (percentage >= 70) return 'from-blue-500 to-primary';
  if (percentage >= 50) return 'from-yellow-500 to-orange-500';
  return 'from-red-500 to-rose-500';
};

const getGradeLabel = (percentage: number) => {
  if (percentage >= 90) return 'Excellent!';
  if (percentage >= 80) return 'Great Job!';
  if (percentage >= 70) return 'Good Work!';
  if (percentage >= 60) return 'Passed';
  if (percentage >= 50) return 'Needs Improvement';
  return 'Keep Studying';
};

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;
  const attemptId = params.attemptId as string;

  const [results, setResults] = useState<AttemptWithResponses | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { getAttemptResults } = useExamActions();

  // Load results
  useEffect(() => {
    const loadResults = async () => {
      setIsLoading(true);
      try {
        const data = await getAttemptResults(attemptId);
        if (!data) {
          router.push('/exams');
          return;
        }
        setResults(data);
      } catch (error) {
        console.error('Error loading results:', error);
        router.push('/exams');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [attemptId, getAttemptResults, router]);

  // Calculate stats by question type
  const stats = useMemo(() => {
    if (!results?.responses) return null;

    const byType = {
      multiple_choice: { correct: 0, total: 0, points: 0, maxPoints: 0 },
      identification: { correct: 0, total: 0, points: 0, maxPoints: 0 },
      essay: { correct: 0, total: 0, points: 0, maxPoints: 0 }
    };

    for (const response of results.responses) {
      const type = response.question.question_type;
      byType[type].total++;
      byType[type].maxPoints += response.question.points;
      byType[type].points += response.score || 0;
      if (response.is_correct) byType[type].correct++;
    }

    return byType;
  }, [results?.responses]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-background-muted rounded mb-6 w-1/3"></div>
            <div className="h-64 bg-background-muted rounded-xl mb-4"></div>
            <div className="h-48 bg-background-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // No results found
  if (!results) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center py-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">Results Not Found</h2>
          <ClayButton onClick={() => router.push('/exams')}>
            Back to Exams
          </ClayButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background-muted">
      {/* Header */}
      <div className="bg-surface-elevated border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/exams')}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
              >
                <ArrowLeft01Icon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-foreground">{results.exam.title}</h1>
                <p className="text-sm text-foreground-muted">Exam Results</p>
              </div>
            </div>
            <ClayButton
              variant="secondary"
              onClick={() => router.push(`/exams/${examId}`)}
            >
              <RotateClockwiseIcon className="w-4 h-4 mr-2" />
              Retake Exam
            </ClayButton>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Score Summary Card */}
        <div className={clsx(
          'rounded-3xl p-8 text-white mb-8 bg-gradient-to-br',
          getScoreBg(results.percentage)
        )}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award01Icon className="w-8 h-8" />
                <span className="text-xl font-medium opacity-90">{getGradeLabel(results.percentage)}</span>
              </div>
              <div className="text-6xl font-bold mb-2">
                {results.percentage}%
              </div>
              <p className="text-lg opacity-90">
                {results.total_score} / {results.max_score} points
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-elevated/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Target01Icon className="w-4 h-4" />
                  <span className="text-sm opacity-80">Questions</span>
                </div>
                <p className="text-2xl font-bold">{results.responses.length}</p>
              </div>
              <div className="bg-surface-elevated/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Clock01Icon className="w-4 h-4" />
                  <span className="text-sm opacity-80">Time</span>
                </div>
                <p className="text-2xl font-bold">{formatTime(results.time_spent_seconds)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats by Question Type */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.multiple_choice.total > 0 && (
              <ClayCard variant="elevated" padding="md" className="rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CheckmarkCircle01Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Multiple Choice</h3>
                    <p className="text-xs text-foreground-muted">{stats.multiple_choice.total} questions</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-600">
                    {Math.round((stats.multiple_choice.correct / stats.multiple_choice.total) * 100)}%
                  </span>
                  <span className="text-sm text-foreground-muted">
                    ({stats.multiple_choice.correct}/{stats.multiple_choice.total} correct)
                  </span>
                </div>
              </ClayCard>
            )}

            {stats.identification.total > 0 && (
              <ClayCard variant="elevated" padding="md" className="rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckmarkCircle01Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Identification</h3>
                    <p className="text-xs text-foreground-muted">{stats.identification.total} questions</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-600">
                    {Math.round((stats.identification.correct / stats.identification.total) * 100)}%
                  </span>
                  <span className="text-sm text-foreground-muted">
                    ({stats.identification.correct}/{stats.identification.total} correct)
                  </span>
                </div>
              </ClayCard>
            )}

            {stats.essay.total > 0 && (
              <ClayCard variant="elevated" padding="md" className="rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-muted flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Essay</h3>
                    <p className="text-xs text-foreground-muted">{stats.essay.total} questions · AI Graded</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {Math.round((stats.essay.points / stats.essay.maxPoints) * 100)}%
                  </span>
                  <span className="text-sm text-foreground-muted">
                    ({stats.essay.points}/{stats.essay.maxPoints} points)
                  </span>
                </div>
              </ClayCard>
            )}
          </div>
        )}

        {/* Detailed Results */}
        <h2 className="text-xl font-bold text-foreground mb-4">Question Review</h2>
        <div className="space-y-4">
          {results.responses.map((response, idx) => {
            const question = response.question;
            const style = questionTypeStyles[question.question_type];
            const isCorrect = response.is_correct;

            return (
              <ClayCard
                key={response.id}
                variant="elevated"
                padding="md"
                className={clsx(
                  'rounded-2xl border-l-4',
                  isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                )}
              >
                {/* Question header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">Q{idx + 1}</span>
                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', style.badge)}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckmarkCircle01Icon className="w-5 h-5" />
                        Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <Cancel01Icon className="w-5 h-5" />
                        Incorrect
                      </span>
                    )}
                    <span className="text-sm text-foreground-muted">
                      {response.score}/{question.points} pts
                    </span>
                  </div>
                </div>

                {/* Question text */}
                <p className="text-foreground mb-4 whitespace-pre-wrap">{question.question}</p>

                {/* Multiple choice options */}
                {question.question_type === 'multiple_choice' && question.options && (
                  <div className="space-y-2 mb-4">
                    {question.options.map((option, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isUserAnswer = response.user_answer?.toUpperCase() === letter;
                      const isCorrectAnswer = question.correct_answer.toUpperCase() === letter;

                      return (
                        <div
                          key={optIdx}
                          className={clsx(
                            'p-3 rounded-lg border-2',
                            isCorrectAnswer && 'bg-green-50 border-green-300',
                            isUserAnswer && !isCorrectAnswer && 'bg-red-50 border-red-300',
                            !isUserAnswer && !isCorrectAnswer && 'bg-background-muted border-border'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className={clsx(
                              'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                              isCorrectAnswer && 'bg-green-500 text-white',
                              isUserAnswer && !isCorrectAnswer && 'bg-red-500 text-white',
                              !isUserAnswer && !isCorrectAnswer && 'bg-border text-foreground-muted'
                            )}>
                              {letter}
                            </span>
                            <span className={clsx(
                              isCorrectAnswer && 'text-green-700',
                              isUserAnswer && !isCorrectAnswer && 'text-red-700'
                            )}>
                              {option.replace(/^[A-D]\)\s*/, '')}
                            </span>
                            {isCorrectAnswer && (
                              <CheckmarkCircle01Icon className="w-4 h-4 text-green-500 ml-auto" />
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <Cancel01Icon className="w-4 h-4 text-red-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Identification answer */}
                {question.question_type === 'identification' && (
                  <div className="space-y-2 mb-4">
                    <div className={clsx(
                      'p-3 rounded-lg',
                      isCorrect ? 'bg-green-50' : 'bg-red-50'
                    )}>
                      <span className="text-xs text-foreground-muted block mb-1">Your Answer:</span>
                      <span className={clsx(
                        'font-medium',
                        isCorrect ? 'text-green-700' : 'text-red-700'
                      )}>
                        {response.user_answer || '(No answer)'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="p-3 rounded-lg bg-green-50">
                        <span className="text-xs text-foreground-muted block mb-1">Correct Answer:</span>
                        <span className="font-medium text-green-700">{question.correct_answer}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Essay answer and feedback */}
                {question.question_type === 'essay' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-primary-muted/50">
                      <span className="text-xs text-foreground-muted block mb-2">Your Answer:</span>
                      <p className="text-foreground whitespace-pre-wrap">
                        {response.user_answer || '(No answer)'}
                      </p>
                    </div>

                    {response.ai_feedback && (
                      <div className="p-4 rounded-lg bg-gradient-to-br from-primary-muted/50 to-primary-muted border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <SparklesIcon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary-dark">AI Feedback</span>
                        </div>
                        <p className="text-foreground-muted text-sm">{response.ai_feedback}</p>
                      </div>
                    )}

                    <div className="p-4 rounded-lg bg-background-muted">
                      <span className="text-xs text-foreground-muted block mb-2">Model Answer / Key Points:</span>
                      <p className="text-foreground text-sm whitespace-pre-wrap">{question.correct_answer}</p>
                    </div>
                  </div>
                )}
              </ClayCard>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-8 pb-8">
          <ClayButton
            variant="secondary"
            size="lg"
            onClick={() => router.push('/exams')}
          >
            <ArrowLeft01Icon className="w-5 h-5 mr-2" />
            Back to Exams
          </ClayButton>
          <ClayButton
            variant="primary"
            size="lg"
            onClick={() => router.push(`/exams/${examId}`)}
            className="bg-secondary hover:bg-secondary/90"
          >
            <RotateClockwiseIcon className="w-5 h-5 mr-2" />
            Retake Exam
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
