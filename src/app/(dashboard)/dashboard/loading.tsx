export default function DashboardLoading() {
  return (
    <div className="pb-12">
      {/* Mobile layout skeleton — matches DashboardMobile */}
      <div className="lg:hidden flex flex-col gap-2 px-4 pt-6 pb-8">
        {/* MobileHeader skeleton */}
        <div className="flex items-center justify-between gap-4 pt-2 pb-2 animate-pulse">
          <div className="min-w-0">
            <div className="h-3 w-24 bg-background-muted rounded-full mb-2" />
            <div className="h-8 w-40 bg-background-muted rounded-full" />
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-foreground/10 bg-background-muted shrink-0" />
        </div>

        {/* MobileQuickActions skeleton */}
        <div className="flex gap-2 mt-4 animate-pulse">
          <div className="flex-1 h-12 rounded-full bg-background-muted" />
          <div className="flex-1 h-12 rounded-full bg-background-muted" />
        </div>

        {/* MobileContinueLearning skeleton */}
        <div className="mt-4 animate-pulse">
          <div className="rounded-[2.5rem] bg-background-muted p-8 h-48 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-foreground/10" />
            <div className="h-3 w-16 bg-foreground/10 rounded-full" />
            <div className="h-6 w-40 bg-foreground/10 rounded-full" />
          </div>
        </div>

        {/* MobileStreakAndActivity skeleton */}
        <div className="flex gap-2 mt-4 animate-pulse">
          <div className="flex-1 rounded-[2.5rem] bg-surface border-2 border-border/40 p-6 h-44 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-background-muted rounded-full" />
              <div className="h-3 w-12 bg-background-muted rounded-full" />
            </div>
            <div>
              <div className="h-14 w-16 bg-background-muted rounded-2xl mb-2" />
              <div className="h-2.5 w-20 bg-background-muted rounded-full" />
            </div>
          </div>
          <div className="w-2/5 flex flex-col gap-2">
            <div className="flex-1 rounded-[2rem] bg-surface border-2 border-border/40 p-4 flex flex-col justify-center items-center gap-2">
              <div className="h-6 w-10 bg-background-muted rounded-lg" />
              <div className="h-2 w-16 bg-background-muted rounded-full" />
            </div>
            <div className="flex-1 rounded-[2rem] bg-surface border-2 border-border/40 p-4 flex flex-col justify-center items-center gap-2">
              <div className="h-6 w-10 bg-background-muted rounded-lg" />
              <div className="h-2 w-16 bg-background-muted rounded-full" />
            </div>
          </div>
        </div>

        {/* MobileRecentActivity skeleton */}
        <div className="mt-8 animate-pulse">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="h-3 w-20 bg-background-muted rounded-full" />
            <div className="h-3 w-14 bg-background-muted rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-3xl bg-surface border border-border/40">
                <div className="p-3 rounded-full bg-background-muted shrink-0">
                  <div className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 py-1 space-y-2">
                  <div className="h-4 w-3/4 bg-background-muted rounded-full" />
                  <div className="h-3 w-12 bg-background-muted rounded-full" />
                  <div className="h-2.5 w-20 bg-background-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop layout skeleton — matches Dashboard desktop layout */}
      <div className="hidden lg:flex flex-col gap-10 max-w-[1700px] mx-auto pt-8 px-8">
        {/* DashboardHeader skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 pt-4 border-b-[6px] border-foreground/10 w-full mb-4 animate-pulse">
          <div className="flex-1">
            <div className="h-4 w-28 bg-background-muted rounded-full mb-3" />
            <div className="h-14 w-64 bg-background-muted rounded-2xl" />
          </div>
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end gap-2">
              <div className="h-3 w-14 bg-background-muted rounded-full" />
              <div className="h-7 w-32 bg-background-muted rounded-xl" />
            </div>
            <div className="w-20 h-20 rounded-full bg-background-muted shrink-0" />
          </div>
        </div>

        {/* Grid: ContinueLearning + StudyStreak | RecentActivity */}
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-10">
            {/* ContinueLearning + StudyStreak row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* ContinueLearning skeleton */}
              <div className="rounded-[3rem] bg-surface border-2 border-border/40 animate-pulse flex flex-col min-h-[350px]">
                <div className="flex items-center gap-3 pt-8 px-10 mb-8">
                  <div className="w-6 h-6 bg-background-muted rounded-lg" />
                  <div className="h-4 w-28 bg-background-muted rounded-full" />
                </div>
                <div className="flex-1 mx-4 mb-4 rounded-[2.5rem] bg-background-muted" />
                <div className="grid grid-cols-2 gap-4 px-4 pb-4">
                  <div className="h-16 rounded-[2rem] bg-background-muted border-[3px] border-border/20" />
                  <div className="h-16 rounded-[2rem] bg-background-muted border-[3px] border-border/20" />
                </div>
              </div>

              {/* StudyStreak skeleton */}
              <div className="rounded-[3rem] bg-surface border-2 border-border/40 p-8 animate-pulse flex flex-col justify-between min-h-[350px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-background-muted rounded-full" />
                    <div className="h-4 w-16 bg-background-muted rounded-full" />
                  </div>
                  <div className="h-7 w-28 bg-background-muted rounded-full" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-6 gap-4">
                  <div className="h-24 w-24 bg-background-muted rounded-2xl" />
                  <div className="h-4 w-28 bg-background-muted rounded-full" />
                </div>
                <div className="mt-8 pt-6 border-t-4 border-foreground/5">
                  <div className="flex justify-between items-end mb-4 px-2">
                    <div className="h-3 w-16 bg-background-muted rounded-full" />
                    <div className="h-3 w-14 bg-background-muted rounded-full" />
                  </div>
                  <div className="flex justify-between gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full aspect-square rounded-[1rem] bg-background-muted border-2 border-border/20" />
                        <div className="h-3 w-3 bg-background-muted rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* WeeklyActivityChart skeleton */}
            <div className="rounded-[3rem] bg-surface border-2 border-border/40 p-10 animate-pulse flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-background-muted rounded-lg" />
                  <div className="h-5 w-40 bg-background-muted rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-28 bg-background-muted rounded-full border-[3px] border-border/10" />
                  <div className="h-10 w-28 bg-background-muted rounded-full border-[3px] border-border/10" />
                </div>
              </div>
              <div className="flex-1 flex items-end gap-4 xl:gap-6 mt-4">
                {[45, 65, 30, 80, 55, 40, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full max-w-[4.5rem] bg-background-muted rounded-full"
                      style={{ height: `${h}%` }}
                    />
                    <div className="h-3 w-6 bg-background-muted rounded-full mt-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RecentActivity skeleton */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-10">
            <div className="rounded-[3rem] bg-surface border-2 border-border/40 h-full flex flex-col p-10 animate-pulse min-h-[600px]">
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div className="h-5 w-20 bg-background-muted rounded-full mb-2" />
                  <div className="h-3 w-24 bg-background-muted rounded-full" />
                </div>
                <div className="h-10 w-24 bg-background-muted rounded-full border-[3px] border-border/10" />
              </div>
              <div className="flex flex-col gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-8 p-3 rounded-[2rem]">
                    <div className="w-[4rem] h-[4rem] rounded-full bg-background-muted border-[3px] border-border shrink-0" />
                    <div className="flex-1 py-1 space-y-2">
                      <div className="h-4 w-3/4 bg-background-muted rounded-full" />
                      <div className="h-3 w-16 bg-background-muted rounded-full" />
                      <div className="flex gap-3">
                        <div className="h-3 w-24 bg-background-muted rounded-full" />
                        <div className="h-3 w-14 bg-background-muted rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
