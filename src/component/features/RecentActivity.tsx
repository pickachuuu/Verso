'use client';

import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { File01Icon, BookOpen01Icon, Clock01Icon, ArrowRight01Icon } from 'hugeicons-react';
import Link from 'next/link';
import { useRecentActivity, ActivityItem } from '@/hooks/useDashboard';

interface ActivityItemComponentProps extends ActivityItem {
  icon: React.ReactNode;
}

function ActivityItemComponent({ type, title, description, time, icon, href }: ActivityItemComponentProps) {
  const getTypeBadge = () => {
    switch (type) {
      case 'note':
        return <ClayBadge variant="accent" className="text-xs px-2 py-1">Note</ClayBadge>;
      case 'flashcard':
        return <ClayBadge variant="success" className="text-xs px-2 py-1">Flashcard</ClayBadge>;
      default:
        return null;
    }
  };

  const content = (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-muted/50 hover:bg-background-muted transition-all duration-200 group cursor-pointer">
      <div className="p-3 rounded-xl bg-surface shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">{title}</h4>
          {getTypeBadge()}
        </div>
        <p className="text-sm text-foreground-muted truncate">{description}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <Clock01Icon className="w-3.5 h-3.5" />
          <span>{time}</span>
        </div>
        <ArrowRight01Icon className="w-4 h-4 text-foreground-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-muted/50 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-background-muted" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-40 bg-background-muted rounded-lg" />
        <div className="h-3 w-56 bg-background-muted rounded-lg" />
      </div>
      <div className="w-16 h-4 bg-background-muted rounded-lg" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-2xl bg-background-muted mb-4">
        <Clock01Icon className="w-8 h-8 text-foreground-muted" />
      </div>
      <h4 className="font-semibold text-foreground mb-1">No recent activity</h4>
      <p className="text-sm text-foreground-muted max-w-[200px]">
        Start creating notes or flashcards to see your activity here
      </p>
    </div>
  );
}

export default function RecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity();

  // Map activities to include icons
  const activitiesWithIcons: ActivityItemComponentProps[] = activities.map((activity) => ({
    ...activity,
    icon: activity.type === 'note'
      ? <File01Icon className="w-5 h-5 text-accent" />
      : <BookOpen01Icon className="w-5 h-5 text-green-600" />,
  }));

  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-foreground-muted">Your latest learning activities</p>
        </div>
        <Link href="/notes" className="text-sm text-accent hover:text-accent-light font-medium flex items-center gap-1 transition-colors">
          View all
          <ArrowRight01Icon className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <ActivityItemSkeleton key={i} />)
        ) : activitiesWithIcons.length > 0 ? (
          activitiesWithIcons.map((activity) => (
            <ActivityItemComponent key={activity.id} {...activity} />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </ClayCard>
  );
}
