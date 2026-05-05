"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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

function FeaturedSkill({ content }: { content: Content }) {
  const topTags = content.tags_tool
    .slice(0, 3)
    .map((t) => ({ label: t, category: "tool" as const }));

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#faf8fd] p-8 lg:p-10
          shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)]
          transition-all duration-300 ease-out
          dark:bg-[#1E1A28] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)]"
        variants={itemVariants}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-3.5 text-[#5E3F96]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5E3F96]">
            Featured Skill
          </span>
        </div>

        <h2
          className="font-heading font-bold leading-[1.1] tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-3"
          style={{ fontSize: "clamp(1.35rem, 2vw + 0.4rem, 1.75rem)" }}
        >
          {content.title}
        </h2>

        <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3 max-w-[60ch]">
          {content.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {topTags.map((tag) => (
            <TagPill key={tag.label} label={tag.label} category={tag.category} />
          ))}
          <span className="text-[12px] text-[#9B9B8E]">
            {content.source_urls?.[0]?.creator}
            {content.published_at && (
              <>
                <span className="mx-1 opacity-40">/</span>
                {formatDate(content.published_at)}
              </>
            )}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

function SkillCard({ content }: { content: Content }) {
  const topTags = content.tags_tool
    .slice(0, 2)
    .map((t) => ({ label: t, category: "tool" as const }));

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#f3eff8] dark:bg-[#221e2e] p-5 h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-3 text-[#5E3F96]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5E3F96] dark:text-[#B89DD4]">
            Skill
          </span>
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <div className="mt-auto pt-3 flex flex-wrap items-center gap-2">
          {topTags.map((tag) => (
            <TagPill key={tag.label} label={tag.label} category={tag.category} />
          ))}
          <span className="text-[11px] text-[#9B9B8E]">
            {formatDate(content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

export function GithubSkillsLayout({ content }: { content: Content[] }) {
  if (content.length === 0) return null;

  const [featured, ...rest] = content;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <FeaturedSkill content={featured} />

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {rest.map((item) => (
            <SkillCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
