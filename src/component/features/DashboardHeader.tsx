'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import { Calendar03Icon } from 'hugeicons-react';
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
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Title area */}
        <div className="flex items-start gap-3">
          <Image
            src="/brand/verso-mark.png"
            alt="Verso logo"
            width={48}
            height={48}
            className="w-12 h-12"
            priority
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {greeting},{' '}
                <span className="text-primary border-b-2 border-pencil/60 border-dashed pb-0.5">
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
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background-muted border border-border shadow-sm">
          <div className="p-2 rounded-xl bg-surface border border-border">
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
    </ClayCard>
  );
}
