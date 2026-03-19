'use client';

import Image from 'next/image';
import { useStudyStreak, useWeeklyActivity } from '@/hooks/useDashboard';
import { FireIcon, Target01Icon } from 'hugeicons-react';

function StreakSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-[3rem] bg-surface border-2 border-border/40 p-8 animate-pulse h-full min-h-[350px]">
      <div className="w-20 h-20 bg-background-muted rounded-full" />
      <div className="h-20 w-32 bg-background-muted rounded-2xl" />
    </div>
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

  const isOnFire = currentStreak >= 7;

  return (
    <div className="h-full rounded-[3rem] bg-surface border-2 border-border/40 p-8 relative overflow-hidden flex flex-col justify-between shadow-sm group">
      {/* Absolute Fire watermark */}
      <FireIcon className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/3 w-[20rem] h-[20rem] text-secondary/[0.04] -z-0 pointer-events-none transition-transform group-hover:scale-110 duration-700" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.2em] text-foreground">
            <FireIcon className="w-5 h-5 text-secondary drop-shadow-sm" />
            STREAK
          </div>
          {studiedToday && (
            <span className="px-4 py-2 bg-success text-[10px] text-surface font-black uppercase tracking-widest rounded-full shadow-sm">
              STUDIED TODAY ✓
            </span>
          )}
        </div>

        {/* Center Giant Number */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <p className="text-[8rem] font-black text-foreground tracking-tighter leading-none">
            {currentStreak}
          </p>
          <p className="text-[14px] font-black uppercase tracking-[0.3em] text-foreground-muted mt-4">
            DAY{currentStreak === 1 ? '' : 'S'} IN A ROW
          </p>
        </div>

        {/* Heatmap Footer */}
        <div className="mt-8 pt-6 border-t-4 border-foreground/5">
          <div className="flex justify-between items-end mb-4 px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">THIS WEEK</span>
            <div className="flex items-center gap-1.5 text-foreground-muted">
              <Target01Icon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{longestStreak} BEST</span>
            </div>
          </div>
          
          <div className="flex justify-between gap-2">
            {weekData.map((day, i) => {
              const hasActivity = day.cardsStudied > 0 || day.sessions > 0;
              const intensity = day.cardsStudied > 10 ? 'high' : day.cardsStudied > 3 ? 'med' : 'low';
              const isToday = i === weekData.length - 1;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group/day cursor-default">
                  <div
                    className={`w-full aspect-square rounded-[1rem] transition-all duration-300 ${
                      hasActivity
                        ? intensity === 'high'
                          ? 'bg-foreground border-2 border-foreground'
                          : intensity === 'med'
                            ? 'bg-foreground/50 border-2 border-foreground/50'
                            : 'bg-foreground/20 border-2 border-foreground/20'
                        : 'bg-transparent border-2 border-foreground/10'
                    } ${isToday ? 'scale-110 shadow-lg' : ''}`}
                    title={`${day.shortDay}: ${day.cardsStudied} cards`}
                  />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-foreground-muted'}`}>
                    {day.shortDay.charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
