import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const INPUT_PATH = path.resolve(__dirname, "data", "content-pieces.json");
const TODAY = new Date().toISOString().split("T")[0];

interface ContentPiece {
  title: string;
  slug: string;
  summary: string;
  body: string;
  content_type: string;
  tags_tool: string[];
  tags_focus: string[];
  tags_workflow: string[];
  tags_domain: string[];
  tags_category: string;
  source_urls: { url: string; platform: "youtube" | "reddit"; creator: string }[];
}

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`File not found: ${INPUT_PATH}`);
    console.error("Create scripts/data/content-pieces.json first.");
    process.exit(1);
  }

  const pieces: ContentPiece[] = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));
  console.log(`Pushing ${pieces.length} content pieces to Supabase...\n`);

  let successCount = 0;

  for (const piece of pieces) {
    const uniqueSlug = `${piece.slug}-${TODAY}`;

    // Insert into content table
    const { error: contentError } = await supabase.from("content").upsert(
      {
        title: piece.title,
        slug: uniqueSlug,
        summary: piece.summary,
        body: piece.body,
        content_type: piece.content_type,
        status: "published",
        tags_tool: piece.tags_tool,
        tags_focus: piece.tags_focus,
        tags_workflow: piece.tags_workflow,
        tags_domain: piece.tags_domain,
        tags_category: piece.tags_category,
        source_urls: piece.source_urls,
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );

    if (contentError) {
      console.error(`  FAIL "${piece.title}": ${contentError.message}`);
      continue;
    }

    // Log source URLs
    for (const src of piece.source_urls) {
      await supabase
        .from("sources_log")
        .upsert({ url: src.url, platform: src.platform }, { onConflict: "url" });
    }

    console.log(`  OK: "${piece.title}" → /${uniqueSlug}`);
    successCount++;
  }

  console.log(`\nDone. ${successCount}/${pieces.length} pieces published.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
