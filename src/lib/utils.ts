import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFreshness(dateStr: string | null): string {
  if (!dateStr) return "Updated recently";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (hours < 1) return "Updated just now";
  if (hours < 24) return `Updated ${hours}h ago`;
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days}d ago`;
  if (days < 30) return `Updated ${Math.floor(days / 7)}w ago`;
  return `Updated ${Math.floor(days / 30)}mo ago`;
}
