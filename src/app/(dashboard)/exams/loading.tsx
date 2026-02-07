import { ClayCard } from '@/component/ui/Clay';

export default function ExamsLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-5 w-24 bg-surface rounded" />
            <div className="h-3 w-52 bg-surface/60 rounded" />
          </div>
        </div>
        <div className="h-10 w-32 bg-surface rounded-xl" />
      </div>

      {/* Exam Stats Skeleton */}
      <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden animate-pulse">
        <div className="h-1 bg-surface" />
        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-surface rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-surface rounded" />
              <div className="h-3 w-20 bg-surface/60 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface rounded-2xl" />
            <div className="flex-1 grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-surface/60 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </ClayCard>

      {/* Search/Filter Skeleton */}
      <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-12 bg-surface rounded-xl" />
          <div className="flex gap-3">
            <div className="h-10 w-44 bg-surface rounded-lg" />
            <div className="h-10 w-36 bg-surface rounded-lg" />
            <div className="h-10 w-24 bg-surface rounded-lg" />
          </div>
        </div>
      </ClayCard>

      {/* List Skeleton */}
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <ClayCard key={i} variant="default" padding="none" className="rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 bg-surface rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-surface rounded" />
                <div className="h-3 w-32 bg-surface/60 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-14 bg-surface rounded-full" />
                <div className="h-6 w-14 bg-surface rounded-full" />
              </div>
            </div>
          </ClayCard>
        ))}
      </div>
    </div>
  );
}
