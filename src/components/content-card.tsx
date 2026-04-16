import Link from "next/link";
import type { Content } from "@/types";
import { TagPill } from "./tag-pill";

/** Tinted background colors keyed by workflow — used as a subtle full-card wash */
const WORKFLOW_TINTS: Record<string, string> = {
  coding: "bg-[#f0f8f2] dark:bg-[#1a2b1e]",
  "code-generation": "bg-[#f0f8f2] dark:bg-[#1a2b1e]",
  refactoring: "bg-[#eef7f2] dark:bg-[#1a2b1e]",
  "code-review": "bg-[#eef5fa] dark:bg-[#1a2530]",
  automation: "bg-[#f3eff8] dark:bg-[#221e2e]",
  pipeline: "bg-[#f3eff8] dark:bg-[#221e2e]",
  "content-curation": "bg-[#f5eff5] dark:bg-[#261e26]",
  writing: "bg-[#faf0ef] dark:bg-[#2e1e1c]",
  research: "bg-[#f9f5ec] dark:bg-[#2a261a]",
  debugging: "bg-[#faf0ef] dark:bg-[#2e1e1c]",
  design: "bg-[#f9f0f3] dark:bg-[#2e1c22]",
  testing: "bg-[#eef5fa] dark:bg-[#1a2530]",
  "developer-experience": "bg-[#eff2fa] dark:bg-[#1c2030]",
  "team-workflow": "bg-[#f8f2ec] dark:bg-[#2a221a]",
  "stakeholder-communication": "bg-[#f8f2ec] dark:bg-[#2a221a]",
};

function getTintClass(workflows: string[]): string {
  for (const w of workflows) {
    if (WORKFLOW_TINTS[w]) return WORKFLOW_TINTS[w];
  }
  return "bg-[#f3eff8] dark:bg-[#221e2e]";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContentCard({
  content,
  featured = false,
}: {
  content: Content;
  featured?: boolean;
}) {
  const tintClass = getTintClass(content.tags_workflow);
  const allTags = [
    ...content.tags_tool.map((t) => ({ label: t, category: "tool" as const })),
    ...content.tags_focus.map((t) => ({
      label: t,
      category: "focus" as const,
    })),
    ...content.tags_workflow.map((t) => ({
      label: t,
      category: "workflow" as const,
    })),
  ];
  const visibleTags = featured ? allTags.slice(0, 5) : allTags.slice(0, 3);

  const creator = content.source_urls?.[0]?.creator;
  const platform = content.source_urls?.[0]?.platform;

  if (featured) {
    return (
      <Link href={`/content/${content.slug}`} className="block group">
        <article
          className="relative rounded-2xl bg-[#fafcf9] p-8 lg:p-10
            shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_20px_rgba(0,0,0,0.05)]
            group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)]
            transition-all duration-300 ease-out
            dark:bg-[#1E241E] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8B6E4E]">
              Latest
            </span>
            {platform && (
              <span className="text-[12px] text-[#9B9B8E]">
                via {platform === "youtube" ? "YouTube" : "Reddit"}
              </span>
            )}
          </div>

          <h2
            className="font-heading leading-[1.1] tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] line-clamp-2"
            style={{ fontSize: "clamp(1.5rem, 2vw + 0.5rem, 2rem)" }}
          >
            {content.title}
          </h2>

          <p className="mt-4 text-base leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-3 max-w-[60ch]">
            {content.summary}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-[13px] text-[#9B9B8E]">
              {creator && (
                <>
                  <span className="font-medium text-[#5A5A6E] dark:text-[#A8B0A6]">
                    {creator}
                  </span>
                  <span className="mx-1.5 opacity-40">/</span>
                </>
              )}
              {formatDate(content.published_at)}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((tag) => (
                <TagPill
                  key={`${tag.category}-${tag.label}`}
                  label={tag.label}
                  category={tag.category}
                />
              ))}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <article
        className={`relative rounded-2xl p-5
          ${tintClass}
          group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
          group-hover:-translate-y-0.5 transition-all duration-300 ease-out`}
      >
        <div className="flex flex-wrap gap-1.5 mb-3">
          {visibleTags.map((tag) => (
            <TagPill
              key={`${tag.category}-${tag.label}`}
              label={tag.label}
              category={tag.category}
            />
          ))}
        </div>

        <h2 className="text-lg font-heading font-semibold leading-snug text-[#1A1A2E] line-clamp-2 dark:text-[#EDF2EC]">
          {content.title}
        </h2>

        <p className="mt-2 text-[15px] leading-[1.65] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
          {content.summary}
        </p>

        <p className="mt-3 text-[12px] text-[#9B9B8E] tracking-wide">
          {creator && (
            <>
              <span className="font-medium text-[#6E6E7E] dark:text-[#A8B0A6]">
                {creator}
              </span>
              <span className="mx-1.5 opacity-40">/</span>
            </>
          )}
          {formatDate(content.published_at)}
        </p>
      </article>
    </Link>
  );
}
