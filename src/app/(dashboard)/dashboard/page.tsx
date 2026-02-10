'use client';

import DashboardHeader from '@/component/features/DashboardHeader';
import DashboardMobile from '@/component/features/DashboardMobile';
import StudyStreak from '@/component/features/StudyStreak';
import WeeklyActivityChart from '@/component/features/WeeklyActivityChart';
import ContinueLearning from '@/component/features/ContinueLearning';
import RecentActivity from '@/component/features/RecentActivity';
import { useUserProfile } from '@/hooks/useAuth';

export default function Dashboard() {
  const { data: user } = useUserProfile();

  return (
    <div className="pb-12">
      {/* Mobile layout */}
      <div className="lg:hidden">
        <DashboardMobile user={user ?? undefined} />
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:block">
        <DashboardHeader user={user ?? undefined} />

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <StudyStreak />
          </div>
          <div className="lg:col-span-8">
            <WeeklyActivityChart />
          </div>
          <div className="lg:col-span-7">
            <ContinueLearning />
          </div>
          <div className="lg:col-span-5">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
