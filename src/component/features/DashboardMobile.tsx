'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { UserProfile } from '@/hooks/useAuth';
import {
  Add01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Clock01Icon,
  FireIcon,
  PencilEdit01Icon,
  PlayIcon,
  SparklesIcon,
  Target01Icon,
} from 'hugeicons-react';
import { FlashcardIcon, NotebookIcon, ExamIcon } from '@/component/icons';
import {
  useContinueLearning,
  useRecentActivity,
  useStudyStreak,
  useWeeklyActivity,
} from '@/hooks/useDashboard';

type DashboardMobileProps = {
  user?: UserProfile | null;
};

const ACTIVITY_META = {
  note: {
    label: 'NOTE',
    icon: NotebookIcon,
    badgeClasses: 'bg-accent/20 text-accent border border-accent/30',
  },
  flashcard: {
    label: 'FLASHCARD',
    icon: FlashcardIcon,
    badgeClasses: 'bg-success/20 text-success border border-success/30',
  },
  exam: {
    label: 'EXAM',
    icon: ExamIcon,
    badgeClasses: 'bg-warning/20 text-warning border border-warning/30',
  },
} as const;

function MobileHeader({ user }: DashboardMobileProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const currentDate = new Date();
  const greeting = (() => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  })();
  const displayName = isMounted ? user?.full_name || user?.email?.split('@')[0] || 'THERE' : 'THERE';

  return (
    <div className="flex items-center justify-between gap-4 pt-2 pb-2">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted mb-1">{greeting}</p>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none truncate">
          {displayName}
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-foreground bg-surface shadow-sm shrink-0">
        <span className="text-[12px] font-black leading-none">{format(currentDate, 'd')}</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-foreground-muted">{format(currentDate, 'MMM')}</span>
      </div>
    </div>
  );
}

function MobileQuickActions() {
  return (
    <div className="flex gap-2 mt-4">
      <Link href="/library" className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-foreground text-surface shadow-lg hover:bg-foreground/90 transition-all active:scale-95">
        <PencilEdit01Icon className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">NEW NOTE</span>
      </Link>
      <Link href="/flashcards" className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-surface border-2 border-border/40 text-foreground hover:bg-background-muted transition-all active:scale-95 shadow-sm">
        <FlashcardIcon className="w-4 h-4" />
        <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">BROWSE SETS</span>
      </Link>
    </div>
  );
}

