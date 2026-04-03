export default function LibraryLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 lg:space-y-14 px-2 md:px-0">
      {/* Hero Header skeleton — matches LibraryHeader */}
      <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4 animate-pulse">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="w-3 h-3 rounded-full bg-background-muted flex-shrink-0" />
            <div className="h-3 w-28 bg-background-muted rounded-full" />
          </div>
          <div className="h-12 md:h-16 w-48 bg-background-muted rounded-2xl" />
        </div>
        <div className="flex shrink-0 w-full md:w-auto pb-1 mt-4 md:mt-0">
          <div className="w-full md:w-44 h-14 bg-background-muted rounded-[2rem]" />
        </div>
      </div>

      {/* Mobile Controls skeleton */}
      <div className="lg:hidden flex flex-col gap-6 w-full animate-pulse">
        <div className="flex w-full items-stretch gap-3 h-[4rem]">
          <div className="flex-1 bg-background-muted rounded-[2rem]" />
          <div className="w-[4rem] h-[4rem] shrink-0 bg-background-muted rounded-[2rem]" />
        </div>
        <div className="flex items-center justify-between px-2">
          <div className="h-2.5 w-32 bg-background-muted rounded-full" />
          <div className="h-2.5 w-24 bg-background-muted rounded-full" />
        </div>
      </div>

      {/* Desktop Inline Toolbar skeleton */}
      <div className="hidden lg:flex flex-col gap-5 w-full animate-pulse">
        {/* Search + Count Row */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 bg-background-muted rounded-[1.5rem] h-[3.25rem]" />
          <div className="shrink-0 bg-background-muted px-5 h-[3.25rem] w-24 rounded-[1.5rem]" />
        </div>
        {/* Filters Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 mr-1">
            <div className="h-3 w-10 bg-background-muted rounded-full" />
            <div className="h-8 w-10 bg-background-muted rounded-full" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-background-muted rounded-full" />
            ))}
          </div>
          <div className="w-px h-6 bg-foreground/10 mx-1" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 bg-background-muted rounded-full" />
            <div className="h-8 w-16 bg-background-muted rounded-full" />
            <div className="h-8 w-10 bg-background-muted rounded-full" />
            <div className="h-8 w-16 bg-background-muted rounded-full" />
          </div>
        </div>
      </div>

      {/* Content Area — Notebook cards grid skeleton */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-full bg-background-muted rounded-[2rem] lg:rounded-[2.5rem] p-5 lg:p-6 flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-8 animate-pulse"
          >
            {/* Notebook cover block */}
            <div className="flex items-start gap-5 lg:gap-6 flex-1 min-w-0">
              <div className="w-20 h-28 lg:w-24 lg:h-32 rounded-[1rem] lg:rounded-[1.25rem] flex-shrink-0 bg-foreground/10" />
              {/* Info column */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                <div className="h-4 lg:h-5 w-3/4 bg-foreground/5 rounded-full" />
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <div className="h-5 w-20 bg-foreground/5 rounded-[0.75rem]" />
                  <div className="h-5 w-12 bg-foreground/5 rounded-[0.75rem]" />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t-2 border-border/20">
                  <div className="h-5 w-16 bg-foreground/5 rounded-[0.5rem]" />
                  <div className="h-5 w-20 bg-foreground/5 rounded-[0.5rem]" />
                </div>
              </div>
            </div>
            {/* 3-dot menu placeholder */}
            <div className="absolute top-4 right-4 lg:top-5 lg:right-5">
              <div className="w-10 h-10 bg-foreground/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
