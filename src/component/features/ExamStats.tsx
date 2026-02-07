'use client';

import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { useExamStats } from '@/hooks/useDashboard';
import { ArrowRight01Icon, Award02Icon, Target01Icon } from 'hugeicons-react';
import { ExamIcon } from '@/component/icons';
import Link from 'next/link';

function ExamStatsSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 bg-surface rounded-lg" />
          <div className="h-3 w-20 bg-surface rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-background-muted">
            <div className="h-6 w-10 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </ClayCard>
  );
}

function getGrade(score: number) {
  if (score >= 90) return { letter: 'A', color: 'text-tertiary', bg: 'bg-tertiary-muted', border: 'border-tertiary/20' };
  if (score >= 80) return { letter: 'B', color: 'text-tertiary', bg: 'bg-tertiary-muted', border: 'border-tertiary/20' };
  if (score >= 70) return { letter: 'C', color: 'text-primary', bg: 'bg-primary-muted', border: 'border-primary/20' };
  if (score >= 60) return { letter: 'D', color: 'text-secondary', bg: 'bg-secondary-muted', border: 'border-secondary/20' };
  return { letter: 'F', color: 'text-error', bg: 'bg-red-50', border: 'border-error/20' };
}

function ScoreRing({ percentage, size = 44 }: { percentage: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return '#22C55E';
    if (percentage >= 60) return '#F68048';
    if (percentage >= 40) return '#2845D6';
    return '#94A3B8';
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={getColor()}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}

export default function ExamStats() {
  const { data: stats, isLoading } = useExamStats();

  if (isLoading) {
    return <ExamStatsSkeleton />;
  }

  const {
    totalExams = 0,
    totalAttempts = 0,
    averageScore = 0,
    bestScore = 0,
    recentAttempts = [],
  } = stats || {};

  if (totalExams === 0) {
    return (
      <ClayCard variant="default" padding="md" className="rounded-2xl h-full">
        <div className="flex items-center gap-6 py-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner flex-shrink-0">
            <ExamIcon className="w-8 h-8 text-foreground-muted" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">No exams yet</h3>
            <p className="text-sm text-foreground-muted mb-2">Create an exam to track your performance</p>
            <Link
              href="/exams"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-semibold transition-colors"
            >
              Go to Exams
              <ArrowRight01Icon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </ClayCard>
    );
  }

  const grade = getGrade(averageScore);

  return (
    <ClayCard variant="default" padding="none" className="rounded-2xl h-full overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-secondary via-secondary-light to-secondary-light" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary-muted to-secondary-muted/70">
              <ExamIcon className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Exam Performance</h3>
              <p className="text-[10px] text-foreground-muted">{totalExams} exam{totalExams !== 1 ? 's' : ''} created</p>
            </div>
          </div>
          <Link
            href="/exams"
            className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-primary-muted/50"
          >
            View all
            <ArrowRight01Icon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Stats row with grade */}
        <div className="flex items-center gap-4 mb-5">
          {/* Letter Grade */}
          <div className={`w-16 h-16 rounded-2xl ${grade.bg} border ${grade.border} flex flex-col items-center justify-center flex-shrink-0`}>
            <span className={`text-2xl font-extrabold ${grade.color} leading-none`}>{grade.letter}</span>
            <span className="text-[9px] text-foreground-muted font-medium mt-0.5">Grade</span>
          </div>

          {/* Stat pills */}
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="text-center py-2 px-1 rounded-xl bg-background-muted border border-border">
              <p className="text-lg font-bold text-foreground leading-none">{totalAttempts}</p>
              <p className="text-[10px] text-foreground-muted font-medium mt-1">Attempts</p>
            </div>
            <div className="text-center py-2 px-1 rounded-xl bg-background-muted border border-border">
              <div className="flex items-center justify-center gap-1">
                <Target01Icon className="w-3.5 h-3.5 text-secondary" />
                <p className="text-lg font-bold text-foreground leading-none">{averageScore}%</p>
              </div>
              <p className="text-[10px] text-foreground-muted font-medium mt-1">Avg</p>
            </div>
            <div className="text-center py-2 px-1 rounded-xl bg-background-muted border border-border">
              <div className="flex items-center justify-center gap-1">
                <Award02Icon className="w-3.5 h-3.5 text-tertiary" />
                <p className="text-lg font-bold text-foreground leading-none">{bestScore}%</p>
              </div>
              <p className="text-[10px] text-foreground-muted font-medium mt-1">Best</p>
            </div>
          </div>
        </div>

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-3">Recent</p>
            <div className="space-y-2">
              {recentAttempts.slice(0, 3).map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/exams/${attempt.examId}/results/${attempt.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-background-muted transition-colors group"
                >
                  <ScoreRing percentage={attempt.percentage} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {attempt.examTitle}
                    </p>
                    <p className="text-[10px] text-foreground-muted">
                      {new Date(attempt.completedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <ClayBadge
                    variant={attempt.percentage >= 80 ? 'success' : attempt.percentage >= 60 ? 'warning' : 'error'}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {attempt.percentage}%
                  </ClayBadge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </ClayCard>
  );
}
