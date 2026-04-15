import { getAnthropicClient, MODEL } from "@/lib/ai/anthropic";
import {
  getRawContentByStatus,
  updateRawContentStatus,
  getPublishedContent,
} from "@/lib/supabase/queries";
import type { DedupResult, RawContent } from "@/types";

/**
 * Tool schema for the dedup + quality filter Claude call.
 * Claude receives the full batch and returns keep/discard decisions.
 */
const DEDUP_TOOL = {
  name: "store_dedup_results",
  description:
    "Store the deduplication and quality filter results for a batch of extracted content items.",
  input_schema: {
    type: "object" as const,
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
  },
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

**Keep items scoring 5 or above. Discard items scoring below 5.**

Be aggressive about filtering — it's better to publish fewer high-quality pieces than to flood the feed with mediocre content.`;

/**
 * Run the dedup + quality filter stage on all ingested items for a batch.
 *
 * - Fetches all raw_content with status = 'ingested' for the batch date
 * - Calls Claude with the full batch for holistic dedup + quality scoring
 * - Also provides recent published content titles so Claude can catch cross-batch duplicates
 * - Updates each item's status to 'filtered' (keep) or 'discarded'
 * - Returns the IDs of items that were kept
 */
export async function dedupAndFilter(batchDate: string): Promise<string[]> {
  const items = await getRawContentByStatus("ingested", batchDate);

  if (items.length === 0) {
    return [];
  }

  // Fetch recent published content for cross-batch dedup context
  const recentContent = await getPublishedContent(30, 0);
  const recentContext =
    recentContent.length > 0
      ? `\n\n## Recently Published Content (avoid duplicating these topics)\n${recentContent.map((c) => `- "${c.title}": ${c.summary}`).join("\n")}`
      : "";

  const client = getAnthropicClient();

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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: DEDUP_SYSTEM_PROMPT,
    tools: [DEDUP_TOOL],
    tool_choice: { type: "tool", name: "store_dedup_results" },
    messages: [
      {
        role: "user",
        content: `Review this batch of ${items.length} extracted content items. For each item, decide whether to keep or discard it, and assign a quality score.${recentContext}

## Batch Items

${batchDescription}`,
      },
    ],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block for dedup stage");
  }

  const result = toolBlock.input as DedupResult;
  const keptIds: string[] = [];

  for (const item of result.items) {
    if (item.action === "keep") {
      await updateRawContentStatus(item.id, "filtered");
      keptIds.push(item.id);
    } else {
      await updateRawContentStatus(item.id, "discarded");
    }
  }

  return keptIds;
}
