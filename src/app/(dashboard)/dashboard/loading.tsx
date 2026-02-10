import { ClayCard } from '@/component/ui/Clay';

export default function DashboardLoading() {
  return (
    <div className="pb-12">
      {/* Mobile layout skeleton */}
      <div className="lg:hidden space-y-4">
        <ClayCard variant="elevated" padding="sm" className="rounded-2xl animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-surface rounded-xl" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 bg-surface rounded" />
                <div className="h-4 w-32 bg-surface/60 rounded" />
              </div>
            </div>
            <div className="h-9 w-24 bg-surface rounded-xl" />
          </div>
        </ClayCard>

        <ClayCard variant="default" padding="sm" className="rounded-2xl animate-pulse">
          <div className="h-3 w-20 bg-surface/60 rounded mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-surface" />
            ))}
          </div>
          <div className="mt-3 h-10 rounded-xl bg-surface" />
        </ClayCard>

        <ClayCard variant="default" padding="sm" className="rounded-2xl animate-pulse">
          <div className="h-4 w-28 bg-surface rounded mb-3" />
          <div className="h-16 rounded-xl bg-surface" />
        </ClayCard>

        <ClayCard variant="default" padding="sm" className="rounded-2xl animate-pulse">
          <div className="h-4 w-32 bg-surface rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 bg-surface rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 bg-surface rounded" />
                  <div className="h-3 w-28 bg-surface/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        </ClayCard>
      </div>

      {/* Desktop layout skeleton */}
      <div className="hidden lg:block">
        {/* Header Skeleton */}
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-surface rounded-2xl" />
              <div className="space-y-2">
                <div className="h-6 w-56 bg-surface rounded" />
                <div className="h-4 w-56 bg-surface/60 rounded" />
              </div>
            </div>
            <div className="h-12 w-52 bg-surface rounded-2xl" />
          </div>
        </ClayCard>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Streak */}
          <div className="lg:col-span-4">
            <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
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
          </div>

          {/* Weekly Activity */}
          <div className="lg:col-span-8">
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

          {/* Continue Learning */}
          <div className="lg:col-span-7">
            <ClayCard variant="elevated" padding="lg" className="rounded-3xl animate-pulse">
              <div className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-surface rounded-lg" />
                  <div className="h-4 w-28 bg-surface rounded" />
                </div>
                <div className="h-28 bg-surface rounded-2xl" />
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="h-12 bg-surface rounded-xl" />
                  <div className="h-12 bg-surface rounded-xl" />
                </div>
              </div>
            </ClayCard>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-5">
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
      </div>
    </div>
  );
}
