"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

interface FilterEntry {
  key: string;
  label: string;
}

export function CategoryFilter({ filters }: { filters: FilterEntry[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeKey = searchParams.get("activity");

  const handleFilter = useCallback(
    (key: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key) {
        params.set("activity", key);
      } else {
        params.delete("activity");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, searchParams, pathname]
  );

  if (filters.length === 0) return null;

  const chipClass = (key: string | null) =>
    `rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 ${
      activeKey === key
        ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#161B16]"
        : "text-[#6E6E7E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#8C9688] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]"
    }`;

  return (
    <div
      className="flex gap-1.5 overflow-x-auto scrollbar-hide"
      role="navigation"
      aria-label="Filter by activity"
    >
      <button className={chipClass(null)} onClick={() => handleFilter(null)}>
        All
      </button>
      {filters.map((f) => (
        <button
          key={f.key}
          className={chipClass(f.key)}
          onClick={() => handleFilter(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
