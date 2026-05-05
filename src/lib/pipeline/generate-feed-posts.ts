import { getAnthropicClient, MODEL } from "@/lib/ai/anthropic";
import { insertFeedPost } from "@/lib/supabase/queries";
import type { SourceUrl } from "@/types";

interface ArticleUpdate {
  contentId: string;
  isNew: boolean;
  sourcePlatforms: string[];
  sourceUrls: SourceUrl[];
}

const FEED_POST_TOOL = {
  name: "store_feed_post",
  description: "Store a feed post summarizing what's new.",
  input_schema: {
    type: "object" as const,
    properties: {
      headline: {
        type: "string",
        description:
          "One-line summary of what's new. Concise, informative, no clickbait. Example: 'New Claude Code harness patterns from 2 YouTube tutorials'",
      },
      summary: {
        type: "string",
        description:
          "2-4 bullet points with the key takeaways. Use markdown bullet syntax (- ). Each bullet should be one actionable insight.",
      },
    },
    required: ["headline", "summary"],
  },
};

const FEED_POST_SYSTEM_PROMPT = `You are writing feed posts for TipStack, a platform that curates AI workflow tips.

A feed post is a short alert that tells practitioners what just changed. It links to a longer article.

## Rules

1. **Headline:** One sentence, 60-100 characters. State what's new, not what the article is about. Good: "3 new cursor workflow shortcuts from Reddit". Bad: "Cursor Tips Collection".
2. **Summary:** 2-4 bullet points. Each bullet is one concrete takeaway. Use markdown bullets (- ).
3. **For updates to existing articles:** Emphasize what's NEW, not the full article scope.
4. **For new articles:** Summarize the key insights.
5. **No hype.** No "game-changing" or "revolutionary". Just state what's useful.`;

export async function generateFeedPosts(
  articleUpdates: ArticleUpdate[],
  pipelineRunId?: string
): Promise<number> {
  if (articleUpdates.length === 0) return 0;

  const client = getAnthropicClient();
  let feedPostsCreated = 0;

  for (const update of articleUpdates) {
    const sourceDesc = update.sourceUrls
      .map((s) => `- ${s.creator} (${s.platform}): ${s.url}`)
      .join("\n");

    const context = update.isNew
      ? "This is a brand new article created from the sources below."
      : "This is an update to an existing article with the new sources below.";

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: FEED_POST_SYSTEM_PROMPT,
      tools: [FEED_POST_TOOL],
      tool_choice: { type: "tool", name: "store_feed_post" },
      messages: [
        {
          role: "user",
          content: `Generate a feed post for this article update.

${context}

## Sources
${sourceDesc}

Platforms involved: ${update.sourcePlatforms.join(", ")}`,
        },
      ],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      throw new Error("Claude did not return a tool_use block for feed post generation");
    }

    const result = toolBlock.input as { headline: string; summary: string };

    await insertFeedPost({
      headline: result.headline,
      summary: result.summary,
      sourceUrls: update.sourceUrls,
      topicContentId: update.contentId,
      sourcePlatforms: update.sourcePlatforms,
      pipelineRunId,
    });

    feedPostsCreated++;
  }

  return feedPostsCreated;
}
