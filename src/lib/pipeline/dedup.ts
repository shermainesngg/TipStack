import { callClaudeCode } from "@/lib/ai/claude-code";
import {
  getRawContentByStatus,
  updateRawContentStatus,
  getPublishedContent,
} from "@/lib/supabase/queries";
import type { DedupResult, RawContent } from "@/types";

const PLATFORM_THRESHOLDS: Record<string, number> = {
  youtube: 5,
  news: 5,
  reddit: 7,
  twitter: 7,
  docs: 3,
  github: 4,
};

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) if (wordsB.has(w)) overlap++;
  return overlap / Math.min(wordsA.size, wordsB.size);
}

function tagOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let overlap = 0;
  for (const t of a) if (setB.has(t)) overlap++;
  return overlap / Math.min(a.length, b.length);
}

export async function codeDedup(
  batchDate: string
): Promise<{ kept: string[]; discarded: string[] }> {
  const items = await getRawContentByStatus("ingested", batchDate);
  if (items.length === 0) return { kept: [], discarded: [] };

  const kept: string[] = [];
  const discarded: string[] = [];
  const keptItems: RawContent[] = [];

  const sorted = [...items].sort(
    (a, b) => (b.raw_extract.quality_score ?? 0) - (a.raw_extract.quality_score ?? 0)
  );

  for (const item of sorted) {
    const score = item.raw_extract.quality_score ?? 0;
    const threshold = PLATFORM_THRESHOLDS[item.platform] ?? 5;

    if (score < threshold) {
      discarded.push(item.id);
      await updateRawContentStatus(item.id, "discarded");
      continue;
    }

    const isDuplicate = keptItems.some((existing) => {
      const tSim = titleSimilarity(item.raw_extract.title, existing.raw_extract.title);
      const toolOvl = tagOverlap(item.raw_extract.tags_tool, existing.raw_extract.tags_tool);
      const focusOvl = tagOverlap(item.raw_extract.tags_focus, existing.raw_extract.tags_focus);
      return tSim > 0.6 && toolOvl > 0.5 && focusOvl > 0.5;
    });

    if (isDuplicate) {
      discarded.push(item.id);
      await updateRawContentStatus(item.id, "discarded");
    } else {
      kept.push(item.id);
      keptItems.push(item);
      await updateRawContentStatus(item.id, "filtered");
    }
  }

  return { kept, discarded };
}

const DEDUP_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The UUID of the raw_content item",
          },
          action: {
            type: "string",
            enum: ["keep", "discard"],
            description:
              "Whether to keep this item for synthesis or discard it",
          },
          reason: {
            type: "string",
            description: "Brief explanation for why this item was kept or discarded",
          },
          duplicate_of: {
            type: ["string", "null"],
            description:
              "If discarded as duplicate, the ID of the item it duplicates. Null otherwise.",
          },
          quality_score: {
            type: "number",
            description: "Quality score from 1-10. 1 = useless, 10 = exceptional.",
          },
        },
        required: ["id", "action", "reason", "duplicate_of", "quality_score"],
      },
      description: "One entry per input item with keep/discard decision",
    },
  },
  required: ["items"],
};

const DEDUP_SYSTEM_PROMPT = `You are a content quality analyst for TipStack, a platform that curates actionable AI workflow tips.

You receive a batch of extracted content items from YouTube videos and Reddit posts. Your job is to:

1. **Remove duplicates**: If multiple items cover the same tip, technique, or topic, keep the highest-quality one and discard the rest. Mark discarded duplicates with the ID of the item they duplicate.

2. **Filter by quality**: Discard items that are:
   - Too vague or generic ("AI is changing everything")
   - Pure hype or opinion with no actionable content
   - Off-topic (not about AI workflow tips or tool usage)
   - Too shallow (just mentions a tool without explaining a technique)

3. **Score quality (1-10)**:
   - 9-10: Specific, novel technique with clear steps. High value.
   - 7-8: Good actionable content, somewhat known but well-explained.
   - 5-6: Useful but generic. Common knowledge presented adequately.
   - 3-4: Thin content. A tip exists but it's vague or surface-level.
   - 1-2: No actionable content. Hype, opinion, or off-topic.

**Quality thresholds vary by source platform:**
- YouTube: keep items scoring 5 or above (long-form, demonstrates real workflows)
- News/HN: keep items scoring 5 or above (community-curated)
- Reddit: keep items scoring 7 or above (high noise ratio)
- Twitter/X: keep items scoring 7 or above (often lacks actionable detail)

Be aggressive about filtering — it's better to publish fewer high-quality pieces than to flood the feed with mediocre content.

Respond with valid JSON matching the schema provided.`;

export async function dedupAndFilter(batchDate: string): Promise<string[]> {
  const items = await getRawContentByStatus("ingested", batchDate);

  if (items.length === 0) {
    return [];
  }

  const recentContent = await getPublishedContent(30, 0);
  const recentContext =
    recentContent.length > 0
      ? `\n\n## Recently Published Content (avoid duplicating these topics)\n${recentContent.map((c) => `- "${c.title}": ${c.summary}`).join("\n")}`
      : "";

  const batchDescription = items
    .map((item: RawContent) => {
      const extract = item.raw_extract;
      return `### Item ID: ${item.id}
Platform: ${item.platform}
Source: ${item.source_url}
Title: ${extract.title}
Summary: ${extract.summary}
Tips: ${extract.tips.join("; ")}
Tags: [${[...extract.tags_tool, ...extract.tags_focus, ...extract.tags_workflow].join(", ")}]
Extraction Quality Signal: ${extract.quality_signal}`;
    })
    .join("\n\n");

  const userMessage = `Review this batch of ${items.length} extracted content items. For each item, decide whether to keep or discard it, and assign a quality score.${recentContext}

## Batch Items

${batchDescription}`;

  const result = await callClaudeCode<DedupResult>({
    systemPrompt: DEDUP_SYSTEM_PROMPT,
    userMessage,
    jsonSchema: DEDUP_SCHEMA,
  });

  const keptIds: string[] = [];

  const platformById = new Map(items.map((i: RawContent) => [i.id, i.platform]));
  const PLATFORM_THRESHOLDS: Record<string, number> = {
    youtube: 5,
    news: 5,
    reddit: 7,
    twitter: 7,
    docs: 3,
    github: 4,
  };

  for (const item of result.items) {
    const platform = platformById.get(item.id) ?? "youtube";
    const threshold = PLATFORM_THRESHOLDS[platform] ?? 5;
    const meetsThreshold = item.quality_score >= threshold;

    if (item.action === "keep" && meetsThreshold) {
      await updateRawContentStatus(item.id, "filtered");
      keptIds.push(item.id);
    } else {
      await updateRawContentStatus(item.id, "discarded");
    }
  }

  return keptIds;
}
