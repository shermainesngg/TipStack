import { FeedSkeleton } from "@/components/feed-skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-2 lg:pt-20 lg:pb-6">
        <div className="h-12 w-64 rounded-lg bg-[#dde4db] dark:bg-[#2A322A]" />
        <div className="mt-3 h-5 w-80 rounded-lg bg-[#dde4db]/60 dark:bg-[#2A322A]/60" />
        <div className="mt-6 flex gap-x-6">
          <div className="h-5 w-16 rounded bg-[#dde4db]/40 dark:bg-[#2A322A]/40" />
          <div className="h-5 w-16 rounded bg-[#dde4db]/40 dark:bg-[#2A322A]/40" />
          <div className="h-5 w-20 rounded bg-[#dde4db]/40 dark:bg-[#2A322A]/40" />
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-8">
        <div className="flex gap-10">
          <aside className="hidden lg:block w-[200px] shrink-0">
            <div className="space-y-2 pt-2">
              {[75, 60, 85, 70, 90, 65].map((w, i) => (
                <div
                  key={i}
                  className="h-7 rounded-lg bg-[#dde4db]/50 dark:bg-[#2A322A]/50"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <FeedSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
