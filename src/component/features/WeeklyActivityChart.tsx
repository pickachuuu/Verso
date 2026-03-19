'use client';

import { useWeeklyActivity } from '@/hooks/useDashboard';
import { Activity03Icon, Clock01Icon } from 'hugeicons-react';
import { FlashcardIcon } from '@/component/icons';
import Image from 'next/image';

function ChartSkeleton() {
  return (
    <div className="rounded-[3rem] bg-surface p-10 animate-pulse h-[400px] flex flex-col border-2 border-border/40">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-40 bg-background-muted rounded-full" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-background-muted rounded-full" />
          <div className="h-10 w-24 bg-background-muted rounded-full" />
        </div>
      </div>
      <div className="flex-1 flex items-end justify-between gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 h-1/2 bg-background-muted rounded-full" />
        ))}
      </div>
    </div>
  );
}

const SKELETON_HEIGHTS = ['40%', '60%', '30%', '80%', '50%', '90%', '70%'];

export default function WeeklyActivityChart() {
  const { data: weeklyData, isLoading } = useWeeklyActivity();

  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Ensure 7 days of data
  const data = weeklyData || [];
  const totalCards = data.reduce((sum, d) => sum + d.cardsStudied, 0);
  const totalMinutes = data.reduce((sum, d) => sum + d.minutesStudied, 0);
  const maxCards = Math.max(...data.map((d) => d.cardsStudied), 1);
  const activeDays = data.filter(d => d.cardsStudied > 0).length;

  return (
    <div className="rounded-[3rem] bg-surface border-2 border-border/40 h-full flex flex-col p-10 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-foreground">
            <Activity03Icon className="w-6 h-6" />
            <h3 className="font-black text-foreground text-xl uppercase tracking-[0.2em] leading-none mt-1">WEEKLY ACTIVITY</h3>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface border-[3px] border-foreground/10 text-foreground">
            <FlashcardIcon className="w-5 h-5" />
            <span className="text-lg font-black leading-none mt-1">{totalCards} <span className="text-[10px] text-foreground-muted tracking-widest uppercase">CARDS</span></span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface border-[3px] border-foreground/10 text-foreground">
            <Clock01Icon className="w-5 h-5" />
            <span className="text-lg font-black leading-none mt-1">{totalMinutes} <span className="text-[10px] text-foreground-muted tracking-widest uppercase">MINS</span></span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative min-h-[180px] flex gap-4 xl:gap-6 mt-4 items-end">
        {/* Empty state overlay when no activity */}
        {totalCards === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-surface/80 backdrop-blur-sm rounded-[2rem]">
            <Image
              src="/brand/verso-empty-clean.svg"
              alt="Verso mascot — empty state"
              width={80}
              height={80}
              className="mb-6 drop-shadow-sm opacity-50 grayscale"
            />
            <p className="text-[16px] font-black tracking-[0.3em] uppercase text-foreground mb-2">NO ACTIVITY THIS WEEK</p>
            <p className="text-[11px] font-black tracking-widest uppercase text-foreground-muted">START STUDYING TO FILL YOUR CHART!</p>
          </div>
        )}

        {/* Bars */}
        {data.map((day, index) => {
          const isToday = index === data.length - 1;
          const hasActivity = day.cardsStudied > 0;
          const heightPercent = maxCards > 0 ? (day.cardsStudied / maxCards) * 100 : 0;

          // Instead of primary, let's use brutalist scale: foreground for today, or just massive flat block.
          const barStyle = isToday
            ? 'bg-foreground border-[3px] border-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
            : 'bg-foreground/10 border-[3px] border-transparent hover:bg-foreground/20';

          return (
            <div key={day.date} className="flex-1 h-full flex flex-col items-center justify-end relative group">
              {/* Tooltip */}
              {hasActivity && (
                <div className="absolute -top-10 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all bg-foreground text-surface px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest z-20 whitespace-nowrap shadow-xl">
                  {day.cardsStudied} CARDS
                </div>
              )}

              {/* Bar */}
              <div className="w-full flex items-end justify-center mb-6 h-full">
                <div
                  className={`w-full max-w-[4.5rem] rounded-full transition-all duration-[600ms] ease-out cursor-pointer hover:-translate-y-2 ${
                    hasActivity ? barStyle : 'bg-surface border-[3px] border-border/40'
                  }`}
                  style={{
                    height: hasActivity ? `${Math.max(heightPercent, 12)}%` : '12px',
                    minHeight: hasActivity ? '40px' : '12px',
                  }}
                />
              </div>

              {/* Label */}
              <span className={`text-[12px] uppercase tracking-[0.2em] font-black ${isToday ? 'text-foreground' : 'text-foreground-muted'}`}>
                {day.shortDay.substring(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
