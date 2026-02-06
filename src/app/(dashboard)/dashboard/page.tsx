'use client';

import DashboardHeader from '@/component/features/DashboardHeader';
import StudyStreak from '@/component/features/StudyStreak';
import CardsDueToday from '@/component/features/CardsDueToday';
import MasteryProgress from '@/component/features/MasteryProgress';
import WeeklyActivityChart from '@/component/features/WeeklyActivityChart';
import ContinueLearning from '@/component/features/ContinueLearning';
import RecentActivity from '@/component/features/RecentActivity';
import ExamStats from '@/component/features/ExamStats';
import { useUserProfile } from '@/hooks/useAuth';

export default function Dashboard() {
  const { data: user } = useUserProfile();

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

      {/* Exam Performance */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-base font-semibold text-foreground">Exams</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
        </div>
        <ExamStats />
      </section>

      {/* Bottom Row: Recent Activity */}
      <section>
        <RecentActivity />
      </section>
    </div>
  );
}
