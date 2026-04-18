import { getAnthropicClient, MODEL } from "@/lib/ai/anthropic";
import { insertRawContent, logProcessedUrl } from "@/lib/supabase/queries";
import type { FetchedItem, ExtractionResult } from "@/types";

/**
 * The tool schema Claude uses to return structured extraction results.
 * Using tool_use guarantees parseable JSON output matching this shape.
 */
const EXTRACTION_TOOL = {
  name: "store_extraction",
  description:
    "Store the structured extraction result from a piece of AI workflow content.",
  input_schema: {
    type: "object" as const,
    properties: {
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
          'AI tools mentioned or demonstrated. Use lowercase_snake_case. Examples: "claude_code", "cursor", "gpt", "copilot", "windsurf", "v0", "bolt", "n8n"',
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
          "code_and_editing",
          "workflow_and_automation",
          "debugging_and_testing",
          "prompting_and_context",
          "tools_and_updates",
          "architecture_and_data",
          "learning_and_practices",
        ],
        description:
          "Primary intent category. code_and_editing = AI-assisted coding/refactoring/review. workflow_and_automation = agents/pipelines/orchestration. debugging_and_testing = AI debugging/test generation. prompting_and_context = prompt engineering/context management. tools_and_updates = new releases/model news. architecture_and_data = system design/data pipelines. learning_and_practices = guides/best practices/tutorials.",
      },
      quality_signal: {
        type: "string",
        enum: ["high", "medium", "low"],
        description:
          "Quality assessment. high = specific actionable techniques with clear steps. medium = useful but somewhat generic. low = vague, hype-heavy, or no actionable content.",
      },
      source_creator: {
        type: "string",
        description: "Name of the original content creator or author",
      },
    },
    required: [
      "title",
      "summary",
      "tips",
      "tags_tool",
      "tags_focus",
      "tags_workflow",
      "tags_domain",
      "quality_signal",
      "source_creator",
    ],
  },
};

const EXTRACTION_SYSTEM_PROMPT = `You are an AI workflow content analyst for TipStack, a platform that curates actionable AI workflow tips.

Your job is to extract structured, actionable insights from raw content (YouTube transcripts, Reddit posts, or tweets/threads) about AI tools and workflows.

## What makes a good extraction:

1. **Actionable tips**: Each tip should be a concrete technique, shortcut, or workflow step someone can immediately use. "Use Claude Code for coding" is too vague. "In Claude Code, use /compact to reduce context when the conversation gets long" is actionable.

2. **Accurate tagging**: Only tag tools that are actually discussed or demonstrated, not just mentioned in passing. Tag focus areas based on the cross-cutting concerns addressed (security, cost optimization, prompt engineering, etc.).

3. **Honest quality assessment**:
   - HIGH: Contains specific, novel techniques with clear steps. Someone reading this learns something they can do today.
   - MEDIUM: Useful information but somewhat general. Good overview but lacks step-by-step detail.
   - LOW: Vague, hype-heavy, opinion-only, or no actionable content. Skip-worthy.

4. **Good titles**: Write a clear, specific title that tells the reader what they'll learn. Not clickbait, not the original title — a clear description of the actionable content.

If the content has no actionable AI workflow tips (e.g., it's pure news, opinion, or off-topic), still extract what you can but mark quality_signal as "low".`;

/**
 * Extract structured data from a single fetched item using Claude.
 * One API call per item with structured output via tool_use.
 */
export async function extractItem(
  item: FetchedItem
): Promise<ExtractionResult> {
  const client = getAnthropicClient();

  const userMessage = `Extract actionable AI workflow tips from this ${item.platform} content.

Source: ${item.url}
Creator: ${item.creator}
${item.title ? `Original Title: ${item.title}` : ""}

--- Content ---
${item.content.slice(0, 12000)}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: EXTRACTION_SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: "store_extraction" },
    messages: [{ role: "user", content: userMessage }],
  });

  // Extract the tool_use block from the response
  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error(`Claude did not return a tool_use block for ${item.url}`);
  }

  return toolBlock.input as ExtractionResult;
}

/**
 * Process a single fetched item: extract with Claude, store in raw_content,
 * and log the URL to sources_log.
 */
export async function ingestItem(
  item: FetchedItem,
  batchDate: string
): Promise<string> {
  const extraction = await extractItem(item);

  const rawContentId = await insertRawContent({
    sourceUrl: item.url,
    platform: item.platform,
    rawExtract: extraction,
    batchDate,
  });

  await logProcessedUrl(item.url, item.platform);

  return rawContentId;
}
