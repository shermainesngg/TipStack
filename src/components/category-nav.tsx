import Link from "next/link";
import { cacheTag, cacheLife } from "next/cache";
import { getAllCategoryConfigs } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/supabase/queries";
import {
  Code2,
  Workflow,
  Bug,
  MessageSquareCode,
  Sparkles,
  Layers,
  BookOpen,
} from "lucide-react";
import type { CategoryConfig } from "@/lib/categories";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  Workflow,
  Bug,
  MessageSquareCode,
  Sparkles,
  Layers,
  BookOpen,
};

async function getCategories() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  const counts = await getCategoryCounts();
  return { counts };
}

function CategoryPill({ config }: { config: CategoryConfig }) {
  const Icon = ICON_MAP[config.icon];

  return (
    <Link
      key={config.slug}
      href={`/categories/${config.slug}`}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap
        text-[#6E6E7E] hover:text-[#1A1A2E] hover:bg-[#dde4db]
        dark:text-[#8C9688] dark:hover:text-[#EDF2EC] dark:hover:bg-[#2A322A]
        transition-colors duration-150"
    >
      {Icon && <Icon className="size-3.5 opacity-70" />}
      {config.label}
    </Link>
  );
}

export async function CategoryNav() {
  let counts: Record<string, number> = {};
  try {
    const result = await getCategories();
    counts = result.counts;
  } catch {
    // Supabase not configured
  }

  const configs = getAllCategoryConfigs();
  const categoriesWithContent = configs.filter(
    (c) => (counts[c.slug] ?? 0) > 0
  );
  const categoriesToShow =
    categoriesWithContent.length > 0 ? categoriesWithContent : configs;

  return (
    <nav
      className="flex gap-0.5 overflow-x-auto scrollbar-hide"
      aria-label="Browse by category"
    >
      {categoriesToShow.map((config) => (
        <CategoryPill key={config.slug} config={config} />
      ))}
    </nav>
  );
}
