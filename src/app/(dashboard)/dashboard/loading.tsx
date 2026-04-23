export default function Loading() {
  return (
    <div className="w-full max-w-7xl mx-auto pt-12 pb-20 space-y-10 px-4">
      <div className="flex flex-col space-y-4 mb-8">
        <div className="w-48 h-4 bg-background-muted rounded-full animate-pulse" />
        <div className="w-72 h-16 bg-background-muted rounded-[1rem] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-48 bg-background-muted rounded-[2rem] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
