export default function FlashcardsLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 lg:space-y-14 px-2 md:px-0">
      {/* Hero Header skeleton — matches FlashcardsHeader */}
      <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4 animate-pulse">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="w-3 h-3 rounded-full bg-background-muted flex-shrink-0" />
            <div className="h-3 w-28 bg-background-muted rounded-full" />
          </div>
          <div className="h-12 md:h-16 w-64 bg-background-muted rounded-2xl" />
        </div>
        <div className="flex shrink-0 w-full md:w-auto pb-1 mt-2 md:mt-0">
          <div className="w-full sm:w-48 h-12 bg-background-muted rounded-[2rem]" />
        </div>
      </div>

      {/* Mobile Controls skeleton */}
      <div className="lg:hidden flex flex-col gap-4 w-full animate-pulse">
        <div className="flex w-full items-stretch gap-3 h-[3.5rem]">
          <div className="flex-1 bg-background-muted rounded-[2rem]" />
          <div className="w-[3.5rem] h-[3.5rem] shrink-0 bg-background-muted rounded-[2rem]" />
        </div>
        <div className="flex items-center justify-between px-2">
          <div className="h-2.5 w-24 bg-background-muted rounded-full" />
          <div className="h-2.5 w-20 bg-background-muted rounded-full" />
        </div>
      </div>

      {/* Desktop Inline Toolbar skeleton */}
      <div className="hidden lg:flex flex-col gap-5 w-full animate-pulse">
        {/* Search + Stats Row */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 bg-background-muted rounded-[1.5rem] h-[3.25rem]" />
          <div className="shrink-0 flex items-center gap-3">
            <div className="bg-background-muted px-5 h-[3.25rem] w-24 rounded-[1.5rem]" />
            <div className="bg-background-muted px-5 h-[3.25rem] w-24 rounded-[1.5rem]" />
          </div>
        </div>
        {/* Filters Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-3 w-14 bg-background-muted rounded-full" />
            <div className="h-8 w-10 bg-background-muted rounded-full" />
            <div className="h-8 w-18 bg-background-muted rounded-full" />
            <div className="h-8 w-20 bg-background-muted rounded-full" />
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

      {/* Content Area — Flashcard cards grid skeleton */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-full bg-background-muted rounded-[2rem] p-5 lg:p-6 flex items-start gap-4 lg:gap-5 animate-pulse relative"
          >
            {/* Mastery icon block */}
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1rem] flex-shrink-0 bg-foreground/10" />

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center pr-8 lg:pr-10 gap-2">
              <div className="h-4 lg:h-5 w-3/4 bg-foreground/5 rounded-full" />
              <div className="h-3 w-1/2 bg-foreground/5 rounded-full" />
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <div className="h-5 w-20 bg-foreground/5 rounded-[0.75rem]" />
                <div className="h-5 w-16 bg-foreground/5 rounded-[0.75rem]" />
                <div className="h-5 w-20 bg-foreground/5 rounded-[0.75rem]" />
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-3 w-full mt-1">
                <div className="flex-1 h-2 bg-foreground/5 rounded-full" />
                <div className="h-3 w-8 bg-foreground/5 rounded-full" />
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
