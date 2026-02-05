'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useCardsDue } from '@/hooks/useDashboard';
import { Clock01Icon, AlertCircleIcon, BookOpen01Icon, ArrowRight01Icon } from 'hugeicons-react';
import Link from 'next/link';

function CardsDueSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-gray-100 rounded-lg" />
          <div className="h-8 w-16 bg-gray-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
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
      padding="md"
      className={`rounded-2xl h-full ${urgencyLevel === 'high' ? 'ring-2 ring-error/20' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${urgencyLevel === 'high' ? 'bg-gradient-to-br from-error/10 to-error/20' : 'bg-gradient-to-br from-primary-muted to-primary-muted/70'}`}>
            <Clock01Icon className={`w-5 h-5 ${urgencyLevel === 'high' ? 'text-error' : 'text-primary'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Cards Due</h3>
            <p className="text-xs text-foreground-muted">Spaced repetition</p>
          </div>
        </div>

        {/* Main Due Count */}
        <div className={`px-4 py-2 rounded-xl shadow-sm ${
          dueToday > 0
            ? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-primary/20'
            : 'bg-gradient-to-br from-gray-50 to-gray-100 text-foreground-muted'
        }`}>
          <span className="text-2xl font-bold">{dueToday}</span>
          <span className="text-sm ml-1 opacity-80">today</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`p-3 rounded-xl text-center transition-all ${overdue > 0 ? 'bg-gradient-to-br from-error/5 to-error/10 border border-error/15' : 'bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100'}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            {overdue > 0 && <AlertCircleIcon className="w-3.5 h-3.5 text-error" />}
            <span className={`text-lg font-bold ${overdue > 0 ? 'text-error' : 'text-foreground'}`}>
              {overdue}
            </span>
          </div>
          <p className="text-xs text-foreground-muted font-medium">Overdue</p>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-muted/50 to-primary-muted/80 border border-primary/10 text-center">
          <span className="text-lg font-bold text-primary">{newCards}</span>
          <p className="text-xs text-foreground-muted font-medium">New</p>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-100 text-center">
          <span className="text-lg font-bold text-foreground">{dueTomorrow}</span>
          <p className="text-xs text-foreground-muted font-medium">Tomorrow</p>
        </div>
      </div>

      {/* Action Area */}
      {hasCardsDue && nextReviewSet ? (
        <Link href={`/flashcards/${nextReviewSet.id}/study`}>
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary-muted/40 to-primary-muted/60 hover:from-primary-muted/60 hover:to-primary-muted/80 transition-all group cursor-pointer border border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/80 shadow-sm">
                  <BookOpen01Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{nextReviewSet.title}</p>
                  <p className="text-xs text-foreground-muted">{nextReviewSet.dueCount} cards ready</p>
                </div>
              </div>
              <ArrowRight01Icon className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      ) : (
        <div className="p-4 rounded-xl bg-gradient-to-br from-tertiary-muted/50 to-tertiary-muted/70 border border-tertiary/15 text-center">
          <p className="text-tertiary font-semibold">🎉 All caught up!</p>
          <p className="text-xs text-tertiary/70 mt-1">No cards due for review right now</p>
        </div>
      )}
    </ClayCard>
  );
}
