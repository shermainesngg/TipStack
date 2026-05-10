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
    priority: {
      type: "number",
      description:
        "Urgency/importance score from 1-10. 9-10: breaking changes, major releases, security advisories. 7-8: significant new features, important updates. 5-6: useful but not urgent. 3-4: minor updates, nice-to-know. 1-2: trivial or redundant.",
    },
  },
  required: ["headline", "summary", "priority"],
};

const FEED_POST_SYSTEM_PROMPT = `You are writing feed posts for TipStack, a platform that curates AI workflow tips.

A feed post is a short alert that tells practitioners what just changed. It links to a longer article.

## Rules

1. **Headline:** One sentence, 60-100 characters. State what's new, not what the article is about. Good: "3 new cursor workflow shortcuts from Reddit". Bad: "Cursor Tips Collection".
2. **Summary:** 1-2 sentences of plain prose. Concise and actionable. No bullet points.
3. **For updates to existing articles:** Emphasize what's NEW, not the full article scope.
4. **For new articles:** Summarize the key insights.
5. **No hype.** No "game-changing" or "revolutionary". Just state what's useful.
6. **Priority:** Rate urgency 1-10. Reserve 9-10 for breaking changes/security issues. Most tips are 5-6.

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

    const result = await callClaudeCode<{ headline: string; summary: string; priority: number }>({
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
      priority: Math.max(1, Math.min(10, Math.round(result.priority))),
      sourceUrls: update.sourceUrls,
      topicContentId: update.contentId,
      sourcePlatforms: update.sourcePlatforms,
      pipelineRunId,
    });
  });

  return articleUpdates.length;
}
