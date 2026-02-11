'use client';

import Image from 'next/image';
import { ClayCard } from '@/component/ui/Clay';
import { useCardsDue } from '@/hooks/useDashboard';
import { Clock01Icon, AlertCircleIcon, ArrowRight01Icon, Notification03Icon } from 'hugeicons-react';
import { FlashcardIcon } from '@/component/icons';
import Link from 'next/link';

function CardsDueSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-surface-elevated rounded-lg" />
          <div className="h-8 w-16 bg-surface-elevated rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-14 bg-surface-elevated rounded-xl" />
          <div className="h-14 bg-surface-elevated rounded-xl" />
          <div className="h-14 bg-surface-elevated rounded-xl" />
        </div>
      </div>
    </ClayCard>
  );
}

export default function CardsDueToday() {
  const { data: cardsDue, isLoading } = useCardsDue();

  if (isLoading) {
    return <CardsDueSkeleton />;
  }

  const dueToday = cardsDue?.dueToday || 0;
  const overdue = cardsDue?.overdue || 0;
  const newCards = cardsDue?.newCards || 0;
  const dueTomorrow = cardsDue?.dueTomorrow || 0;
  const nextReviewSet = cardsDue?.nextReviewSet;

  const hasCardsDue = dueToday > 0 || newCards > 0;
  const urgencyLevel = overdue > 5 ? 'high' : overdue > 0 ? 'medium' : 'normal';

  return (
    <ClayCard
      variant="default"
      padding="none"
      className={`rounded-2xl h-full overflow-hidden ${urgencyLevel === 'high' ? 'ring-1 ring-red-500/20' : ''}`}
    >
      <div className="p-5">
        {/* Header with main count */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock01Icon className={`w-4 h-4 ${urgencyLevel === 'high' ? 'text-red-400' : 'text-primary-light'}`} />
              <h3 className="font-semibold text-foreground text-sm">Cards Due</h3>
            </div>
            <p className="text-xs text-foreground-muted">Spaced repetition</p>
          </div>

          {/* Big due count */}
          <div className={`flex items-baseline gap-1 px-3 py-1.5 rounded-xl ${
            dueToday > 0
              ? 'bg-primary/15 text-primary-light border border-primary/20'
              : 'bg-surface-elevated text-foreground-muted border border-border/50'
          }`}>
            <span className="text-2xl font-extrabold leading-none">{dueToday}</span>
            <span className="text-xs font-medium opacity-70">today</span>
          </div>
        </div>

        {/* Mini stat row */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex-1 py-2 rounded-lg text-center border ${
            overdue > 0
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-surface-elevated/60 border-border/40'
          }`}>
            {overdue > 0 && <AlertCircleIcon className="w-3 h-3 text-red-400 mx-auto mb-0.5" />}
            <p className={`text-sm font-bold ${overdue > 0 ? 'text-red-400' : 'text-foreground'}`}>{overdue}</p>
            <p className="text-[10px] text-foreground-muted">Overdue</p>
          </div>
          <div className="flex-1 py-2 rounded-lg text-center bg-primary/10 border border-primary/15">
            <p className="text-sm font-bold text-primary-light">{newCards}</p>
            <p className="text-[10px] text-foreground-muted">New</p>
          </div>
          <div className="flex-1 py-2 rounded-lg text-center bg-surface-elevated/60 border border-border/40">
            <Notification03Icon className="w-3 h-3 text-foreground-muted mx-auto mb-0.5" />
            <p className="text-sm font-bold text-foreground">{dueTomorrow}</p>
            <p className="text-[10px] text-foreground-muted">Tomorrow</p>
          </div>
        </div>

        {/* Action */}
        {hasCardsDue && nextReviewSet ? (
          <Link href={`/flashcards/${nextReviewSet.id}/study`}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/15 transition-all group cursor-pointer border border-primary/15">
              <div className="p-1.5 rounded-lg bg-surface-elevated shadow-sm border border-border/30">
                <FlashcardIcon className="w-3.5 h-3.5 text-primary-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-xs truncate">{nextReviewSet.title}</p>
                <p className="text-[10px] text-foreground-muted">{nextReviewSet.dueCount} cards ready</p>
              </div>
              <ArrowRight01Icon className="w-4 h-4 text-primary-light opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          </Link>
        ) : (
          <div className="p-3 rounded-xl bg-surface-elevated/80 border border-border/40 text-center">
            <Image
              src="/brand/verso-happy-clean.svg"
              alt="Verso mascot celebrating"
              width={44}
              height={44}
              className="mx-auto mb-1.5 drop-shadow-sm"
            />
            <p className="text-primary-light font-semibold text-sm">All caught up!</p>
            <p className="text-[10px] text-foreground-muted mt-0.5">No cards due for review</p>
          </div>
        )}
      </div>
    </ClayCard>
  );
}
