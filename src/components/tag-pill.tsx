import { cn } from "@/lib/utils";
import { toolDisplayName } from "@/lib/tools";

type TagCategory = "tool" | "focus" | "workflow" | "domain";

const TAG_STYLES: Record<
  TagCategory,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  tool: {
    bg: "bg-[#F2C4B8]",
    text: "text-[#6E2B2B]",
    darkBg: "dark:bg-[#3D2020]",
    darkText: "dark:text-[#E8A89E]",
  },
  focus: {
    bg: "bg-[#D2E098]",
    text: "text-[#3A5015]",
    darkBg: "dark:bg-[#1E2D12]",
    darkText: "dark:text-[#B5D070]",
  },
  workflow: {
    bg: "bg-[#D8BFD2]",
    text: "text-[#582848]",
    darkBg: "dark:bg-[#2E1828]",
    darkText: "dark:text-[#C898B8]",
  },
  domain: {
    bg: "bg-[#ECCF90]",
    text: "text-[#5E4515]",
    darkBg: "dark:bg-[#2E2510]",
    darkText: "dark:text-[#D4B060]",
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
        "inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full whitespace-nowrap tracking-wide",
        styles.bg,
        styles.text,
        styles.darkBg,
        styles.darkText,
        className
      )}
    >
      {category === "tool" ? toolDisplayName(label) : formatLabel(label)}
    </span>
  );
}
