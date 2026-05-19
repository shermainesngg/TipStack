"use client";

import { useState } from "react";
import type { ChangelogEntry, ChangeCategory } from "@/types";
import { ChangelogTimelineEntry } from "./changelog-entry-card";
import { DailyDigestCard } from "./daily-digest-card";

const FILTERS: { key: ChangeCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "breaking_change", label: "Breaking" },
  { key: "new_feature", label: "New" },
  { key: "improvement", label: "Improved" },
  { key: "bug_fix", label: "Fixes" },
  { key: "deprecation", label: "Deprecated" },
  { key: "performance", label: "Perf" },
];

interface DayGroup {
  date: string;
  label: string;
  entries: ChangelogEntry[];
}

interface MonthGroup {
  label: string;
  days: DayGroup[];
}

function filterEntries(entries: ChangelogEntry[], category: ChangeCategory | "all"): ChangelogEntry[] {
  if (category === "all") return entries;
  return entries
    .map((entry) => ({
      ...entry,
      changes: entry.changes.filter((c) => c.category === category),
    }))
    .filter((entry) => entry.changes.length > 0);
}

function groupByMonthAndDay(entries: ChangelogEntry[]): MonthGroup[] {
  const dayMap: Record<string, ChangelogEntry[]> = {};

  for (const entry of entries) {
    const date = new Date(entry.published_at);
    const dayKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    if (!dayMap[dayKey]) dayMap[dayKey] = [];
    dayMap[dayKey].push(entry);
  }

  const sortedDays = Object.entries(dayMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayEntries]): DayGroup => {
      const [y, m, d] = dayKey.split("-").map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return {
        date: dayKey,
        label: date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        }),
        entries: dayEntries,
      };
    });

  const monthMap: Record<string, DayGroup[]> = {};
  for (const day of sortedDays) {
    const monthKey = day.date.slice(0, 7);
    if (!monthMap[monthKey]) monthMap[monthKey] = [];
    monthMap[monthKey].push(day);
  }

  return Object.entries(monthMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, days]) => {
      const [y, m] = monthKey.split("-").map(Number);
      const date = new Date(Date.UTC(y, m - 1, 1));
      return {
        label: date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
        days,
      };
    });
}

export function ChangelogTimeline({ entries }: { entries: ChangelogEntry[] }) {
  const [activeFilter, setActiveFilter] = useState<ChangeCategory | "all">("all");

  const filtered = filterEntries(entries, activeFilter);
  const months = groupByMonthAndDay(filtered);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-10">
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
              <div className="relative pl-8 ml-[5px] mb-4">
                <div className="absolute -left-[10px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[#dde4db] dark:bg-[#2A322A] flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-[#9B9B8E] dark:bg-[#A8B0A6]" />
                </div>
                <h2 className="font-heading font-bold text-[14px] uppercase tracking-[0.1em] text-[#9B9B8E] dark:text-[#A8B0A6]">
                  {month.label}
                </h2>
              </div>

              <div className="relative border-l-[2px] border-[#dde4db] dark:border-[#2A322A] ml-[5px]">
                {month.days.map((day) => (
                  <div key={day.date} className="pb-6">
                    <div className="relative pl-8 pb-4">
                      <div className="absolute -left-[5px] top-[6px] z-10 h-2 w-2 rounded-full bg-[#9B9B8E] dark:bg-[#A8B0A6]" />
                      <h3 className="font-heading font-semibold text-[13px] text-[#5A5A6E] dark:text-[#A8B0A6]">
                        {day.label}
                      </h3>
                    </div>

                    {activeFilter === "all" && (
                      <div className="pl-8">
                        <DailyDigestCard date={day.date} />
                      </div>
                    )}

                    {day.entries.map((entry) => (
                      <ChangelogTimelineEntry key={entry.id} entry={entry} />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
