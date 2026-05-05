import Link from "next/link";
import { cacheTag, cacheLife } from "next/cache";
import { getAllCategoryConfigs, getCategoryFilters } from "@/lib/categories";
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

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Terminal,
  Shield,
  Sparkles,
  MessageSquareCode,
  Workflow,
  Blocks,
  Bug,
};

async function getMeta() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getCategoryToolsAndFreshness();
}

export async function CategoryShowcase() {
  let meta: Record<string, CategoryMeta> = {};
  try {
    meta = await getMeta();
  } catch {
    // Supabase not configured
  }

  const configs = getAllCategoryConfigs();
  const hasContent = Object.keys(meta).length > 0;

  if (!hasContent) return null;

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9B9B8E] mb-4">
        Browse by category
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {configs.map((config) => {
          const filters = getCategoryFilters(config.slug);
          const topicLabels = filters.slice(0, 3).map((f) => f.label);
          const Icon = ICON_MAP[config.icon];

          return (
            <Link
              key={config.slug}
              href={`/categories/${config.slug}`}
              className={`group rounded-2xl p-5 ${config.tint} ${config.darkTint}
                hover:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08)]
                transition-all duration-300 ease-out`}
            >
              <div className="flex items-center gap-2 mb-2">
                {Icon && (
                  <Icon className={`size-4 ${config.accent}`} />
                )}
                <h3
                  className={`font-heading font-semibold text-[15px] ${config.accent}`}
                >
                  {config.label}
                </h3>
              </div>
              <p className="text-[13px] leading-[1.5] text-[#5A5A6E] dark:text-[#A8B0A6] line-clamp-2">
                {config.description}
              </p>
              {topicLabels.length > 0 && (
                <p className="mt-3 text-[12px] text-[#9B9B8E] line-clamp-1">
                  {topicLabels.join(" · ")}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
