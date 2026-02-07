'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useContinueLearning } from '@/hooks/useDashboard';
import {
  PlayIcon,
  Clock01Icon,
  Add01Icon,
  ArrowRight01Icon,
  SparklesIcon,
  PencilEdit01Icon,
  Bookmark01Icon,
} from 'hugeicons-react';
import { FlashcardIcon } from '@/component/icons';
import Link from 'next/link';

function ContinueSkeleton() {
  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl animate-pulse h-full">
      <div className="space-y-4">
        <div className="h-5 w-32 bg-surface rounded-lg" />
        <div className="h-28 bg-gradient-to-br from-surface to-surface-elevated rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 bg-surface rounded-xl" />
          <div className="h-14 bg-surface rounded-xl" />
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
          subtitle: `${dueCardsCount} cards waiting`,
          icon: <Clock01Icon className="w-6 h-6" />,
          href: '/flashcards',
          gradient: 'from-secondary via-secondary to-secondary-light',
          accentColor: 'secondary',
          priority: 'high',
        };
      case 'continue_set':
        return {
          title: 'Continue Studying',
          subtitle: lastStudiedSet ? `${lastStudiedSet.title}` : 'Pick up where you left off',
          icon: <PlayIcon className="w-6 h-6" />,
          href: lastStudiedSet ? `/flashcards/${lastStudiedSet.id}/study` : '/flashcards',
          gradient: 'from-primary via-primary to-primary-light',
          accentColor: 'primary',
          priority: 'medium',
        };
      case 'start_new':
        return {
          title: 'Start New Set',
          subtitle: 'Begin studying a new set',
          icon: <FlashcardIcon className="w-6 h-6" />,
          href: '/flashcards',
          gradient: 'from-primary-light via-primary to-primary-dark',
          accentColor: 'tertiary',
          priority: 'normal',
        };
      case 'create_cards':
      default:
        return {
          title: 'Create Flashcards',
          subtitle: 'Generate from your notes',
          icon: <Add01Icon className="w-6 h-6" />,
          href: '/library',
          gradient: 'from-primary via-primary to-primary-dark',
          accentColor: 'primary',
          priority: 'normal',
        };
    }
  };

  const config = getActionConfig();

  return (
    <ClayCard variant="elevated" padding="none" className="rounded-3xl h-full overflow-hidden relative">
      {/* Decorative bookmark tab */}
      <div className="absolute top-0 right-6 w-8 h-10 bg-gradient-to-b from-secondary to-secondary-light rounded-b-lg shadow-md z-20 flex items-end justify-center pb-1">
        <Bookmark01Icon className="w-4 h-4 text-white" />
      </div>

      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-muted to-primary-muted/60">
            <SparklesIcon className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Recommended</h3>
        </div>

        {/* Main CTA Card */}
        <Link href={config.href} className="block">
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-5 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer group`}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-lg" />

            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base leading-tight">{config.title}</h4>
                <p className="text-white/75 text-xs mt-1 truncate">{config.subtitle}</p>
              </div>
              <ArrowRight01Icon className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </div>

            {/* Progress bar for continue_set */}
            {suggestedAction === 'continue_set' && lastStudiedSet && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/70">Progress</span>
                  <span className="font-bold">{lastStudiedSet.progress}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${lastStudiedSet.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Priority badge */}
            {suggestedAction === 'review_due' && dueCardsCount && dueCardsCount > 5 && (
              <div className="mt-3">
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur-sm">
                  ⚡ High Priority
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link href="/library">
            <div className="p-3 rounded-xl bg-gradient-to-br from-surface to-surface-elevated/50 hover:from-secondary-muted/30 hover:to-secondary-muted/50 border border-border hover:border-secondary/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-secondary-muted to-secondary-muted/70">
                  <PencilEdit01Icon className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground group-hover:text-secondary transition-colors">New Note</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/flashcards">
            <div className="p-3 rounded-xl bg-gradient-to-br from-surface to-surface-elevated/50 hover:from-tertiary-muted/30 hover:to-tertiary-muted/50 border border-border hover:border-tertiary/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-tertiary-muted to-tertiary-muted/70">
                  <FlashcardIcon className="w-3.5 h-3.5 text-tertiary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground group-hover:text-tertiary transition-colors">Browse Sets</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </ClayCard>
  );
}
