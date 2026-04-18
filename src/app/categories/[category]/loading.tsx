function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-[shimmer_1.8s_ease-in-out_infinite] bg-[#dde4db] dark:bg-[#2A322A] rounded-xl ${className ?? ""}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export default function CategoryLoading() {
  return (
    <div>
      <div className="bg-[#f3eff8] dark:bg-[#221e2e]">
        <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-8 lg:pt-16 lg:pb-10">
          <Shimmer className="h-10 w-64 mb-4" />
          <Shimmer className="h-5 w-96 max-w-full" />
          <Shimmer className="h-4 w-20 mt-3" />
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-8">
        <div className="flex gap-2 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        <Shimmer className="h-64 w-full rounded-2xl mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
