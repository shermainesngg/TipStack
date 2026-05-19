import type { ChangelogEntry, ChangeCategory } from "@/types";

const CATEGORY_STYLE: Record<ChangeCategory, { dot: string; ring: string; bg: string; text: string; label: string }> = {
  new_feature: {
    dot: "bg-[#4A7C59] dark:bg-[#7BC48A]",
    ring: "ring-[#d4e8d9] dark:ring-[#1E3226]",
    bg: "bg-[#D4E8D9] dark:bg-[#1E3226]",
    text: "text-[#2E5E3A] dark:text-[#7BC48A]",
    label: "New",
  },
  improvement: {
    dot: "bg-[#3A6B8C] dark:bg-[#6BAED6]",
    ring: "ring-[#d0e2ef] dark:ring-[#1A2E3D]",
    bg: "bg-[#D0E2EF] dark:bg-[#1A2E3D]",
    text: "text-[#2A5470] dark:text-[#6BAED6]",
    label: "Improved",
  },
  breaking_change: {
    dot: "bg-[#8B4A4A] dark:bg-[#E5A097]",
    ring: "ring-[#f0dbd8] dark:ring-[#3D2424]",
    bg: "bg-[#F2C4B8] dark:bg-[#3D2020]",
    text: "text-[#6E2B2B] dark:text-[#E8A89E]",
    label: "Breaking",
  },
  bug_fix: {
    dot: "bg-[#7B6230] dark:bg-[#D4B875]",
    ring: "ring-[#f0e8d4] dark:ring-[#2E2818]",
    bg: "bg-[#ECCF90] dark:bg-[#2E2510]",
    text: "text-[#5E4515] dark:text-[#D4B060]",
    label: "Fix",
  },
  deprecation: {
    dot: "bg-[#6E6E7E] dark:bg-[#A8B0A6]",
    ring: "ring-[#dde4db] dark:ring-[#2A322A]",
    bg: "bg-[#CDD5CA] dark:bg-[#2A322A]",
    text: "text-[#3A423A] dark:text-[#C8D0C6]",
    label: "Deprecated",
  },
  performance: {
    dot: "bg-[#7B61A6] dark:bg-[#C5B3E6]",
    ring: "ring-[#e0d6f0] dark:ring-[#2A2040]",
    bg: "bg-[#E0D6F0] dark:bg-[#2A2040]",
    text: "text-[#5A4080] dark:text-[#C5B3E6]",
    label: "Perf",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function highestPriorityCategory(entry: ChangelogEntry): ChangeCategory {
  const priority: ChangeCategory[] = ["breaking_change", "new_feature", "deprecation", "improvement", "bug_fix", "performance"];
  for (const cat of priority) {
    if (entry.changes.some((c) => c.category === cat)) return cat;
  }
  return "improvement";
}

export function ChangelogTimelineEntry({ entry }: { entry: ChangelogEntry }) {
  const topCategory = highestPriorityCategory(entry);
  const dot = CATEGORY_STYLE[topCategory];
  const allTools = [...new Set(entry.changes.flatMap((c) => c.affected_tools))];

  return (
    <div className="relative pl-8 pb-8 group">
      <div
        className={`absolute -left-[7px] top-[5px] z-10 h-3 w-3 rounded-full ${dot.dot} ring-[3px] ${dot.ring} transition-transform duration-200 group-hover:scale-125`}
      />

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[#9B9B8E] font-medium tabular-nums">
            {formatDate(entry.published_at)}
          </span>
          {entry.version && (
            <span className="text-[12px] font-mono font-medium text-[#5A5A6E] dark:text-[#A8B0A6]">
              {entry.version}
            </span>
          )}
        </div>

        <h3 className="font-heading font-semibold text-[16px] text-[#1A1A2E] dark:text-[#EDF2EC] leading-snug">
          {entry.headline || entry.title}
        </h3>

        {entry.changes.length > 0 && (
          <ul className="space-y-1.5 text-[14px] text-[#5A5A6E] dark:text-[#A8B0A6] leading-relaxed max-w-[55ch]">
            {entry.changes.map((change) => {
              const style = CATEGORY_STYLE[change.category];
              return (
                <li key={change.id} className="flex items-start gap-2">
                  <span
                    className={`shrink-0 mt-[5px] text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-px rounded-full ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                  <span>{change.description}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {allTools.map((tool) => (
            <span
              key={tool}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#D8BFD2] text-[#582848] dark:bg-[#2E1828] dark:text-[#C898B8]"
            >
              {tool.replace(/_/g, " ")}
            </span>
          ))}
          <a
            href={entry.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-medium text-[#6B47A8] dark:text-[#C5B3E6] underline underline-offset-2 decoration-[#6B47A8]/30 hover:decoration-[#6B47A8] transition-colors"
          >
            source ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export { CATEGORY_STYLE };
