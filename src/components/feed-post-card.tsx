import Link from "next/link";
import type { FeedPost, Platform, ContentCategory } from "@/types";
import { getArticleUrl } from "@/lib/categories";

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  twitter: "X",
  news: "News",
  docs: "Docs",
  github: "GitHub",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "text-[#6E2B2B] bg-[#F2C4B8] dark:text-[#E8A89E] dark:bg-[#3D2020]",
  reddit: "text-[#5E4515] bg-[#ECCF90] dark:text-[#D4B060] dark:bg-[#2E2510]",
  twitter: "text-[#582848] bg-[#D8BFD2] dark:text-[#C898B8] dark:bg-[#2E1828]",
  news: "text-[#3A5015] bg-[#D2E098] dark:text-[#B5D070] dark:bg-[#1E2D12]",
  docs: "text-[#1A4A40] bg-[#B8D8D0] dark:text-[#80BEB4] dark:bg-[#152E28]",
  github: "text-[#3A423A] bg-[#CDD5CA] dark:text-[#C8D0C6] dark:bg-[#2A322A]",
};

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  claude_code_features: "Claude Code",
  security_and_guardrails: "Security",
  github_skills: "GitHub Skills",
  prompting_and_rules: "Prompting & Rules",
  workflow_patterns: "Workflows",
  mcp_and_integrations: "MCP",
  debugging_and_testing: "Debugging & Testing",
};

const TOKEN_CONTEXT_TAGS = new Set(["cost_optimization", "context_management"]);

const CATEGORY_TAG_COLORS: Record<ContentCategory, string> = {
  claude_code_features: "text-[#5E4515] bg-[#ECCF90] dark:text-[#D4B060] dark:bg-[#2E2510]",
  security_and_guardrails: "text-[#6E2B2B] bg-[#F2C4B8] dark:text-[#E8A89E] dark:bg-[#3D2020]",
  github_skills: "text-[#582848] bg-[#D8BFD2] dark:text-[#C898B8] dark:bg-[#2E1828]",
  prompting_and_rules: "text-[#3A5015] bg-[#D2E098] dark:text-[#B5D070] dark:bg-[#1E2D12]",
  workflow_patterns: "text-[#1A4A40] bg-[#B8D8D0] dark:text-[#80BEB4] dark:bg-[#152E28]",
  mcp_and_integrations: "text-[#3A5015] bg-[#D2E098] dark:text-[#B5D070] dark:bg-[#1E2D12]",
  debugging_and_testing: "text-[#582848] bg-[#D8BFD2] dark:text-[#C898B8] dark:bg-[#2E1828]",
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
  const articleHref = post.topic_slug && post.topic_category
    ? getArticleUrl(post.topic_category, post.topic_slug)
    : "#";
  const isTokenContext = (post.topic_tags_focus ?? []).some((t) => TOKEN_CONTEXT_TAGS.has(t));

  return (
    <Link href={articleHref} className="block group">
      <article
        className="relative rounded-2xl bg-[#fafcfa] p-5 lg:p-6
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-all duration-300 ease-out
          dark:bg-[#1E241E]"
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {post.source_platforms.map((platform) => {
            let label = PLATFORM_LABELS[platform as Platform] ?? platform;
            if (platform === "reddit") {
              const subs = post.source_urls
                .filter((s) => s.platform === "reddit")
                .map((s) => s.creator.match(/^r\/(\S+)/)?.[1])
                .filter(Boolean);
              const unique = [...new Set(subs)];
              if (unique.length > 0) label = unique.map((s) => `r/${s}`).join(", ");
            }
            return (
              <span
                key={platform}
                className={`inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full tracking-wide ${PLATFORM_COLORS[platform as Platform] ?? ""}`}
              >
                {label}
              </span>
            );
          })}
          <span className="text-[12px] text-[#9B9B8E] tracking-wide">
            {formatFeedTime(post.published_at)}
          </span>
        </div>

        <h2 className="font-heading font-semibold text-lg leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2 title-clamp" title={post.headline}>
          {post.headline}
        </h2>

        <p className="mt-3 text-[15px] leading-[1.65] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3">
          {post.summary
            .split("\n")
            .filter(Boolean)
            .map((line) => line.replace(/^- /, "").trim())
            .join(" ")}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {post.topic_category && (
              <span
                className={`inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full tracking-wide ${CATEGORY_TAG_COLORS[post.topic_category] ?? ""}`}
              >
                {CATEGORY_LABELS[post.topic_category] ?? post.topic_category}
              </span>
            )}
            {post.topic_sub_topic && (
              <span className="inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full tracking-wide text-[#5E4515] bg-[#ECCF90] dark:text-[#D4B060] dark:bg-[#2E2510]">
                {post.topic_sub_topic}
              </span>
            )}
            {isTokenContext && (
              <span className="inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full tracking-wide text-[#1A4A40] bg-[#B8D8D0] dark:text-[#80BEB4] dark:bg-[#152E28]">
                Token &amp; Context
              </span>
            )}
          </div>
          <span className="text-[12px] text-[#9B9B8E] tracking-wide whitespace-nowrap">
            Read article &rarr;
          </span>
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
