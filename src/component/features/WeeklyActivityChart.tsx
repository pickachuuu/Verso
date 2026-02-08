'use client';

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

// Gradient colors for each day to add visual variety
const BAR_COLORS = [
  'from-blue-300 to-primary',
  'from-primary-light to-primary',
  'from-blue-200 to-primary-light',
  'from-blue-300 to-primary',
  'from-primary to-primary-dark',
  'from-primary-light to-primary-dark',
  'from-primary to-primary-dark', // today - most vivid
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
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-muted to-primary-muted/70">
            <Activity03Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">Weekly Activity</h3>
            <p className="text-xs text-foreground-muted">Last 7 days</p>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-primary-muted/50 to-primary-muted/80 border border-primary/10">
            <FlashcardIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold text-primary">{totalCards}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-br from-tertiary-muted/50 to-tertiary-muted/80 border border-tertiary/10">
            <Clock01Icon className="w-3.5 h-3.5 text-tertiary" />
            <span className="text-sm font-bold text-tertiary">{totalMinutes}m</span>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex-1 flex items-end justify-between gap-3 mb-3 px-1 min-h-[140px] relative">
        {/* Empty state overlay when no activity */}
        {totalCards === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-muted/40 to-primary-muted/20 mb-3">
              <Activity03Icon className="w-6 h-6 text-primary/40" />
            </div>
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
            <div key={day.date} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-10 shadow-lg">
                <p className="font-bold">{day.cardsStudied} cards</p>
                {day.minutesStudied > 0 && (
                  <p className="opacity-70">{day.minutesStudied}m studied</p>
                )}
              </div>

              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-xl transition-all duration-500 cursor-pointer hover:opacity-90 ${
                    hasActivity
                      ? `bg-gradient-to-t ${barColor} ${isToday ? 'shadow-lg shadow-primary/25 ring-2 ring-primary/20 ring-offset-2 ring-offset-surface' : 'shadow-sm'}`
                      : 'bg-gradient-to-t from-surface to-surface-elevated/50'
                  }`}
                  style={{
                    height: hasActivity ? `${Math.max(heightPercent, 12)}%` : '8px',
                    minHeight: hasActivity ? '16px' : '8px',
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
      <div className="mt-5 pt-4 border-t border-border/50">
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
                    ? 'bg-gradient-to-br from-primary-light to-primary shadow-sm shadow-primary/20'
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
