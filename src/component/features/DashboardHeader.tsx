'use client';

import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { UserProfile } from '@/hooks/useAuth';

export default function DashboardHeader({ user }: { user?: UserProfile | null }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentDate = new Date();
  const greeting = (() => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  })();

  const displayName = isMounted
    ? user?.full_name || user?.email?.split('@')[0] || 'THERE'
    : 'THERE';

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 pt-4 border-b-[6px] border-foreground/10 w-full mb-4">
      <div className="flex-1">
        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-primary mb-3">
          {greeting}
        </p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase leading-none">
          {displayName}
        </h1>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="flex flex-col text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted mb-2">TODAY IS</p>
          <p className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-widest leading-none">
            {format(currentDate, 'EEEE')}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full bg-foreground text-surface shadow-xl shrink-0">
          <span className="text-3xl font-black leading-none">{format(currentDate, 'd')}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-surface/70 mt-0.5">{format(currentDate, 'MMM')}</span>
        </div>
      </div>
    </div>
  );
}
