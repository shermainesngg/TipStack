function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-[#dde4db] dark:bg-[#2A322A] ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_ease-in-out_infinite]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="rounded-2xl bg-[#fafcf9] p-8 lg:p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)] dark:bg-[#1E241E]">
      <div className="flex items-center gap-2 mb-5">
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-3 w-16" />
      </div>
      <Shimmer className="h-8 w-3/4 rounded-lg mb-2" />
      <Shimmer className="h-8 w-1/2 rounded-lg" />
      <div className="mt-4 space-y-2">
        <Shimmer className="h-4 w-full max-w-[60ch]" />
        <Shimmer className="h-4 w-5/6 max-w-[50ch]" />
        <Shimmer className="h-4 w-2/3 max-w-[40ch]" />
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-5 w-14 rounded-md" />
        <Shimmer className="h-5 w-16 rounded-md" />
        <Shimmer className="h-5 w-12 rounded-md" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#f0f8f2] p-5 dark:bg-[#1a2b1e]">
      <div className="flex gap-1.5 mb-3">
        <Shimmer className="h-5 w-14 rounded-md" />
        <Shimmer className="h-5 w-16 rounded-md" />
      </div>
      <Shimmer className="h-5 w-4/5 rounded-lg mb-1.5" />
      <Shimmer className="h-5 w-3/5 rounded-lg" />
      <div className="mt-2 space-y-1.5">
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
      </div>
      <Shimmer className="mt-3 h-3 w-28" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      <FeaturedSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
