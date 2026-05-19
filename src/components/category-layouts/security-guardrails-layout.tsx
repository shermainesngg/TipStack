"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, CheckCircle2 } from "lucide-react";
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

function extractChecklist(body: string): string[] {
  const items = body.match(/^[-*]\s+\*\*(.+?)\*\*/gm);
  if (!items) return [];
  return items.map((i) => i.replace(/^[-*]\s+\*\*/, "").replace(/\*\*$/, "")).slice(0, 5);
}

function FeaturedGuardrail({ content }: { content: Content }) {
  const checklist = extractChecklist(content.body);
  const topTags = content.tags_tool
    .slice(0, 2)
    .map((t) => ({ label: t, category: "tool" as const }));

  return (
    <Link href={getArticleUrl(content.tags_category, content.slug)} className="block group">
      <motion.article
        className="rounded-2xl bg-[#fdfaf9] p-8 lg:p-10
          shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)]
          transition-all duration-300 ease-out
          dark:bg-[#241E1C] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)]"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {checklist.length > 0 && (
            <div className="lg:w-2/5 shrink-0 space-y-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="size-4 text-[#8B4A4A] dark:text-[#E5A097] shrink-0 mt-0.5" />
                  <span className="text-[13px] text-[#3D3D50] dark:text-[#C8D0C6] leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={checklist.length > 0 ? "lg:w-3/5" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="size-3.5 text-[#8B4A4A]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B4A4A]">
                Security Guide
              </span>
            </div>

            <h2
              className="font-heading font-bold leading-[1.1] tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-3 title-clamp"
              style={{ fontSize: "clamp(1.35rem, 2vw + 0.4rem, 1.75rem)" }}
              title={content.title}
            >
              {content.title}
            </h2>

            <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3 max-w-[50ch]">
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
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function GuardrailCard({ content }: { content: Content }) {
  const topTag = content.tags_tool[0];

  return (
    <Link href={getArticleUrl(content.tags_category, content.slug)} className="block group">
      <motion.article
        className="rounded-2xl bg-[#faf0ef] dark:bg-[#2e1e1c] p-5 h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="size-3 text-[#8B4A4A]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B4A4A] dark:text-[#E5A097]">
            {content.content_type === "quick_tip" ? "Quick tip" : "Guardrail"}
          </span>
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2 title-clamp" title={content.title}>
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

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

export function SecurityGuardrailsLayout({ content }: { content: Content[] }) {
  if (content.length === 0) return null;

  const [featured, ...rest] = content;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <FeaturedGuardrail content={featured} />

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
        >
          {rest.map((item) => (
            <GuardrailCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
