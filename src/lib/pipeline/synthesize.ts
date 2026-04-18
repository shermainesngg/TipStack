import { getAnthropicClient, MODEL } from "@/lib/ai/anthropic";
import {
  getRawContentByStatus,
  insertContent,
  updateRawContentStatus,
} from "@/lib/supabase/queries";
import type { SynthesisResult, RawContent } from "@/types";

/**
 * Tool schema for the synthesis Claude call.
 * Claude receives all filtered items and produces publishable content pieces.
 */
const SYNTHESIS_TOOL = {
  name: "store_synthesis_results",
  description:
    "Store the synthesized content pieces ready for human review and publishing.",
  input_schema: {
    type: "object" as const,
    properties: {
      content_pieces: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description:
                "Clear, specific title that tells readers what they will learn. Not clickbait.",
            },
            slug: {
              type: "string",
              description:
                "URL-safe, human-readable slug. Lowercase, hyphens only, no special characters. Example: claude-code-compact-context-management",
            },
            summary: {
              type: "string",
              description:
                "2-3 sentences for card display. Should make someone want to click through.",
            },
            body: {
              type: "string",
              description:
                "Full content in markdown. Detailed breakdown with steps, code examples if relevant, and practical guidance. Use ## headings, bullet points, and bold for scannability.",
            },
            content_type: {
              type: "string",
              enum: ["quick_tip", "deep_dive", "roundup", "update"],
              description:
                "Content format: quick_tip = one focused technique (1-2 paragraphs), deep_dive = thorough walkthrough (300-800 words), roundup = collection of related tips (numbered list), update = tool news or model release info",
            },
            tags_tool: {
              type: "array",
              items: { type: "string" },
              description: "AI tools covered in this piece (lowercase_snake_case)",
            },
            tags_focus: {
              type: "array",
              items: { type: "string" },
              description: "Cross-cutting focus areas this piece addresses (e.g. security, prompt_engineering, cost_optimization)",
            },
            tags_workflow: {
              type: "array",
              items: { type: "string" },
              description: "Workflow types covered",
            },
            tags_domain: {
              type: "array",
              items: { type: "string" },
              description: 'Technical domain areas (e.g. "frontend", "backend", "devops", "ci_cd", "databases", "api_design")',
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
            source_items: {
              type: "array",
              items: { type: "string" },
              description:
                "Array of raw_content IDs that were combined into this piece",
            },
            source_urls: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  platform: {
                    type: "string",
                    enum: ["youtube", "reddit"],
                  },
                  creator: { type: "string" },
                },
                required: ["url", "platform", "creator"],
              },
              description:
                "Original source URLs with platform and creator for attribution",
            },
          },
          required: [
            "title",
            "slug",
            "summary",
            "body",
            "content_type",
            "tags_tool",
            "tags_focus",
            "tags_workflow",
            "tags_domain",
            "tags_category",
            "source_items",
            "source_urls",
          ],
        },
      },
    },
    required: ["content_pieces"],
  },
};

/**
 * Few-shot examples embedded in the synthesis prompt so Claude
 * understands the tone, depth, and format we want.
 */
const FEW_SHOT_EXAMPLES = `
## Example Published Pieces

### Example 1
**Title:** 5 Claude Code Shortcuts That Cut Context Window Waste in Half
**Summary:** Claude Code's context window fills up fast during long sessions. These five techniques — from /compact to strategic file scoping — help you stay productive without starting over.
**Body (excerpt):**
## The Problem: Context Window Bloat

Every file you open, every error message, every back-and-forth exchange eats into Claude Code's context window. Once it's full, responses degrade or you're forced to start a new session — losing all the context you've built up.

## 1. Use /compact Regularly

The \`/compact\` command summarizes your conversation history, freeing up context space while preserving the key decisions and code state. Run it:
- After completing a subtask (e.g., "finished the auth middleware, moving to tests")
- When you notice responses getting shorter or less detailed
- Before starting a new area of the codebase

**Pro tip:** Add a brief note when compacting — \`/compact finished auth, starting payment integration\` — so the summary captures your intent.

## 2. Scope File References Precisely
...

### Example 2
**Title:** How to Build a Reddit-to-Notion Pipeline with n8n and Claude
**Summary:** A step-by-step workflow that monitors specific subreddits, filters high-quality posts using Claude, and saves structured summaries directly to a Notion database — all running on autopilot.
**Body (excerpt):**
## What You'll Build

An automated pipeline that:
1. Monitors r/ClaudeAI and r/cursor for posts scoring above 50 upvotes
2. Sends each post to Claude for structured extraction (summary, key tips, tool tags)
3. Writes the result to a Notion database with proper tagging

Total setup time: ~30 minutes. Runs for free on n8n cloud's starter tier.

## Step 1: Set Up the Reddit Trigger Node
...
`;

