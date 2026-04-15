"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Filter, Wrench, Crosshair, Zap } from "lucide-react";

interface TagFilterProps {
  tools: string[];
  focuses: string[];
  workflows: string[];
  variant?: "chips" | "sidebar";
}

function formatLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TagFilter({
  tools,
  focuses,
  workflows,
  variant = "chips",
}: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  const handleFilter = useCallback(
    (tag: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tag) {
        params.set("tag", tag);
      } else {
        params.delete("tag");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  if (variant === "sidebar") {
    const sidebarBtnClass = (tag: string | null) =>
      `w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#2D2D3F] focus-visible:ring-offset-2 ${
        activeTag === tag
          ? "bg-[#2D2D3F] text-white dark:bg-[#EDF2EC] dark:text-[#161B16]"
          : "text-[#64748B] hover:bg-[#E2E8E0] dark:text-[#8C9688] dark:hover:bg-[#2A322A]"
      }`;

    return (
      <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:bg-[#1E241E] dark:shadow-none">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A2E] dark:text-[#EDF2EC] mb-4">
          <Filter className="h-4 w-4 text-[#A0A8B0]" />
          Filters
        </div>

        <button
          className={sidebarBtnClass(null)}
          onClick={() => handleFilter(null)}
        >
          All Tips
        </button>

        {tools.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#A0A8B0]">
              <Wrench className="h-3 w-3" />
              Tools
            </div>
            <div className="space-y-0.5">
              {tools.map((tag) => (
                <button
                  key={`tool-${tag}`}
                  className={sidebarBtnClass(tag)}
                  onClick={() => handleFilter(tag)}
                >
                  {formatLabel(tag)}
                </button>
              ))}
            </div>
          </div>
        )}

        {focuses.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#A0A8B0]">
              <Crosshair className="h-3 w-3" />
              Focus
            </div>
            <div className="space-y-0.5">
              {focuses.map((tag) => (
                <button
                  key={`focus-${tag}`}
                  className={sidebarBtnClass(tag)}
                  onClick={() => handleFilter(tag)}
                >
                  {formatLabel(tag)}
                </button>
              ))}
            </div>
          </div>
        )}

        {workflows.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#A0A8B0]">
              <Zap className="h-3 w-3" />
              Workflows
            </div>
            <div className="space-y-0.5">
              {workflows.map((tag) => (
                <button
                  key={`workflow-${tag}`}
                  className={sidebarBtnClass(tag)}
                  onClick={() => handleFilter(tag)}
                >
                  {formatLabel(tag)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Chips variant (mobile)
  const chipClass = (tag: string | null) =>
    `rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#2D2D3F] focus-visible:ring-offset-2 ${
      activeTag === tag
        ? "bg-[#2D2D3F] text-white dark:bg-[#EDF2EC] dark:text-[#161B16]"
        : "bg-white text-[#64748B] hover:bg-[#F5F5F0] dark:bg-[#1E241E] dark:text-[#8C9688] dark:hover:bg-[#2A322A]"
    }`;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide
        [mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]"
      role="navigation"
      aria-label="Filter by tag"
    >
      <button className={chipClass(null)} onClick={() => handleFilter(null)}>
        All
      </button>
      {tools.map((tag) => (
        <button
          key={`tool-${tag}`}
          className={chipClass(tag)}
          onClick={() => handleFilter(tag)}
        >
          {formatLabel(tag)}
        </button>
      ))}
      {focuses.map((tag) => (
        <button
          key={`focus-${tag}`}
          className={chipClass(tag)}
          onClick={() => handleFilter(tag)}
        >
          {formatLabel(tag)}
        </button>
      ))}
      {workflows.map((tag) => (
        <button
          key={`workflow-${tag}`}
          className={chipClass(tag)}
          onClick={() => handleFilter(tag)}
        >
          {formatLabel(tag)}
        </button>
      ))}
    </div>
  );
}
