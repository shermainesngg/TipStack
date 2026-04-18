"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { TagPill } from "@/components/tag-pill";
import type { Content } from "@/types";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 22 },
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function LatestUpdate({ content }: { content: Content }) {
  const allTags = [
    ...content.tags_tool.slice(0, 2).map((t) => ({ label: t, category: "tool" as const })),
    ...content.tags_focus.slice(0, 1).map((t) => ({ label: t, category: "focus" as const })),
  ];
  const creator = content.source_urls?.[0]?.creator;

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#fafcf9] p-8 lg:p-10
          shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)]
          transition-all duration-300 ease-out
          dark:bg-[#1E241E] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)]"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-3.5 text-[#3D6080]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3D6080]">
            Latest
          </span>
          <span className="text-[12px] text-[#9B9B8E]">
            {formatDate(content.published_at)}
          </span>
        </div>

        <h2
          className="font-heading font-bold leading-[1.1] tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2"
          style={{ fontSize: "clamp(1.35rem, 2vw + 0.4rem, 1.75rem)" }}
        >
          {content.title}
        </h2>

        <p className="mt-3 text-base leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3 max-w-[60ch]">
          {content.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {allTags.map((tag) => (
            <TagPill
              key={`${tag.category}-${tag.label}`}
              label={tag.label}
              category={tag.category}
            />
          ))}
          {creator && (
            <span className="text-[12px] text-[#9B9B8E]">
              via <span className="font-medium text-[#6E6E7E] dark:text-[#A8B0A6]">{creator}</span>
            </span>
          )}
        </div>
      </motion.article>
    </Link>
  );
}

function TimelineEntry({ content }: { content: Content }) {
  const topTag = content.tags_tool[0];

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.div
        className="flex gap-4 items-start"
        variants={itemVariants}
      >
        <div className="flex flex-col items-center shrink-0 pt-1.5">
          <div className="size-2.5 rounded-full bg-[#3D6080] dark:bg-[#6B9CC0]" />
          <div className="w-px flex-1 min-h-8 bg-[#dde4db] dark:bg-[#3A433A]" />
        </div>

        <article
          className="flex-1 rounded-xl px-5 py-4 -mt-1 mb-2
            group-hover:bg-[#eef5fa] dark:group-hover:bg-[#1a2530]
            transition-colors duration-200"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-medium text-[#3D6080] dark:text-[#6B9CC0]">
              {formatDateShort(content.published_at)}
            </span>
            {topTag && <TagPill label={topTag} category="tool" />}
          </div>

          <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
            {content.title}
          </h3>

          <p className="mt-1.5 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
            {content.summary}
          </p>
        </article>
      </motion.div>
    </Link>
  );
}

export function ToolsUpdatesLayout({ content }: { content: Content[] }) {
  if (content.length === 0) return null;

  const [featured, ...rest] = content;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <LatestUpdate content={featured} />

      {rest.length > 0 && (
        <motion.div className="max-w-2xl" variants={containerVariants}>
          {rest.map((item) => (
            <TimelineEntry key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
