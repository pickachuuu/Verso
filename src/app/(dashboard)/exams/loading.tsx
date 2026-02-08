import { ClayCard } from '@/component/ui/Clay';

export default function ExamsLoading() {
  return (
    <div className="space-y-6">
      {/* Hero Header Skeleton — matches the elevated ClayCard hero */}
      <ClayCard variant="elevated" padding="lg" className="rounded-3xl animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-surface to-surface-elevated rounded-2xl" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-7 w-28 bg-surface rounded-lg" />
                <div className="h-5 w-36 bg-surface/60 rounded-full" />
              </div>
              <div className="h-4 w-64 bg-surface/40 rounded-lg" />
            </div>
          </div>
          <div className="h-11 w-36 bg-surface rounded-xl" />
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

      {/* List Skeleton — matches new rounded-2xl list items with mini icon */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-2xl bg-gradient-to-r from-surface to-surface-elevated/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
