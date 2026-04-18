import fs from "fs";
import path from "path";
import { isUrlProcessed, sleep, type FetchedItem } from "./lib/shared";

const MVP_SUBREDDITS = [
  { name: "ClaudeAI", tier: 1 },
  { name: "ChatGPTPro", tier: 1 },
  { name: "ChatGPTCoding", tier: 1 },
  { name: "cursor", tier: 1 },
  { name: "LocalLLaMA", tier: 1 },
  { name: "AI_Agents", tier: 1 },
  { name: "vibecoding", tier: 1 },
];

const REDDIT_MIN_SCORE = 10;
const REDDIT_POSTS_PER_SUB = 10;
const REDDIT_USER_AGENT = "TipStack/1.0 (content aggregator)";

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched-reddit.json");

// ─── Helpers ────────────────────────────────────────────────────────────────

interface RedditPost {
  title: string;
  url: string;
  selftext: string;
  score: number;
  author: string;
  permalink: string;
  is_self: boolean;
  num_comments: number;
}

async function getSubredditPosts(
  subreddit: string,
  limit: number
): Promise<RedditPost[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
    { headers: { "User-Agent": REDDIT_USER_AGENT } }
  );

  if (!res.ok) {
    throw new Error(`Reddit fetch failed for r/${subreddit}: ${res.status}`);
  }

  const json = await res.json();
  const posts: RedditPost[] = json.data.children
    .map((child: { data: RedditPost }) => child.data)
    .filter((post: RedditPost) => !post.url.includes("/wiki/") && post.author !== "AutoModerator");

  return posts;
}

// ─── Main ───────────────────────────────────────────────────────────────────

export async function fetchReddit(): Promise<{ items: FetchedItem[]; titles: string[] }> {
  const items: FetchedItem[] = [];
  const allTitles: string[] = [];

  console.log("=== Fetching Reddit content ===\n");

  for (const sub of MVP_SUBREDDITS) {
    console.log(`Subreddit: r/${sub.name}`);
    try {
      const posts = await getSubredditPosts(sub.name, REDDIT_POSTS_PER_SUB);
      console.log(`  Found ${posts.length} posts`);

      let kept = 0;
      for (const post of posts) {
        allTitles.push(post.title);

        if (post.score < REDDIT_MIN_SCORE) continue;

        const postUrl = `https://www.reddit.com${post.permalink}`;

        if (await isUrlProcessed(postUrl)) {
          console.log(`  SKIP (already processed): ${post.title}`);
          continue;
        }

        if (!post.is_self || !post.selftext || post.selftext.length < 100) {
          console.log(`  SKIP (link post or too short): ${post.title}`);
          continue;
        }

        items.push({
          url: postUrl,
          platform: "reddit",
          content: post.selftext.slice(0, 12000),
          creator: `u/${post.author}`,
          title: post.title,
        });
        console.log(`  OK (score=${post.score}, ${post.selftext.length} chars): ${post.title}`);
        kept++;
      }

      if (kept === 0) {
        console.log(`  No new qualifying posts`);
      }
    } catch (err) {
      console.error(`  ERROR fetching subreddit: ${err}`);
    }

    await sleep(2000);
    console.log();
  }

  return { items, titles: allTitles };
}

// ─── Standalone entry point ─────────────────────────────────────────────────

if (require.main === module) {
  fetchReddit()
    .then(({ items }) => {
      fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));
      console.log(`Done. ${items.length} items saved to ${OUTPUT_PATH}`);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
