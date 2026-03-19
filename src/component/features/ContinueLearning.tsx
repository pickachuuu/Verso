'use client';

import Link from 'next/link';
import { useContinueLearning } from '@/hooks/useDashboard';
import {
  Add01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  PencilEdit01Icon,
  PlayIcon,
  SparklesIcon,
} from 'hugeicons-react';
import { FlashcardIcon } from '@/component/icons';

function ContinueSkeleton() {
  return (
    <div className="rounded-[3rem] bg-surface border-2 border-border/40 p-8 animate-pulse h-full min-h-[350px] flex flex-col justify-between">
      <div className="h-8 w-32 bg-background-muted rounded-full" />
      <div className="h-40 bg-background-muted rounded-[2rem] mt-6" />
    </div>
  );
}

export default function ContinueLearning() {
  const { data, isLoading } = useContinueLearning();

  if (isLoading) {
    return <ContinueSkeleton />;
  }

  const { lastStudiedSet, suggestedAction } = data || {};

  const config = (() => {
    switch (suggestedAction) {
      case 'review_due':
        return {
          title: 'REVIEW DUE CARDS',
          icon: <Clock01Icon className="w-8 h-8" />,
          href: '/flashcards',
        };
      case 'continue_set':
        return {
          title: 'RESUME STUDYING',
          icon: <PlayIcon className="w-8 h-8" />,
          href: lastStudiedSet ? `/flashcards/${lastStudiedSet.id}/study` : '/flashcards',
        };
      case 'start_new':
        return {
          title: 'START A NEW SET',
          icon: <FlashcardIcon className="w-8 h-8" />,
          href: '/flashcards',
        };
      case 'create_cards':
      default:
        return {
          title: 'CREATE FLASHCARDS',
          icon: <Add01Icon className="w-8 h-8" />,
          href: '/library',
        };
    }
  })();

  return (
    <div className="h-full rounded-[3rem] bg-surface relative flex flex-col pt-8 overflow-hidden group">
      {/* Decorative massive absolute elements */}
      <div className="absolute top-[-5rem] left-[-5rem] w-64 h-64 bg-foreground/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8 px-10 relative z-10">
        <SparklesIcon className="w-6 h-6 text-foreground drop-shadow-sm" />
        <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-foreground">RECOMMENDED</h3>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-4 relative z-10">
        <Link href={config.href} className="flex-1 block h-full">
          <div className="h-full relative overflow-hidden rounded-[2.5rem] bg-foreground text-surface p-8 pb-10 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center text-center">
            
            <div className="p-5 rounded-full bg-surface/10 border border-surface/20 text-surface mb-6 shrink-0 relative z-10 shadow-lg">
              {config.icon}
            </div>
            
            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-surface/60 mb-3 relative z-10">UP NEXT</h2>
            <h3 className="font-black text-3xl md:text-4xl uppercase tracking-widest text-surface leading-none relative z-10 max-w-[80%] mx-auto pb-2 border-b-4 border-surface/20">
              {config.title}
            </h3>
            
            {suggestedAction === 'continue_set' && lastStudiedSet && (
              <div className="w-full mt-8 relative z-10">
                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-surface/80 mb-3 px-2">
                  <span>PROGRESS SUMMARY</span>
                  <span className="text-surface">{lastStudiedSet.progress}% COMPLETED</span>
                </div>
                <div className="h-3 bg-surface/20 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-surface rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${lastStudiedSet.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-[-0.5rem] transition-all duration-300">
               <ArrowRight01Icon className="w-8 h-8 text-surface/50" />
            </div>
          </div>
        </Link>
      </div>

      {/* Footer Dual Actions */}
      <div className="grid grid-cols-2 gap-4 px-4 pb-4 mt-2">
        <Link href="/library" className="block outline-none">
          <div className="group/btn flex items-center justify-center gap-3 py-6 px-4 rounded-[2rem] bg-surface border-[3px] border-foreground hover:bg-foreground hover:text-surface transition-colors cursor-pointer text-foreground items-center text-center">
            <PencilEdit01Icon className="w-5 h-5 shrink-0" />
            <span className="font-black text-[11px] uppercase tracking-[0.2em] leading-none mt-1">NEW NOTE</span>
          </div>
        </Link>
        <Link href="/flashcards" className="block outline-none">
          <div className="group/btn flex items-center justify-center gap-3 py-6 px-4 rounded-[2rem] bg-surface border-[3px] border-border/40 hover:border-foreground/40 hover:bg-background-muted transition-colors cursor-pointer text-foreground items-center text-center">
            <FlashcardIcon className="w-5 h-5 shrink-0" />
            <span className="font-black text-[11px] uppercase tracking-[0.2em] leading-none mt-1">ALL SETS</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
