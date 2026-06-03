import { callClaudeCode } from "@/lib/ai/claude-code";
import {
  getRawContentByStatus,
  insertContent,
  updateRawContentStatus,
} from "@/lib/supabase/queries";
import type { SynthesisResult, RawContent } from "@/types";

const SYNTHESIS_SCHEMA = {
  type: "object",
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
              "Content format — choose carefully, do NOT default to deep_dive: quick_tip = ONE focused technique or tool, under 400 words, no more than 3 headings. deep_dive = in-depth walkthrough of a SINGLE complex topic with multiple steps, 500-800 words. roundup = collection of 3+ related tips/rules/tools presented as a numbered or categorized list (if the title says 'N things/rules/tips' it is ALWAYS a roundup). update = breaking news, version release, or security advisory about a specific event.",
          },
          tags_tool: {
            type: "array",
            items: { type: "string" },
            description: 'AI tool products covered (lowercase_snake_case). Use canonical names: "claude_code", "cursor", "copilot", "chatgpt", "windsurf", "v0", "bolt", "n8n". No company names or generic terms.',
          },
          tags_focus: {
            type: "array",
            items: { type: "string" },
            description: 'Cross-cutting focus areas. Prefer canonical values: "prompt_engineering", "context_management", "system_prompts", "cost_optimization", "security", "model_updates", "model_comparisons", "benchmarks", "best_practices". Add others only when none fit.',
          },
          tags_workflow: {
            type: "array",
            items: { type: "string" },
            description: 'Work activity this content helps with. Prefer canonical values: "code-generation", "coding", "refactoring", "code-review", "automation", "pipeline", "agents", "debugging", "testing", "error-handling", "research", "tutorial", "team-workflow", "design", "content-curation". Add others only when none fit.',
          },
          tags_domain: {
            type: "array",
            items: { type: "string" },
            description: 'Technical domain areas. Prefer canonical values: "frontend", "backend", "devops", "ci_cd", "databases", "api_design", "data_engineering", "system_design". Add others only when none fit.',
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
          practical_use_case: {
            type: "string",
            description:
              'Concrete scenario where this technique applies, starting with "When you..." or "If you...". 2-4 sentences. Omit for content_type "update".',
          },
          try_this: {
            type: "string",
            description:
              'Specific action the reader can try right now, starting with an imperative verb. Include exact commands or steps. Completable in under 5 minutes. Omit for content_type "update".',
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
};

const FEW_SHOT_EXAMPLES = `
## Example Published Pieces

### Example 1 (roundup — note the Mermaid diagram after the intro)
**Title:** 5 Claude Code Shortcuts That Cut Context Window Waste in Half
**Summary:** Claude Code's context window fills up fast during long sessions. These five techniques — from /compact to strategic file scoping — help you stay productive without starting over.
**Body (excerpt):**
## The Problem: Context Window Bloat

Every file you open, every error message, every back-and-forth exchange eats into Claude Code's context window. Once it's full, responses degrade or you're forced to start a new session — losing all the context you've built up.

\`\`\`mermaid
flowchart LR
  A[New Session] --> B[Files & Errors\\nFill Context]
  B --> C{Context Full?}
  C -- No --> D[Keep Working]
  C -- Yes --> E[/compact]
  E --> F[Summary Replaces\\nRaw History]
  F --> D
  D --> B
\`\`\`

## 1. Use /compact Regularly

The \`/compact\` command summarizes your conversation history, freeing up context space while preserving the key decisions and code state. Run it:
- After completing a subtask (e.g., "finished the auth middleware, moving to tests")
- When you notice responses getting shorter or less detailed
- Before starting a new area of the codebase

**Pro tip:** Add a brief note when compacting — \`/compact finished auth, starting payment integration\` — so the summary captures your intent.

## 2. Scope File References Precisely
...

### Example 2 (deep_dive — note the sequence diagram showing system interactions)
**Title:** How to Build a Reddit-to-Notion Pipeline with n8n and Claude
**Summary:** A step-by-step workflow that monitors specific subreddits, filters high-quality posts using Claude, and saves structured summaries directly to a Notion database — all running on autopilot.
**Body (excerpt):**
## What You'll Build

An automated pipeline that:
1. Monitors r/ClaudeAI and r/cursor for posts scoring above 50 upvotes
2. Sends each post to Claude for structured extraction (summary, key tips, tool tags)
3. Writes the result to a Notion database with proper tagging

\`\`\`mermaid
sequenceDiagram
  participant R as Reddit API
  participant N as n8n Workflow
  participant C as Claude
  participant DB as Notion DB
  R->>N: New post (score > 50)
  N->>C: Extract summary + tags
  C-->>N: Structured JSON
  N->>DB: Write to database
  Note over DB: Tagged & searchable
\`\`\`

Total setup time: ~30 minutes. Runs for free on n8n cloud's starter tier.

## Step 1: Set Up the Reddit Trigger Node
...

### Example 3 (quick_tip — even short pieces benefit from a focused diagram)
**Title:** Use Claude Code's --allowedTools Flag to Lock Down Agent Permissions
**Summary:** One CLI flag prevents Claude Code from running dangerous commands during automated runs. Here's how to scope it for CI pipelines.
**Body (excerpt):**
## The Flag

Pass \`--allowedTools\` when launching Claude Code to restrict which tools the agent can use:

\`\`\`bash
claude -p "review this PR" --allowedTools Read,Grep,Glob
\`\`\`

\`\`\`mermaid
flowchart TD
  A[Claude Code Agent] --> B{Tool Request}
  B --> C[Read] --> E[✅ Allowed]
  B --> D[Bash] --> F[❌ Blocked]
  B --> G[Write] --> H[❌ Blocked]
\`\`\`

This gives the agent read-only access — it can explore the codebase but cannot modify files or run shell commands.
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

## Content Type Selection — DO NOT default to deep_dive

Aim for a MIX of content types. Use this decision tree:
- Title mentions a NUMBER of things ("9 rules", "5 tips", "3 patterns") → **roundup**
- Covers a single tool, library, or technique with a short explanation → **quick_tip**
- Breaking news, version release, security incident report → **update**
- In-depth walkthrough of one complex topic requiring multiple steps → **deep_dive**

In a batch of 5+ items, at MOST 40% should be deep_dive. Prefer quick_tip for focused single-tool pieces.

## Content Quality Standards

- Every piece must contain at least one concrete, actionable technique
- Avoid filler phrases ("In today's fast-paced world...", "AI is revolutionizing...")
- Be specific: tool names, exact commands, real workflow steps
- If a tip involves code, include a code snippet
- Keep body length between 300-800 words — enough depth to be useful, short enough to respect the reader's time

## Visual Content — Use Diagrams Over Text

Prefer diagrams and visual representations over lengthy prose wherever possible. Use Mermaid code blocks (\`\`\`mermaid) for:

- **Flowcharts**: Decision trees, setup workflows, "should I use X?" decisions
- **Sequence diagrams**: API call flows, agent-to-tool interactions, auth flows
- **Architecture diagrams**: System boundaries, data flow, component relationships
- **Comparison tables**: Use markdown tables for feature comparisons, tool trade-offs

Rules:
- Every deep_dive and roundup MUST include at least one Mermaid diagram — no exceptions
- quick_tip pieces SHOULD include a small diagram (3-5 nodes) when the concept involves a flow, decision, or system interaction
- Place the first diagram EARLY in the article (after the intro, before detailed steps) — it orients the reader visually before they read the details
- Keep diagrams focused — max 8-10 nodes. Split into multiple diagrams if complex.
- Use flowchart TD (top-down) or LR (left-right) for processes
- Use sequenceDiagram for interactions between systems/actors
- Label edges clearly — the diagram should be understandable without reading surrounding text
- Diagrams REPLACE prose, not duplicate it — if a diagram shows the flow, do not re-describe the same flow in a paragraph beneath it

## Actionable Sections

For ALL content types EXCEPT "update", you MUST generate two additional fields:

- **practical_use_case**: A concrete scenario where this technique applies. Start with "When you..." or "If you...". 2-4 sentences describing a real situation a developer would encounter.
- **try_this**: A specific action the reader can try right now. Start with an imperative verb (e.g., "Open...", "Run...", "Add..."). Include exact commands or steps. Must be completable in under 5 minutes.

Do NOT include these fields for content_type "update" — updates are informational and don't need exercises.

## Slug Format

Generate URL-safe slugs: lowercase, hyphens between words, no special characters. Example: "claude-code-context-management-tips"

${FEW_SHOT_EXAMPLES}

Respond with valid JSON matching the schema provided.`;

export async function synthesize(batchDate: string): Promise<number> {
  const items = await getRawContentByStatus("filtered", batchDate);

  if (items.length === 0) {
    return 0;
  }

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

  const result = await callClaudeCode<SynthesisResult>({
    systemPrompt: SYNTHESIS_SYSTEM_PROMPT,
    userMessage: `Synthesize these ${items.length} filtered content items into publishable content pieces. Group related items together where it makes sense. Every piece must be actionable and well-structured.

## Filtered Items

${itemDescriptions}`,
    jsonSchema: SYNTHESIS_SCHEMA,
  });

  // Per-piece quality = the best source item's dedup score. A piece synthesizes
  // the strongest technique from its sources, so the max drives auto-publish.
  const scoreById = new Map(
    items.map((i: RawContent) => [i.id, i.raw_extract.quality_score ?? 0])
  );

  let piecesCreated = 0;

  for (const piece of result.content_pieces) {
    const uniqueSlug = `${piece.slug}-${batchDate}`;
    const qualityScore = Math.max(
      0,
      ...piece.source_items.map((id) => scoreById.get(id) ?? 0)
    );

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
      tagsCategory: piece.tags_category ?? "claude_code_features",
      sourceUrls: piece.source_urls,
      qualityScore,
      practicalUseCase: piece.practical_use_case,
      tryThis: piece.try_this,
    });

    for (const rawContentId of piece.source_items) {
      await updateRawContentStatus(rawContentId, "merged");
    }

    piecesCreated++;
  }

  return piecesCreated;
}
