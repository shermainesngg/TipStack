"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "What's New" },
  { href: "/changelog", label: "Changelog" },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="ml-8 hidden sm:flex items-center gap-1" aria-label="Main">
      {links.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors duration-150 ${
              isActive
                ? "text-[#1A1A2E] bg-[#dde4db] dark:text-[#EDF2EC] dark:bg-[#2A322A]"
                : "text-[#5A5A6E] hover:text-[#1A1A2E] hover:bg-[#dde4db] dark:text-[#A8B0A6] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
