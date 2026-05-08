import { callClaudeCode } from "@/lib/ai/claude-code";
import {
  getRawContentByStatus,
  findMatchingArticle,
  updateContentArticle,
  insertContent,
  updateRawContentStatus,
  getSubTopicsForCategory,
} from "@/lib/supabase/queries";
import type { RawContent, Content, ContentSummary, SourceUrl, FetchedItem, SynthesizedPiece } from "@/types";

const RESYNTHESIZE_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Updated title (may stay the same if still accurate)",
    },
    summary: {
      type: "string",
      description: "Updated 2-3 sentence summary for card display",
    },
    body: {
      type: "string",
      description:
        "Full rewritten article body in markdown. Rewrite from scratch incorporating all sources — do not append.",
    },
    tags_tool: {
      type: "array",
      items: { type: "string" },
      description: "Updated tool tags (union of existing + new)",
    },
    tags_focus: {
      type: "array",
      items: { type: "string" },
      description: "Updated focus tags",
    },
    tags_workflow: {
      type: "array",
      items: { type: "string" },
      description: "Updated workflow tags",
    },
    tags_domain: {
      type: "array",
      items: { type: "string" },
      description: "Updated domain tags",
    },
    community_notes: {
      type: "array",
      items: { type: "string" },
      description: "Conflicting or supplementary community observations (if any)",
    },
    sub_topic: {
      type: "string",
      description: "Human-friendly sub-topic name (2-4 words, title case) for grouping within the category page",
    },
    sources_attribution: {
      type: "array",
      items: {
        type: "object",
        properties: {
          platform: { type: "string" },
          creator: { type: "string" },
          url: { type: "string" },
          contribution_summary: { type: "string" },
        },
        required: ["platform", "creator", "url", "contribution_summary"],
      },
      description: "Attribution for each source that contributed to this article",
    },
  },
  required: [
    "title",
    "summary",
    "body",
    "tags_tool",
    "tags_focus",
    "tags_workflow",
    "tags_domain",
    "sub_topic",
  ],
};

const RESYNTHESIZE_SYSTEM_PROMPT = `You are rewriting a living article for TipStack, a platform that curates actionable AI workflow tips.

You receive an existing published article and new source material that covers the same topic. Your job is to FULLY REWRITE the article from scratch, incorporating all source material into one cohesive piece.

## Rules

1. **Rewrite from scratch.** Do not append or patch. The output must read as one cohesive piece, not a patchwork of additions.
2. **Source authority.** Official documentation is canonical. Community content adds examples, gotchas, and practical context but does not override official docs.
3. **Community notes.** If community sources conflict with official docs, include as a clearly labeled community note: "Community insight: some users report [X]". Return these in the community_notes array.
4. **Write for practitioners.** Specific techniques, real commands, concrete examples.
5. **Format for scannability.** Use ## headings, bullet points, bold, and code blocks.
6. **Keep it 300-1200 words.** Articles can grow but should stay focused.
7. **Merge tags.** Return the union of existing and new tags where appropriate.
8. **Sub-topic.** Assign or keep a human-friendly sub-topic name (2-4 words, title case) for grouping on the category page.
9. **Sources section.** Include a "Sources" section at the end listing: source type, creator name, and link.

Respond with valid JSON matching the schema provided.`;

const NEW_ARTICLE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string", description: "URL-safe slug, lowercase, hyphens only" },
    summary: { type: "string" },
    body: { type: "string" },
    content_type: {
      type: "string",
      enum: ["quick_tip", "deep_dive", "roundup", "update"],
    },
    tags_tool: { type: "array", items: { type: "string" } },
    tags_focus: { type: "array", items: { type: "string" } },
    tags_workflow: { type: "array", items: { type: "string" } },
    tags_domain: { type: "array", items: { type: "string" } },
    tags_category: {
      type: "string",
      enum: [
        "claude_code_features",
        "security_and_guardrails",
        "github_skills",
        "prompting_and_rules",
        "workflow_patterns",
        "mcp_and_integrations",
        "debugging_and_testing",
      ],
    },
    sub_topic: {
      type: "string",
      description: "Human-friendly sub-topic name (2-4 words, title case) for grouping within the category page. Examples: 'System Prompts', 'Hook Patterns', 'Git Workflows'.",
    },
  },
  required: [
    "title", "slug", "summary", "body", "content_type",
    "tags_tool", "tags_focus", "tags_workflow", "tags_domain", "tags_category", "sub_topic",
  ],
};

