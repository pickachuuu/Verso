'use client';

import { format } from 'date-fns';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { Calendar03Icon, SparklesIcon } from 'hugeicons-react';

export default function DashboardHeader({ user }: { user?: { full_name?: string; email?: string } | null }) {
  const currentDate = new Date();
  const greeting = getGreeting();

  function getGreeting() {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'there';

  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent-muted/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent-muted/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <ClayBadge variant="accent" className="text-xs font-medium">
              <SparklesIcon className="w-3.5 h-3.5" />
              Welcome back
            </ClayBadge>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {greeting}, <span className="text-accent">{displayName}</span>
          </h1>

          <p className="text-foreground-muted text-base md:text-lg max-w-md">
            Ready to continue your learning journey? Let&apos;s make today productive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ClayCard variant="default" padding="sm" className="rounded-2xl">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 rounded-xl bg-accent-muted">
                <Calendar03Icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-foreground-muted font-medium">Today</p>
                <p className="text-sm font-semibold text-foreground">
                  {format(currentDate, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </ClayCard>
        </div>
      </div>
    </ClayCard>
  );
}
