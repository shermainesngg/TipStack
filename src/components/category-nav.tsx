import Link from "next/link";
import { cacheTag, cacheLife } from "next/cache";
import { getAllCategoryConfigs, toUrlSlug } from "@/lib/categories";
import {
  getCategoryToolsAndFreshness,
  type CategoryMeta,
} from "@/lib/supabase/queries";
import {
  Terminal,
  Shield,
  Sparkles,
  MessageSquareCode,
  Workflow,
  Blocks,
  Bug,
} from "lucide-react";
import type { CategoryConfig } from "@/lib/categories";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Terminal,
  Shield,
  Sparkles,
  MessageSquareCode,
  Workflow,
  Blocks,
  Bug,
};

async function getCategoryMeta() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getCategoryToolsAndFreshness();
}

function CategoryPill({ config }: { config: CategoryConfig }) {
  const Icon = ICON_MAP[config.icon];

  return (
    <Link
      key={config.slug}
      href={`/categories/${toUrlSlug(config.slug)}`}
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
  let meta: Record<string, CategoryMeta> = {};
  try {
    meta = await getCategoryMeta();
  } catch {
    // Supabase not configured
  }

  const configs = getAllCategoryConfigs();

  return (
    <nav
      className="flex gap-0.5 overflow-x-auto scrollbar-hide"
      aria-label="Browse by category"
    >
      {configs.map((config) => (
        <CategoryPill key={config.slug} config={config} />
      ))}
    </nav>
  );
}
