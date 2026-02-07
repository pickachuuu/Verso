'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useMasteryData } from '@/hooks/useDashboard';

function MasterySkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-24 h-24 bg-gradient-to-br from-surface to-surface-elevated rounded-full" />
        <div className="h-4 w-32 bg-surface rounded-lg" />
        <div className="w-full space-y-2">
          <div className="h-3 w-full bg-surface rounded-lg" />
          <div className="h-3 w-3/4 bg-surface rounded-lg" />
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

function ProgressRing({ percentage, size = 120, strokeWidth = 10 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 80) return { stroke: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', glow: 'rgba(34, 197, 94, 0.15)' };
    if (percentage >= 50) return { stroke: '#F68048', bg: 'rgba(246, 128, 72, 0.1)', glow: 'rgba(246, 128, 72, 0.15)' };
    if (percentage >= 25) return { stroke: '#2845D6', bg: 'rgba(40, 69, 214, 0.1)', glow: 'rgba(40, 69, 214, 0.15)' };
    return { stroke: '#94A3B8', bg: 'rgba(148, 163, 184, 0.08)', glow: 'rgba(148, 163, 184, 0.08)' };
  };

  const color = getColor();

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
        style={{ background: color.glow }}
      />
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color.bg} strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color.stroke} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-2xl font-extrabold text-foreground leading-none">{percentage}%</span>
      </div>
    </div>
  );
}

function getLevel(percentage: number) {
  if (percentage >= 80) return { label: 'Master', emoji: '👑', color: 'text-tertiary' };
  if (percentage >= 50) return { label: 'Scholar', emoji: '📖', color: 'text-secondary' };
  if (percentage >= 25) return { label: 'Learner', emoji: '✏️', color: 'text-primary' };
  return { label: 'Novice', emoji: '🌱', color: 'text-foreground-muted' };
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-surface to-surface-elevated flex items-center justify-center shadow-inner">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="font-semibold text-foreground mb-1 text-sm">No flashcards yet</h3>
          <p className="text-xs text-foreground-muted">Create flashcards to track mastery</p>
        </div>
      </ClayCard>
    );
  }

  const level = getLevel(masteryPercentage);

  // Status segments for horizontal bar
  const segments = [
    { label: 'New', count: newCards, color: 'bg-border-light' },
    { label: 'Learning', count: learningCards, color: 'bg-primary' },
    { label: 'Review', count: reviewCards, color: 'bg-secondary' },
    { label: 'Mastered', count: masteredCards, color: 'bg-tertiary' },
  ];

  return (
    <ClayCard variant="default" padding="none" className="rounded-2xl h-full overflow-hidden">
      {/* Colored top accent */}
      <div className={`h-1 ${
        masteryPercentage >= 80 ? 'bg-gradient-to-r from-tertiary via-tertiary-light to-tertiary' :
        masteryPercentage >= 50 ? 'bg-gradient-to-r from-secondary via-secondary-light to-secondary' :
        masteryPercentage >= 25 ? 'bg-gradient-to-r from-primary via-primary-light to-primary' :
        'bg-gradient-to-r from-border to-border-light'
      }`} />

      <div className="p-5 flex flex-col items-center text-center h-full">
        {/* Ring */}
        <ProgressRing percentage={masteryPercentage} size={100} strokeWidth={9} />

        {/* Level label */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-sm">{level.emoji}</span>
          <span className={`text-sm font-bold ${level.color}`}>{level.label}</span>
        </div>

        <p className="text-xs text-foreground-muted mt-1">{totalCards} total cards</p>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Stacked bar */}
        <div className="w-full mt-4">
          <div className="h-3 rounded-full overflow-hidden flex bg-surface shadow-inner">
            {segments.map((seg) => {
              const width = totalCards > 0 ? (seg.count / totalCards) * 100 : 0;
              return width > 0 ? (
                <div
                  key={seg.label}
                  className={`${seg.color} transition-all duration-500`}
                  style={{ width: `${width}%` }}
                  title={`${seg.label}: ${seg.count}`}
                />
              ) : null;
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${seg.color}`} />
                <span className="text-[10px] text-foreground-muted font-medium">
                  {seg.label} ({seg.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
