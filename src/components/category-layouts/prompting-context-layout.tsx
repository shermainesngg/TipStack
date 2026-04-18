"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquareCode } from "lucide-react";
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

function extractPrompt(body: string, maxLines = 6): string | null {
  const blockMatch = body.match(/```[\w]*\n([\s\S]*?)```/);
  if (blockMatch) {
    return blockMatch[1].trim().split("\n").slice(0, maxLines).join("\n");
  }
  const quoteMatch = body.match(/^>\s+(.+(?:\n>\s+.+)*)/m);
  if (quoteMatch) {
    return quoteMatch[0]
      .split("\n")
      .map((l) => l.replace(/^>\s*/, ""))
      .slice(0, maxLines)
      .join("\n");
  }
  return null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function FeaturedPrompt({ content }: { content: Content }) {
  const prompt = extractPrompt(content.body, 8);
  const topTags = [
    ...content.tags_tool.slice(0, 1).map((t) => ({ label: t, category: "tool" as const })),
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
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareCode className="size-3.5 text-[#7B6230]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7B6230]">
            Featured Prompt
          </span>
        </div>

        {prompt && (
          <div className="rounded-xl bg-[#f9f5ec] dark:bg-[#2a261a] p-5 mb-5">
            <pre className="text-[13px] leading-[1.65] text-[#5A4A30] dark:text-[#D4B875] font-mono whitespace-pre-wrap">
              {prompt}
            </pre>
          </div>
        )}

        <h2
          className="font-heading font-bold leading-[1.1] tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2"
          style={{ fontSize: "clamp(1.35rem, 2vw + 0.4rem, 1.75rem)" }}
        >
          {content.title}
        </h2>

        <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3 max-w-[55ch]">
          {content.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {topTags.map((tag) => (
            <TagPill
              key={`${tag.category}-${tag.label}`}
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
      </motion.article>
    </Link>
  );
}

function PromptTemplateCard({ content }: { content: Content }) {
  const prompt = extractPrompt(content.body, 3);
  const topTag = content.tags_tool[0] || content.tags_focus[0];
  const tagCategory = content.tags_tool[0] ? ("tool" as const) : ("focus" as const);

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#f9f5ec] dark:bg-[#2a261a] p-5 h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        {prompt && (
          <div className="rounded-lg bg-[#f0e8d4] dark:bg-[#2E2818] p-3 mb-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
            <pre className="text-[11px] leading-[1.5] text-[#5A4A30] dark:text-[#D4B875] font-mono whitespace-pre-wrap line-clamp-3">
              {prompt}
            </pre>
          </div>
        )}

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <div className="mt-auto pt-3 flex items-center gap-2">
          {topTag && <TagPill label={topTag} category={tagCategory} />}
          <span className="text-[11px] text-[#9B9B8E]">
            {formatDate(content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

export function PromptingContextLayout({
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
      <FeaturedPrompt content={featured} />

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {rest.map((item) => (
            <PromptTemplateCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
