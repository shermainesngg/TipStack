import { cacheTag, cacheLife } from "next/cache";
import { getRecentFeedPosts, getDailyBriefsSince } from "@/lib/supabase/queries";
import type { FeedPost, DailyBrief } from "@/types";
import { FeedBriefing } from "@/components/feed-briefing";

async function getBriefingData() {
  "use cache";
  cacheTag("feed");
  cacheLife("hours");

  const [posts, briefList] = await Promise.all([
    getRecentFeedPosts(16, 300),
    getDailyBriefsSince(16).catch(() => [] as DailyBrief[]),
  ]);
  return { posts, briefList };
}

export default async function FeedPage() {
  let posts: FeedPost[] = [];
  let briefList: DailyBrief[] = [];

  try {
    ({ posts, briefList } = await getBriefingData());
  } catch {
    // Supabase not configured yet — render empty state
  }

  const briefs: Record<string, DailyBrief> = {};
  for (const b of briefList) briefs[b.brief_date] = b;

  return (
    <div className="pt-10 pb-16 lg:pt-14">
      <header className="mb-8 max-w-[760px]">
        <div className="mb-3 text-[15px] font-heading font-bold uppercase tracking-[0.12em] text-[#8B6E4E] dark:text-[#C4A77E]">
          TipStack Briefing
        </div>
        <p className="max-w-[54ch] text-[15px] leading-[1.6] text-[#5A5A6E] dark:text-[#A8B0A6]">
          Everything worth knowing in AI workflows — pulled from the noise, one
          morning scan at a time.
        </p>
      </header>

      <FeedBriefing posts={posts} briefs={briefs} />
    </div>
  );
}
