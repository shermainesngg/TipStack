import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { fetchGitHubSkills } from "../src/lib/sources/github-skills";
import { isUrlProcessed } from "./lib/shared";

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched-github-skills.json");
const META_PATH = path.resolve(__dirname, "data", "skill-meta.json");

async function main() {
  console.log("Fetching GitHub skills...\n");

  const { items, skillMetas } = await fetchGitHubSkills(isUrlProcessed);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));

  const metaObj = Object.fromEntries(skillMetas);
  fs.writeFileSync(META_PATH, JSON.stringify(metaObj, null, 2));

  console.log(`\n=== GitHub Skills Summary ===`);
  console.log(`  Skills discovered: ${items.length}`);
  console.log(`  Items saved to: ${OUTPUT_PATH}`);
  console.log(`  Metadata saved to: ${META_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