const SPLIT_SCHEMA = {
  type: "object",
  properties: {
    pieces: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug_suffix: { type: "string" },
          body: { type: "string" },
          tags_focus: { type: "array", items: { type: "string" } },
        },
        required: ["title", "slug_suffix", "body", "tags_focus"],
      },
    },
  },
  required: ["pieces"],
};

interface MatchResult {
  contentId: string;
  isNew: boolean;
  sourcePlatforms: string[];
  sourceUrls: SourceUrl[];
}

export async function matchAndUpdateArticles(
  batchDate: string
): Promise<MatchResult[]> {
  const items = await getRawContentByStatus("filtered", batchDate);
  if (items.length === 0) return [];

  const groups = groupByTopic(items);
  const results: MatchResult[] = [];

  for (const group of groups) {
    const tagsTool = dedupeStrings(group.flatMap((i) => i.raw_extract.tags_tool));
    const tagsFocus = dedupeStrings(group.flatMap((i) => i.raw_extract.tags_focus));

    const sourceUrls: SourceUrl[] = group.map((i) => ({
      url: i.source_url,
      platform: i.platform,
      creator: i.raw_extract.source_creator,
    }));
    const sourcePlatforms = dedupeStrings(group.map((i) => i.platform));

    const match = await findMatchingArticle(tagsTool, tagsFocus);

    if (match) {
      await resynthesizeArticle(match, group);

      if (checkArticleSize(match.body)) {
        const subPieces = await splitArticle(match, group);
        for (const piece of subPieces) {
          const subId = await insertContent({
            title: piece.title,
            slug: piece.slug,
            summary: piece.summary,
            body: piece.body,
            contentType: piece.content_type,
            tagsTool: piece.tags_tool,
            tagsFocus: piece.tags_focus,
            tagsWorkflow: piece.tags_workflow,
            tagsDomain: piece.tags_domain,
            tagsCategory: piece.tags_category,
            sourceUrls: piece.source_urls,
          });
          results.push({
            contentId: subId,
            isNew: true,
            sourcePlatforms,
            sourceUrls,
          });
        }
      }

      results.push({
        contentId: match.id,
        isNew: false,
        sourcePlatforms,
        sourceUrls,
      });
    } else {
      const contentId = await createNewArticle(group, batchDate);
      results.push({
        contentId,
        isNew: true,
        sourcePlatforms,
        sourceUrls,
      });
    }

    for (const item of group) {
      await updateRawContentStatus(item.id, "merged");
    }
  }

  return results;
}

function groupByTopic(items: RawContent[]): RawContent[][] {
  const groups: RawContent[][] = [];
  const used = new Set<string>();

  for (const item of items) {
    if (used.has(item.id)) continue;

    const group = [item];
    used.add(item.id);

    for (const other of items) {
      if (used.has(other.id)) continue;
      const toolOverlap = item.raw_extract.tags_tool.some((t) =>
        other.raw_extract.tags_tool.includes(t)
      );
      const focusOverlap = item.raw_extract.tags_focus.some((t) =>
        other.raw_extract.tags_focus.includes(t)
      );
      if (toolOverlap && focusOverlap) {
        group.push(other);
        used.add(other.id);
      }
    }

    groups.push(group);
  }

  return groups;
}

