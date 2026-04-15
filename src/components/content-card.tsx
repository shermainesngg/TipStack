import Link from "next/link";
import type { Content } from "@/types";
import { TagPill } from "./tag-pill";
import { Sparkles } from "lucide-react";

/** Pastel accent colors for card left border */
const WORKFLOW_COLORS: Record<string, string> = {
  coding: "bg-[#8ECDA0]",
  "code-generation": "bg-[#8ECDA0]",
  refactoring: "bg-[#7BC4A0]",
  "code-review": "bg-[#A8D4E6]",
  automation: "bg-[#C5B3E6]",
  pipeline: "bg-[#C5B3E6]",
  "content-curation": "bg-[#D4A8D4]",
  writing: "bg-[#F5B0AA]",
  research: "bg-[#F5D98C]",
  debugging: "bg-[#F5B0AA]",
  design: "bg-[#F5C4D0]",
  testing: "bg-[#A8D4E6]",
  "developer-experience": "bg-[#A8C8F0]",
  "team-workflow": "bg-[#F5D0A0]",
  "stakeholder-communication": "bg-[#F5D0A0]",
};

function getAccentColor(workflows: string[]): string {
  for (const w of workflows) {
    if (WORKFLOW_COLORS[w]) return WORKFLOW_COLORS[w];
  }
  return "bg-[#C5B3E6]";
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
  const accentColor = getAccentColor(content.tags_workflow);
  const allTags = [
    ...content.tags_tool.map((t) => ({ label: t, category: "tool" as const })),
    ...content.tags_focus.map((t) => ({ label: t, category: "focus" as const })),
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
          className="relative rounded-2xl bg-white p-6 lg:p-8
            shadow-[0_2px_12px_rgba(0,0,0,0.06)]
            group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]
            transition-all duration-200
            dark:bg-[#1E241E] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]
            dark:group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
        >
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FADCD9]">
              <Sparkles className="h-6 w-6 text-[#994D4D]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#994D4D]">
                  Latest
                </span>
                {platform && (
                  <span className="text-xs text-[#A0A8B0]">
                    from {platform === "youtube" ? "YouTube" : "Reddit"}
                  </span>
                )}
              </div>

              <h2 className="mt-1.5 text-xl lg:text-2xl font-bold leading-snug text-[#1A1A2E] font-heading dark:text-[#EDF2EC] line-clamp-2">
                {content.title}
              </h2>

              <p className="mt-2 text-[15px] leading-relaxed text-[#7C8590] line-clamp-3">
                {content.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-[#A0A8B0]">
                  {creator && (
                    <>
                      <span className="font-medium text-[#7C8590]">
                        @{creator}
                      </span>
                      <span className="mx-1.5">&middot;</span>
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
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/content/${content.slug}`} className="block group">
      <article
        className="relative rounded-2xl bg-white p-5
          shadow-[0_2px_12px_rgba(0,0,0,0.06)]
          group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)]
          group-hover:-translate-y-0.5 transition-all duration-200
          dark:bg-[#1E241E] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)]
          dark:group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
      >
        <div
          className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${accentColor}`}
        />
        <div className="pl-3">
          <p className="text-[13px] font-medium text-[#A0A8B0]">
            {content.tags_workflow[0]?.replace(/_/g, " ").toUpperCase()}
          </p>

          <h2 className="mt-1.5 text-[18px] font-semibold leading-snug text-[#1A1A2E] line-clamp-2 font-heading dark:text-[#EDF2EC]">
            {content.title}
          </h2>

          <p className="mt-2 text-[15px] leading-relaxed text-[#7C8590] line-clamp-2">
            {content.summary}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[13px] text-[#A0A8B0]">
              {creator && (
                <>
                  <span>@{creator}</span>
                  <span className="mx-1.5">&middot;</span>
                </>
              )}
              {formatDate(content.published_at)}
            </p>

            <div className="flex gap-1.5">
              {visibleTags.map((tag) => (
                <TagPill
                  key={`${tag.category}-${tag.label}`}
                  label={tag.label}
                  category={tag.category}
                />
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
