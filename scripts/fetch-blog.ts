import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { fetchBlogItems } from "@/lib/sources/blog";
import { isUrlProcessed } from "./lib/shared";

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched-blog.json");

async function main() {
  console.log("Fetching AI blog feeds...");
  const items = await fetchBlogItems(isUrlProcessed);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));

  console.log(`\n=== Blog Fetch Summary ===`);
  console.log(`  Total: ${items.length} items saved to ${OUTPUT_PATH}`);
  for (const item of items.slice(0, 10)) {
    console.log(`  - ${item.creator}: ${item.title}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
