import { ClayCard } from '@/component/ui/Clay';

export default function LibraryLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-5 w-24 bg-surface rounded" />
            <div className="h-3 w-44 bg-surface/60 rounded" />
          </div>
        </div>
        <div className="h-10 w-32 bg-surface rounded-xl" />
      </div>

      {/* Search/Filter Skeleton */}
      <ClayCard variant="default" padding="md" className="rounded-2xl animate-pulse">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-12 bg-surface rounded-xl" />
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-surface rounded-lg" />
            <div className="h-10 w-20 bg-surface rounded-lg" />
          </div>
        </div>
      </ClayCard>

      {/* Notebook Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-surface overflow-hidden">
            <div className="h-full flex flex-col items-center justify-center gap-3 p-4">
              <div className="w-16 h-5 bg-border/60 rounded" />
              <div className="w-20 h-3 bg-border/40 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
