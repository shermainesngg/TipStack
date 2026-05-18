import "./lib/shim-server-only";

import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { callClaudeCode, pMap } from "@/lib/ai/claude-code";
import { createServiceClient } from "@/lib/supabase/server";

const FEED_POST_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description:
        "One-line summary of the actual update or capability. Focus on what changed or what's useful, not where it came from. Example: 'Claude Code supports agentic workflows in projects'",
    },
    summary: {
      type: "string",
      description:
        "A short, succinct 1-2 sentence summary of the key takeaways. Plain prose, no bullet points.",
    },
  },
  required: ["headline", "summary"],
};

const SYSTEM_PROMPT = `You are rewriting feed post headlines for TipStack.

## Rules
1. **Headline:** One sentence, 60-100 characters. State the actual update, feature, or technique. Never mention platforms (YouTube, Reddit, HN), creators, or source counts. Good: "Claude Code supports agentic workflows in projects". Bad: "Two YouTube creators share agentic workflow tips".
2. **Summary:** 1-2 sentences of plain prose. Focus on the takeaway, not the sources.
3. **No hype.** No "game-changing" or "revolutionary". Just state what's useful.

Respond with valid JSON matching the schema provided.`;

async function main() {
  const supabase = createServiceClient();

  const { data: posts, error } = await supabase
    .from("feed_posts")
    .select("id, headline, summary, topic_content_id")
    .order("created_at", { ascending: false });

  if (error) throw error;
  console.log(`Found ${posts.length} feed posts to regenerate.\n`);

  let updated = 0;

  await pMap(posts, async (post) => {
    const { data: article } = await supabase
      .from("content")
      .select("title, summary")
      .eq("id", post.topic_content_id)
      .single();

    if (!article) {
      console.log(`  SKIP (no article): ${post.headline}`);
      return;
    }

    const result = await callClaudeCode<{ headline: string; summary: string }>({
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Rewrite this feed post headline and summary to focus on the actual update, not the sources.

**Current headline:** ${post.headline}
**Current summary:** ${post.summary}

**Article title:** ${article.title}
**Article summary:** ${article.summary}`,
      jsonSchema: FEED_POST_SCHEMA,
    });

    const { error: updateErr } = await supabase
      .from("feed_posts")
      .update({ headline: result.headline, summary: result.summary })
      .eq("id", post.id);

    if (updateErr) {
      console.log(`  ERROR: ${post.id} — ${updateErr.message}`);
    } else {
      updated++;
      console.log(`  "${post.headline}" → "${result.headline}"`);
    }
  }, 3);

  console.log(`\nDone. Updated ${updated}/${posts.length} feed posts.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
