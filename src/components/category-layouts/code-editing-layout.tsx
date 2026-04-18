"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
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

function extractCodeSnippet(body: string, maxLines = 5): string | null {
  const match = body.match(/```[\w]*\n([\s\S]*?)```/);
  if (!match) return null;
  return match[1].trim().split("\n").slice(0, maxLines).join("\n");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function FeaturedTechnique({ content }: { content: Content }) {
  const snippet = extractCodeSnippet(content.body, 8);
  const topTags = content.tags_tool
    .slice(0, 2)
    .map((t) => ({ label: t, category: "tool" as const }));

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
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {snippet && (
            <div className="lg:w-1/2 shrink-0">
              <pre className="rounded-xl bg-[#1A1A2E] p-5 text-[13px] leading-[1.6] text-[#d4dbd2] font-mono overflow-hidden">
                <code>{snippet}</code>
              </pre>
            </div>
          )}

          <div className={snippet ? "lg:w-1/2" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="size-3.5 text-[#2D6040]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2D6040]">
                Featured Technique
              </span>
            </div>

            <h2
              className="font-heading font-bold leading-[1.1] tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-3"
              style={{ fontSize: "clamp(1.35rem, 2vw + 0.4rem, 1.75rem)" }}
            >
              {content.title}
            </h2>

            <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3 max-w-[50ch]">
              {content.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {topTags.map((tag) => (
                <TagPill
                  key={tag.label}
                  label={tag.label}
                  category={tag.category}
                />
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
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function TechniqueCard({ content }: { content: Content }) {
  const snippet = extractCodeSnippet(content.body, 4);
  const topTag = content.tags_tool[0];

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#f0f8f2] dark:bg-[#1a2b1e] p-5
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out h-full flex flex-col"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        {snippet && (
          <pre className="rounded-lg bg-[#1A1A2E] p-3.5 text-[11px] leading-[1.5] text-[#d4dbd2] font-mono overflow-hidden mb-4">
            <code>{snippet}</code>
          </pre>
        )}

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <div className="mt-auto pt-3 flex items-center gap-2">
          {topTag && <TagPill label={topTag} category="tool" />}
          <span className="text-[11px] text-[#9B9B8E]">
            {formatDate(content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

function QuickTechniqueRow({ content }: { content: Content }) {
  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="flex items-center gap-3 rounded-xl px-4 py-3 bg-[#fafcfa] dark:bg-[#1E241E]
          group-hover:bg-[#f0f8f2] dark:group-hover:bg-[#1a2b1e] transition-colors duration-200"
        variants={itemVariants}
      >
        <Code2 className="size-3.5 text-[#2D6040] shrink-0" />
        <h3 className="flex-1 min-w-0 text-[14px] font-heading font-medium text-[#1A1A2E] dark:text-[#EDF2EC] truncate">
          {content.title}
        </h3>
        <span className="text-[11px] text-[#9B9B8E] shrink-0">
          {formatDate(content.published_at)}
        </span>
      </motion.article>
    </Link>
  );
}

export function CodeEditingLayout({ content }: { content: Content[] }) {
  if (content.length === 0) return null;

  const [featured, ...rest] = content;
  const quickTips = rest.filter((c) => c.content_type === "quick_tip");
  const others = rest.filter((c) => c.content_type !== "quick_tip");

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <FeaturedTechnique content={featured} />

      {others.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {others.map((item) => (
            <TechniqueCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}

      {quickTips.length > 0 && (
        <motion.div className="space-y-1" variants={containerVariants}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B9B8E] mb-3 px-1">
            Quick Techniques
          </p>
          {quickTips.map((item) => (
            <QuickTechniqueRow key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
