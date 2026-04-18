import { cn } from "@/lib/utils";

type TagCategory = "tool" | "focus" | "workflow" | "domain";

const TAG_STYLES: Record<
  TagCategory,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  tool: {
    bg: "bg-[#f0dbd8]",
    text: "text-[#8B4A4A]",
    darkBg: "dark:bg-[#3D2424]",
    darkText: "dark:text-[#E5A097]",
  },
  focus: {
    bg: "bg-[#e0d8ef]",
    text: "text-[#5E3F96]",
    darkBg: "dark:bg-[#2A1F3D]",
    darkText: "dark:text-[#B89DD4]",
  },
  workflow: {
    bg: "bg-[#d2e8d6]",
    text: "text-[#2D6040]",
    darkBg: "dark:bg-[#1A3327]",
    darkText: "dark:text-[#7EBE8E]",
  },
  domain: {
    bg: "bg-[#f0e8d4]",
    text: "text-[#7B6230]",
    darkBg: "dark:bg-[#2E2818]",
    darkText: "dark:text-[#D4B875]",
  },
};

function formatLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TagPill({
  label,
  category,
  className,
}: {
  label: string;
  category: TagCategory;
  className?: string;
}) {
  const styles = TAG_STYLES[category];

  return (
    <span
      className={cn(
        "inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap tracking-wide",
        styles.bg,
        styles.text,
        styles.darkBg,
        styles.darkText,
        className
      )}
    >
      {formatLabel(label)}
    </span>
  );
}
