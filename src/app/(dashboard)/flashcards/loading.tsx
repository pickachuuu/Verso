import { ClayCard } from '@/component/ui/Clay';

export default function FlashcardsLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-surface rounded" />
            <div className="h-3 w-48 bg-surface/60 rounded" />
          </div>
        </div>
        <div className="h-10 w-36 bg-surface rounded-xl" />
      </div>

      {/* Stats Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        <ClayCard variant="default" padding="md" className="rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1.5">
              <div className="h-4 w-20 bg-surface rounded" />
              <div className="h-3 w-28 bg-surface/60 rounded" />
            </div>
            <div className="h-10 w-16 bg-surface rounded-xl" />
          </div>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 h-14 bg-surface/60 rounded-lg" />
            <div className="flex-1 h-14 bg-surface/60 rounded-lg" />
            <div className="flex-1 h-14 bg-surface/60 rounded-lg" />
          </div>
          <div className="h-12 bg-surface/40 rounded-xl" />
        </ClayCard>
        <ClayCard variant="default" padding="md" className="rounded-2xl">
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-24 h-24 bg-surface rounded-full" />
            <div className="h-4 w-20 bg-surface rounded" />
            <div className="h-3 w-24 bg-surface/60 rounded" />
            <div className="w-full h-3 bg-surface rounded-full mt-2" />
          </div>
        </ClayCard>
      </div>

      {/* Search/Filter Skeleton */}
      <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-12 bg-surface rounded-xl" />
          <div className="flex gap-3">
            <div className="h-10 w-40 bg-surface rounded-lg" />
            <div className="h-10 w-24 bg-surface rounded-lg" />
            <div className="h-10 w-20 bg-surface rounded-lg" />
          </div>
        </div>
      </ClayCard>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <ClayCard key={i} variant="default" padding="none" className="rounded-2xl overflow-hidden">
            <div className="h-1 w-full bg-surface" />
            <div className="p-5 space-y-4">
              <div className="h-5 w-3/4 bg-surface rounded" />
              <div className="h-3 w-1/2 bg-surface/60 rounded" />
              <div className="space-y-2 pt-2">
                <div className="h-3 w-32 bg-surface/60 rounded" />
                <div className="h-1.5 w-full bg-surface rounded-full" />
              </div>
              <div className="h-3 w-16 bg-surface rounded" />
            </div>
          </ClayCard>
        ))}
      </div>
    </div>
  );
}
