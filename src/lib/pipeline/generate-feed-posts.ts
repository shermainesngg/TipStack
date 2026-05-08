import { callClaudeCode, pMap } from "@/lib/ai/claude-code";
import { insertFeedPost } from "@/lib/supabase/queries";
import type { SourceUrl } from "@/types";

interface ArticleUpdate {
  contentId: string;
  isNew: boolean;
  sourcePlatforms: string[];
  sourceUrls: SourceUrl[];
}

const FEED_POST_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description:
        "One-line summary of what's new. Concise, informative, no clickbait. Example: 'New Claude Code harness patterns from 2 YouTube tutorials'",
    },
    summary: {
      type: "string",
      description:
        "A short, succinct 1-2 sentence summary of the key takeaways. Plain prose, no bullet points.",
    },
  },
  required: ["headline", "summary"],
};

const FEED_POST_SYSTEM_PROMPT = `You are writing feed posts for TipStack, a platform that curates AI workflow tips.

A feed post is a short alert that tells practitioners what just changed. It links to a longer article.

## Rules

1. **Headline:** One sentence, 60-100 characters. State what's new, not what the article is about. Good: "3 new cursor workflow shortcuts from Reddit". Bad: "Cursor Tips Collection".
2. **Summary:** 1-2 sentences of plain prose. Concise and actionable. No bullet points.
3. **For updates to existing articles:** Emphasize what's NEW, not the full article scope.
4. **For new articles:** Summarize the key insights.
5. **No hype.** No "game-changing" or "revolutionary". Just state what's useful.

Respond with valid JSON matching the schema provided.`;

export async function generateFeedPosts(
  articleUpdates: ArticleUpdate[],
  pipelineRunId?: string
): Promise<number> {
  if (articleUpdates.length === 0) return 0;

  await pMap(articleUpdates, async (update) => {
    const sourceDesc = update.sourceUrls
      .map((s) => `- ${s.creator} (${s.platform}): ${s.url}`)
      .join("\n");

    const context = update.isNew
      ? "This is a brand new article created from the sources below."
      : "This is an update to an existing article with the new sources below.";

    const result = await callClaudeCode<{ headline: string; summary: string }>({
      systemPrompt: FEED_POST_SYSTEM_PROMPT,
      userMessage: `Generate a feed post for this article update.

${context}

## Sources
${sourceDesc}

Platforms involved: ${update.sourcePlatforms.join(", ")}`,
      jsonSchema: FEED_POST_SCHEMA,
    });

    await insertFeedPost({
      headline: result.headline,
      summary: result.summary,
      sourceUrls: update.sourceUrls,
      topicContentId: update.contentId,
      sourcePlatforms: update.sourcePlatforms,
      pipelineRunId,
    });
  });

  return articleUpdates.length;
}
