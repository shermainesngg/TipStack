import { cacheTag, cacheLife } from "next/cache";
import { getFeedPosts } from "@/lib/supabase/queries";
import { FeedScroll } from "@/components/feed-scroll";

async function getInitialFeed() {
  "use cache";
  cacheTag("feed");
  cacheLife("hours");

  const posts = await getFeedPosts(null, 20);
  const nextCursor =
    posts.length === 20 ? posts[posts.length - 1].published_at : null;
  return { posts, nextCursor };
}

export default async function FeedPage() {
  let feedData: Awaited<ReturnType<typeof getInitialFeed>> = {
    posts: [],
    nextCursor: null,
  };

  try {
    feedData = await getInitialFeed();
  } catch {
    // Supabase not configured yet — render empty state
  }

  return (
    <div className="max-w-[720px] pt-10 pb-16 lg:pt-16">
      <header className="mb-10">
        <h1 className="font-heading font-extrabold tracking-tight text-[#1A1A2E] dark:text-[#EDF2EC] text-[1.75rem] leading-[1.1]">
          Fresh from the feed
        </h1>
        <p className="mt-2 text-[15px] leading-[1.7] text-[#5A5A6E] dark:text-[#A8B0A6]">
          The sharpest AI workflow tips — pulled from the noise so you don&apos;t have to scroll.
        </p>
      </header>

      <FeedScroll
        initialPosts={feedData.posts}
        initialCursor={feedData.nextCursor}
      />
    </div>
  );
}
