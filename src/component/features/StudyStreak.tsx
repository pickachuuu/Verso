'use client';

import { ClayCard } from '@/component/ui/Clay';
import { useStudyStreak } from '@/hooks/useDashboard';
import { FireIcon, Target01Icon } from 'hugeicons-react';

function StreakSkeleton() {
  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse h-full">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-gray-100 rounded-lg" />
          <div className="h-8 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </ClayCard>
  );
}

export default function StudyStreak() {
  const { data: streak, isLoading } = useStudyStreak();

  if (isLoading) {
    return <StreakSkeleton />;
  }

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const studiedToday = streak?.studiedToday || false;

  // Determine streak status and styling - using Secondary (Coral) for streak/progress
  const getStreakStyle = () => {
    if (currentStreak >= 7) {
      return {
        bgGradient: 'bg-gradient-to-br from-secondary via-secondary to-orange-500',
        shadowColor: 'shadow-secondary/30',
        iconColor: 'text-white',
        textColor: 'text-white',
        ringColor: 'ring-secondary/20',
      };
    } else if (currentStreak >= 3) {
      return {
        bgGradient: 'bg-gradient-to-br from-secondary to-secondary-light',
        shadowColor: 'shadow-secondary/25',
        iconColor: 'text-white',
        textColor: 'text-white',
        ringColor: 'ring-secondary/15',
      };
    } else if (currentStreak > 0) {
      return {
        bgGradient: 'bg-gradient-to-br from-secondary/80 to-secondary',
        shadowColor: 'shadow-secondary/20',
        iconColor: 'text-white',
        textColor: 'text-white',
        ringColor: 'ring-secondary/10',
      };
    }
    return {
      bgGradient: 'bg-gradient-to-br from-gray-100 to-gray-200',
      shadowColor: 'shadow-gray-200/50',
      iconColor: 'text-gray-400',
      textColor: 'text-gray-600',
      ringColor: 'ring-gray-200/50',
    };
  };

  const style = getStreakStyle();

  return (
    <ClayCard variant="default" padding="md" className="rounded-2xl overflow-hidden h-full">
      <div className="flex items-center gap-4">
        {/* Streak Icon */}
        <div className={`relative w-16 h-16 rounded-2xl ${style.bgGradient} flex items-center justify-center shadow-lg ${style.shadowColor} ${currentStreak > 0 ? 'ring-4 ' + style.ringColor : ''}`}>
          <FireIcon className={`w-8 h-8 ${style.iconColor} ${currentStreak >= 3 ? 'animate-pulse' : ''}`} />
          {currentStreak >= 7 && (
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-full flex items-center justify-center shadow-md">
              <span className="text-xs">🔥</span>
            </div>
          )}
        </div>

        {/* Streak Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Study Streak
            </p>
            {studiedToday && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-tertiary/10 to-tertiary/20 text-tertiary text-xs font-semibold rounded-full border border-tertiary/20">
                Today ✓
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-4xl font-bold text-foreground tracking-tight">
              {currentStreak}
            </p>
            <p className="text-base text-foreground-muted font-medium">
              {currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        {/* Best Streak */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1.5 text-foreground-muted justify-end">
            <Target01Icon className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Best</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-0.5">{longestStreak}</p>
        </div>
      </div>

      {/* Motivation Message */}
      {!studiedToday && currentStreak > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm text-secondary font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Study today to keep your {currentStreak}-day streak alive!
          </p>
        </div>
      )}
      {currentStreak === 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm text-foreground-muted">
            Start studying to begin your streak!
          </p>
        </div>
      )}
    </ClayCard>
  );
}
