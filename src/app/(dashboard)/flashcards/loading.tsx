import { ClayCard } from '@/component/ui/Clay';

export default function FlashcardsLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Header Skeleton */}
      <ClayCard variant="elevated" padding="lg" className="rounded-3xl animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-surface rounded-2xl" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-surface rounded" />
              <div className="h-4 w-56 bg-surface/60 rounded" />
            </div>
          </div>
          <div className="h-11 w-44 bg-surface rounded-2xl" />
        </div>
      </ClayCard>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main content */}
        <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
          {/* Mobile controls */}
          <div className="lg:hidden space-y-2 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 bg-surface rounded-2xl" />
              <div className="h-10 w-24 bg-surface rounded-2xl" />
            </div>
            <div className="h-3 w-44 bg-surface/60 rounded" />
          </div>

          {/* List Skeleton */}
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ClayCard key={i} variant="default" padding="none" className="rounded-2xl overflow-hidden animate-pulse">
                <div className="flex items-stretch">
                  <div className="w-1 bg-surface" />
                  <div className="flex items-center gap-4 p-3 pr-5 flex-1">
                    <div className="w-14 h-12 bg-surface rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-2/3 bg-surface rounded" />
                      <div className="h-3 w-1/2 bg-surface/70 rounded" />
                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-2.5 w-20 bg-surface/70 rounded" />
                        <div className="h-2.5 w-16 bg-surface/70 rounded" />
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="h-8 w-8 bg-surface rounded-lg" />
                      <div className="h-8 w-8 bg-surface rounded-lg" />
                    </div>
                  </div>
                </div>
              </ClayCard>
            ))}
          </div>
        </div>

        {/* Sidebar controls */}
        <div className="order-1 lg:order-2 lg:col-span-4 space-y-4 hidden lg:block">
          <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-surface rounded" />
              <div className="h-10 flex-1 bg-surface rounded-xl" />
            </div>
          </ClayCard>

          <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
            <div className="space-y-3">
              <div className="h-3 w-20 bg-surface/60 rounded" />
              <div className="flex gap-2">
                <div className="h-7 w-14 bg-surface rounded" />
                <div className="h-7 w-16 bg-surface rounded" />
                <div className="h-7 w-16 bg-surface rounded" />
              </div>
              <div className="h-3 w-14 bg-surface/60 rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-surface rounded-lg" />
                <div className="h-8 w-8 bg-surface rounded-lg" />
                <div className="h-8 w-8 bg-surface rounded-lg" />
              </div>
            </div>
          </ClayCard>

          <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-10 bg-surface/60 rounded" />
                <div className="h-6 w-16 bg-surface rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-10 bg-surface/60 rounded" />
                <div className="h-6 w-16 bg-surface rounded" />
              </div>
              <div className="col-span-2 space-y-2">
                <div className="h-3 w-24 bg-surface/60 rounded" />
                <div className="h-5 w-12 bg-surface rounded" />
              </div>
            </div>
            <div className="mt-3 h-3 w-32 bg-surface/60 rounded" />
          </ClayCard>
        </div>
      </div>
    </div>
  );
}
