import { cacheTag, cacheLife } from "next/cache";
import { getFeedPosts, getFeedStats } from "@/lib/supabase/queries";
import type { FeedStats } from "@/lib/supabase/queries";
import type { FeedPost } from "@/types";
import { FeedScroll } from "@/components/feed-scroll";
import { FeedTabs } from "@/components/feed-tabs";

async function getInitialFeed() {
  "use cache";
  cacheTag("feed");
  cacheLife("hours");

  const posts = await getFeedPosts(null, 40);
  const nextCursor =
    posts.length === 40 ? posts[posts.length - 1].published_at : null;
  return { posts, nextCursor };
}

async function getCachedStats() {
  "use cache";
  cacheTag("content");
  cacheLife("hours");

  const raw = await getFeedStats();
  let lastRunLabel = "";
  if (raw.lastIngestion) {
    const diffH = Math.floor(
      (Date.now() - new Date(raw.lastIngestion).getTime()) / 3_600_000
    );
    if (diffH < 1) lastRunLabel = "just now";
    else if (diffH < 24) lastRunLabel = `${diffH}h ago`;
    else lastRunLabel = `${Math.floor(diffH / 24)}d ago`;
  }
  return { ...raw, lastRunLabel };
}

export default async function FeedPage() {
  let feedData: { posts: FeedPost[]; nextCursor: string | null } = {
    posts: [],
    nextCursor: null,
  };
  let stats: FeedStats & { lastRunLabel: string } = {
    sourcesProcessed: 0,
    toolsTracked: 0,
    articlesPublished: 0,
    lastIngestion: null,
    lastRunLabel: "",
  };

  try {
    [feedData, stats] = await Promise.all([getInitialFeed(), getCachedStats()]);
  } catch {
    // Supabase not configured yet — render empty state
  }

  const news: FeedPost[] = [];
  const community: FeedPost[] = [];
  for (const post of feedData.posts) {
    if (post.source_platforms.includes("news")) {
      news.push(post);
    } else {
      community.push(post);
    }
  }

  return (
    <div className="pt-10 pb-16 lg:pt-16">
      <header className="mb-10 max-w-[720px]">
        <h1 className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] text-[1.75rem] leading-[1.1]">
          What&apos;s New
        </h1>
        <p className="mt-2 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
          The sharpest AI workflow tips — pulled from the noise.
        </p>
        {(stats.sourcesProcessed > 0 || stats.articlesPublished > 0) && (
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#9B9B8E]">
            {stats.sourcesProcessed > 0 && (
              <span>{stats.sourcesProcessed} sources ingested</span>
            )}
            {stats.toolsTracked > 0 && (
              <span>{stats.toolsTracked} tools tracked</span>
            )}
            {stats.articlesPublished > 0 && (
              <span>{stats.articlesPublished} articles published</span>
            )}
            {stats.lastRunLabel && (
              <span>Last run {stats.lastRunLabel}</span>
            )}
          </p>
        )}
      </header>

      <FeedTabs
        news={news}
        community={community}
        newsCursor={news.length >= 20 ? news[news.length - 1].published_at : null}
        communityCursor={community.length >= 20 ? community[community.length - 1].published_at : null}
      />

      <div className="hidden lg:grid lg:grid-cols-2 gap-10 lg:h-[calc(100vh-10rem)]">
        <section className="flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-5 shrink-0">
            <h2 className="font-heading font-bold text-[15px] tracking-wide text-[#1A1A2E] dark:text-[#EDF2EC]">
              News
            </h2>
            <div className="flex-1 h-px bg-[#dde4db] dark:bg-[#3A433A]" />
          </div>
          <div className="lg:overflow-y-auto lg:min-h-0 scrollbar-feed lg:pr-2">
            <FeedScroll
              initialPosts={news}
              initialCursor={
                news.length >= 20
                  ? news[news.length - 1].published_at
                  : null
              }
              platforms="news"
            />
          </div>
        </section>

        <section className="flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-5 shrink-0">
            <h2 className="font-heading font-bold text-[15px] tracking-wide text-[#1A1A2E] dark:text-[#EDF2EC]">
              Community
            </h2>
            <div className="flex-1 h-px bg-[#dde4db] dark:bg-[#3A433A]" />
          </div>
          <div className="lg:overflow-y-auto lg:min-h-0 scrollbar-feed lg:pr-2">
            <FeedScroll
              initialPosts={community}
              initialCursor={
                community.length >= 20
                  ? community[community.length - 1].published_at
                  : null
              }
              platforms="youtube,reddit,twitter,docs"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
