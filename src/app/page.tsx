import { Suspense } from "react";
import { cacheTag, cacheLife } from "next/cache";
import {
  getPublishedContent,
  getPublishedContentByTags,
  getPublishedContentByTagAny,
  getAvailableTags,
} from "@/lib/supabase/queries";
import { formatFreshness } from "@/lib/utils";
import { AnimatedFeed } from "@/components/animated-feed";
import { TagFilter } from "@/components/tag-filter";
import { CategoryShowcase } from "@/components/category-showcase";

async function getContent(
  tag: string | undefined,
  tagType: string | undefined
) {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  if (tag) {
    if (!tagType) return getPublishedContentByTagAny(tag);
    const tools = tagType === "tool" ? [tag] : [];
    const focuses = tagType === "focus" ? [tag] : [];
    const workflows = tagType === "workflow" ? [tag] : [];
    const domains = tagType === "domain" ? [tag] : [];
    return getPublishedContentByTags(tools, focuses, workflows, domains);
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
  searchParams: Promise<{ tag?: string; tagType?: string }>;
}) {
  const { tag, tagType } = await searchParams;

  let content: Awaited<ReturnType<typeof getContent>> = [];
  let availableTags: Awaited<ReturnType<typeof getTags>> = {
    tools: [],
    focuses: [],
    workflows: [],
    domains: [],
  };

  try {
    [content, availableTags] = await Promise.all([
      getContent(tag, tagType),
      getTags(),
    ]);
  } catch {
    // Supabase not configured yet — render empty state
  }

  const [featured, ...rest] = content;

  return (
    <div>
      <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-2 lg:pt-20 lg:pb-6">
        <h1
          className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] max-w-[20ch] leading-[1.05]"
          style={{ fontSize: "clamp(2rem, 4vw + 1rem, 3.25rem)" }}
        >
          AI tips that are actually worth your time
        </h1>
        <p className="mt-3 max-w-[48ch] text-[17px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
          Filters out the noise from YouTube, Reddit, and X — and captures the signals worth your time.
        </p>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[14px] tracking-wide">
          <span className="text-[#8B6E4E]">
            {formatFreshness(content[0]?.published_at ?? null)}
          </span>
          {content.length > 0 && (
            <span className="text-[#5A5A6E] dark:text-[#A8B0A6]">
              <span className="text-[20px] font-heading font-bold text-[#1A1A2E] dark:text-[#EDF2EC] mr-1">
                {content.length}
              </span>
              tips published
            </span>
          )}
        </div>
      </div>

      <Suspense>
        <CategoryShowcase />
      </Suspense>

      <div className="mx-auto max-w-[1200px] px-5 py-8">
        <div className="flex gap-10">
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

          <div className="min-w-0 flex-1">
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
              <AnimatedFeed featured={featured} rest={rest} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
