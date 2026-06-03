import { callClaudeCode, pMap } from "@/lib/ai/claude-code";
import { insertRawContent, logProcessedUrl } from "@/lib/supabase/queries";
import type { FetchedItem, ExtractionResult } from "@/types";

export const EXTRACT_BATCH_SIZE = 5;

const BATCH_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_url: {
            type: "string",
            description: "The source URL of the item being extracted (copy exactly from input)",
          },
          title: {
            type: "string",
            description:
              "Concise, descriptive title for this content (not the original title — rewrite for clarity)",
          },
          summary: {
            type: "string",
            description: "2-3 sentence overview of what this content covers",
          },
          tips: {
            type: "array",
            items: { type: "string" },
            description:
              "Each concrete, actionable tip extracted. Each tip should be specific enough that someone could follow it immediately. Aim for 3-8 tips.",
          },
          tags_tool: {
            type: "array",
            items: { type: "string" },
            description:
              'AI tool products mentioned or demonstrated — not companies. Use lowercase_snake_case. Canonical names: "claude_code", "cursor", "copilot", "chatgpt", "windsurf", "v0", "bolt", "n8n". Do NOT include company names (anthropic, openai) or generic terms (ai-editor, rss).',
          },
          tags_focus: {
            type: "array",
            items: { type: "string" },
            description:
              'Cross-cutting focus areas this content addresses. Use lowercase_snake_case. Examples: "security", "prompt_engineering", "governance", "cost_optimization", "model_updates", "enterprise", "open_source", "evaluation", "privacy"',
          },
          tags_workflow: {
            type: "array",
            items: { type: "string" },
            description:
              'Workflow types covered. Examples: "coding", "writing", "automation", "research", "debugging", "design", "testing"',
          },
          tags_domain: {
            type: "array",
            items: { type: "string" },
            description:
              'Technical domain areas this content applies to. Use lowercase_snake_case. Examples: "frontend", "backend", "devops", "ci_cd", "mobile", "data_engineering", "machine_learning", "infrastructure", "databases", "api_design", "security_engineering"',
          },
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
            description:
              "Primary category. claude_code_features = new releases, design patterns, correct usage of Claude Code features. security_and_guardrails = real-world security setups, permissions, production guardrails. github_skills = popular community skills, skill building, use cases. prompting_and_rules = CLAUDE.md patterns, prompt engineering, context management. workflow_patterns = agentic workflows, CI/CD, multi-agent, automation. mcp_and_integrations = MCP servers, tool connections, integration patterns. debugging_and_testing = test generation, AI debugging, TDD workflows.",
          },
          quality_score: {
            type: "number",
            description:
              "Quality score 1-10. 9-10 = specific novel technique with clear steps. 7-8 = good actionable content, well-explained. 5-6 = useful but generic. 3-4 = thin/vague. 1-2 = no actionable content, hype or off-topic.",
          },
          quality_signal: {
            type: "string",
            enum: ["high", "medium", "low"],
            description:
              "Quality bucket. high = score 7-10. medium = score 4-6. low = score 1-3.",
          },
          source_creator: {
            type: "string",
            description: "Name of the original content creator or author",
          },
        },
        required: [
          "source_url",
          "title",
          "summary",
          "tips",
          "tags_tool",
          "tags_focus",
          "tags_workflow",
          "tags_domain",
          "tags_category",
          "quality_score",
          "quality_signal",
          "source_creator",
        ],
      },
    },
  },
  required: ["items"],
};

const EXTRACTION_SYSTEM_PROMPT = `You are an AI workflow content analyst for TipStack, a platform that curates actionable AI workflow tips.

You receive a batch of content items. For EACH item, extract structured, actionable insights.

## What makes a good extraction:

1. **Actionable tips**: Each tip should be a concrete technique, shortcut, or workflow step someone can immediately use. "Use Claude Code for coding" is too vague. "In Claude Code, use /compact to reduce context when the conversation gets long" is actionable.

2. **Accurate tagging**: Only tag tools that are actually discussed or demonstrated, not just mentioned in passing. Tag focus areas based on the cross-cutting concerns addressed (security, cost optimization, prompt engineering, etc.).

3. **Quality scoring (1-10)**:
   - 9-10: Specific, novel technique with clear steps. High value.
   - 7-8: Good actionable content, somewhat known but well-explained.
   - 5-6: Useful but generic. Common knowledge presented adequately.
   - 3-4: Thin content. A tip exists but it's vague or surface-level.
   - 1-2: No actionable content. Hype, opinion, or off-topic.

4. **Good titles**: Write a clear, specific title that tells the reader what they'll learn. Not clickbait, not the original title — a clear description of the actionable content.

Return one extraction per input item. Copy each item's source_url exactly into the output so results can be matched back.

Respond with valid JSON matching the schema provided.`;

