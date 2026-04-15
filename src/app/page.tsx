import { Suspense } from "react";
import { cacheTag, cacheLife } from "next/cache";
import {
  getPublishedContent,
  getPublishedContentByTags,
  getAvailableTags,
} from "@/lib/supabase/queries";
import { ContentCard } from "@/components/content-card";
import { TagFilter } from "@/components/tag-filter";
import { Lightbulb, Wrench, Zap } from "lucide-react";

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
      {/* Heading + Stats */}
      <div className="mx-auto max-w-[1200px] px-5 pt-10 pb-2 lg:pt-14 lg:pb-4">
        <h1 className="text-3xl lg:text-[40px] font-extrabold tracking-tight font-heading leading-tight">
          AI Workflow Tips
        </h1>
        <p className="mt-2 max-w-lg text-base text-[#7C8590] leading-relaxed">
          Curated, actionable tips from YouTube and Reddit — filtered for
          signal, not noise.
        </p>

        {/* Stat pills */}
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-[#FADCD9] px-4 py-3 dark:bg-[#3D2424]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5C4BE] dark:bg-[#4D2E2E]">
              <Lightbulb className="h-4 w-4 text-[#994D4D]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A1A2E] leading-none dark:text-[#F5B0AA]">
                {content.length}
              </p>
              <p className="text-xs text-[#994D4D] mt-0.5 dark:text-[#F5B0AA]/70">
                Tips
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#E5DCFA] px-4 py-3 dark:bg-[#2A1F3D]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4C8F0] dark:bg-[#352A4D]">
              <Wrench className="h-4 w-4 text-[#6B47A8]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A1A2E] leading-none dark:text-[#C5B3E6]">
                {availableTags.tools.length}
              </p>
              <p className="text-xs text-[#6B47A8] mt-0.5 dark:text-[#C5B3E6]/70">
                Tools
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-[#D5EFDA] px-4 py-3 dark:bg-[#1A3327]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C0E6C8] dark:bg-[#243D2D]">
              <Zap className="h-4 w-4 text-[#2D6B45]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#1A1A2E] leading-none dark:text-[#8ECDA0]">
                {availableTags.workflows.length}
              </p>
              <p className="text-xs text-[#2D6B45] mt-0.5 dark:text-[#8ECDA0]/70">
                Workflows
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1200px] px-5 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters (desktop) */}
          <aside className="hidden lg:block w-[220px] shrink-0">
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
            <div className="lg:hidden sticky top-16 z-30 -mx-5 bg-[#EDF2EC]/80 px-5 py-3 backdrop-blur-sm dark:bg-[#161B16]/80 mb-6">
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
              <div className="py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E2E8E0] dark:bg-[#2A322A]">
                  <Lightbulb className="h-8 w-8 text-[#A0A8B0]" />
                </div>
                <p className="text-lg font-medium text-[#7C8590]">
                  {tag
                    ? "No tips found for this filter."
                    : "No tips published yet."}
                </p>
                <p className="mt-1 text-sm text-[#A0A8B0]">
                  {tag ? "Try a different tag." : "Check back soon."}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Featured card (latest tip) */}
                {featured && <ContentCard content={featured} featured />}

                {/* Remaining tips grid */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {rest.map((item) => (
                      <ContentCard key={item.id} content={item} />
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
