'use client';

import { format } from 'date-fns';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { Calendar03Icon, DashboardSpeed01Icon } from 'hugeicons-react';
import type { UserProfile } from '@/hooks/useAuth';

export default function DashboardHeader({ user }: { user?: UserProfile | null }) {
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
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-secondary/8 via-secondary/4 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title area */}
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-muted to-primary-muted/60 shadow-lg shadow-primary/10">
              <DashboardSpeed01Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {greeting},{' '}
                  <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                    {displayName}
                  </span>
                </h1>
              </div>
              <p className="text-foreground-muted">
                Here&apos;s an overview of your study progress
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-surface/60 backdrop-blur-sm border border-primary-muted/70 shadow-sm">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-muted to-primary-muted/60">
              <Calendar03Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-foreground-muted font-semibold uppercase tracking-widest">Today</p>
              <p className="text-sm font-bold text-foreground">
                {format(currentDate, 'EEEE, MMM d')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
