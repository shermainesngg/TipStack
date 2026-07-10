import type { Platform } from "@/types";

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  reddit: "Reddit",
  twitter: "X",
  news: "News",
  docs: "Docs",
  github: "GitHub",
  blog: "Blog",
};

/** Tinted chip classes (text + bg) per platform — matches the tag category palette. */
export const PLATFORM_CHIP: Record<Platform, string> = {
  youtube: "text-[#6E2B2B] bg-[#F2C4B8] dark:text-[#E8A89E] dark:bg-[#3D2020]",
  reddit: "text-[#5E4515] bg-[#ECCF90] dark:text-[#D4B060] dark:bg-[#2E2510]",
  twitter: "text-[#582848] bg-[#D8BFD2] dark:text-[#C898B8] dark:bg-[#2E1828]",
  news: "text-[#3A5015] bg-[#D2E098] dark:text-[#B5D070] dark:bg-[#1E2D12]",
  docs: "text-[#1A4A40] bg-[#B8D8D0] dark:text-[#80BEB4] dark:bg-[#152E28]",
  github: "text-[#3A423A] bg-[#CDD5CA] dark:text-[#C8D0C6] dark:bg-[#2A322A]",
  blog: "text-[#6E4A2B] bg-[#E8D2B8] dark:text-[#D4B08A] dark:bg-[#2E2418]",
};

/** Small solid dot color per platform — for compact meta lines. */
export const PLATFORM_DOT: Record<Platform, string> = {
  youtube: "bg-[#C4614E]",
  reddit: "bg-[#C79A3E]",
  twitter: "bg-[#9A6A8E]",
  news: "bg-[#7FA53E]",
  docs: "bg-[#4E9A8E]",
  github: "bg-[#7A857A]",
  blog: "bg-[#B08A5E]",
};

export function platformLabel(p: string): string {
  return PLATFORM_LABELS[p as Platform] ?? p;
}
