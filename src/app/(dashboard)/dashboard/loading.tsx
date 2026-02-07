import { ClayCard } from '@/component/ui/Clay';

export default function DashboardLoading() {
  return (
    <div className="pb-10">
      {/* Header Skeleton */}
      <ClayCard variant="elevated" padding="none" className="rounded-3xl overflow-hidden animate-pulse">
        <div className="px-8 py-7 md:px-10 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-3">
              <div className="h-6 w-28 bg-surface rounded-full" />
              <div className="h-9 w-72 bg-surface rounded-lg" />
              <div className="h-5 w-56 bg-surface/60 rounded-lg" />
            </div>
            <div className="h-14 w-44 bg-surface rounded-2xl" />
          </div>
        </div>
      </ClayCard>

      {/* Bento Grid Skeleton */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 auto-rows-min">
        {/* Streak */}
        <ClayCard variant="default" padding="md" className="rounded-2xl xl:row-span-2 animate-pulse">
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="w-20 h-20 bg-surface rounded-full" />
            <div className="h-10 w-12 bg-surface rounded-lg" />
            <div className="h-4 w-24 bg-surface/60 rounded" />
            <div className="w-full mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-surface rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </ClayCard>

        {/* Weekly Activity */}
        <div className="md:col-span-1 xl:col-span-2 xl:row-span-2">
          <ClayCard variant="default" padding="md" className="rounded-2xl h-full animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface rounded-xl" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-surface rounded" />
                  <div className="h-3 w-16 bg-surface/60 rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-surface rounded-xl" />
                <div className="h-8 w-16 bg-surface rounded-xl" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-3 h-36 mb-3">
              {[45, 65, 30, 80, 55, 40, 70].map((h, i) => (
                <div key={i} className="flex-1 flex items-end">
                  <div className="w-full bg-surface rounded-xl" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 h-3 bg-surface/60 rounded mx-auto" />
              ))}
            </div>
          </ClayCard>
        </div>

        {/* Recommended */}
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl xl:row-span-2 animate-pulse">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-surface rounded-lg" />
              <div className="h-4 w-24 bg-surface rounded" />
            </div>
            <div className="h-28 bg-surface rounded-2xl" />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="h-12 bg-surface rounded-xl" />
              <div className="h-12 bg-surface rounded-xl" />
            </div>
          </div>
        </ClayCard>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="mt-5">
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-surface rounded" />
              <div className="h-3 w-24 bg-surface/60 rounded" />
            </div>
            <div className="h-7 w-16 bg-surface rounded-lg" />
          </div>
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-surface rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-surface rounded" />
                  <div className="h-3 w-56 bg-surface/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </ClayCard>
      </div>
    </div>
  );
}
