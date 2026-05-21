import { callClaudeCode, pMap } from "@/lib/ai/claude-code";
import { insertFeedPost, pruneOldFeedPosts } from "@/lib/supabase/queries";
import { createServiceClient } from "@/lib/supabase/server";
import type { SourceUrl } from "@/types";

interface ArticleUpdate {
  contentId: string;
  isNew: boolean;
  sourcePlatforms: string[];
  sourceUrls: SourceUrl[];
}

async function getContentById(contentId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("content")
    .select("title, summary")
    .eq("id", contentId)
    .single();
  return data;
}

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

1. **Headline:** One sentence, 60-100 characters. State the actual update, feature, or technique — not the source or article. Never mention platforms, creators, or counts. Good: "Claude Code supports agentic workflows in projects". Bad: "Two YouTube creators share agentic workflow tips".
2. **Summary:** 1-2 sentences of plain prose. Concise and actionable. No bullet points.
3. **For updates to existing articles:** Emphasize what's NEW, not the full article scope.
4. **For new articles:** Summarize the key insights.
5. **No hype.** No "game-changing" or "revolutionary". Just state what's useful.
6. **Priority:** Rate urgency 1-10. Reserve 9-10 for breaking changes/security issues. Most tips are 5-6.
7. **Do NOT fetch, visit, or access any URLs.** All the context you need is provided in the prompt.

Respond with valid JSON matching the schema provided.`;

const MAX_FEED_POSTS_PER_RUN = 8;
const MIN_PRIORITY = 5;

interface FeedPostCandidate {
  headline: string;
  summary: string;
  priority: number;
  update: ArticleUpdate;
}

export async function generateFeedPosts(
  articleUpdates: ArticleUpdate[],
  pipelineRunId?: string
): Promise<number> {
  if (articleUpdates.length === 0) return 0;

  const candidates: FeedPostCandidate[] = [];

  await pMap(articleUpdates, async (update) => {
    const article = await getContentById(update.contentId);
    const articleTitle = article?.title ?? "Untitled";
    const articleSummary = article?.summary ?? "";

    const sourceDesc = update.sourceUrls
      .map((s) => `- ${s.creator} (${s.platform})`)
      .join("\n");

    const context = update.isNew
      ? "This is a brand new article created from the sources below."
      : "This is an update to an existing article with the new sources below.";

    const result = await callClaudeCode<{ headline: string; summary: string; priority: number }>({
      systemPrompt: FEED_POST_SYSTEM_PROMPT,
      userMessage: `Generate a feed post for this article update.

${context}

**Article Title:** ${articleTitle}
**Article Summary:** ${articleSummary}

## Sources
${sourceDesc}

Platforms involved: ${update.sourcePlatforms.join(", ")}`,
      jsonSchema: FEED_POST_SCHEMA,
    });

    candidates.push({
      headline: result.headline,
      summary: result.summary,
      priority: Math.max(1, Math.min(10, Math.round(result.priority))),
      update,
    });
  });

  const toPublish = candidates
    .filter((c) => c.priority >= MIN_PRIORITY)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_FEED_POSTS_PER_RUN);

  for (const candidate of toPublish) {
    await insertFeedPost({
      headline: candidate.headline,
      summary: candidate.summary,
      priority: candidate.priority,
      sourceUrls: candidate.update.sourceUrls,
      topicContentId: candidate.update.contentId,
      sourcePlatforms: candidate.update.sourcePlatforms,
      pipelineRunId,
    });
  }

  await pruneOldFeedPosts(16);

  return toPublish.length;
}
