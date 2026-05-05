import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { fetchDocsItems, extractFeatureKeywords } from "@/lib/sources/docs";

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched-docs.json");

async function main() {
  console.log("Fetching documentation sources...");
  const items = await fetchDocsItems();

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));

  console.log(`\n=== Docs Fetch Summary ===`);
  console.log(`  Releases: ${items.filter((i) => i.title?.startsWith("Claude Code v")).length}`);
  console.log(`  What's New: ${items.filter((i) => i.title?.startsWith("What's New")).length}`);
  console.log(`  Total: ${items.length} items saved to ${OUTPUT_PATH}`);

  if (items.length > 0) {
    const keywords = extractFeatureKeywords(items);
    console.log(`\n  Feature keywords extracted: ${keywords.length}`);
    console.log(`  Top keywords: ${keywords.slice(0, 10).join(", ")}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
