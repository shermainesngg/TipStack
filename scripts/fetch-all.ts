import fs from "fs";
import path from "path";
import { fetchYouTube } from "./fetch-youtube";
import { fetchReddit } from "./fetch-reddit";
import { fetchTwitter } from "./fetch-twitter";
import { fetchNews } from "./fetch-news";
import { fetchDocsItems, extractFeatureKeywords } from "@/lib/sources/docs";
import { fetchGitHubSkills } from "@/lib/sources/github-skills";
import { fetchBlogItems } from "@/lib/sources/blog";
import { isUrlProcessed } from "./lib/shared";

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched.json");
const SKILL_META_PATH = path.resolve(__dirname, "data", "skill-meta.json");

/**
 * Run one source's fetch in isolation. A single flaky source (expired Twitter
 * cookies, a blog feed 500, GitHub rate-limit) must never abort the whole
 * daily ingestion — it degrades to its fallback and the run continues.
 */
async function safeSource<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[${label}] source failed, continuing without it: ${err}`);
    return fallback;
  }
}

async function main() {
  // Docs fetch runs first — its keywords feed YouTube search discovery
  const docsItems = await safeSource("docs", () => fetchDocsItems(isUrlProcessed), []);
  const docKeywords = extractFeatureKeywords(docsItems);

  // Reddit runs second — its titles also feed YouTube search
  const { items: redditItems, titles: redditTitles } = await safeSource(
    "reddit",
    () => fetchReddit(),
    { items: [], titles: [] }
  );
  const youtubeItems = await safeSource("youtube", () => fetchYouTube(redditTitles, docKeywords), []);
  const [twitterItems, newsItems, githubResult, blogItems] = await Promise.all([
    safeSource("twitter", () => fetchTwitter(), []),
    safeSource("news", () => fetchNews(), []),
    safeSource("github", () => fetchGitHubSkills(isUrlProcessed), { items: [], skillMetas: new Map() }),
    safeSource("blog", () => fetchBlogItems(isUrlProcessed), []),
  ]);

  const allItems = [...docsItems, ...youtubeItems, ...redditItems, ...twitterItems, ...newsItems, ...githubResult.items, ...blogItems];

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allItems, null, 2));

  const metaObj = Object.fromEntries(githubResult.skillMetas);
  fs.writeFileSync(SKILL_META_PATH, JSON.stringify(metaObj, null, 2));

  console.log("=== Summary ===");
  console.log(`  Docs:    ${docsItems.length} items`);
  console.log(`  YouTube: ${youtubeItems.length} items`);
  console.log(`  Reddit:  ${redditItems.length} items`);
  console.log(`  Twitter: ${twitterItems.length} items`);
  console.log(`  News:    ${newsItems.length} items`);
  console.log(`  GitHub:  ${githubResult.items.length} items (${githubResult.skillMetas.size} skill metas)`);
  console.log(`  Blog:    ${blogItems.length} items`);
  console.log(`  Total:   ${allItems.length} items saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
