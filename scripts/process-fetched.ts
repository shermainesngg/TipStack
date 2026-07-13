// Shim server-only BEFORE any pipeline imports
import "./lib/shim-server-only";

import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { ingestBatch } from "../src/lib/pipeline/ingest";
import { codeDedup } from "../src/lib/pipeline/dedup";
import { matchAndUpdateArticles } from "../src/lib/pipeline/match-articles";
import { generateFeedPosts } from "../src/lib/pipeline/generate-feed-posts";
import { generateDailyBrief, fallbackDailyBrief } from "../src/lib/pipeline/generate-daily-brief";
import { populateSkills } from "../src/lib/pipeline/populate-skills";
import { isUrlProcessed, updateRawContentStatus, getRecentFeedPosts, upsertDailyBrief } from "../src/lib/supabase/queries";
import type { FetchedItem, FetchedSkillMeta } from "../src/types";

const INPUT_PATH = path.resolve(__dirname, "data", "fetched.json");
const SKILL_META_PATH = path.resolve(__dirname, "data", "skill-meta.json");
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

  // Step 2.5: Populate skills table from GitHub skill metadata
  if (fs.existsSync(SKILL_META_PATH)) {
    console.log("Populating skills table...");
    const metaObj: Record<string, FetchedSkillMeta> = JSON.parse(
      fs.readFileSync(SKILL_META_PATH, "utf-8")
    );
    const skillMetas = new Map(Object.entries(metaObj));
    const skillMap = await populateSkills(skillMetas);
    console.log(`  Skills populated: ${skillMap.size}\n`);
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

  // Step 6: Generate today's daily brief digest.
  // Failures here must be LOUD, never silently swallowed: a green run must not
  // be able to hide a missing brief (see the July 2026 gap that went unnoticed).
  console.log("Generating daily brief...");
  let briefStatus: "ok" | "fallback" | "no-posts" | "failed" = "failed";
  try {
    const today = new Date().toISOString().slice(0, 10);
    const recent = await getRecentFeedPosts(1, 100);
    const todays = recent.filter(
      (p) => new Date(p.published_at).toISOString().slice(0, 10) === today
    );
    if (todays.length === 0) {
      briefStatus = "no-posts";
      console.warn(
        `  ⚠ No feed posts dated ${today} — brief skipped (scanned ${recent.length} recent posts).`
      );
    } else {
      let brief;
      try {
        brief = await generateDailyBrief(todays);
        briefStatus = "ok";
      } catch (genErr) {
        brief = fallbackDailyBrief(todays);
        briefStatus = "fallback";
        console.warn(
          `  ⚠ AI brief generation failed, using deterministic fallback: ${
            genErr instanceof Error ? genErr.message : genErr
          }`
        );
      }
      await upsertDailyBrief({
        briefDate: today,
        headline: brief.headline,
        summary: brief.summary,
        storyCount: todays.length,
      });
      console.log(
        `  Brief${briefStatus === "fallback" ? " (fallback)" : ""}: "${brief.headline}" (${todays.length} stories)\n`
      );
    }
  } catch (err) {
    briefStatus = "failed";
    console.error(
      `  ✗ Brief generation FAILED: ${err instanceof Error ? err.stack || err.message : err}\n`
    );
  }

  console.log("=== Pipeline complete ===");
  console.log(`  Fetched:      ${items.length}`);
  console.log(`  Ingested:     ${ingested.length}`);
  console.log(`  Kept:         ${kept.length}`);
  console.log(`  Articles:     ${articleUpdates.length}`);
  console.log(`  Feed posts:   ${feedPostsCreated}`);
  console.log(`  Daily brief:  ${briefStatus}`);

  // A genuine brief failure exits non-zero so the GitHub Actions run goes red
  // and we notice — the rest of the pipeline has already persisted its work.
  if (briefStatus === "failed") {
    process.exitCode = 1;
    console.error(
      "\n✗ Pipeline persisted content but the daily brief did not generate. " +
        "Backfill with: npx tsx scripts/backfill-briefs.ts"
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
