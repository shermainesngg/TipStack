"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bug, CheckCircle2 } from "lucide-react";
import { TagPill } from "@/components/tag-pill";
import { getArticleUrl } from "@/lib/categories";
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

function extractProblemSolution(body: string): {
  problem: string | null;
  solution: string | null;
} {
  const sections = body.split(/^##\s+/m);
  if (sections.length < 2)
    return { problem: null, solution: null };

  const problemSection = sections.find((s) =>
    /^(the\s+)?problem|issue|bug|challenge/i.test(s.trim())
  );
  const solutionSection = sections.find((s) =>
    /^(the\s+)?solution|fix|approach|resolution/i.test(s.trim())
  );

  const extractFirst = (section: string | undefined) => {
    if (!section) return null;
    const lines = section.split("\n").filter((l) => l.trim());
    return lines.slice(1, 3).join(" ").trim().slice(0, 180) || null;
  };

  return {
    problem: extractFirst(problemSection),
    solution: extractFirst(solutionSection),
  };
}

function FeaturedDiagnostic({ content }: { content: Content }) {
  const { problem, solution } = extractProblemSolution(content.body);
  const topTags = content.tags_tool
    .slice(0, 2)
    .map((t) => ({ label: t, category: "tool" as const }));

  return (
    <Link href={getArticleUrl(content.tags_category, content.slug)} className="block group">
      <motion.article
        className="rounded-2xl overflow-hidden
          shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)]
          transition-all duration-300 ease-out
          dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)]"
        variants={itemVariants}
      >
        <div className="bg-[#faf0ef] dark:bg-[#2e1e1c] p-8 lg:p-10">
          <div className="flex items-center gap-2 mb-3">
            <Bug className="size-3.5 text-[#8B4A4A]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B4A4A]">
              Problem
            </span>
          </div>
          <h2
            className="font-heading font-bold leading-[1.1] tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2"
            style={{ fontSize: "clamp(1.35rem, 2vw + 0.4rem, 1.75rem)" }}
          >
            {content.title}
          </h2>
          {problem && (
            <p className="mt-3 text-[15px] leading-[1.7] text-[#6E4A4A] dark:text-[#E5A097] line-clamp-2 max-w-[55ch]">
              {problem}
            </p>
          )}
        </div>

        <div className="bg-[#f0f8f2] dark:bg-[#1a2b1e] px-8 lg:px-10 py-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-3.5 text-[#2D6040]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2D6040]">
              Solution
            </span>
          </div>
          {solution ? (
            <p className="text-[15px] leading-[1.7] text-[#2D5040] dark:text-[#7EBE8E] line-clamp-2 max-w-[55ch]">
              {solution}
            </p>
          ) : (
            <p className="text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2 max-w-[55ch]">
              {content.summary}
            </p>
          )}

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
      </motion.article>
    </Link>
  );
}

function DiagnosticCard({ content }: { content: Content }) {
  const topTag = content.tags_tool[0];
  const isQuickTip = content.content_type === "quick_tip";

  return (
    <Link href={getArticleUrl(content.tags_category, content.slug)} className="block group">
      <motion.article
        className="rounded-2xl overflow-hidden h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="bg-[#faf0ef] dark:bg-[#2e1e1c] px-5 pt-4 pb-3">
          <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
            {content.title}
          </h3>
        </div>
        <div className="bg-[#f0f8f2] dark:bg-[#1a2b1e] px-5 pt-3 pb-4 flex-1 flex flex-col">
          <p className="text-[13px] leading-[1.6] text-[#2D5040] dark:text-[#7EBE8E] line-clamp-2">
            {content.summary}
          </p>
          <div className="mt-auto pt-3 flex items-center gap-2">
            {isQuickTip && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2D6040] dark:text-[#7EBE8E]">
                Quick fix
              </span>
            )}
            {topTag && <TagPill label={topTag} category="tool" />}
            <span className="text-[11px] text-[#9B9B8E] ml-auto">
              {formatDate(content.published_at)}
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

export function DebuggingTestingLayout({
  content,
}: {
  content: Content[];
}) {
  if (content.length === 0) return null;

  const [featured, ...rest] = content;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <FeaturedDiagnostic content={featured} />

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {rest.map((item) => (
            <DiagnosticCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
