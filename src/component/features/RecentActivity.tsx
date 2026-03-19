'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRecentActivity } from '@/hooks/useDashboard';
import { ArrowRight01Icon, Clock01Icon } from 'hugeicons-react';
import { FlashcardIcon, NotebookIcon, ExamIcon } from '@/component/icons';

const ACTIVITY_META = {
  note: {
    label: 'NOTE',
    icon: NotebookIcon,
    badgeClasses: 'bg-accent text-surface border border-accent/30',
  },
  flashcard: {
    label: 'FLASHCARD',
    icon: FlashcardIcon,
    badgeClasses: 'bg-success text-surface border border-success/30',
  },
  exam: {
    label: 'EXAM',
    icon: ExamIcon,
    badgeClasses: 'bg-warning text-surface border border-warning/30',
  },
} as const;

function ActivitySkeleton() {
  return (
    <div className="rounded-[3rem] bg-surface border-2 border-border/40 p-10 animate-pulse h-full min-h-[600px] flex flex-col">
      <div className="h-8 w-40 bg-background-muted mb-12 rounded-full" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-6">
            <div className="w-16 h-16 bg-background-muted rounded-full shrink-0" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-4 w-1/2 bg-background-muted rounded-full" />
              <div className="h-3 w-3/4 bg-background-muted rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 text-center bg-background-muted/20 rounded-[2rem] border-2 border-dashed border-border/60">
      <Image
        src="/brand/verso-empty-clean.svg"
        alt="Verso mascot — empty state"
        width={96}
        height={96}
        className="mb-8 drop-shadow-sm opacity-40 grayscale"
      />
      <h4 className="font-black text-foreground text-[14px] uppercase tracking-[0.3em] mb-2 leading-none">THE VOID IS EMPTY</h4>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted/70 max-w-[220px]">
        CREATE NOTES OR FLASHCARDS TO SEE YOUR ACTIVITY TRACE
      </p>
    </div>
  );
}

export default function RecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity();
  const items = activities.slice(0, 6);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  return (
    <div className="rounded-[3rem] bg-surface border-2 border-border/40 h-full flex flex-col p-10 relative overflow-hidden">
      
      <div className="flex items-center justify-between mb-12 relative z-10">
        <div>
          <h3 className="text-[20px] leading-none font-black uppercase tracking-[0.2em] text-foreground">JOURNAL</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-2">LATEST ACTIVITY</p>
        </div>
        <Link href="/library" className="group flex items-center gap-3 px-6 py-4 rounded-full bg-surface border-[3px] border-foreground/10 text-foreground hover:bg-foreground hover:text-surface transition-all active:scale-95 shadow-sm">
          <span className="text-[11px] font-black uppercase tracking-widest leading-none mt-1">VIEW ALL</span>
          <ArrowRight01Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col relative z-10">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6 relative">
            {/* Timeline backbone */}
            <div className="absolute left-[2rem] top-8 bottom-8 w-[4px] bg-foreground/5 rounded-full z-0" />

            {items.map((item) => {
              const meta = ACTIVITY_META[item.type] || ACTIVITY_META.note;
              const Icon = meta.icon;

              return (
                <Link key={item.id} href={item.href} className="group flex gap-8 p-3 rounded-[2rem] hover:bg-surface/50 transition-colors z-10 hover:shadow-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-[4rem] h-[4rem] rounded-full bg-surface border-[3px] border-border shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-foreground transition-all duration-300">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                  </div>

                  <div className="flex-1 py-1 flex flex-col justify-center">
                    <div className="flex flex-col items-start gap-1.5 mb-2">
                       <h4 className="font-black text-[15px] sm:text-[18px] leading-tight text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-3 break-words pr-4">{item.title}</h4>
                       <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${meta.badgeClasses}`}>
                         {meta.label}
                       </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <p className="text-[12px] font-bold text-foreground-muted tracking-tight">{item.description}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-foreground-muted font-black uppercase tracking-widest shrink-0 bg-background-muted px-2 py-0.5 rounded-full">
                        <Clock01Icon className="w-3.5 h-3.5" />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
