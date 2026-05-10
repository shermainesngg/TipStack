import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import type { Metadata } from "next";
import {
  getPublishedContentByCategoryAndActivity,
  getActiveFiltersForCategory,
  getCategoryFreshness,
  getSkillsByType,
} from "@/lib/supabase/queries";
import { formatFreshness } from "@/lib/utils";
import {
  getCategoryConfig,
  getAllCategorySlugs,
  getCategoryFilters,
  getCategoryFilterByKey,
  fromUrlSlug,
  toUrlSlug,
} from "@/lib/categories";
import { CategoryLayoutRenderer } from "@/components/category-layouts";
import { CategoryFilter } from "@/components/tool-filter";
import type { ContentCategory, Skill } from "@/types";
import {
  Code2,
  Workflow,
  Bug,
  MessageSquareCode,
  Sparkles,
  Layers,
  BookOpen,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  Workflow,
  Bug,
  MessageSquareCode,
  Sparkles,
  Layers,
  BookOpen,
};

// ─── Static generation ──────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllCategorySlugs().map((slug) => ({
    category: toUrlSlug(slug),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const config = getCategoryConfig(fromUrlSlug(rawCategory));
  if (!config) return {};
  return {
    title: `${config.label} — TipStack`,
    description: config.description,
  };
}

// ─── Cached data functions ──────────────────────────────────────────────────

async function getCategoryContent(
  category: string,
  activityTags: string[] | null
) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getPublishedContentByCategoryAndActivity(category, activityTags);
}

async function getActiveFilters(category: string) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  const filters = getCategoryFilters(category);
  return getActiveFiltersForCategory(category, filters);
}

async function getCachedFreshness(category: string) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getCategoryFreshness(category);
}

async function getSkillsGrouped() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getSkillsByType();
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ activity?: string }>;
}) {
  const { category: rawCategory } = await params;
  const { activity } = await searchParams;

  const category = fromUrlSlug(rawCategory);
  const validSlugs = getAllCategorySlugs();
  if (!validSlugs.includes(category as ContentCategory)) {
    notFound();
  }

  const config = getCategoryConfig(category)!;
  const Icon = ICON_MAP[config.icon];

  const allFilters = getCategoryFilters(category);
  const activeFilter = activity
    ? getCategoryFilterByKey(category, activity)
    : undefined;
  const activityTags = activeFilter?.tags ?? null;
  const isGithubSkills = category === "github_skills";

  let content: Awaited<ReturnType<typeof getCategoryContent>> = [];
  let activeFilterKeys: string[] = [];
  let freshness: string | null = null;
  let skillsByType: Record<string, Skill[]> = {};

  try {
    const results = await Promise.all([
      getCategoryContent(category, activityTags),
      getActiveFilters(category),
      getCachedFreshness(category),
      isGithubSkills ? getSkillsGrouped() : Promise.resolve({} as Record<string, Skill[]>),
    ]);

    content = results[0];
    activeFilterKeys = results[1];
    freshness = results[2];
    if (isGithubSkills) skillsByType = results[3];
  } catch {
    // Supabase not configured
  }

  const visibleFilters = allFilters.filter((f) =>
    activeFilterKeys.includes(f.key)
  );

  return (
    <div>
      <div className={`${config.tint} ${config.darkTint}`}>
        <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-8 lg:pt-16 lg:pb-10">
          <div className="flex items-center gap-2.5 mb-4">
            {Icon && <Icon className={`size-5 ${config.accent}`} />}
            <h1
              className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] leading-[1.05]"
              style={{
                fontSize: "clamp(1.75rem, 3vw + 0.5rem, 2.5rem)",
              }}
            >
              {config.label}
            </h1>
          </div>
          <p className="max-w-[50ch] text-[16px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
            {config.description}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px]">
            <span className="text-[#9B9B8E]">
              {formatFreshness(freshness)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-8">
        {visibleFilters.length > 1 && (
          <div className="mb-8">
            <Suspense>
              <CategoryFilter filters={visibleFilters} />
            </Suspense>
          </div>
        )}

        {content.length === 0 && Object.keys(skillsByType).length === 0 ? (
          <div className="py-24 text-left max-w-[40ch]">
            <p className="text-2xl font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC]">
              {activeFilter
                ? `No ${config.label.toLowerCase()} tips for "${activeFilter.label}" yet.`
                : `No ${config.label.toLowerCase()} tips yet.`}
            </p>
            <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
              {activeFilter
                ? "Try removing the filter or browse another category."
                : "The pipeline is running. Tips will appear here shortly."}
            </p>
          </div>
        ) : (
          <CategoryLayoutRenderer
            category={category as ContentCategory}
            content={content}
            skillsByType={isGithubSkills ? skillsByType : undefined}
          />
        )}
      </div>
    </div>
  );
}
