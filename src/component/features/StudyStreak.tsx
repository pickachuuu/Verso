'use client';

import Image from 'next/image';
import { ClayCard } from '@/component/ui/Clay';
import { useStudyStreak, useWeeklyActivity } from '@/hooks/useDashboard';
import { FireIcon, Target01Icon } from 'hugeicons-react';

function StreakSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-20 h-20 bg-gradient-to-br from-surface to-surface-elevated rounded-full" />
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
  const flameTone = isOnFire
    ? 'text-secondary'
    : isWarm
      ? 'text-secondary/80'
      : isActive
        ? 'text-secondary/60'
        : 'text-foreground-muted';
  const flameShell = isActive
    ? 'bg-secondary/10 border-secondary/30 shadow-sm'
    : 'bg-background-muted border-border';

  return (
    <ClayCard variant="default" padding="none" className="rounded-2xl h-full relative">
      <div className="relative z-10 p-6 flex flex-col items-center text-center h-full">
        {/* Flame / Icon */}
        <div className="relative mb-4">
          <div className={`relative w-20 h-20 rounded-full border ${flameShell} flex items-center justify-center`}>
            <FireIcon className={`w-10 h-10 ${flameTone} ${isOnFire ? 'animate-pulse' : ''}`} />
          </div>
          {/* Fire badge for 7+ */}
          {isOnFire && (
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-secondary/15 rounded-full flex items-center justify-center border border-secondary/40">
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
          <span className="mt-3 px-3 py-1 bg-tertiary/10 text-tertiary text-xs font-bold rounded-full border border-tertiary/30">
            Studied today ✓
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Mini 7-day heatmap */}
        <div className="w-full mt-5 pt-5 border-t border-border/70">
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
                          ? 'bg-primary/40 border border-primary/40'
                          : intensity === 'med'
                            ? 'bg-primary/25 border border-primary/30'
                            : 'bg-primary/15 border border-primary/20'
                        : 'bg-background-muted border border-border'
                    } ${isToday ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background' : ''}`}
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
          <div className="mt-4 flex flex-col items-center gap-2">
            <Image
              src="/brand/verso-thinking-clean.svg"
              alt="Verso mascot thinking"
              width={40}
              height={40}
              className="drop-shadow-sm"
            />
            <p className="text-xs text-foreground-muted">
              Start studying to begin your streak!
            </p>
          </div>
        )}
      </div>
    </ClayCard>
  );
}
