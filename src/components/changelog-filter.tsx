"use client";

import { useState } from "react";
import type { ChangelogEntry, ChangelogUrgency } from "@/types";
import { ChangelogTimelineEntry } from "./changelog-entry-card";

const FILTERS: { key: ChangelogUrgency | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "breaking", label: "Breaking" },
  { key: "important", label: "Important" },
  { key: "informational", label: "Informational" },
];

function groupByMonth(entries: ChangelogEntry[]): { label: string; entries: ChangelogEntry[] }[] {
  const groups: Record<string, ChangelogEntry[]> = {};

  for (const entry of entries) {
    const date = new Date(entry.published_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, entries]) => {
      const date = new Date(entries[0].published_at);
      return {
        label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        entries,
      };
    });
}

export function ChangelogTimeline({ entries }: { entries: ChangelogEntry[] }) {
  const [activeFilter, setActiveFilter] = useState<ChangelogUrgency | "all">("all");

  const filtered = activeFilter === "all"
    ? entries
    : entries.filter((e) => e.urgency === activeFilter);

  const months = groupByMonth(filtered);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-10">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150 ${
              activeFilter === f.key
                ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#1A1A2E]"
                : "text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {months.length === 0 ? (
        <p className="text-[#9B9B8E] text-[15px] py-12">
          No changelog entries match this filter.
        </p>
      ) : (
        <div className="space-y-8">
          {months.map((month) => (
            <section key={month.label}>
              {/* Month header */}
              <div className="relative pl-8 ml-[5px] mb-4">
                <div className="absolute -left-[10px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#dde4db] dark:bg-[#2A322A] flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-[#9B9B8E] dark:bg-[#A8B0A6]" />
                </div>
                <h2 className="font-heading font-bold text-[14px] uppercase tracking-[0.1em] text-[#9B9B8E] dark:text-[#A8B0A6]">
                  {month.label}
                </h2>
              </div>

              {/* Entries with continuous timeline line */}
              <div className="relative border-l-[2px] border-[#dde4db] dark:border-[#2A322A] ml-[5px]">
                {month.entries.map((entry) => (
                  <ChangelogTimelineEntry key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
