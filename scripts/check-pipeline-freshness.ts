// Shim server-only BEFORE any supabase imports
import "./lib/shim-server-only";

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { createServiceClient } from "../src/lib/supabase/server";

const PLATFORMS = ["youtube", "reddit", "twitter", "news", "docs", "blog", "github"];

async function main() {
  const client = createServiceClient();
  const now = Date.now();
  const ago = (ts: string) => `${((now - new Date(ts).getTime()) / 86400000).toFixed(1)}d ago`;

  console.log("=== latest feed_post per source_platform ===");
  for (const p of PLATFORMS) {
    const { data, error } = await client
      .from("feed_posts")
      .select("published_at, headline")
      .contains("source_platforms", [p])
      .order("published_at", { ascending: false })
      .limit(1);
    if (error) {
      console.log(`  ${p.padEnd(8)} ERROR ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`  ${p.padEnd(8)} (none)`);
    } else {
      const r = data[0];
      console.log(`  ${p.padEnd(8)} ${r.published_at}  (${ago(r.published_at)})`);
    }
  }

  // Also: raw_content per platform (what the fetchers are actually pulling)
  console.log("\n=== latest raw_content per platform ===");
  for (const p of PLATFORMS) {
    const { data, error } = await client
      .from("raw_content")
      .select("created_at, platform")
      .eq("platform", p)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      console.log(`  ${p.padEnd(8)} ERROR ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`  ${p.padEnd(8)} (none)`);
    } else {
      console.log(`  ${p.padEnd(8)} ${data[0].created_at}  (${ago(data[0].created_at)})`);
    }
  }
}

main().then(() => process.exit(0));
