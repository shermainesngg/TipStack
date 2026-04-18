"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { TagPill } from "@/components/tag-pill";
import type { Content } from "@/types";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
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
  });
}

function estimateReadingTime(body: string): number {
  const words = body.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 230));
}

function extractLearningPoints(body: string): string[] {
  const listMatch = body.match(/^[-*]\s+(.+)$/gm);
  if (!listMatch) return [];
  return listMatch
    .slice(0, 4)
    .map((item) => item.replace(/^[-*]\s+/, "").replace(/\*\*/g, ""));
}

function FeaturedGuide({ content }: { content: Content }) {
  const readTime = estimateReadingTime(content.body);
  const learningPoints = extractLearningPoints(content.body);
  const creator = content.source_urls?.[0]?.creator;
  const allTags = [
    ...content.tags_tool.slice(0, 2).map((t) => ({ label: t, category: "tool" as const })),
    ...content.tags_focus.slice(0, 1).map((t) => ({ label: t, category: "focus" as const })),
  ];

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
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="size-3.5 text-[#8B4A6E]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B4A6E]">
            Guide
          </span>
          <span className="text-[12px] text-[#9B9B8E]">
            {readTime} min read
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

        {learningPoints.length > 0 && (
          <div className="mt-5 rounded-xl bg-[#f9f0f3] dark:bg-[#2e1c22] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B4A6E] dark:text-[#D4A0BD] mb-2">
              What you'll learn
            </p>
            <ul className="space-y-1.5">
              {learningPoints.map((point, i) => (
                <li
                  key={i}
                  className="text-[13px] leading-[1.5] text-[#5A3A4E] dark:text-[#C8A0B6] line-clamp-1"
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

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
              by{" "}
              <span className="font-medium text-[#6E6E7E] dark:text-[#A8B0A6]">
                {creator}
              </span>
            </span>
          )}
        </div>
      </motion.article>
    </Link>
  );
}

function GuideCard({ content }: { content: Content }) {
  const readTime = estimateReadingTime(content.body);
  const creator = content.source_urls?.[0]?.creator;
  const topTag = content.tags_tool[0] || content.tags_focus[0];
  const tagCategory = content.tags_tool[0] ? ("tool" as const) : ("focus" as const);
  const typeLabel =
    content.content_type === "deep_dive"
      ? "Deep Dive"
      : content.content_type === "roundup"
        ? "Roundup"
        : content.content_type === "quick_tip"
          ? "Quick Tip"
          : "Guide";

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#f9f0f3] dark:bg-[#2e1c22] p-5 h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B4A6E] dark:text-[#D4A0BD]">
            {typeLabel}
          </span>
          <span className="text-[11px] text-[#9B9B8E]">{readTime} min</span>
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <div className="mt-auto pt-3 flex items-center gap-2">
          {topTag && <TagPill label={topTag} category={tagCategory} />}
          {creator && (
            <span className="text-[11px] text-[#9B9B8E]">
              by{" "}
              <span className="font-medium text-[#6E6E7E] dark:text-[#A8B0A6]">
                {creator}
              </span>
            </span>
          )}
        </div>
      </motion.article>
    </Link>
  );
}

export function LearningPracticesLayout({
  content,
}: {
  content: Content[];
}) {
  if (content.length === 0) return null;

  const [featured, ...rest] = content;

  const deepDives = rest.filter((c) => c.content_type === "deep_dive");
  const roundups = rest.filter((c) => c.content_type === "roundup");
  const quickTips = rest.filter((c) => c.content_type === "quick_tip");
  const others = rest.filter(
    (c) =>
      c.content_type !== "deep_dive" &&
      c.content_type !== "roundup" &&
      c.content_type !== "quick_tip"
  );
  const grouped = [...deepDives, ...roundups, ...others, ...quickTips];

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <FeaturedGuide content={featured} />

      {grouped.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {grouped.map((item) => (
            <GuideCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
