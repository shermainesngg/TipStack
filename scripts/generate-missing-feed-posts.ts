import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { callClaudeCode } from "../src/lib/ai/claude-code";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const FEED_POST_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
  },
  required: ["headline", "summary"],
};

async function main() {
  // Step 1: Publish all pending_review articles
  const { data: pending, error: pendingErr } = await sb
    .from("content")
    .select("id, title")
    .eq("status", "pending_review");

  if (pendingErr) throw pendingErr;

  if (pending && pending.length > 0) {
    console.log(`Publishing ${pending.length} pending articles...\n`);
    const { error: updateErr } = await sb
      .from("content")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("status", "pending_review");
    if (updateErr) throw updateErr;
    for (const a of pending) {
      console.log(`  Published: ${a.title}`);
    }
    console.log();
  }

  // Step 2: Find published content without feed posts
  const { data: content } = await sb
    .from("content")
    .select("id, title, summary, source_urls, tags_tool, status")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (!content || content.length === 0) {
    console.log("No content found.");
    return;
  }

  let created = 0;
  let skipped = 0;
  for (const article of content) {
    const { data: existing } = await sb
      .from("feed_posts")
      .select("id")
      .eq("topic_content_id", article.id)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    console.log(`Generating feed post for: ${article.title}`);

    const sources = (article.source_urls || []) as { url: string; platform: string; creator: string }[];
    const sourceDesc = sources.length > 0
      ? sources.map((s) => `- ${s.creator} (${s.platform}): ${s.url}`).join("\n")
      : "(no sources)";
    const platforms = [...new Set(sources.map((s) => s.platform))];

    try {
      const result = await callClaudeCode<{ headline: string; summary: string }>({
        systemPrompt: `Write a feed post for TipStack. Headline: 60-100 chars, what's new. Summary: 2-4 markdown bullets with key takeaways. No hype. JSON only.`,
        userMessage: `Generate a feed post.\n\nTitle: ${article.title}\nSummary: ${article.summary}\n\nSources:\n${sourceDesc}`,
        jsonSchema: FEED_POST_SCHEMA,
      });

      await sb.from("feed_posts").insert({
        headline: result.headline,
        summary: result.summary,
        source_urls: sources,
        topic_content_id: article.id,
        source_platforms: platforms,
      });

      console.log(`  -> ${result.headline}`);
      created++;
    } catch (err) {
      console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nDone. Published: ${pending?.length || 0}, Feed posts created: ${created}, Skipped (already had posts): ${skipped}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
