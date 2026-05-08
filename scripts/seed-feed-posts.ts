import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { callClaudeCode } from "../src/lib/ai/claude-code";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const FEED_POST_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description:
        "One-line summary of what's new. Concise, informative, no clickbait.",
    },
    summary: {
      type: "string",
      description:
        "2-4 bullet points with the key takeaways. Use markdown bullet syntax (- ).",
    },
  },
  required: ["headline", "summary"],
};

const SYSTEM_PROMPT = `You are writing feed posts for TipStack, a platform that curates AI workflow tips.

A feed post is a short alert that tells practitioners what just changed. It links to a longer article.

## Rules

1. **Headline:** One sentence, 60-100 characters. State what's new, not what the article is about.
2. **Summary:** 2-4 bullet points. Each bullet is one concrete takeaway. Use markdown bullets (- ).
3. **For new articles:** Summarize the key insights.
4. **No hype.** No "game-changing" or "revolutionary". Just state what's useful.

Respond with valid JSON matching the schema provided.`;

async function main() {
  const { data: articles, error } = await supabase
    .from("content")
    .select("id, title, source_urls, tags_tool, summary")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch content:", error.message);
    process.exit(1);
  }

  console.log(`Generating feed posts for ${articles.length} articles...\n`);

  let created = 0;

  for (const article of articles) {
    const sourceUrls = article.source_urls ?? [];
    const sourceDesc = sourceUrls
      .map((s: any) => `- ${s.creator} (${s.platform}): ${s.url}`)
      .join("\n");
    const platforms = [...new Set(sourceUrls.map((s: any) => s.platform))];

    try {
      const result = await callClaudeCode<{ headline: string; summary: string }>({
        systemPrompt: SYSTEM_PROMPT,
        userMessage: `Generate a feed post for this new article.

**Title:** ${article.title}
**Summary:** ${article.summary ?? ""}

## Sources
${sourceDesc}

Platforms involved: ${platforms.join(", ")}`,
        jsonSchema: FEED_POST_SCHEMA,
      });

      const { error: insertError } = await supabase.from("feed_posts").insert({
        headline: result.headline,
        summary: result.summary,
        source_urls: sourceUrls,
        topic_content_id: article.id,
        source_platforms: platforms,
      });

      if (insertError) {
        console.error(`  FAIL "${article.title}": ${insertError.message}`);
        continue;
      }

      console.log(`  OK: "${result.headline}"`);
      created++;
    } catch (err) {
      console.error(
        `  ERROR "${article.title}": ${err instanceof Error ? err.message : err}`
      );
    }
  }

  console.log(`\nDone. Created ${created}/${articles.length} feed posts.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
