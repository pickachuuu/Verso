'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useStudyStreak, useWeeklyActivity } from '@/hooks/useDashboard';
import { FireIcon, Target01Icon } from 'hugeicons-react';

function StreakSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full" />
        <div className="h-8 w-16 bg-surface rounded-lg" />
        <div className="h-4 w-24 bg-surface rounded-lg" />
        <div className="flex gap-1.5 mt-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-surface rounded-lg" />
          ))}
        </div>
      </div>
    </ClayCard>
  );
}

export default function StudyStreak() {
  const { data: streak, isLoading: streakLoading } = useStudyStreak();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyActivity();

  if (streakLoading || weeklyLoading) {
    return <StreakSkeleton />;
  }

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const studiedToday = streak?.studiedToday || false;
  const weekData = weeklyData || [];

  // Flame intensity based on streak
  const isOnFire = currentStreak >= 7;
  const isWarm = currentStreak >= 3;
  const isActive = currentStreak > 0;

  const flameGradient = isOnFire
    ? 'from-secondary via-red-500 to-secondary-light'
    : isWarm
      ? 'from-secondary via-secondary to-secondary-light'
      : isActive
        ? 'from-secondary/90 to-secondary-light'
        : 'from-gray-200 to-gray-300';

  return (
    <ClayCard variant="default" padding="none" className="rounded-2xl h-full overflow-hidden relative">
      {/* Subtle gradient background for active streaks */}
      {isActive && (
        <div className={`absolute inset-0 bg-gradient-to-b ${
          isOnFire ? 'from-secondary-muted/80 via-white to-white' :
          isWarm ? 'from-secondary-muted/60 via-white to-white' :
          'from-secondary-muted/30 to-white'
        } pointer-events-none`} />
      )}

      <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
        {/* Flame / Icon */}
        <div className="relative mb-4">
          {/* Glow ring */}
          {isActive && (
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${flameGradient} opacity-20 blur-xl scale-150`} />
          )}
          <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${flameGradient} flex items-center justify-center shadow-lg ${
            isOnFire ? 'shadow-secondary/40' : isWarm ? 'shadow-secondary/30' : isActive ? 'shadow-secondary/20' : 'shadow-gray-200/50'
          }`}>
            <FireIcon className={`w-10 h-10 text-white ${isOnFire ? 'animate-pulse' : ''}`} />
          </div>
          {/* Fire badge for 7+ */}
          {isOnFire && (
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-secondary-light to-secondary rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <span className="text-xs">🔥</span>
            </div>
          )}
        </div>

        {/* Streak count */}
        <p className="text-5xl font-extrabold text-foreground tracking-tight leading-none">
          {currentStreak}
        </p>
        <p className="text-sm text-foreground-muted font-medium mt-1">
          day {currentStreak === 1 ? '' : 's'} streak
        </p>

        {/* Studied today badge */}
        {studiedToday && (
          <span className="mt-3 px-3 py-1 bg-gradient-to-r from-tertiary/10 to-tertiary/20 text-tertiary text-xs font-bold rounded-full border border-tertiary/20">
            Studied today ✓
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mini 7-day heatmap */}
        <div className="w-full mt-5 pt-5 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-foreground-muted font-semibold">This week</span>
            <div className="flex items-center gap-1.5 text-foreground-muted">
              <Target01Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">{longestStreak} best</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {weekData.map((day, i) => {
              const hasActivity = day.cardsStudied > 0 || day.sessions > 0;
              const intensity = day.cardsStudied > 10 ? 'high' : day.cardsStudied > 3 ? 'med' : 'low';
              const isToday = i === weekData.length - 1;

              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-full aspect-square rounded-lg transition-all duration-300 ${
                      hasActivity
                        ? intensity === 'high'
                          ? 'bg-gradient-to-br from-primary to-primary-light shadow-sm shadow-primary/20'
                          : intensity === 'med'
                            ? 'bg-gradient-to-br from-primary/60 to-primary-light/60'
                            : 'bg-gradient-to-br from-primary/30 to-primary-light/30'
                        : 'bg-surface'
                    } ${isToday ? 'ring-2 ring-primary/30 ring-offset-1' : ''}`}
                    title={`${day.shortDay}: ${day.cardsStudied} cards`}
                  />
                  <span className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : 'text-foreground-muted'}`}>
                    {day.shortDay}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivation line */}
        {!studiedToday && currentStreak > 0 && (
          <p className="mt-4 text-xs text-secondary font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Don&apos;t break your {currentStreak}-day streak!
          </p>
        )}
        {currentStreak === 0 && (
          <p className="mt-4 text-xs text-foreground-muted">
            Start studying to begin your streak!
          </p>
        )}
      </div>
    </ClayCard>
  );
}
