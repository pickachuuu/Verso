'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useWeeklyActivity } from '@/hooks/useDashboard';
import { Activity03Icon } from 'hugeicons-react';

function ChartSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="h-5 w-32 bg-gray-100 rounded-lg mb-4" />
      <div className="flex items-end justify-between gap-2 h-32">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-gray-100 rounded-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
            <div className="h-3 w-6 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </ClayCard>
  );
}

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
    <ClayCard variant="default" padding="md" className="rounded-2xl h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-muted to-primary-muted/70">
            <Activity03Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Weekly Activity</h3>
            <p className="text-xs text-foreground-muted">Last 7 days</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right px-3 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50">
            <p className="font-bold text-foreground">{totalCards}</p>
            <p className="text-xs text-foreground-muted">cards</p>
          </div>
          <div className="text-right px-3 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50">
            <p className="font-bold text-foreground">{totalMinutes}m</p>
            <p className="text-xs text-foreground-muted">studied</p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-3 h-32 mb-3 px-1">
        {data.map((day, index) => {
          const heightPercent = maxCards > 0 ? (day.cardsStudied / maxCards) * 100 : 0;
          const isToday = index === data.length - 1;
          const hasActivity = day.cardsStudied > 0;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center group">
              {/* Tooltip */}
              <div className="relative mb-1">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none z-10 shadow-lg">
                  {day.cardsStudied} cards
                  {day.minutesStudied > 0 && ` · ${day.minutesStudied}m`}
                </div>
              </div>

              {/* Bar */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className={`w-full rounded-xl transition-all duration-300 cursor-pointer ${
                    hasActivity
                      ? isToday
                        ? 'bg-gradient-to-t from-primary to-primary-light shadow-md shadow-primary/20'
                        : 'bg-gradient-to-t from-primary/40 to-primary/60 hover:from-primary/50 hover:to-primary/70'
                      : 'bg-gradient-to-t from-gray-100 to-gray-50'
                  }`}
                  style={{
                    height: hasActivity ? `${Math.max(heightPercent, 10)}%` : '6px',
                    minHeight: hasActivity ? '12px' : '6px'
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
              <span className={`text-xs font-medium ${isToday ? 'text-primary font-semibold' : 'text-foreground-muted'}`}>
                {day.shortDay}
              </span>
            </div>
          );
        })}
      </div>

      {/* Active Days Indicator */}
      <div className="mt-5 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground-muted font-medium">Active days this week</span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < activeDays
                    ? 'bg-gradient-to-br from-primary-light to-primary shadow-sm shadow-primary/30'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
