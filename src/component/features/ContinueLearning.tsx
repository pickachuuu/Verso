'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useContinueLearning } from '@/hooks/useDashboard';
import {
  PlayIcon,
  Clock01Icon,
  Add01Icon,
  BookOpen01Icon,
  ArrowRight01Icon,
  SparklesIcon
} from 'hugeicons-react';
import Link from 'next/link';

function ContinueSkeleton() {
  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl animate-pulse h-full">
      <div className="space-y-4">
        <div className="h-6 w-40 bg-gray-100 rounded-lg" />
        <div className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </ClayCard>
  );
}

export default function ContinueLearning() {
  const { data, isLoading } = useContinueLearning();

  if (isLoading) {
    return <ContinueSkeleton />;
  }

  const { lastStudiedSet, suggestedAction, dueCardsCount } = data || {};

  const getActionConfig = () => {
    switch (suggestedAction) {
      case 'review_due':
        return {
          title: 'Review Due Cards',
          description: `${dueCardsCount} cards waiting for review`,
          icon: <Clock01Icon className="w-6 h-6" />,
          href: '/flashcards',
          gradient: 'from-secondary via-secondary to-orange-500', // Coral - urgent action
          shadowColor: 'shadow-secondary/30',
          priority: 'high',
        };
      case 'continue_set':
        return {
          title: 'Continue Studying',
          description: lastStudiedSet ? `${lastStudiedSet.title} - ${lastStudiedSet.progress}% complete` : 'Pick up where you left off',
          icon: <PlayIcon className="w-6 h-6" />,
          href: lastStudiedSet ? `/flashcards/${lastStudiedSet.id}/study` : '/flashcards',
          gradient: 'from-primary via-primary to-indigo-600', // Indigo - primary action
          shadowColor: 'shadow-primary/30',
          priority: 'medium',
        };
      case 'start_new':
        return {
          title: 'Start New Set',
          description: 'Begin studying a new flashcard set',
          icon: <BookOpen01Icon className="w-6 h-6" />,
          href: '/flashcards',
          gradient: 'from-tertiary via-tertiary to-teal-600', // Teal - fresh start
          shadowColor: 'shadow-tertiary/30',
          priority: 'normal',
        };
      case 'create_cards':
      default:
        return {
          title: 'Create Flashcards',
          description: 'Generate cards from your notes',
          icon: <Add01Icon className="w-6 h-6" />,
          href: '/notes',
          gradient: 'from-primary via-primary to-indigo-600', // Indigo - creative action
          shadowColor: 'shadow-primary/30',
          priority: 'normal',
        };
    }
  };

  const config = getActionConfig();

  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-muted to-primary-muted/60">
          <SparklesIcon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Recommended</h3>
      </div>

      {/* Main CTA */}
      <Link href={config.href}>
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-5 text-white shadow-xl ${config.shadowColor} hover:shadow-2xl transition-all hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer group`}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-lg">{config.title}</h4>
              <p className="text-white/80 text-sm truncate">{config.description}</p>
            </div>
            <ArrowRight01Icon className="w-6 h-6 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>

          {/* Progress bar for continue_set */}
          {suggestedAction === 'continue_set' && lastStudiedSet && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/80">Progress</span>
                <span className="font-semibold">{lastStudiedSet.masteredCards}/{lastStudiedSet.totalCards} mastered</span>
              </div>
              <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${lastStudiedSet.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Urgency indicator for review_due */}
          {suggestedAction === 'review_due' && dueCardsCount && dueCardsCount > 5 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                ⚡ High Priority
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Secondary Actions */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/notes">
          <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 hover:from-secondary-muted/30 hover:to-secondary-muted/50 border border-gray-100 hover:border-secondary/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-secondary-muted to-secondary-muted/70 shadow-sm">
                <Add01Icon className="w-4 h-4 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground group-hover:text-secondary transition-colors">Create Note</p>
                <p className="text-xs text-foreground-muted truncate">New material</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/flashcards">
          <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 hover:from-tertiary-muted/30 hover:to-tertiary-muted/50 border border-gray-100 hover:border-tertiary/20 transition-all cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-tertiary-muted to-tertiary-muted/70 shadow-sm">
                <BookOpen01Icon className="w-4 h-4 text-tertiary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground group-hover:text-tertiary transition-colors">Browse Sets</p>
                <p className="text-xs text-foreground-muted truncate">All flashcards</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </ClayCard>
  );
}
