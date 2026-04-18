import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import {
  getPublishedContentByCategoryAndDomain,
  getAvailableTags,
} from "@/lib/supabase/queries";
import {
  getCategoryConfig,
  getAllCategorySlugs,
} from "@/lib/categories";
import { getCategoryLayout } from "@/components/category-layouts";
import { DomainFilter } from "@/components/domain-filter";
import type { ContentCategory } from "@/types";
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

async function getCategoryContent(
  category: string,
  domain: string | null
) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getPublishedContentByCategoryAndDomain(category, domain);
}

async function getDomains() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  const tags = await getAvailableTags();
  return tags.domains;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ domain?: string }>;
}) {
  const { category } = await params;
  const { domain } = await searchParams;

  const validSlugs = getAllCategorySlugs();
  if (!validSlugs.includes(category as ContentCategory)) {
    notFound();
  }

  const config = getCategoryConfig(category)!;
  const Icon = ICON_MAP[config.icon];

  let content: Awaited<ReturnType<typeof getCategoryContent>> = [];
  let domains: string[] = [];

  try {
    [content, domains] = await Promise.all([
      getCategoryContent(category, domain ?? null),
      getDomains(),
    ]);
  } catch {
    // Supabase not configured
  }

  const Layout = getCategoryLayout(category as ContentCategory);

  return (
    <div>
      <div
        className={`${config.tint} ${config.darkTint}`}
      >
        <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-8 lg:pt-16 lg:pb-10">
          <div className="flex items-center gap-2.5 mb-4">
            {Icon && (
              <Icon className={`size-5 ${config.accent}`} />
            )}
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
          <p className="mt-3 text-[14px] text-[#9B9B8E]">
            <span className="text-[18px] font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC] mr-1">
              {content.length}
            </span>
            {content.length === 1 ? "tip" : "tips"}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-8">
        {domains.length > 0 && (
          <div className="mb-8">
            <Suspense>
              <DomainFilter domains={domains} />
            </Suspense>
          </div>
        )}

        {content.length === 0 ? (
          <div className="py-24 text-left max-w-[40ch]">
            <p className="text-2xl font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC]">
              {domain
                ? `No ${config.label.toLowerCase()} tips for "${domain}" yet.`
                : `No ${config.label.toLowerCase()} tips yet.`}
            </p>
            <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
              {domain
                ? "Try removing the domain filter or browse another category."
                : "The pipeline is running. Tips will appear here shortly."}
            </p>
          </div>
        ) : (
          <Layout content={content} />
        )}
      </div>
    </div>
  );
}
