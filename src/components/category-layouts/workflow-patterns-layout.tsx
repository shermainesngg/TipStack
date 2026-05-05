"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Workflow } from "lucide-react";
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

function extractSteps(body: string): string[] {
  const headings = body.match(/^##\s+(.+)$/gm);
  if (!headings) return [];
  return headings.map((h) => h.replace(/^##\s+/, "")).slice(0, 6);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function FeaturedWorkflow({ content }: { content: Content }) {
  const steps = extractSteps(content.body);
  const topTags = content.tags_tool
    .slice(0, 2)
    .map((t) => ({ label: t, category: "tool" as const }));
  const creator = content.source_urls?.[0]?.creator;

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#f7fafd] p-8 lg:p-10
          shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)]
          transition-all duration-300 ease-out
          dark:bg-[#1A2028] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)]"
        variants={itemVariants}
      >
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {steps.length > 0 && (
            <div className="lg:w-2/5 shrink-0">
              <div className="space-y-0">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="size-6 rounded-full bg-[#eef5fa] dark:bg-[#1A2A3D] flex items-center justify-center text-[11px] font-semibold text-[#3D6080] dark:text-[#8DB8D4]">
                        {i + 1}
                      </div>
                      {i < steps.length - 1 && (
                        <div className="w-px h-4 bg-[#dde4eb] dark:bg-[#2A3A4A] mt-1" />
                      )}
                    </div>
                    <span className="text-[13px] text-[#3D3D50] dark:text-[#C8D0C6] leading-snug pt-0.5">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={steps.length > 0 ? "lg:w-3/5" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <Workflow className="size-3.5 text-[#3D6080]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3D6080]">
                Featured Workflow
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
                <TagPill key={tag.label} label={tag.label} category={tag.category} />
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
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function WorkflowCard({ content }: { content: Content }) {
  const stepCount = content.body.match(/^##\s/gm)?.length ?? 0;
  const topTag = content.tags_tool[0];
  const creator = content.source_urls?.[0]?.creator;

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <motion.article
        className="rounded-2xl bg-[#eef5fa] dark:bg-[#1a2530] p-5 h-full flex flex-col
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          transition-shadow duration-300 ease-out"
        variants={itemVariants}
        whileHover={{ y: -3, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Workflow className="size-3 text-[#3D6080]" />
          {stepCount > 0 && (
            <span className="text-[11px] font-medium text-[#3D6080] dark:text-[#8DB8D4]">
              {stepCount} steps
            </span>
          )}
        </div>

        <h3 className="font-heading font-semibold text-[15px] leading-snug text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2">
          {content.title}
        </h3>

        <p className="mt-2 text-[13px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <div className="mt-auto pt-3 flex items-center gap-2">
          {topTag && <TagPill label={topTag} category="tool" />}
          <span className="text-[11px] text-[#9B9B8E]">
            {creator ?? formatDate(content.published_at)}
          </span>
        </div>
      </motion.article>
    </Link>
  );
}

export function WorkflowPatternsLayout({ content }: { content: Content[] }) {
  if (content.length === 0) return null;

  const [featured, ...rest] = content;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <FeaturedWorkflow content={featured} />

      {rest.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={containerVariants}
        >
          {rest.map((item) => (
            <WorkflowCard key={item.id} content={item} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
