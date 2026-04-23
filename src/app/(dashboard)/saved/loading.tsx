export default function Loading() {
  return (
    <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 px-2 md:px-0">
      <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
        <div className="flex flex-col space-y-4">
          <div className="w-48 h-4 bg-background-muted rounded-full animate-pulse" />
          <div className="w-72 h-16 bg-background-muted rounded-[1rem] animate-pulse" />
        </div>
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-full h-40 bg-background-muted rounded-[1.5rem] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
