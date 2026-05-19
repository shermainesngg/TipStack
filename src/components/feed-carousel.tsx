"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { FeedPost, ContentCategory, Platform } from "@/types";
import { getArticleUrl, getCategoryConfig } from "@/lib/categories";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  claude_code_features: "Claude Code",
  security_and_guardrails: "Security",
  github_skills: "GitHub Skills",
  prompting_and_rules: "Prompting & Rules",
  workflow_patterns: "Workflows",
  mcp_and_integrations: "MCP",
  debugging_and_testing: "Debugging & Testing",
};

const CATEGORY_TAG_COLORS: Record<ContentCategory, string> = {
  claude_code_features: "text-[#5E4515] bg-[#ECCF90] dark:text-[#D4B060] dark:bg-[#2E2510]",
  security_and_guardrails: "text-[#6E2B2B] bg-[#F2C4B8] dark:text-[#E8A89E] dark:bg-[#3D2020]",
  github_skills: "text-[#582848] bg-[#D8BFD2] dark:text-[#C898B8] dark:bg-[#2E1828]",
  prompting_and_rules: "text-[#3A5015] bg-[#D2E098] dark:text-[#B5D070] dark:bg-[#1E2D12]",
  workflow_patterns: "text-[#1A4A40] bg-[#B8D8D0] dark:text-[#80BEB4] dark:bg-[#152E28]",
  mcp_and_integrations: "text-[#3A5015] bg-[#D2E098] dark:text-[#B5D070] dark:bg-[#1E2D12]",
  debugging_and_testing: "text-[#582848] bg-[#D8BFD2] dark:text-[#C898B8] dark:bg-[#2E1828]",
};

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

function getCardTint(category: ContentCategory | undefined): string {
  const config = category ? getCategoryConfig(category) : null;
  if (config) return `${config.tint} ${config.darkTint}`;
  return "bg-[#fafcfa] dark:bg-[#1E241E]";
}

export function FeedCarousel({ posts }: { posts: FeedPost[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !el.firstElementChild) return;
    const cardWidth = (el.firstElementChild as HTMLElement).offsetWidth;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(index, posts.length - 1));
  }, [posts.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el || !el.firstElementChild) return;
    const cardWidth = (el.firstElementChild as HTMLElement).offsetWidth;
    const gap = 12;
    el.scrollTo({ left: (cardWidth + gap) * index, behavior: "smooth" });
  };

  const goPrev = () => scrollTo(Math.max(0, activeIndex - 1));
  const goNext = () => scrollTo(Math.min(posts.length - 1, activeIndex + 1));

  if (posts.length === 0) return null;

  return (
    <div className="mt-3 group/carousel relative">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3"
      >
        {posts.map((post) => {
          const tintClass = getCardTint(post.topic_category);
          const label = post.topic_category
            ? CATEGORY_LABELS[post.topic_category] ?? "Update"
            : "Update";
          const tagColor = post.topic_category
            ? CATEGORY_TAG_COLORS[post.topic_category] ?? ""
            : "text-[#5A5A6E] bg-[#dde4db] dark:text-[#A8B0A6] dark:bg-[#2A322A]";
          const articleUrl =
            post.topic_slug && post.topic_category
              ? getArticleUrl(post.topic_category, post.topic_slug)
              : null;

          const card = (
            <article
              className={cn(
                "rounded-2xl p-5 lg:p-6 flex flex-col justify-between min-h-[260px]",
                tintClass
              )}
            >
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {post.source_platforms.map((platform) => (
                    <span
                      key={platform}
                      className={cn(
                        "inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full tracking-wide",
                        PLATFORM_COLORS[platform as Platform] ?? ""
                      )}
                    >
                      {PLATFORM_LABELS[platform as Platform] ?? platform}
                    </span>
                  ))}
                  <span className="text-[12px] text-[#9B9B8E] tracking-wide">
                    {formatFeedTime(post.published_at)}
                  </span>
                </div>

                <h3 className="font-heading font-semibold text-lg leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-3 mb-2">
                  {post.headline}
                </h3>

                <p className="text-[15px] leading-[1.65] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3">
                  {post.summary
                    .split("\n")
                    .filter(Boolean)
                    .map((line) => line.replace(/^- /, "").trim())
                    .join(" ")}
                </p>
              </div>

              <div className="flex items-center justify-between mt-4 gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {post.topic_category && (
                    <span
                      className={cn(
                        "inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full tracking-wide",
                        tagColor
                      )}
                    >
                      {label}
                    </span>
                  )}
                  {post.topic_sub_topic && (
                    <span className="inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full tracking-wide text-[#5E4515] bg-[#ECCF90] dark:text-[#D4B060] dark:bg-[#2E2510]">
                      {post.topic_sub_topic}
                    </span>
                  )}
                </div>
                {articleUrl && (
                  <span className="text-[12px] text-[#9B9B8E] tracking-wide whitespace-nowrap">
                    Read article &rarr;
                  </span>
                )}
              </div>
            </article>
          );

          return (
            <div key={post.id} className="snap-start shrink-0 w-full">
              {articleUrl ? (
                <Link href={articleUrl} className="block group">
                  {card}
                </Link>
              ) : (
                card
              )}
            </div>
          );
        })}
      </div>

      {/* Prev / Next arrows */}
      {posts.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous story"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10",
              "h-8 w-8 rounded-full flex items-center justify-center",
              "bg-[#fafcfa]/90 dark:bg-[#1E241E]/90 shadow-md backdrop-blur-sm",
              "text-[#1A1A2E] dark:text-[#EDF2EC]",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200",
              "max-lg:opacity-70",
              activeIndex === 0 && "!opacity-0 pointer-events-none"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={goNext}
            aria-label="Next story"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10",
              "h-8 w-8 rounded-full flex items-center justify-center",
              "bg-[#fafcfa]/90 dark:bg-[#1E241E]/90 shadow-md backdrop-blur-sm",
              "text-[#1A1A2E] dark:text-[#EDF2EC]",
              "opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200",
              "max-lg:opacity-70",
              activeIndex === posts.length - 1 && "!opacity-0 pointer-events-none"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {/* Dots + counter */}
      {posts.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="flex gap-1.5">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Go to story ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === activeIndex
                    ? "w-5 h-1.5 bg-[#1A1A2E] dark:bg-[#EDF2EC]"
                    : "w-1.5 h-1.5 bg-[#dde4db] dark:bg-[#3A433A]"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-[#9B9B8E] tabular-nums">
            {activeIndex + 1}/{posts.length}
          </span>
        </div>
      )}
    </div>
  );
}

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

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
