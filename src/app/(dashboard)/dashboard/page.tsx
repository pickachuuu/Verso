'use client';

import DashboardHeader from '@/component/features/DashboardHeader';
import StudyStreak from '@/component/features/StudyStreak';
import CardsDueToday from '@/component/features/CardsDueToday';
import MasteryProgress from '@/component/features/MasteryProgress';
import WeeklyActivityChart from '@/component/features/WeeklyActivityChart';
import ContinueLearning from '@/component/features/ContinueLearning';
import RecentActivity from '@/component/features/RecentActivity';
import { useEffect, useState } from 'react';
import { getCurrentUserProfile } from '@/hook/useAuthActions';

export default function Dashboard() {
  const [user, setUser] = useState<{ full_name?: string; email?: string } | null>(null);

  useEffect(() => {
    // Try to load user from localStorage first
    const cached = localStorage.getItem('dashboardUser');
    if (cached) {
      setUser(JSON.parse(cached));
    }
    // Always fetch in background to update localStorage
    getCurrentUserProfile().then((profile) => {
      if (profile) {
        setUser(profile);
        localStorage.setItem('dashboardUser', JSON.stringify(profile));
      }
    });
  }, []);

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <DashboardHeader user={user} />

      {/* Top Row: Key Metrics */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-base font-semibold text-foreground">Your Progress</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <StudyStreak />
          <CardsDueToday />
          <MasteryProgress />
        </div>
      </section>

      {/* Middle Row: Activity & Actions */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-base font-semibold text-foreground">Activity</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <WeeklyActivityChart />
          </div>
          <div>
            <ContinueLearning />
          </div>
        </div>
      </section>

      {/* Bottom Row: Recent Activity */}
      <section>
        <RecentActivity />
      </section>
    </div>
  );
}
