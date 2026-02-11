'use client';

import Image from 'next/image';
import { ClayCard } from '@/component/ui/Clay';
import { useWeeklyActivity } from '@/hooks/useDashboard';
import { Activity03Icon, Clock01Icon } from 'hugeicons-react';
import { FlashcardIcon } from '@/component/icons';

const SKELETON_HEIGHTS = [45, 65, 30, 80, 55, 40, 70];

function ChartSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="h-5 w-32 bg-surface rounded-lg mb-4" />
      <div className="flex items-end justify-between gap-2 h-32">
        {SKELETON_HEIGHTS.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-surface rounded-lg" style={{ height: `${height}%` }} />
            <div className="h-3 w-6 bg-surface rounded" />
          </div>
        ))}
      </div>
    </ClayCard>
  );
}

// Soft ink tones for each day
const BAR_COLORS = [
  'bg-primary/25',
  'bg-primary/35',
  'bg-primary/20',
  'bg-primary/30',
  'bg-primary/40',
  'bg-primary/35',
  'bg-primary/50', // today - most vivid
];

export default function WeeklyActivityChart() {
  const { data: weeklyData, isLoading } = useWeeklyActivity();

  if (isLoading) {
    return <ChartSkeleton />;
  }

  const data = weeklyData || [];
  const maxCards = Math.max(...data.map(d => d.cardsStudied), 1);
  const totalCards = data.reduce((sum, d) => sum + d.cardsStudied, 0);
  const totalMinutes = data.reduce((sum, d) => sum + d.minutesStudied, 0);
  const activeDays = data.filter(d => d.cardsStudied > 0).length;

  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-background-muted border border-border">
            <Activity03Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">Weekly Activity</h3>
            <p className="text-xs text-foreground-muted">Last 7 days</p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-muted border border-border">
            <FlashcardIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{totalCards}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-muted border border-border">
            <Clock01Icon className="w-3.5 h-3.5 text-tertiary" />
            <span className="text-sm font-bold text-tertiary">{totalMinutes}m</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 flex items-end justify-between gap-3 mb-3 px-1 h-40 min-h-[160px] relative">
        {/* Empty state overlay when no activity */}
        {totalCards === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <Image
              src="/brand/verso-writing-notes-clean.svg"
              alt="Verso mascot"
              width={64}
              height={64}
              className="mb-3 drop-shadow-sm"
            />
            <p className="text-sm font-medium text-foreground-muted">No activity this week</p>
            <p className="text-xs text-foreground-muted/70 mt-1">Study some cards to see your chart fill up!</p>
          </div>
        )}

        {data.map((day, index) => {
          const heightPercent = maxCards > 0 ? (day.cardsStudied / maxCards) * 100 : 0;
          const isToday = index === data.length - 1;
          const hasActivity = day.cardsStudied > 0;
          const barColor = BAR_COLORS[index] || BAR_COLORS[BAR_COLORS.length - 1];

          return (
            <div key={day.date} className="flex-1 h-full flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-10 shadow-lg">
                <p className="font-bold">{day.cardsStudied} cards</p>
                {day.minutesStudied > 0 && (
                  <p className="opacity-70">{day.minutesStudied}m studied</p>
                )}
              </div>

              {/* Bar */}
              <div className="w-full h-full flex items-end">
                <div
                  className={`w-full rounded-xl transition-all duration-500 cursor-pointer hover:opacity-90 ${
                    hasActivity
                      ? `${barColor} ${isToday ? 'shadow-sm ring-2 ring-primary/20 ring-offset-2 ring-offset-background' : 'shadow-sm'}`
                      : 'bg-background-muted border border-border'
                  }`}
                  style={{
                    height: hasActivity ? `${Math.max(heightPercent, 16)}%` : '8px',
                    minHeight: hasActivity ? '24px' : '8px',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Labels */}
      <div className="flex justify-between gap-3 px-1">
        {data.map((day, index) => {
          const isToday = index === data.length - 1;
          return (
            <div key={day.date} className="flex-1 text-center">
              <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground-muted'}`}>
                {day.shortDay}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Days Footer */}
      <div className="mt-5 pt-4 border-t border-border/70">
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-muted font-medium">
            {activeDays}/7 active days
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < activeDays
                    ? 'bg-primary/35'
                    : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
