/**
 * One-off script to rewrite security category articles with Mermaid diagrams.
 * Run: npx tsx scripts/rewrite-with-diagrams.ts
 */
import { createClient } from "@supabase/supabase-js";
import { callClaudeCode } from "../src/lib/ai/claude-code";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REWRITE_PROMPT = `You are rewriting an existing article for TipStack to be MORE VISUAL and LESS text-heavy.

Your job: rewrite the article body to include Mermaid diagrams that replace or supplement long text explanations.

## Rules

1. ADD at least 1-2 Mermaid diagrams (flowchart, sequence diagram, or architecture diagram)
2. Place the main diagram EARLY — after the intro paragraph, before detailed steps
3. REDUCE prose — if a diagram explains a flow, remove the paragraph that described the same flow in text
4. Keep all code examples and actionable steps intact
5. Keep the same heading structure (## headings) but tighten text under each
6. Diagrams should use \`\`\`mermaid code blocks
7. Keep diagrams focused: max 8-10 nodes each
8. Use markdown tables for comparisons instead of bullet-list comparisons
9. Total body length should be SHORTER than the original (diagrams replace text, not add to it)
10. Do NOT change the title, summary, or any metadata — only rewrite the body field

## Diagram Style Guide

- flowchart TD for top-down processes (setup steps, decision trees)
- flowchart LR for left-right flows (data pipelines, request flows)
- sequenceDiagram for multi-actor interactions (agent → API → DB)
- Use descriptive edge labels
- Use subgraph for grouping related nodes

## What makes a good diagram here

- Attack/defense flows: "attacker does X → system checks Y → blocks/allows"
- Architecture boundaries: "agent | proxy | upstream API"
- Decision trees: "Is X? → yes/no → do Y/Z"
- Before/after comparisons of secure vs insecure patterns

Return ONLY the new markdown body content. No JSON wrapper, no explanation.`;

async function main() {
  const { data: articles, error } = await supabase
    .from("content")
    .select("id, title, slug, body, content_type")
    .eq("tags_category", "security_and_guardrails")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch articles:", error.message);
    process.exit(1);
  }

  console.log(`Found ${articles.length} security articles to rewrite\n`);

  for (const article of articles) {
    console.log(`Rewriting: ${article.title}`);
    console.log(`  Slug: ${article.slug}`);
    console.log(`  Original length: ${article.body.length} chars`);

    try {
      const newBody = await callClaudeCode<string>({
        systemPrompt: REWRITE_PROMPT,
        userMessage: `Rewrite this article body with Mermaid diagrams:\n\n## Title: ${article.title}\n\n## Current Body:\n\n${article.body}`,
        rawText: true,
      });

      if (!newBody || newBody.length < 200) {
        console.log(`  SKIPPED — response too short (${newBody?.length ?? 0} chars)\n`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("content")
        .update({ body: newBody })
        .eq("id", article.id);

      if (updateError) {
        console.log(`  ERROR updating: ${updateError.message}\n`);
      } else {
        console.log(`  New length: ${newBody.length} chars (${Math.round((newBody.length / article.body.length) * 100)}% of original)`);
        console.log(`  Has mermaid: ${newBody.includes("```mermaid")}\n`);
      }
    } catch (err) {
      console.log(`  ERROR: ${err instanceof Error ? err.message : err}\n`);
    }
  }

  console.log("Done!");
}

main();
