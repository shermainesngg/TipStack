import { cn } from "@/lib/utils";

type TagCategory = "tool" | "focus" | "workflow";

const TAG_STYLES: Record<
  TagCategory,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  tool: {
    bg: "bg-[#FADCD9]",
    text: "text-[#994D4D]",
    darkBg: "dark:bg-[#3D2424]",
    darkText: "dark:text-[#F5B0AA]",
  },
  focus: {
    bg: "bg-[#E5DCFA]",
    text: "text-[#6B47A8]",
    darkBg: "dark:bg-[#2A1F3D]",
    darkText: "dark:text-[#C5B3E6]",
  },
  workflow: {
    bg: "bg-[#D5EFDA]",
    text: "text-[#2D6B45]",
    darkBg: "dark:bg-[#1A3327]",
    darkText: "dark:text-[#8ECDA0]",
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
        "inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap",
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
