import { Suspense } from "react";
import { cacheTag, cacheLife } from "next/cache";
import {
  getPublishedContent,
  getPublishedContentByTags,
  getAvailableTags,
} from "@/lib/supabase/queries";
import { ContentCard } from "@/components/content-card";
import { TagFilter } from "@/components/tag-filter";

async function getContent(tag: string | undefined) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  if (tag) {
    return getPublishedContentByTags([tag], [tag], [tag]);
  }
  return getPublishedContent();
}

async function getTags() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  return getAvailableTags();
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;

  let content: Awaited<ReturnType<typeof getContent>> = [];
  let availableTags: Awaited<ReturnType<typeof getTags>> = {
    tools: [],
    focuses: [],
    workflows: [],
  };

  try {
    [content, availableTags] = await Promise.all([
      getContent(tag),
      getTags(),
    ]);
  } catch {
    // Supabase not configured yet — render empty state
  }

  const [featured, ...rest] = content;

  return (
    <div>
      {/* Hero — left-aligned, asymmetric, typographic */}
      <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-2 lg:pt-20 lg:pb-6">
        <h1
          className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] max-w-[14ch] leading-[1.05]"
          style={{ fontSize: "clamp(2rem, 4vw + 1rem, 3.25rem)" }}
        >
          AI Workflow Tips
        </h1>
        <p className="mt-3 max-w-[44ch] text-[17px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
          Curated, actionable tips from YouTube and Reddit — filtered for
          signal, not noise.
        </p>

        {/* Stat line — inline text, not cards-within-cards */}
        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[14px] tracking-wide">
          <span className="text-[#8B6E4E]">
            <span className="text-[20px] font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC] mr-1">
              {content.length}
            </span>
            tips
          </span>
          <span className="text-[#6B6B9E]">
            <span className="text-[20px] font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC] mr-1">
              {availableTags.tools.length}
            </span>
            tools
          </span>
          <span className="text-[#4E7E5E]">
            <span className="text-[20px] font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC] mr-1">
              {availableTags.workflows.length}
            </span>
            workflows
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1200px] px-5 py-8">
        <div className="flex gap-10">
          {/* Sidebar Filters (desktop) */}
          <aside className="hidden lg:block w-[200px] shrink-0">
            <div className="sticky top-20">
              <Suspense>
                <TagFilter
                  tools={availableTags.tools}
                  focuses={availableTags.focuses}
                  workflows={availableTags.workflows}
                  variant="sidebar"
                />
              </Suspense>
            </div>
          </aside>

          {/* Content Column */}
          <div className="min-w-0 flex-1">
            {/* Mobile filter chips */}
            <div className="lg:hidden sticky top-16 z-30 -mx-5 bg-[#EDF2EC]/80 px-5 py-3 backdrop-blur-sm dark:bg-[#161B16]/80 mb-8">
              <Suspense>
                <TagFilter
                  tools={availableTags.tools}
                  focuses={availableTags.focuses}
                  workflows={availableTags.workflows}
                  variant="chips"
                />
              </Suspense>
            </div>

            {content.length === 0 ? (
              <div className="py-24 text-left max-w-[40ch]">
                <p className="text-2xl font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC]">
                  {tag
                    ? `Nothing tagged "${tag}" yet.`
                    : "No tips published yet."}
                </p>
                <p className="mt-3 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
                  {tag
                    ? "Try browsing all tips or pick a different filter."
                    : "The pipeline is running. First tips will appear here shortly."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Featured card (latest tip) — full width */}
                {featured && <ContentCard content={featured} featured />}

                {/* Remaining tips — asymmetric masonry-style grid */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {rest.map((item, i) => (
                      <div
                        key={item.id}
                        className={
                          i === 0 && rest.length >= 3
                            ? "md:col-span-2 lg:col-span-1"
                            : ""
                        }
                      >
                        <ContentCard content={item} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