const SYNTHESIS_SYSTEM_PROMPT = `You are a content synthesizer for TipStack, a platform that curates actionable AI workflow tips for practitioners.

You receive a batch of quality-filtered content extractions from YouTube videos and Reddit posts. Your job is to synthesize these into publishable content pieces.

## Your Goals

1. **Group related items**: If multiple sources cover related topics (e.g., three items about Claude Code productivity), combine them into one comprehensive piece rather than publishing near-duplicates.

2. **Standalone items**: If an item covers a unique topic with enough depth, it can become its own piece.

3. **Write for practitioners**: Your audience uses AI tools daily. They want specific techniques, not overviews. Write like you're explaining to a skilled colleague, not a beginner.

4. **Format for scannability**: Use markdown headings (##), bullet points, bold text, and code blocks. People scan before they read.

5. **Source attribution**: Every piece must reference which source items it draws from (by ID) and include the original URLs for credit.

## Content Quality Standards

- Every piece must contain at least one concrete, actionable technique
- Avoid filler phrases ("In today's fast-paced world...", "AI is revolutionizing...")
- Be specific: tool names, exact commands, real workflow steps
- If a tip involves code, include a code snippet
- Keep body length between 300-800 words — enough depth to be useful, short enough to respect the reader's time

## Slug Format

Generate URL-safe slugs: lowercase, hyphens between words, no special characters. Example: "claude-code-context-management-tips"

${FEW_SHOT_EXAMPLES}`;

/**
 * Run the synthesis stage on all filtered items for a batch.
 *
 * - Fetches all raw_content with status = 'filtered' for the batch date
 * - Calls Claude with the full set to generate publishable content pieces
 * - Writes each piece to the content table (status: pending_review)
 * - Updates raw_content status to 'merged' for items that were used
 * - Returns the number of content pieces created
 */
export async function synthesize(batchDate: string): Promise<number> {
  const items = await getRawContentByStatus("filtered", batchDate);

  if (items.length === 0) {
    return 0;
  }

  const client = getAnthropicClient();

  const itemDescriptions = items
    .map((item: RawContent) => {
      const extract = item.raw_extract;
      return `### Item ID: ${item.id}
Platform: ${item.platform}
Source URL: ${item.source_url}
Creator: ${extract.source_creator}
Title: ${extract.title}
Summary: ${extract.summary}
Tips:
${extract.tips.map((t) => `- ${t}`).join("\n")}
Tags: tool=[${extract.tags_tool.join(", ")}] focus=[${extract.tags_focus.join(", ")}] workflow=[${extract.tags_workflow.join(", ")}] domain=[${(extract.tags_domain ?? []).join(", ")}]`;
    })
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYNTHESIS_SYSTEM_PROMPT,
    tools: [SYNTHESIS_TOOL],
    tool_choice: { type: "tool", name: "store_synthesis_results" },
    messages: [
      {
        role: "user",
        content: `Synthesize these ${items.length} filtered content items into publishable content pieces. Group related items together where it makes sense. Every piece must be actionable and well-structured.

## Filtered Items

${itemDescriptions}`,
      },
    ],
  });

  const toolBlock = response.content.find((block) => block.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error(
      "Claude did not return a tool_use block for synthesis stage"
    );
  }

  const result = toolBlock.input as SynthesisResult;
  let piecesCreated = 0;

  for (const piece of result.content_pieces) {
    // Append batch date to slug for uniqueness across runs
    const uniqueSlug = `${piece.slug}-${batchDate}`;

    await insertContent({
      title: piece.title,
      slug: uniqueSlug,
      summary: piece.summary,
      body: piece.body,
      contentType: piece.content_type ?? "deep_dive",
      tagsTool: piece.tags_tool,
      tagsFocus: piece.tags_focus,
      tagsWorkflow: piece.tags_workflow,
      tagsDomain: piece.tags_domain ?? [],
      tagsCategory: piece.tags_category ?? "learning_and_practices",
      sourceUrls: piece.source_urls,
    });

    // Mark source raw_content items as merged
    for (const rawContentId of piece.source_items) {
      await updateRawContentStatus(rawContentId, "merged");
    }

    piecesCreated++;
  }

  return piecesCreated;
}
