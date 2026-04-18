"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

function formatLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DomainFilter({ domains }: { domains: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeDomain = searchParams.get("domain");

  const handleFilter = useCallback(
    (domain: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (domain) {
        params.set("domain", domain);
      } else {
        params.delete("domain");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, searchParams, pathname]
  );

  if (domains.length === 0) return null;

  const chipClass = (domain: string | null) =>
    `rounded-full px-3 py-1 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 ${
      activeDomain === domain
        ? "bg-[#1A1A2E] text-[#fafcfa] dark:bg-[#EDF2EC] dark:text-[#161B16]"
        : "text-[#6E6E7E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#8C9688] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]"
    }`;

  return (
    <div
      className="flex gap-1.5 overflow-x-auto scrollbar-hide"
      role="navigation"
      aria-label="Filter by domain"
    >
      <button className={chipClass(null)} onClick={() => handleFilter(null)}>
        All
      </button>
      {domains.map((domain) => (
        <button
          key={domain}
          className={chipClass(domain)}
          onClick={() => handleFilter(domain)}
        >
          {formatLabel(domain)}
        </button>
      ))}
    </div>
  );
}
