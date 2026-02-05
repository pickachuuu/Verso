'use client';

import { format } from 'date-fns';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { Calendar03Icon, SparklesIcon, Rocket01Icon } from 'hugeicons-react';

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
      {/* Background gradient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
        {/* Secondary gradient orb */}
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-gradient-to-tr from-secondary/8 via-secondary/4 to-transparent rounded-full blur-3xl" />
        {/* Tertiary accent */}
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-tertiary/6 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ClayBadge variant="accent" className="text-xs font-semibold px-3 py-1.5">
              <SparklesIcon className="w-3.5 h-3.5" />
              Welcome back
            </ClayBadge>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {greeting}, <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">{displayName}</span>
            </h1>
            <p className="text-foreground-muted text-base md:text-lg max-w-lg">
              Ready to forge some knowledge? Let&apos;s make today count.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-muted to-primary-muted/60">
              <Calendar03Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-foreground-muted font-medium uppercase tracking-wide">Today</p>
              <p className="text-sm font-bold text-foreground">
                {format(currentDate, 'EEEE, MMM d')}
              </p>
            </div>
          </div>

          {/* Quick action button */}
          <button className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
            <Rocket01Icon className="w-4 h-4" />
            Start Learning
          </button>
        </div>
      </div>
    </ClayCard>
  );
}