async function resynthesizeArticle(
  existing: Content,
  newItems: RawContent[]
): Promise<void> {
  const newMaterial = newItems
    .map((item) => {
      const e = item.raw_extract;
      return `### Source: ${e.source_creator} (${item.platform})
URL: ${item.source_url}
Title: ${e.title}
Summary: ${e.summary}
Tips:
${e.tips.map((t) => `- ${t}`).join("\n")}`;
    })
    .join("\n\n");

  const existingSourceUrls = existing.source_urls ?? [];
  const newSourceUrls: SourceUrl[] = newItems.map((i) => ({
    url: i.source_url,
    platform: i.platform,
    creator: i.raw_extract.source_creator,
  }));
  const allSourceUrls = [...existingSourceUrls, ...newSourceUrls];

  const existingSubTopics = await getSubTopicsForCategory(existing.tags_category);
  const subTopicContext = existingSubTopics.length > 0
    ? `\n\n## Existing Sub-Topics for This Category\n${existingSubTopics.join(", ")}\n\nPrefer using an existing sub-topic if the article fits. Only create a new one if genuinely novel.`
    : "";

  const userMessage = `Rewrite this living article from scratch incorporating all source material.

## Existing Article

**Title:** ${existing.title}
**Current Sub-Topic:** ${existing.sub_topic ?? "(none)"}
**Tags:** tool=[${existing.tags_tool.join(", ")}] focus=[${existing.tags_focus.join(", ")}] workflow=[${existing.tags_workflow.join(", ")}] domain=[${(existing.tags_domain ?? []).join(", ")}]

${existing.body}

## New Source Material

${newMaterial}${subTopicContext}`;

  const result = await callClaudeCode<{
    title: string;
    summary: string;
    body: string;
    tags_tool: string[];
    tags_focus: string[];
    tags_workflow: string[];
    tags_domain: string[];
    community_notes?: string[];
    sub_topic: string;
    sources_attribution?: { platform: string; creator: string; url: string; contribution_summary: string }[];
  }>({
    systemPrompt: RESYNTHESIZE_SYSTEM_PROMPT,
    userMessage,
    jsonSchema: RESYNTHESIZE_SCHEMA,
  });

  let finalBody = result.body;
  if (result.community_notes && result.community_notes.length > 0) {
    finalBody += `\n\n---\n\n## Community Notes\n\n${result.community_notes.map((n) => `- ${n}`).join("\n")}`;
  }

  await updateContentArticle(existing.id, {
    title: result.title,
    summary: result.summary,
    body: finalBody,
    sourceUrls: allSourceUrls,
    tagsTool: result.tags_tool,
    tagsFocus: result.tags_focus,
    tagsWorkflow: result.tags_workflow,
    tagsDomain: result.tags_domain,
    subTopic: result.sub_topic,
  });
}

async function createNewArticle(
  items: RawContent[],
  batchDate: string
): Promise<string> {
  const itemDescriptions = items
    .map((item) => {
      const e = item.raw_extract;
      return `### Item ID: ${item.id}
Platform: ${item.platform}
Source URL: ${item.source_url}
Creator: ${e.source_creator}
Title: ${e.title}
Summary: ${e.summary}
Tips:
${e.tips.map((t) => `- ${t}`).join("\n")}
Tags: tool=[${e.tags_tool.join(", ")}] focus=[${e.tags_focus.join(", ")}] workflow=[${e.tags_workflow.join(", ")}] domain=[${(e.tags_domain ?? []).join(", ")}]`;
    })
    .join("\n\n");

  const inferredCategory = items[0]?.raw_extract.tags_tool[0]
    ? "claude_code_features"
    : "claude_code_features";
  const existingSubTopics = await getSubTopicsForCategory(inferredCategory);
  const subTopicContext = existingSubTopics.length > 0
    ? `\n\nExisting sub-topics for this category: ${existingSubTopics.join(", ")}. Prefer using an existing sub-topic if the article fits.`
    : "";

  const piece = await callClaudeCode<{
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
    sub_topic: string;
  }>({
    systemPrompt: `You are a content synthesizer for TipStack. Create a single publishable article from the provided source material. Write for AI tool practitioners — specific techniques, real commands, actionable guidance. Use markdown with ## headings, bullets, bold. 300-800 words. Assign a sub_topic (2-4 words, title case) for grouping on the category page.${subTopicContext}\n\nRespond with valid JSON matching the schema provided.`,
    userMessage: `Create a new article from these ${items.length} source items:\n\n${itemDescriptions}`,
    jsonSchema: NEW_ARTICLE_SCHEMA,
  });

  const sourceUrls: SourceUrl[] = items.map((i) => ({
    url: i.source_url,
    platform: i.platform,
    creator: i.raw_extract.source_creator,
  }));

  const contentId = await insertContent({
    title: piece.title,
    slug: `${piece.slug}-${batchDate}`,
    summary: piece.summary,
    body: piece.body,
    contentType: piece.content_type ?? "deep_dive",
    tagsTool: piece.tags_tool,
    tagsFocus: piece.tags_focus,
    tagsWorkflow: piece.tags_workflow,
    tagsDomain: piece.tags_domain ?? [],
    tagsCategory: piece.tags_category ?? "claude_code_features",
    sourceUrls,
    subTopic: piece.sub_topic,
  });

  return contentId;
}

