import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { ingestBatch } from "../src/lib/pipeline/ingest";
import { codeDedup } from "../src/lib/pipeline/dedup";
import { matchAndUpdateArticles } from "../src/lib/pipeline/match-articles";
import { generateFeedPosts } from "../src/lib/pipeline/generate-feed-posts";
import { isUrlProcessed, updateRawContentStatus } from "../src/lib/supabase/queries";
import type { FetchedItem } from "../src/types";

const INPUT_PATH = path.resolve(__dirname, "data", "fetched.json");
const BATCH_DATE = new Date().toISOString().split("T")[0];

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`File not found: ${INPUT_PATH}`);
    process.exit(1);
  }

  const items: FetchedItem[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  console.log(`Processing ${items.length} fetched items (batch: ${BATCH_DATE})\n`);

  // Step 1: Filter out already-processed URLs
  const toProcess: FetchedItem[] = [];
  let skipped = 0;

  for (const item of items) {
    if (await isUrlProcessed(item.url)) {
      skipped++;
    } else {
      toProcess.push(item);
    }
  }

  console.log(`${toProcess.length} new items, ${skipped} already processed\n`);

  if (toProcess.length === 0) {
    console.log("No new items to process. Done.");
    return;
  }

  // Step 2: Batch extract + ingest (5 items per Claude call, batches run concurrently)
  console.log("Running batch extraction...");
  const { ingested, failed } = await ingestBatch(toProcess, BATCH_DATE);
  console.log(`\n=== Extraction complete ===`);
  console.log(`  Ingested: ${ingested.length}`);
  console.log(`  Failed:   ${failed.length}\n`);

  if (ingested.length === 0) {
    console.log("No items ingested. Done.");
    return;
  }

  // Step 3: Code-based dedup + quality filter (no Claude call — uses quality_score from extraction)
  console.log("Running quality filter + dedup...");
  const { kept, discarded } = await codeDedup(BATCH_DATE);
  console.log(`  Kept: ${kept.length}, Discarded: ${discarded.length}\n`);

  if (kept.length === 0) {
    console.log("All items filtered out. Done.");
    return;
  }

  // Step 4: Match & update articles
  console.log("Running article matching & synthesis...");
  const articleUpdates = await matchAndUpdateArticles(BATCH_DATE);
  console.log(`  Articles created/updated: ${articleUpdates.length}`);
  console.log(`  New: ${articleUpdates.filter(a => a.isNew).length}`);
  console.log(`  Updated: ${articleUpdates.filter(a => !a.isNew).length}\n`);

  // Step 5: Generate feed posts
  console.log("Generating feed posts...");
  const feedPostsCreated = await generateFeedPosts(articleUpdates);
  console.log(`  Feed posts created: ${feedPostsCreated}\n`);

  console.log("=== Pipeline complete ===");
  console.log(`  Fetched:      ${items.length}`);
  console.log(`  Ingested:     ${ingested.length}`);
  console.log(`  Kept:         ${kept.length}`);
  console.log(`  Articles:     ${articleUpdates.length}`);
  console.log(`  Feed posts:   ${feedPostsCreated}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
