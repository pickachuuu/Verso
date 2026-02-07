'use client';

import DashboardHeader from '@/component/features/DashboardHeader';
import StudyStreak from '@/component/features/StudyStreak';
import WeeklyActivityChart from '@/component/features/WeeklyActivityChart';
import ContinueLearning from '@/component/features/ContinueLearning';
import RecentActivity from '@/component/features/RecentActivity';
import { useUserProfile } from '@/hooks/useAuth';

export default function Dashboard() {
  const { data: user } = useUserProfile();

  return (
    <div className="pb-10 max-w-3xl mx-auto">
      {/* Header */}
      <DashboardHeader user={user ?? undefined} />

      {/* Single column layout - 1 widget per row */}
      <div className="mt-6 space-y-5">
        <StudyStreak />
        <WeeklyActivityChart />
        <ContinueLearning />
        <RecentActivity />
      </div>
    </div>
  );
}
