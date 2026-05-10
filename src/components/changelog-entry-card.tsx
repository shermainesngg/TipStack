import type { ChangelogEntry, ChangelogUrgency } from "@/types";

const URGENCY_DOT: Record<ChangelogUrgency, { color: string; ring: string }> = {
  breaking: {
    color: "bg-[#8B4A4A] dark:bg-[#E5A097]",
    ring: "ring-[#f0dbd8] dark:ring-[#3D2424]",
  },
  important: {
    color: "bg-[#7B6230] dark:bg-[#D4B875]",
    ring: "ring-[#f0e8d4] dark:ring-[#2E2818]",
  },
  informational: {
    color: "bg-[#6E6E7E] dark:bg-[#A8B0A6]",
    ring: "ring-[#dde4db] dark:ring-[#2A322A]",
  },
};

const URGENCY_LABEL: Record<ChangelogUrgency, { bg: string; text: string; label: string }> = {
  breaking: {
    bg: "bg-[#f0dbd8] dark:bg-[#3D2424]",
    text: "text-[#8B4A4A] dark:text-[#E5A097]",
    label: "Breaking",
  },
  important: {
    bg: "bg-[#f0e8d4] dark:bg-[#2E2818]",
    text: "text-[#7B6230] dark:text-[#D4B875]",
    label: "Important",
  },
  informational: {
    bg: "bg-[#dde4db] dark:bg-[#2A322A]",
    text: "text-[#6E6E7E] dark:text-[#A8B0A6]",
    label: "Info",
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ChangelogTimelineEntry({ entry }: { entry: ChangelogEntry }) {
  const dot = URGENCY_DOT[entry.urgency];
  const label = URGENCY_LABEL[entry.urgency];

  return (
    <div className="relative pl-8 pb-8 group">
      {/* Timeline dot — centered on the 2px border-l line at ml-[5px] */}
      <div
        className={`absolute -left-[7px] top-[5px] z-10 h-3 w-3 rounded-full ${dot.color} ring-[3px] ${dot.ring} transition-transform duration-200 group-hover:scale-125`}
      />

      {/* Content */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[#9B9B8E] font-medium tabular-nums">
            {formatDate(entry.published_at)}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-md ${label.bg} ${label.text}`}
          >
            {label.label}
          </span>
          {entry.version && (
            <span className="text-[12px] font-mono font-medium text-[#5A5A6E] dark:text-[#A8B0A6]">
              {entry.version}
            </span>
          )}
        </div>

        <h3 className="font-heading font-semibold text-[16px] text-[#1A1A2E] dark:text-[#EDF2EC] leading-snug">
          {entry.title}
        </h3>

        <p className="text-[14.5px] text-[#5A5A6E] dark:text-[#A8B0A6] leading-relaxed max-w-[55ch]">
          {entry.summary}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {entry.affected_tools.map((tool) => (
            <span
              key={tool}
              className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-md bg-[#e0d8ef] text-[#5E3F96] dark:bg-[#2A1F3D] dark:text-[#B89DD4]"
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
