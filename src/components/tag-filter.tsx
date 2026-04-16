"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

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
      `w-full text-left rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#2D2D3F] focus-visible:ring-offset-2 ${
        activeTag === tag
          ? "font-semibold text-[#1A1A2E] bg-[#dde4db] dark:text-[#EDF2EC] dark:bg-[#2A322A]"
          : "text-[#6E6E7E] hover:text-[#1A1A2E] dark:text-[#8C9688] dark:hover:text-[#EDF2EC]"
      }`;

    return (
      <nav aria-label="Filter by tag">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B9B8E] mb-3">
          Filter
        </p>

        <button
          className={sidebarBtnClass(null)}
          onClick={() => handleFilter(null)}
        >
          All Tips
        </button>

        {tools.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B9B8E] mb-2 px-2.5">
              Tools
            </p>
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
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B9B8E] mb-2 px-2.5">
              Focus
            </p>
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
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B9B8E] mb-2 px-2.5">
              Workflows
            </p>
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
      </nav>
    );
  }

  // Chips variant (mobile)
  const chipClass = (tag: string | null) =>
    `rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#2D2D3F] focus-visible:ring-offset-2 ${
      activeTag === tag
        ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#161B16]"
        : "text-[#6E6E7E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#8C9688] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]"
    }`;

  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide
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
