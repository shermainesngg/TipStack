import fs from "fs";
import path from "path";
import { fetchYouTube } from "./fetch-youtube";
import { fetchReddit } from "./fetch-reddit";
import { fetchTwitter } from "./fetch-twitter";
import { fetchNews } from "./fetch-news";

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched.json");

async function main() {
  // Reddit runs first — its titles feed YouTube search discovery
  const { items: redditItems, titles: redditTitles } = await fetchReddit();
  const youtubeItems = await fetchYouTube(redditTitles);
  const [twitterItems, newsItems] = await Promise.all([
    fetchTwitter(),
    fetchNews(),
  ]);

  const allItems = [...youtubeItems, ...redditItems, ...twitterItems, ...newsItems];

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allItems, null, 2));

  console.log("=== Summary ===");
  console.log(`  YouTube: ${youtubeItems.length} items`);
  console.log(`  Reddit:  ${redditItems.length} items`);
  console.log(`  Twitter: ${twitterItems.length} items`);
  console.log(`  News:    ${newsItems.length} items`);
  console.log(`  Total:   ${allItems.length} items saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
