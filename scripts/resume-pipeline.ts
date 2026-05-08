import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { matchAndUpdateArticles } from "../src/lib/pipeline/match-articles";
import { generateFeedPosts } from "../src/lib/pipeline/generate-feed-posts";

const BATCH_DATE = process.argv[2] || "2026-05-05";

async function main() {
  console.log(`Resuming pipeline from match-articles (batch: ${BATCH_DATE})\n`);

  console.log("Running article matching & synthesis...");
  const articleUpdates = await matchAndUpdateArticles(BATCH_DATE);
  console.log(`  Articles created/updated: ${articleUpdates.length}`);
  console.log(`  New: ${articleUpdates.filter(a => a.isNew).length}`);
  console.log(`  Updated: ${articleUpdates.filter(a => !a.isNew).length}\n`);

  console.log("Generating feed posts...");
  const feedPostsCreated = await generateFeedPosts(articleUpdates);
  console.log(`  Feed posts created: ${feedPostsCreated}\n`);

  console.log("=== Pipeline complete ===");
  console.log(`  Articles:     ${articleUpdates.length}`);
  console.log(`  Feed posts:   ${feedPostsCreated}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
