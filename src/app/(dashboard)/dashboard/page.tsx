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
      <div className="hidden lg:flex flex-col gap-10 max-w-[1700px] mx-auto pt-8 px-8">
        <DashboardHeader user={user ?? undefined} />
        
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <ContinueLearning />
              <StudyStreak />
            </div>
            <WeeklyActivityChart />
          </div>
          
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
