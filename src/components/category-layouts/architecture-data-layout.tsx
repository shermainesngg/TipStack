"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
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

function FeaturedPattern({ content }: { content: Content }) {
  const domainTags = content.tags_domain.slice(0, 3).map((t) => ({
    label: t,
    category: "domain" as const,
  }));
  const toolTags = content.tags_tool.slice(0, 2).map((t) => ({
    label: t,
    category: "tool" as const,
  }));
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
          <Layers className="size-3.5 text-[#4A5A8B]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4A5A8B]">
            Architecture Pattern
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
          {domainTags.map((tag) => (
            <TagPill
              key={tag.label}
              label={tag.label}
              category={tag.category}
            />
          ))}
          {toolTags.map((tag) => (
            <TagPill
              key={tag.label}
              label={tag.label}
              category={tag.category}
            />
          ))}
          <span className="text-[12px] text-[#9B9B8E]">
            {creator}
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

function PatternCard({ content }: { content: Content }) {
  const domainTags = content.tags_domain.slice(0, 2).map((t) => ({
    label: t,
    category: "domain" as const,
  }));
  const topTool = content.tags_tool[0];
  const creator = content.source_urls?.[0]?.creator;

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#eff2fa] dark:bg-[#1c2030] p-5 h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex flex-wrap gap-1.5 mb-3">
          {domainTags.map((tag) => (
            <TagPill
              key={tag.label}
              label={tag.label}
              category={tag.category}
            />
          ))}
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <div className="mt-auto pt-3 flex items-center gap-2">
          {topTool && <TagPill label={topTool} category="tool" />}
          <span className="text-[11px] text-[#9B9B8E]">
            {creator ?? formatDate(content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

export function ArchitectureDataLayout({
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
      <FeaturedPattern content={featured} />

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={containerVariants}
        >
          {rest.map((item) => (
            <PatternCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