function MobileContinueLearning() {
  const { data, isLoading } = useContinueLearning();

  if (isLoading) {
    return (
      <div className="rounded-[2.5rem] bg-surface border-2 border-border/40 p-8 animate-pulse mt-4">
        <div className="h-4 w-32 bg-background-muted mb-6 rounded-full" />
        <div className="h-12 w-3/4 bg-background-muted mb-4 rounded-xl" />
      </div>
    );
  }

  const { lastStudiedSet, suggestedAction } = data || {};
  const config = (() => {
    switch (suggestedAction) {
      case 'review_due': return { title: 'REVIEW DUE CARDS', icon: <Clock01Icon className="w-6 h-6" />, href: '/flashcards' };
      case 'continue_set': return { title: 'CONTINUE STUDYING', icon: <PlayIcon className="w-6 h-6" />, href: lastStudiedSet ? `/flashcards/${lastStudiedSet.id}/study` : '/flashcards' };
      case 'start_new': return { title: 'START A NEW SET', icon: <FlashcardIcon className="w-6 h-6" />, href: '/flashcards' };
      case 'create_cards':
      default: return { title: 'CREATE FLASHCARDS', icon: <Add01Icon className="w-6 h-6" />, href: '/library' };
    }
  })();

  return (
    <div className="mt-4">
      <Link href={config.href} className="block group">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground text-surface p-8 shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 w-48 h-48 bg-surface opacity-10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
          
          <div className="p-4 rounded-full bg-surface/10 backdrop-blur-sm border border-surface/20 text-surface mb-5 shrink-0 relative z-10">
            {config.icon}
          </div>
          
          <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-surface/70 mb-2 relative z-10">UP NEXT</h2>
          <h3 className="font-black text-2xl uppercase tracking-widest text-surface leading-tight relative z-10">
            {config.title}
          </h3>
          
          {suggestedAction === 'continue_set' && lastStudiedSet && (
            <div className="w-full mt-8 relative z-10">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-surface/60 mb-2">
                <span>PROGRESS</span>
                <span className="text-surface">{lastStudiedSet.progress}%</span>
              </div>
              <div className="h-2.5 bg-surface/20 rounded-full overflow-hidden">
                <div className="h-full bg-surface rounded-full transition-all duration-500" style={{ width: `${lastStudiedSet.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function MobileStreakAndActivity() {
  const { data: streak, isLoading: streakLoading } = useStudyStreak();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyActivity();

  if (streakLoading || weeklyLoading) {
    return (
      <div className="flex gap-2 h-40 mt-4">
        <div className="flex-1 rounded-[2.5rem] bg-surface border-2 border-border/40 animate-pulse" />
        <div className="w-2/5 rounded-[2.5rem] bg-surface border-2 border-border/40 animate-pulse" />
      </div>
    );
  }

  const currentStreak = streak?.currentStreak || 0;
  const data = weeklyData || [];
  const activeDays = data.filter((d) => d.cardsStudied > 0 || d.sessions > 0).length;
  const totalCards = data.reduce((sum, d) => sum + d.cardsStudied, 0);

  return (
    <div className="mt-4 flex gap-2">
      {/* Massive Streak Block */}
      <div className="flex-1 rounded-[2.5rem] bg-surface border-2 border-border/40 p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted mb-4 z-10">
          <FireIcon className="w-4 h-4 text-secondary drop-shadow-sm" />
          STREAK
        </div>
        <div className="z-10 mt-auto pt-4">
          <p className="text-6xl font-black tracking-tighter text-foreground leading-none">{currentStreak}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-foreground-muted mt-2">DAY{currentStreak === 1 ? '' : 'S'} IN A ROW</p>
        </div>
        {/* Decorative huge fire watermark */}
        <FireIcon className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/3 w-40 h-40 text-secondary/[0.03] -z-0 pointer-events-none" />
      </div>

      {/* Mini Stats Stack */}
      <div className="w-2/5 flex flex-col gap-2">
        <div className="flex-1 rounded-[2rem] bg-surface border-2 border-border/40 p-4 flex flex-col justify-center items-center text-center shadow-sm">
          <p className="text-2xl font-black text-foreground leading-none">{totalCards}</p>
          <p className="text-[8px] font-black uppercase tracking-widest text-foreground-muted mt-1.5">CARDS REVIWED</p>
        </div>
        <div className="flex-1 rounded-[2rem] bg-surface border-2 border-border/40 p-4 flex flex-col justify-center items-center text-center shadow-sm">
          <p className="text-2xl font-black text-foreground leading-none">{activeDays}<span className="text-foreground-muted/50 text-base">/7</span></p>
          <p className="text-[8px] font-black uppercase tracking-widest text-foreground-muted mt-1.5">ACTIVE DAYS</p>
        </div>
      </div>
    </div>
  );
}

function MobileRecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity();
  const items = activities.slice(0, 4);

  return (
    <div className="mt-8 mb-6">
      <div className="flex items-center justify-between px-2 mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">ACTIVITY LOG</h3>
        <Link href="/library" className="text-[8px] font-black uppercase tracking-widest text-foreground-muted hover:text-foreground">VIEW ALL &rarr;</Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse px-2">
          {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="h-16 bg-surface border border-border/40 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-[10px] uppercase font-black tracking-widest text-foreground-muted text-center py-8">
          NO ACTIVITY YET
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const meta = ACTIVITY_META[item.type] || ACTIVITY_META.note;
            const Icon = meta.icon;
            return (
              <Link key={item.id} href={item.href} className="group block relative">
                {/* Connecting timeline */}
                {index !== items.length - 1 && (
                  <div className="absolute left-[34px] top-[48px] bottom-[-24px] w-[2px] bg-foreground/10 z-0" />
                )}
                <div className="flex items-start gap-4 p-3 rounded-3xl bg-surface border border-border/40 hover:border-foreground/20 transition-all shadow-sm relative z-10">
                  <div className={`p-3 rounded-full bg-background-muted shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex flex-col items-start gap-2 mb-2 pr-2">
                      <h4 className="font-black text-sm text-foreground leading-tight line-clamp-3 break-words">{item.title}</h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${meta.badgeClasses}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 pr-2">
                       {item.description && <span className="text-[10px] font-bold text-foreground-muted tracking-tight">{item.description}</span>}
                      <span className="text-[8px] font-black text-foreground-muted tracking-widest uppercase bg-border/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                         <Clock01Icon className="w-3 h-3"/>
                         {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardMobile({ user }: DashboardMobileProps) {
  return (
    <div className="flex flex-col gap-2 px-4 pt-6 pb-24">
      <MobileHeader user={user} />
      <MobileQuickActions />
      <MobileContinueLearning />
      <MobileStreakAndActivity />
      <MobileRecentActivity />
    </div>
  );
}
