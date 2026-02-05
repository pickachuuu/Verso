'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useMasteryData } from '@/hooks/useDashboard';

function MasterySkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="flex items-center gap-6">
        <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-32 bg-gray-100 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded-lg" />
            <div className="h-3 w-3/4 bg-gray-100 rounded-lg" />
            <div className="h-3 w-1/2 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    </ClayCard>
  );
}

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ percentage, size = 112, strokeWidth = 10 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on percentage - using 3-tone system
  const getColor = () => {
    if (percentage >= 80) return { stroke: '#14B8A6', bg: '#F0FDFA', glow: 'rgba(20, 184, 166, 0.15)' }; // Tertiary (Teal) - Success
    if (percentage >= 50) return { stroke: '#F97316', bg: '#FFF7ED', glow: 'rgba(249, 115, 22, 0.15)' }; // Secondary (Coral) - Progress
    if (percentage >= 25) return { stroke: '#6366F1', bg: '#EEF2FF', glow: 'rgba(99, 102, 241, 0.15)' }; // Primary (Indigo)
    return { stroke: '#94A3B8', bg: '#F8FAFC', glow: 'rgba(148, 163, 184, 0.1)' }; // Gray - Starting
  };

  const color = getColor();

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
        style={{ background: color.glow }}
      />
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-2xl font-bold text-foreground">{percentage}%</span>
        <span className="text-xs text-foreground-muted font-medium">Mastered</span>
      </div>
    </div>
  );
}

interface StatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  gradient: string;
}

function StatusBar({ label, count, total, color, gradient }: StatusBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="w-18 text-xs text-foreground-muted font-medium">{label}</div>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${gradient}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className={`w-10 text-xs font-bold ${color} text-right`}>{count}</div>
    </div>
  );
}

export default function MasteryProgress() {
  const { data: mastery, isLoading } = useMasteryData();

  if (isLoading) {
    return <MasterySkeleton />;
  }

  const {
    totalCards = 0,
    newCards = 0,
    learningCards = 0,
    reviewCards = 0,
    masteredCards = 0,
    masteryPercentage = 0,
  } = mastery || {};

  if (totalCards === 0) {
    return (
      <ClayCard variant="default" padding="md" className="rounded-2xl h-full">
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">No flashcards yet</h3>
          <p className="text-sm text-foreground-muted">Create flashcards to track your mastery progress</p>
        </div>
      </ClayCard>
    );
  }

  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl h-full">
      <div className="flex items-center gap-5">
        {/* Progress Ring */}
        <ProgressRing percentage={masteryPercentage} />

        {/* Status Breakdown */}
        <div className="flex-1 space-y-2.5 min-w-0">
          <div className="mb-3">
            <h3 className="font-semibold text-foreground">Mastery Progress</h3>
            <p className="text-xs text-foreground-muted">{totalCards} total cards</p>
          </div>

          <StatusBar label="New" count={newCards} total={totalCards} color="text-gray-500" gradient="bg-gradient-to-r from-gray-300 to-gray-400" />
          <StatusBar label="Learning" count={learningCards} total={totalCards} color="text-primary" gradient="bg-gradient-to-r from-primary-light to-primary" />
          <StatusBar label="Review" count={reviewCards} total={totalCards} color="text-secondary" gradient="bg-gradient-to-r from-secondary-light to-secondary" />
          <StatusBar label="Mastered" count={masteredCards} total={totalCards} color="text-tertiary" gradient="bg-gradient-to-r from-tertiary-light to-tertiary" />
        </div>
      </div>
    </ClayCard>
  );
}