interface BatchExtractionResult {
  items: (ExtractionResult & { source_url: string; quality_score: number })[];
}

export async function extractBatch(
  items: FetchedItem[]
): Promise<Map<string, ExtractionResult & { quality_score: number }>> {
  const itemDescriptions = items
    .map(
      (item, i) =>
        `### Item ${i + 1}
Source URL: ${item.url}
Platform: ${item.platform}
Creator: ${item.creator}
${item.title ? `Original Title: ${item.title}` : ""}

--- Content ---
${item.content.slice(0, 10000)}`
    )
    .join("\n\n---\n\n");

  const result = await callClaudeCode<BatchExtractionResult>({
    systemPrompt: EXTRACTION_SYSTEM_PROMPT,
    userMessage: `Extract actionable AI workflow tips from each of these ${items.length} content items.\n\n${itemDescriptions}`,
    jsonSchema: BATCH_EXTRACTION_SCHEMA,
  });

  const map = new Map<string, ExtractionResult & { quality_score: number }>();
  for (const extracted of result.items) {
    const { source_url, ...rest } = extracted;
    map.set(source_url, rest);
  }
  return map;
}

export async function ingestBatch(
  items: FetchedItem[],
  batchDate: string
): Promise<{ ingested: string[]; failed: string[] }> {
  const batches: FetchedItem[][] = [];
  for (let i = 0; i < items.length; i += EXTRACT_BATCH_SIZE) {
    batches.push(items.slice(i, i + EXTRACT_BATCH_SIZE));
  }

  const ingested: string[] = [];
  const failed: string[] = [];

  const batchResults = await pMap(batches, async (batch, batchIndex) => {
    const label = `[batch ${batchIndex + 1}/${batches.length}]`;
    try {
      console.log(`${label} Extracting ${batch.length} items...`);
      const extractions = await extractBatch(batch);

      const results: { url: string; rawContentId?: string; error?: string }[] = [];
      for (const item of batch) {
        const extraction = extractions.get(item.url);
        if (!extraction) {
          results.push({ url: item.url, error: "No extraction returned" });
          continue;
        }

        try {
          const rawContentId = await insertRawContent({
            sourceUrl: item.url,
            platform: item.platform,
            rawExtract: extraction,
            batchDate,
          });
          await logProcessedUrl(item.url, item.platform);
          results.push({ url: item.url, rawContentId });
          console.log(`${label} OK: ${extraction.title} (score: ${extraction.quality_score})`);
        } catch (err) {
          results.push({ url: item.url, error: err instanceof Error ? err.message : String(err) });
        }
      }
      return results;
    } catch (err) {
      console.error(`${label} BATCH ERROR: ${err instanceof Error ? err.message : err}`);
      return batch.map((item) => ({
        url: item.url,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  });

  for (const results of batchResults) {
    for (const r of results) {
      if ("rawContentId" in r && r.rawContentId) ingested.push(r.rawContentId);
      else failed.push(r.url);
    }
  }

  return { ingested, failed };
}

export async function extractItem(
  item: FetchedItem
): Promise<ExtractionResult> {
  const results = await extractBatch([item]);
  const extraction = results.get(item.url);
  if (!extraction) throw new Error(`No extraction returned for ${item.url}`);
  return extraction;
}

export async function ingestItem(
  item: FetchedItem,
  batchDate: string
): Promise<string> {
  const { ingested, failed } = await ingestBatch([item], batchDate);
  if (failed.length > 0) throw new Error(`Failed to ingest ${item.url}`);
  return ingested[0];
}
