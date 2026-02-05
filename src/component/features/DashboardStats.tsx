'use client';

import { ClayCard, ClayIconBox } from '@/component/ui/Clay';
import { File01Icon, BookOpen01Icon, Target01Icon, TickDouble01Icon } from 'hugeicons-react';
import { useDashboardStats } from '@/hooks/useDashboard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function StatCardSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 bg-background-muted rounded-lg" />
          <div className="h-9 w-16 bg-background-muted rounded-lg" />
          <div className="h-3 w-32 bg-background-muted rounded-lg" />
        </div>
        <div className="w-14 h-14 bg-background-muted rounded-2xl" />
      </div>
    </ClayCard>
  );
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-foreground-muted">{description}</p>
          )}
        </div>
        <ClayIconBox size="md" variant="accent" className="shrink-0">
          {icon}
        </ClayIconBox>
      </div>
    </ClayCard>
  );
}

export default function DashboardStats() {
  const { data: stats, isLoading } = useDashboardStats();

  const statCards: StatCardProps[] = [
    {
      title: 'Notes',
      value: stats?.notesCount || 0,
      icon: <File01Icon className="w-6 h-6 text-accent" />,
      description: 'Total study notes'
    },
    {
      title: 'Flashcards',
      value: stats?.totalFlashcards || 0,
      icon: <BookOpen01Icon className="w-6 h-6 text-accent" />,
      description: 'Cards created'
    },
    {
      title: 'Sets',
      value: stats?.totalSets || 0,
      icon: <Target01Icon className="w-6 h-6 text-accent" />,
      description: stats?.fullyMasteredSets && stats.fullyMasteredSets > 0
        ? `${stats.fullyMasteredSets} completed`
        : 'Flashcard sets'
    },
    {
      title: 'Mastered',
      value: stats?.masteredCards || 0,
      icon: <TickDouble01Icon className="w-6 h-6 text-accent" />,
      description: 'Cards completed'
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        <span className="text-sm text-foreground-muted">Your learning stats</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat, index) => <StatCard key={index} {...stat} />)
        }
      </div>
    </div>
  );
}
