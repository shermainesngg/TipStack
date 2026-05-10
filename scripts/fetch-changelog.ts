// Shim server-only BEFORE any pipeline imports
import "./lib/shim-server-only";

import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { fetchAndClassifyChangelog } from "@/lib/sources/anthropic-changelog";

async function main() {
  console.log("Fetching Anthropic changelog entries...\n");

  const result = await fetchAndClassifyChangelog();

  console.log(`\n=== Changelog Fetch Summary ===`);
  console.log(`  Inserted: ${result.inserted} new entries`);
  console.log(`  Skipped:  ${result.skipped} already processed`);
  if (result.errors > 0) {
    console.log(`  Errors:   ${result.errors}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
