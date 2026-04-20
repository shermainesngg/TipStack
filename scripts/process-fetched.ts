import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { extractItem } from "../src/lib/pipeline/ingest";
import { dedupAndFilter } from "../src/lib/pipeline/dedup";
import { synthesize } from "../src/lib/pipeline/synthesize";
import {
  isUrlProcessed,
  insertRawContent,
  logProcessedUrl,
} from "../src/lib/supabase/queries";
import type { FetchedItem } from "../src/types";

const INPUT_PATH = path.resolve(__dirname, "data", "fetched.json");
const OUTPUT_PATH = path.resolve(__dirname, "data", "content-pieces.json");
const BATCH_DATE = new Date().toISOString().split("T")[0];

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`File not found: ${INPUT_PATH}`);
    process.exit(1);
  }

  const items: FetchedItem[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  console.log(`Processing ${items.length} fetched items (batch: ${BATCH_DATE})\n`);

  // Step 1: Extract + ingest each item
  let ingested = 0;
  let skipped = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const label = `[${i + 1}/${items.length}]`;

    const alreadyProcessed = await isUrlProcessed(item.url);
    if (alreadyProcessed) {
      console.log(`${label} SKIP (already processed): ${item.url}`);
      skipped++;
      continue;
    }

    try {
      console.log(`${label} Extracting: ${item.title || item.url}`);
      const extraction = await extractItem(item);

      await insertRawContent({
        sourceUrl: item.url,
        platform: item.platform,
        rawExtract: extraction,
        batchDate: BATCH_DATE,
      });

      await logProcessedUrl(item.url, item.platform);
      ingested++;
      console.log(`${label} OK (quality: ${extraction.quality_signal})`);
    } catch (err) {
      console.error(`${label} ERROR: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n=== Extraction complete ===`);
  console.log(`  Ingested: ${ingested}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${items.length - ingested - skipped}\n`);

  if (ingested === 0) {
    console.log("No new items to process. Done.");
    return;
  }

  // Step 2: Dedup + quality filter
  console.log("Running dedup + quality filter...");
  const keptIds = await dedupAndFilter(BATCH_DATE);
  console.log(`  Kept: ${keptIds.length} / ${ingested} items\n`);

  if (keptIds.length === 0) {
    console.log("All items filtered out. Done.");
    return;
  }

  // Step 3: Synthesize into publishable content
  console.log("Running synthesis...");
  const piecesCreated = await synthesize(BATCH_DATE);
  console.log(`  Created: ${piecesCreated} content pieces\n`);

  console.log("=== Pipeline complete ===");
  console.log(`  Fetched:   ${items.length}`);
  console.log(`  Ingested:  ${ingested}`);
  console.log(`  Kept:      ${keptIds.length}`);
  console.log(`  Published: ${piecesCreated} pieces (status: pending_review)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
