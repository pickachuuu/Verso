'use client';

import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { File01Icon, Clock01Icon, ArrowRight01Icon } from 'hugeicons-react';
import { NotebookIcon, FlashcardIcon, ExamIcon } from '@/component/icons';
import Link from 'next/link';
import { useRecentActivity, ActivityItem } from '@/hooks/useDashboard';

interface ActivityItemComponentProps extends ActivityItem {
  icon: React.ReactNode;
  iconBg: string;
  dotColor: string;
  isLast: boolean;
}

function ActivityTimelineItem({ type, title, description, time, icon, iconBg, dotColor, href, isLast }: ActivityItemComponentProps) {
  const getTypeBadge = () => {
    switch (type) {
      case 'note':
        return <ClayBadge variant="accent" className="text-[10px] px-2 py-0.5">Note</ClayBadge>;
      case 'flashcard':
        return <ClayBadge variant="success" className="text-[10px] px-2 py-0.5">Flashcard</ClayBadge>;
      case 'exam':
        return <ClayBadge variant="warning" className="text-[10px] px-2 py-0.5">Exam</ClayBadge>;
      default:
        return null;
    }
  };

  const content = (
    <div className="flex gap-4 group cursor-pointer">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 mt-2 ${dotColor} opacity-30 rounded-full`} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${!isLast ? 'pb-5' : 'pb-1'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h4 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{title}</h4>
              {getTypeBadge()}
            </div>
            <p className="text-xs text-foreground-muted truncate">{description}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-medium flex-shrink-0 mt-0.5">
            <Clock01Icon className="w-3 h-3" />
            <span>{time}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function ActivityItemSkeleton({ isLast }: { isLast: boolean }) {
  return (
    <div className="flex gap-4 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-border flex-shrink-0" />
        {!isLast && <div className="w-0.5 flex-1 mt-2 bg-border rounded-full" />}
      </div>
      <div className={`flex-1 ${!isLast ? 'pb-5' : 'pb-1'}`}>
        <div className="h-4 w-40 bg-border rounded-lg mb-2" />
        <div className="h-3 w-56 bg-border rounded-lg" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 mb-4 shadow-inner">
        <Clock01Icon className="w-8 h-8 text-foreground-muted" />
      </div>
      <h4 className="font-semibold text-foreground text-sm mb-1">No recent activity</h4>
      <p className="text-xs text-foreground-muted max-w-[220px]">
        Start creating notes or flashcards to see your activity here
      </p>
    </div>
  );
}

export default function RecentActivity() {
  const { data: activities = [], isLoading } = useRecentActivity();

  const iconConfigs = {
    note: {
      icon: <NotebookIcon className="w-4.5 h-4.5 text-primary" />,
      iconBg: 'bg-gradient-to-br from-primary-muted to-primary-muted/70',
      dotColor: 'bg-primary',
    },
    flashcard: {
      icon: <FlashcardIcon className="w-4.5 h-4.5 text-tertiary" />,
      iconBg: 'bg-gradient-to-br from-tertiary-muted to-tertiary-muted/70',
      dotColor: 'bg-tertiary',
    },
    exam: {
      icon: <ExamIcon className="w-4.5 h-4.5 text-secondary" />,
      iconBg: 'bg-gradient-to-br from-secondary-muted to-secondary-muted/70',
      dotColor: 'bg-secondary',
    },
  };

  const activitiesWithIcons: ActivityItemComponentProps[] = activities.map((activity, index) => {
    const config = iconConfigs[activity.type] || iconConfigs.note;
    return {
      ...activity,
      icon: config.icon,
      iconBg: config.iconBg,
      dotColor: config.dotColor,
      isLast: index === activities.length - 1,
    };
  });

  return (
    <ClayCard variant="elevated" padding="none" className="rounded-3xl overflow-hidden">
      {/* Decorative top: subtle ruled-line accent */}
      <div
        className="h-2 opacity-[0.06]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #2845D6 3px, #2845D6 4px)',
        }}
      />

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
            <p className="text-xs text-foreground-muted mt-0.5">Your learning journal</p>
          </div>
          <Link href="/library" className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-muted/50">
            View all
            <ArrowRight01Icon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Timeline */}
        <div>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <ActivityItemSkeleton key={i} isLast={i === 2} />
            ))
          ) : activitiesWithIcons.length > 0 ? (
            activitiesWithIcons.map((activity) => (
              <ActivityTimelineItem key={activity.id} {...activity} />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </ClayCard>
  );
}