function dedupeStrings(arr: string[]): string[] {
  return [...new Set(arr)];
}

function checkArticleSize(articleBody: string): boolean {
  return articleBody.split(/\s+/).length > 2000;
}

export async function splitArticle(
  article: Content,
  rawItems: RawContent[]
): Promise<SynthesizedPiece[]> {
  const result = await callClaudeCode<{
    pieces: { title: string; slug_suffix: string; body: string; tags_focus: string[] }[];
  }>({
    systemPrompt: `You are splitting a large article into 2-4 logically separated sub-articles. Each sub-article should be self-contained and cover a distinct aspect of the topic. Keep each 300-800 words.\n\nRespond with valid JSON matching the schema provided.`,
    userMessage: `Split this article into logical sub-articles:\n\n**Title:** ${article.title}\n\n${article.body}`,
    jsonSchema: SPLIT_SCHEMA,
  });

  return result.pieces.map((p) => ({
    title: p.title,
    slug: `${article.slug}-${p.slug_suffix}`,
    summary: p.body.slice(0, 200).replace(/\n/g, " ").trim(),
    body: p.body,
    content_type: article.content_type,
    tags_tool: article.tags_tool,
    tags_focus: p.tags_focus,
    tags_workflow: article.tags_workflow,
    tags_domain: article.tags_domain,
    tags_category: article.tags_category,
    source_items: rawItems.map((i) => i.id),
    source_urls: article.source_urls,
  }));
}

interface StaleArticle {
  articleId: string;
  reason: string;
  triggeringDocsUrl: string;
}

const STALENESS_TRIGGER_WORDS = [
  "breaking change",
  "removed",
  "deprecated",
  "renamed",
  "replaced",
  "no longer",
  "discontinued",
];

export function detectStaleness(
  docsItems: FetchedItem[],
  existingArticles: (Content | ContentSummary)[]
): StaleArticle[] {
  const staleArticles: StaleArticle[] = [];

  for (const docsItem of docsItems) {
    const contentLower = docsItem.content.toLowerCase();

    const hasTriggerWord = STALENESS_TRIGGER_WORDS.some((word) =>
      contentLower.includes(word)
    );
    if (!hasTriggerWord) continue;

    for (const article of existingArticles) {
      const articleTags = [
        ...article.tags_tool,
        ...article.tags_focus,
        ...article.tags_workflow,
      ].map((t) => t.toLowerCase());

      const hasOverlap = articleTags.some(
        (tag) => tag.length >= 3 && contentLower.includes(tag)
      );

      if (hasOverlap) {
        const triggerWord = STALENESS_TRIGGER_WORDS.find((word) =>
          contentLower.includes(word)
        );
        staleArticles.push({
          articleId: article.id,
          reason: `Docs mention "${triggerWord}" for a topic covered by this article (source: ${docsItem.title})`,
          triggeringDocsUrl: docsItem.url,
        });
      }
    }
  }

  return staleArticles;
}
