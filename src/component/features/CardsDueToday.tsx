'use client';

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
          <div className="h-5 w-32 bg-surface rounded-lg" />
          <div className="h-8 w-16 bg-surface rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-14 bg-surface rounded-xl" />
          <div className="h-14 bg-surface rounded-xl" />
          <div className="h-14 bg-surface rounded-xl" />
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
      className={`rounded-2xl h-full overflow-hidden ${urgencyLevel === 'high' ? 'ring-2 ring-error/20' : ''}`}
    >
      {/* Colored top accent bar */}
      <div className={`h-1 ${
        urgencyLevel === 'high'
          ? 'bg-gradient-to-r from-error via-red-400 to-error'
          : hasCardsDue
            ? 'bg-gradient-to-r from-primary via-primary-light to-primary'
            : 'bg-gradient-to-r from-tertiary via-tertiary-light to-tertiary'
      }`} />

      <div className="p-5">
        {/* Header with main count */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock01Icon className={`w-4 h-4 ${urgencyLevel === 'high' ? 'text-error' : 'text-primary'}`} />
              <h3 className="font-semibold text-foreground text-sm">Cards Due</h3>
            </div>
            <p className="text-xs text-foreground-muted">Spaced repetition</p>
          </div>

          {/* Big due count */}
          <div className={`flex items-baseline gap-1 px-3 py-1.5 rounded-xl ${
            dueToday > 0
              ? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-md shadow-primary/20'
              : 'bg-gradient-to-br from-tertiary-muted to-tertiary-muted/80 text-tertiary'
          }`}>
            <span className="text-2xl font-extrabold leading-none">{dueToday}</span>
            <span className="text-xs font-medium opacity-80">today</span>
          </div>
        </div>

        {/* Mini stat row */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex-1 py-2 rounded-lg text-center border ${
            overdue > 0
              ? 'bg-red-50 border-red-100'
              : 'bg-background-muted border-border'
          }`}>
            {overdue > 0 && <AlertCircleIcon className="w-3 h-3 text-error mx-auto mb-0.5" />}
            <p className={`text-sm font-bold ${overdue > 0 ? 'text-error' : 'text-foreground'}`}>{overdue}</p>
            <p className="text-[10px] text-foreground-muted">Overdue</p>
          </div>
          <div className="flex-1 py-2 rounded-lg text-center bg-primary-muted/40 border border-primary/10">
            <p className="text-sm font-bold text-primary">{newCards}</p>
            <p className="text-[10px] text-foreground-muted">New</p>
          </div>
          <div className="flex-1 py-2 rounded-lg text-center bg-background-muted border border-border">
            <Notification03Icon className="w-3 h-3 text-foreground-muted mx-auto mb-0.5" />
            <p className="text-sm font-bold text-foreground">{dueTomorrow}</p>
            <p className="text-[10px] text-foreground-muted">Tomorrow</p>
          </div>
        </div>

        {/* Action */}
        {hasCardsDue && nextReviewSet ? (
          <Link href={`/flashcards/${nextReviewSet.id}/study`}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-muted/40 to-primary-muted/60 hover:from-primary-muted/60 hover:to-primary-muted/80 transition-all group cursor-pointer border border-primary/10">
              <div className="p-1.5 rounded-lg bg-white/80 shadow-sm">
                <FlashcardIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-xs truncate">{nextReviewSet.title}</p>
                <p className="text-[10px] text-foreground-muted">{nextReviewSet.dueCount} cards ready</p>
              </div>
              <ArrowRight01Icon className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          </Link>
        ) : (
          <div className="p-3 rounded-xl bg-gradient-to-br from-tertiary-muted/50 to-tertiary-muted/70 border border-tertiary/15 text-center">
            <p className="text-tertiary font-semibold text-sm">All caught up!</p>
            <p className="text-[10px] text-tertiary/60 mt-0.5">No cards due for review</p>
          </div>
        )}
      </div>
    </ClayCard>
  );
}
