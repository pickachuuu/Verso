'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ClayBadge, ClayCard } from '@/component/ui/Clay';
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
    label: 'Note',
    badge: 'accent',
    icon: NotebookIcon,
    tint: 'text-primary',
  },
  flashcard: {
    label: 'Flashcard',
    badge: 'success',
    icon: FlashcardIcon,
    tint: 'text-tertiary',
  },
  exam: {
    label: 'Exam',
    badge: 'warning',
    icon: ExamIcon,
    tint: 'text-secondary',
  },
} as const;

function MobileHeader({ user }: DashboardMobileProps) {
  const currentDate = new Date();
  const greeting = (() => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'there';

  return (
    <ClayCard variant="elevated" padding="sm" className="rounded-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/brand/verso-mark.png"
            alt="Verso logo"
            width={40}
            height={40}
            className="w-10 h-10"
            priority
          />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-foreground-muted">{greeting}</p>
            <h1 className="text-base font-semibold text-foreground truncate">
              Hi, <span className="text-primary">{displayName}</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-muted border border-border">
          <Calendar03Icon className="w-4 h-4 text-primary" />
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-foreground-muted">Today</p>
            <p className="text-[11px] font-semibold text-foreground">
              {format(currentDate, 'MMM d')}
            </p>
          </div>
        </div>
      </div>
    </ClayCard>
  );
}

function MobileWeeklySnapshot() {
  const { data: streak, isLoading: streakLoading } = useStudyStreak();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyActivity();

  if (streakLoading || weeklyLoading) {
    return (
      <ClayCard variant="default" padding="sm" className="rounded-2xl animate-pulse">
        <div className="h-3 w-24 bg-background-muted rounded mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-background-muted border border-border/50" />
          ))}
        </div>
        <div className="mt-3 h-10 rounded-xl bg-background-muted border border-border/50" />
      </ClayCard>
    );
  }

  const currentStreak = streak?.currentStreak || 0;
  const studiedToday = streak?.studiedToday || false;
  const data = weeklyData || [];
  const totalCards = data.reduce((sum, d) => sum + d.cardsStudied, 0);
  const totalMinutes = data.reduce((sum, d) => sum + d.minutesStudied, 0);
  const activeDays = data.filter((d) => d.cardsStudied > 0 || d.sessions > 0).length;
  const maxCards = Math.max(...data.map((d) => d.cardsStudied), 1);

  return (
    <ClayCard variant="default" padding="sm" className="rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">This week</span>
        <span className="text-[10px] text-foreground-muted">{activeDays}/7 active</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-left">
        <div className="rounded-xl bg-background-muted border border-border px-2 py-2">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-foreground-muted">
            <FireIcon className="w-3.5 h-3.5 text-secondary" />
            Streak
          </div>
          <p className="text-lg font-semibold text-foreground mt-1">{currentStreak}d</p>
          <p className="text-[9px] text-foreground-muted">{studiedToday ? 'Today ✓' : 'Keep it up'}</p>
        </div>
        <div className="rounded-xl bg-background-muted border border-border px-2 py-2">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-foreground-muted">
            <FlashcardIcon className="w-3.5 h-3.5 text-primary" />
            Cards
          </div>
          <p className="text-lg font-semibold text-foreground mt-1">{totalCards}</p>
          <p className="text-[9px] text-foreground-muted">Studied</p>
        </div>
        <div className="rounded-xl bg-background-muted border border-border px-2 py-2">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-foreground-muted">
            <Clock01Icon className="w-3.5 h-3.5 text-tertiary" />
            Minutes
          </div>
          <p className="text-lg font-semibold text-foreground mt-1">{totalMinutes}</p>
          <p className="text-[9px] text-foreground-muted">Focused</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-foreground-muted mb-2">
          <Target01Icon className="w-3.5 h-3.5" />
          Activity
        </div>
        <div className="flex items-end gap-1 h-12">
          {data.map((day, index) => {
            const isToday = index === data.length - 1;
            const hasActivity = day.cardsStudied > 0 || day.sessions > 0;
            const heightPercent = maxCards > 0 ? (day.cardsStudied / maxCards) * 100 : 0;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className={`w-full rounded-md ${
                    hasActivity
                      ? `bg-primary/40 ${isToday ? 'ring-2 ring-primary/30 ring-offset-1 ring-offset-background' : ''}`
                      : 'bg-background-muted border border-border'
                  }`}
                  style={{ height: hasActivity ? `${Math.max(heightPercent, 18)}%` : '6px' }}
                />
                <span className={`mt-1 text-[9px] ${isToday ? 'text-primary font-semibold' : 'text-foreground-muted'}`}>
                  {day.shortDay.slice(0, 1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ClayCard>
  );
}

function MobileContinueLearning() {
  const { data, isLoading } = useContinueLearning();

  if (isLoading) {
    return (
      <ClayCard variant="default" padding="sm" className="rounded-2xl animate-pulse">
        <div className="h-4 w-28 bg-background-muted rounded mb-3" />
        <div className="h-16 rounded-xl bg-background-muted border border-border/50" />
      </ClayCard>
    );
  }

  const { lastStudiedSet, suggestedAction, dueCardsCount } = data || {};

  const config = (() => {
    switch (suggestedAction) {
      case 'review_due':
        return {
          title: 'Review due cards',
          subtitle: `${dueCardsCount} cards waiting`,
          icon: <Clock01Icon className="w-5 h-5" />,
          href: '/flashcards',
          accent: 'secondary',
        };
      case 'continue_set':
        return {
          title: 'Continue studying',
          subtitle: lastStudiedSet ? lastStudiedSet.title : 'Pick up where you left off',
          icon: <PlayIcon className="w-5 h-5" />,
          href: lastStudiedSet ? `/flashcards/${lastStudiedSet.id}/study` : '/flashcards',
          accent: 'primary',
        };
      case 'start_new':
        return {
          title: 'Start a new set',
          subtitle: 'Begin studying a new set',
          icon: <FlashcardIcon className="w-5 h-5" />,
          href: '/flashcards',
          accent: 'tertiary',
        };
      case 'create_cards':
      default:
        return {
          title: 'Create flashcards',
          subtitle: 'Generate from your notes',
          icon: <Add01Icon className="w-5 h-5" />,
          href: '/library',
          accent: 'primary',
        };
    }
  })();

  const accentClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
  } as const;

  return (
    <ClayCard variant="default" padding="sm" className="rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <div className="p-1.5 rounded-lg bg-background-muted border border-border">
            <SparklesIcon className="w-3.5 h-3.5 text-primary" />
          </div>
          Recommended
        </div>
        <Link href={config.href} className="text-xs text-primary font-semibold flex items-center gap-1">
          Start
          <ArrowRight01Icon className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Link href={config.href} className="block">
        <div className="rounded-xl border border-border bg-surface p-3 flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-background-muted border border-border ${accentClasses[config.accent as keyof typeof accentClasses]}`}>
            {config.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{config.title}</p>
            <p className="text-[11px] text-foreground-muted truncate">{config.subtitle}</p>
          </div>
        </div>
      </Link>

      {suggestedAction === 'continue_set' && lastStudiedSet && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-foreground-muted">
            <span>Progress</span>
            <span className="font-semibold text-foreground">{lastStudiedSet.progress}%</span>
          </div>
          <div className="mt-2 h-2 bg-background-muted rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${lastStudiedSet.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Link
          href="/library"
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-surface text-[11px] font-semibold text-foreground-muted hover:text-foreground"
        >
          <PencilEdit01Icon className="w-3.5 h-3.5 text-secondary" />
          New note
        </Link>
        <Link
          href="/flashcards"
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-surface text-[11px] font-semibold text-foreground-muted hover:text-foreground"
        >
          <FlashcardIcon className="w-3.5 h-3.5 text-tertiary" />
          Browse sets
        </Link>
      </div>
    </ClayCard>
  );
}

function MobileRecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity();
  const items = activities.slice(0, 3);

  return (
    <ClayCard variant="elevated" padding="sm" className="rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
          <p className="text-[11px] text-foreground-muted">Latest updates</p>
        </div>
        <Link href="/library" className="text-[11px] text-primary font-semibold flex items-center gap-1">
          View all
          <ArrowRight01Icon className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-background-muted border border-border/50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-xs text-foreground-muted">No activity yet. Start learning!</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const meta = ACTIVITY_META[item.type] || ACTIVITY_META.note;
            const Icon = meta.icon;
            return (
              <Link key={item.id} href={item.href} className="block">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 hover:bg-background-muted transition-colors">
                  <div className="p-2 rounded-lg bg-background-muted border border-border">
                    <Icon className={`w-4 h-4 ${meta.tint}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                      <ClayBadge variant={meta.badge} className="text-[9px] px-2 py-0.5">
                        {meta.label}
                      </ClayBadge>
                    </div>
                    <p className="text-[11px] text-foreground-muted truncate">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-foreground-muted flex-shrink-0">{item.time}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </ClayCard>
  );
}

export default function DashboardMobile({ user }: DashboardMobileProps) {
  return (
    <div className="space-y-4">
      <MobileHeader user={user} />
      <MobileWeeklySnapshot />
      <MobileContinueLearning />
      <MobileRecentActivity />
    </div>
  );
}
