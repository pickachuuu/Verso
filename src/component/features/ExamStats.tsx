'use client';

import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { useExamStats } from '@/hooks/useDashboard';
import { TestTube01Icon, ArrowRight01Icon, Award02Icon, Target01Icon } from 'hugeicons-react';
import Link from 'next/link';

function ExamStatsSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 bg-gray-100 rounded-lg" />
          <div className="h-3 w-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-gray-50">
            <div className="h-6 w-10 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </ClayCard>
  );
}

function ScoreRing({ percentage, size = 48 }: { percentage: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return '#14B8A6'; // teal/tertiary
    if (percentage >= 60) return '#F97316'; // coral/secondary
    if (percentage >= 40) return '#6366F1'; // indigo/primary
    return '#94A3B8'; // gray
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
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
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
            <TestTube01Icon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No exams yet</h3>
          <p className="text-sm text-foreground-muted">Create an exam to track your performance</p>
          <Link
            href="/exams"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:text-primary-dark font-semibold transition-colors"
          >
            Go to Exams
            <ArrowRight01Icon className="w-4 h-4" />
          </Link>
        </div>
      </ClayCard>
    );
  }

  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary-muted to-secondary-muted/70">
            <TestTube01Icon className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Exam Performance</h3>
            <p className="text-xs text-foreground-muted">{totalExams} exam{totalExams !== 1 ? 's' : ''} created</p>
          </div>
        </div>
        <Link
          href="/exams"
          className="text-sm text-primary hover:text-primary-dark font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-muted/50"
        >
          View all
          <ArrowRight01Icon className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 text-center">
          <p className="text-2xl font-bold text-foreground">{totalAttempts}</p>
          <p className="text-xs text-foreground-muted font-medium">Attempts</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Target01Icon className="w-4 h-4 text-secondary" />
            <p className="text-2xl font-bold text-foreground">{averageScore}%</p>
          </div>
          <p className="text-xs text-foreground-muted font-medium">Average</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Award02Icon className="w-4 h-4 text-tertiary" />
            <p className="text-2xl font-bold text-foreground">{bestScore}%</p>
          </div>
          <p className="text-xs text-foreground-muted font-medium">Best</p>
        </div>
      </div>

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3">Recent Attempts</p>
          <div className="space-y-2.5">
            {recentAttempts.slice(0, 3).map((attempt) => (
              <Link
                key={attempt.id}
                href={`/exams/${attempt.examId}/results/${attempt.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <ScoreRing percentage={attempt.percentage} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {attempt.examTitle}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {new Date(attempt.completedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <ClayBadge
                  variant={attempt.percentage >= 80 ? 'success' : attempt.percentage >= 60 ? 'warning' : 'error'}
                  className="text-xs px-2 py-0.5"
                >
                  {attempt.percentage}%
                </ClayBadge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </ClayCard>
  );
}
