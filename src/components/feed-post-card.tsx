import Link from "next/link";
import type { FeedPost, Platform } from "@/types";

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  twitter: "X",
  news: "News",
  docs: "Docs",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "text-[#8B4A4A] bg-[#f0dbd8] dark:text-[#E5A097] dark:bg-[#3D2424]",
  reddit: "text-[#7B6230] bg-[#f0e8d4] dark:text-[#D4B875] dark:bg-[#2E2818]",
  twitter: "text-[#5E3F96] bg-[#e0d8ef] dark:text-[#B89DD4] dark:bg-[#2A1F3D]",
  news: "text-[#2D6040] bg-[#d2e8d6] dark:text-[#7EBE8E] dark:bg-[#1A3327]",
  docs: "text-[#4A6B8B] bg-[#d8e4f0] dark:text-[#97C5E5] dark:bg-[#1F2E3D]",
};

function formatFeedTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const hours = Math.floor(diffMs / 3_600_000);

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    if (hours < 1) return "Just now";
    return `${hours}h ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function FeedPostCard({ post }: { post: FeedPost }) {
  const articleHref = post.topic_slug ? `/content/${post.topic_slug}` : "#";

  return (
    <Link href={articleHref} className="block group">
      <article
        className="relative rounded-2xl bg-[#fafcfa] p-5 lg:p-6
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-all duration-300 ease-out
          dark:bg-[#1E241E]"
      >
        <div className="flex items-center gap-2 mb-3">
          {post.source_platforms.map((platform) => (
            <span
              key={platform}
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md tracking-wide ${PLATFORM_COLORS[platform as Platform] ?? ""}`}
            >
              {PLATFORM_LABELS[platform as Platform] ?? platform}
            </span>
          ))}
          <span className="text-[12px] text-[#9B9B8E] tracking-wide">
            {formatFeedTime(post.published_at)}
          </span>
        </div>

        <h2 className="font-heading font-semibold text-lg leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {post.headline}
        </h2>

        <div className="mt-3 text-[15px] leading-[1.65] text-[#5A5A6E] dark:text-[#A8B0A6] space-y-1">
          {post.summary.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className={line.startsWith("- ") ? "pl-3" : ""}>
              {line.startsWith("- ") ? (
                <>
                  <span className="text-[#8B6E4E] mr-1.5" aria-hidden="true">
                    &bull;
                  </span>
                  {line.slice(2)}
                </>
              ) : (
                line
              )}
            </p>
          ))}
        </div>

        <div className="mt-4 text-[12px] text-[#9B9B8E] tracking-wide">
          Read full article &rarr;
        </div>
      </article>
    </Link>
  );
}

export function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = "Today";
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  } else {
    label = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-[13px] font-heading font-semibold text-[#1A1A2E] dark:text-[#EDF2EC] whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#dde4db] dark:bg-[#3A433A]" />
    </div>
  );
}
