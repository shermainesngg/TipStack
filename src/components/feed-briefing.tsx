"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedPost, ContentCategory, DailyBrief } from "@/types";
import { getArticleUrl, getAllCategorySlugs } from "@/lib/categories";
import { SourceLine } from "./source-cluster";

const MAX_EDITIONS = 7;

// ─── Section metadata ───────────────────────────────────────────────────────

const SECTION_LABEL: Record<ContentCategory, string> = {
  claude_code_features: "Claude Code",
  mcp_and_integrations: "MCP & Integrations",
  workflow_patterns: "Workflow Patterns",
  prompting_and_rules: "Prompting & Rules",
  github_skills: "GitHub Skills",
  debugging_and_testing: "Debugging & Testing",
  security_and_guardrails: "Security & Guardrails",
};

const CATEGORY_DOT: Record<ContentCategory, string> = {
  claude_code_features: "bg-[#C79A3E]",
  mcp_and_integrations: "bg-[#5E9E7A]",
  workflow_patterns: "bg-[#4E9A8E]",
  prompting_and_rules: "bg-[#8FA84E]",
  github_skills: "bg-[#9A6A8E]",
  debugging_and_testing: "bg-[#6A7EA8]",
  security_and_guardrails: "bg-[#C4614E]",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function summaryToBullets(summary: string): string[] {
  return summary
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function wordCount(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

function formatFeedTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const hours = Math.floor((now.getTime() - date.getTime()) / 3_600_000);
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

function articleHref(post: FeedPost): string | null {
  return post.topic_slug && post.topic_category
    ? getArticleUrl(post.topic_category, post.topic_slug)
    : null;
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

function fullDateLabel(key: string): string {
  const d = new Date(key + "T12:00:00Z");
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };
  return d.toLocaleDateString("en-US", opts);
}

function relLabel(key: string): string | null {
  if (key === todayKey()) return "Today";
  if (key === yesterdayKey()) return "Yesterday";
  return null;
}

function pillLabel(key: string): string {
  return (
    relLabel(key) ??
    new Date(key + "T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    })
  );
}

type Section = { key: string; label: string; dot: string; posts: FeedPost[] };

function groupByCategory(posts: FeedPost[]): Section[] {
  const buckets = new Map<string, FeedPost[]>();
  for (const p of posts) {
    const key = p.topic_category ?? "_other";
    (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(p);
  }
  const sections: Section[] = [];
  for (const cat of getAllCategorySlugs()) {
    const list = buckets.get(cat);
    if (list?.length) {
      sections.push({ key: cat, label: SECTION_LABEL[cat], dot: CATEGORY_DOT[cat], posts: list });
    }
  }
  const other = buckets.get("_other");
  if (other?.length) {
    sections.push({ key: "_other", label: "More Updates", dot: "bg-[#9B9B8E]", posts: other });
  }
  return sections;
}

type Edition = {
  key: string;
  posts: FeedPost[];
  sections: Section[];
  readMin: number;
};

function buildEditions(posts: FeedPost[]): Edition[] {
  const byDay = new Map<string, FeedPost[]>();
  for (const p of posts) {
    const k = dayKey(p.published_at);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(p);
  }
  const keys = [...byDay.keys()].sort().reverse().slice(0, MAX_EDITIONS);

  // The Brief (AI day-summary) is the hero; every article lists in the sections
  // below, ordered by priority within each category.
  return keys.map((key) => {
    const dayPosts = byDay.get(key)!.slice().sort((a, b) => (b.priority ?? 5) - (a.priority ?? 5));
    const words = dayPosts.reduce((n, p) => n + wordCount(p.headline) + wordCount(p.summary), 0);
    return {
      key,
      posts: dayPosts,
      sections: groupByCategory(dayPosts),
      readMin: Math.max(2, Math.round(words / 200)),
    };
  });
}

// ─── Pieces ─────────────────────────────────────────────────────────────────

function BriefingRow({ post }: { post: FeedPost }) {
  const href = articleHref(post);
  const dek = summaryToBullets(post.summary)[0] ?? "";
  const hasSources = post.source_urls.length > 0;

  const inner = (
    <div className="rounded-xl px-3 py-3.5 -mx-3 transition-colors group-hover:bg-[#fafcfa] dark:group-hover:bg-[#1E241E]">
      <h3 className="font-heading font-semibold text-[16.5px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2 group-hover:text-[#6B47A8] dark:group-hover:text-[#C5B3E6] transition-colors">
        {post.headline}
      </h3>
      {dek && (
        <p className="mt-1 text-[14px] leading-[1.55] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-1">{dek}</p>
      )}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[12px] text-[#6E6E7E] dark:text-[#8FA090] tracking-wide">
        {hasSources && <SourceLine sources={post.source_urls} />}
        {hasSources && <span className="text-[#9B9B8E]">·</span>}
        <span className="text-[#9B9B8E]">{formatFeedTime(post.published_at)}</span>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block group">{inner}</Link>
  ) : (
    <div className="group">{inner}</div>
  );
}

function SectionHeader({ label, dot, count }: { label: string; dot: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5 mb-1.5">
      <span className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
      <h2 className="font-heading font-semibold text-[12px] uppercase tracking-[0.12em] text-[#1A1A2E] dark:text-[#EDF2EC] whitespace-nowrap">{label}</h2>
      <span className="text-[12px] text-[#9B9B8E] tabular-nums">{count}</span>
      <div className="flex-1 h-px bg-[#dde4db] dark:bg-[#3A433A]" />
    </div>
  );
}

function BriefHero({ brief }: { brief: DailyBrief }) {
  return (
    <article className="rounded-2xl bg-[#fafcfa] dark:bg-[#1E241E] p-6 sm:p-8 lg:p-10 shadow-[0_2px_10px_rgba(0,0,0,0.04),0_18px_44px_rgba(0,0,0,0.09)] dark:shadow-none dark:border dark:border-[#3A433A]">
      <div className="text-[11px] font-heading font-semibold uppercase tracking-[0.14em] text-[#8B6E4E] dark:text-[#C4A77E] mb-4">
        The Brief
      </div>
      {brief.headline && (
        <h2 className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.12] [font-size:clamp(1.5rem,2.4vw+0.6rem,2.1rem)]">
          {brief.headline}
        </h2>
      )}
      <p className="mt-4 text-[16.5px] leading-[1.75] text-[#3D3D50] dark:text-[#C8D0C6]">
        {brief.summary}
      </p>
    </article>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export function FeedBriefing({
  posts,
  briefs,
}: {
  posts: FeedPost[];
  briefs: Record<string, DailyBrief>;
}) {
  const editions = useMemo(() => buildEditions(posts), [posts]);
  const [idx, setIdx] = useState(0);

  if (editions.length === 0) {
    return (
      <div className="py-12">
        <p className="text-lg font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC]">No updates yet.</p>
        <p className="mt-2 text-[14px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
          Check back later — the pipeline runs twice daily.
        </p>
      </div>
    );
  }

  const clampedIdx = Math.min(idx, editions.length - 1);
  const edition = editions[clampedIdx];
  const brief = briefs[edition.key];
  const rel = relLabel(edition.key);

  return (
    <div className="pb-16 max-w-[760px]">
      {/* Day navigator: date rail — click a day to jump to it */}
      <div className="flex items-center mb-7">
        <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
          {editions.map((e, i) => (
            <button
              key={e.key}
              type="button"
              onClick={() => setIdx(i)}
              aria-current={i === clampedIdx}
              className={`shrink-0 text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-colors ${
                i === clampedIdx
                  ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#1A1A2E]"
                  : "bg-[#dde4db]/60 text-[#5A5A6E] hover:bg-[#dde4db] dark:bg-[#2A322A]/60 dark:text-[#A8B0A6]"
              }`}
            >
              {pillLabel(e.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Selected edition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={edition.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="mb-6 flex items-baseline gap-3 flex-wrap">
            <h1 className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.05] [font-size:clamp(1.7rem,3vw+0.5rem,2.4rem)]">
              {fullDateLabel(edition.key)}
            </h1>
            {rel && (
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-[#dde4db] text-[#5A5A6E] dark:bg-[#2A322A] dark:text-[#A8B0A6]">
                {rel}
              </span>
            )}
          </div>
          <div className="-mt-4 mb-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-[#6E6E7E] dark:text-[#8FA090]">
            <span>{edition.readMin} min read</span>
            <span className="text-[#c3cbc0] dark:text-[#3A433A]">·</span>
            <span>{edition.posts.length} {edition.posts.length === 1 ? "update" : "updates"}</span>
          </div>

          {brief && <BriefHero brief={brief} />}

          {edition.sections.length > 0 && (
            <div className="mt-10 space-y-9">
              {edition.sections.map((sec) => (
                <section key={sec.key}>
                  <SectionHeader label={sec.label} dot={sec.dot} count={sec.posts.length} />
                  <div className="mt-1 space-y-1">
                    {sec.posts.map((post) => (
                      <BriefingRow key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
