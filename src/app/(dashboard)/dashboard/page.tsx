'use client';

import DashboardStats from '@/component/features/DashboardStats';
import RecentActivity from '@/component/features/RecentActivity';
import QuickActions from '@/component/features/QuickActions';
import DashboardHeader from '@/component/features/DashboardHeader';
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

      {/* Stats Section */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2 columns on larger screens */}
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
