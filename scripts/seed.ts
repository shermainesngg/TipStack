import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local (Next.js convention) from project root
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

// ─── Config ─────────────────────────────────────────────────────────────────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Make sure .env.local exists with both variables set."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

const TODAY = "2026-04-11";

// ─── Seed Data ──────────────────────────────────────────────────────────────

interface SeedPiece {
  title: string;
  slug: string;
  summary: string;
  body: string;
  tags_tool: string[];
  tags_role: string[];
  tags_workflow: string[];
  source_urls: { url: string; platform: "youtube" | "reddit"; creator: string }[];
  sourceLogEntries: { url: string; platform: "youtube" | "reddit" }[];
  rawContentEntries: {
    source_url: string;
    platform: "youtube" | "reddit";
    raw_extract: object;
  }[];
}

const pieces: SeedPiece[] = [
  // ── 1. Claude Code ──────────────────────────────────────────────────────
  {
    title: "5 Claude Code Patterns That Replace Entire Shell Scripts",
    slug: `claude-code-patterns-replace-shell-scripts-${TODAY}`,
    summary:
      "Stop writing one-off bash scripts for repo maintenance. These five Claude Code workflows handle refactoring, migrations, and bulk edits with a single prompt — plus tips for writing effective CLAUDE.md files.",
    body: `## Why Claude Code Changes the Game for Repo Maintenance

Most developers still reach for shell scripts, sed pipelines, or custom codemods when they need to make sweeping changes across a codebase. Claude Code offers a fundamentally different approach: describe *what* you want in plain language and let the agent figure out the file-by-file details.

Below are five battle-tested patterns collected from engineering teams that have adopted Claude Code as part of their daily workflow.

### 1. Bulk Rename With Contextual Awareness

Instead of a fragile regex find-and-replace, ask Claude Code to rename a concept across your codebase while preserving contextual meaning:

\`\`\`
Rename the concept "workspace" to "project" throughout the codebase.
Update variable names, types, database references, comments, and tests.
Do NOT rename the Supabase table yet — only application code.
\`\`\`

Claude Code will read each file, understand whether "workspace" refers to your domain concept or an unrelated IDE setting, and only change what matters.

### 2. Migration Generator From Schema Diff

Point Claude Code at a before/after type definition and let it produce a migration:

\`\`\`
Compare src/types/old.ts and src/types/new.ts.
Generate a Supabase SQL migration that ALTERs tables to match the new types.
Include a rollback section at the bottom.
\`\`\`

This avoids hand-writing ALTER TABLE statements and catches edge cases like nullable columns or new indexes.

### 3. Test Scaffold From Implementation

After writing a new module, you can generate comprehensive tests:

\`\`\`
Read src/lib/pipeline/synthesize.ts.
Write a vitest spec that covers happy path, empty input, and error cases.
Mock the Anthropic SDK calls.
\`\`\`

The generated tests follow the existing patterns in your test suite because Claude Code reads neighboring spec files for context.

### 4. CLAUDE.md as Persistent Memory

Your \`CLAUDE.md\` file is the single most important lever. Treat it like onboarding docs for a new team member:

- **Project conventions** — naming, folder structure, import style
- **Do-not-touch zones** — generated files, vendor code
- **Database rules** — which columns are computed, which are user-editable
- **Deployment notes** — environment variables, feature flags

A well-written CLAUDE.md can cut prompt length in half because you stop repeating yourself.

### 5. Interactive Code Review Prep

Before opening a PR, run Claude Code as a reviewer:

\`\`\`
Review all staged changes. Flag any security issues, performance
regressions, or violations of the rules in CLAUDE.md.
\`\`\`

This catches problems *before* your teammates see them, reducing review cycles.

### Key Takeaways

- Claude Code is most powerful when it has full repo context — keep your CLAUDE.md updated.
- Use explicit constraints ("do NOT rename the table") to prevent over-eager changes.
- Pair Claude Code with version control: always review diffs before committing.
- Combine these patterns with CI checks for a safety net.

These patterns have saved teams anywhere from 2-8 hours per week on routine codebase maintenance. Start with one pattern, measure the time saved, and expand from there.`,
    tags_tool: ["claude_code"],
    tags_role: ["developer", "staff-engineer"],
    tags_workflow: ["code-generation", "refactoring", "code-review"],
    source_urls: [
      {
        url: "https://www.youtube.com/watch?v=abc123seed1",
        platform: "youtube" as const,
        creator: "AI Foundations",
      },
      {
        url: "https://www.reddit.com/r/ClaudeAI/comments/seed01",
        platform: "reddit" as const,
        creator: "u/codecraft_daily",
      },
    ],
    sourceLogEntries: [
      { url: "https://www.youtube.com/watch?v=abc123seed1", platform: "youtube" },
      { url: "https://www.reddit.com/r/ClaudeAI/comments/seed01", platform: "reddit" },
    ],
    rawContentEntries: [
      {
        source_url: "https://www.youtube.com/watch?v=abc123seed1",
        platform: "youtube",
        raw_extract: {
          title: "Claude Code Workflow Tips for Large Codebases",
          summary:
            "Walkthrough of five patterns for using Claude Code to handle bulk edits, migrations, test generation, and code review prep.",
          tips: [
            "Use CLAUDE.md as persistent memory for project conventions",
            "Point Claude Code at schema diffs to auto-generate migrations",
            "Run Claude Code as a pre-PR reviewer to catch issues early",
          ],
          tags_tool: ["claude_code"],
          tags_role: ["developer"],
          tags_workflow: ["code-generation", "refactoring"],
          quality_signal: "high",
          source_creator: "AI Foundations",
        },
      },
      {
        source_url: "https://www.reddit.com/r/ClaudeAI/comments/seed01",
        platform: "reddit",
        raw_extract: {
          title: "Replaced all my bash codemods with Claude Code",
          summary:
            "Thread discussing how teams are replacing shell scripts with Claude Code prompts for bulk refactoring.",
          tips: [
            "Explicit constraints prevent Claude Code from over-editing",
            "Combine with git diff review before committing",
          ],
          tags_tool: ["claude_code"],
          tags_role: ["developer", "staff-engineer"],
          tags_workflow: ["refactoring", "code-review"],
          quality_signal: "high",
          source_creator: "u/codecraft_daily",
        },
      },
    ],
  },

  // ── 2. n8n Automation ───────────────────────────────────────────────────
  {
    title: "Building a Content Pipeline With n8n, RSS, and Claude",
    slug: `n8n-content-pipeline-rss-claude-${TODAY}`,
    summary:
      "A step-by-step guide to building an automated content curation pipeline using n8n workflows that fetch RSS feeds, filter with Claude, and publish to a CMS — no code required for most of it.",
    body: `## The Problem: Manual Content Curation Doesn't Scale

If you're running a newsletter, content hub, or internal knowledge base, you know the pain of manually scanning dozens of sources every day. RSS readers help, but they still require a human to evaluate relevance, summarize, and format each piece.

This guide shows how to wire up an n8n workflow that automates 90% of that pipeline.

### Architecture Overview

The workflow has four stages:

1. **Fetch** — Pull new items from 10-20 RSS feeds on a cron schedule
2. **Filter** — Send each item's title and first 500 characters to Claude with a scoring prompt
3. **Enrich** — For items that score above threshold, ask Claude to produce a summary and tags
4. **Publish** — Push the enriched item to your CMS via API (Supabase, Notion, WordPress, etc.)

### Setting Up the RSS Trigger

In n8n, create a new workflow and add a **Schedule Trigger** node set to run every 6 hours. Connect it to an **RSS Feed Read** node. You can add multiple RSS nodes in parallel for different sources:

\`\`\`
Schedule Trigger (every 6h)
  ├─ RSS Read: Hacker News front page
  ├─ RSS Read: r/MachineLearning top
  ├─ RSS Read: Stratechery feed
  └─ RSS Read: Lenny's Newsletter
\`\`\`

### The Filtering Prompt

Connect each RSS output to an **HTTP Request** node calling the Anthropic API (or use the n8n AI node if available):

\`\`\`json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 200,
  "messages": [{
    "role": "user",
    "content": "Rate this article 1-10 for relevance to AI-assisted workflows. Return JSON: {score, reason}. Title: {{$json.title}} Body: {{$json.contentSnippet}}"
  }]
}
\`\`\`

Add an **IF** node after the response: only continue if \`score >= 7\`.

### Enrichment and Deduplication

For items that pass the filter, send them to a second Claude call that produces:

- A two-sentence summary
- Three to five topic tags
- A suggested category

Before publishing, query your CMS to check if a piece with a similar title already exists. n8n's **Supabase** node makes this a single lookup:

\`\`\`sql
SELECT id FROM content WHERE slug = :generated_slug LIMIT 1;
\`\`\`

If a row is returned, skip. Otherwise, insert.

### Error Handling Tips

- **Set retry policies** on every HTTP node — APIs fail, and n8n's built-in retry handles transient errors.
- **Add a dead-letter branch** — route failed items to a Google Sheet or Slack channel so you can inspect them later.
- **Log token usage** — add a Function node after each Claude call that writes the usage object to a monitoring table.
- **Use environment variables** for API keys — never hard-code secrets in n8n node parameters.

### Results

After running this pipeline for two weeks, a solo operator reported:

- **Time saved:** roughly 45 minutes per day on manual scanning
- **Content volume:** 3x more pieces published per week
- **Quality:** relevance scores from readers stayed constant (no quality drop from automation)

### Going Further

- Swap RSS for YouTube transcript extraction to cover video content
- Add a Slack approval step before publishing to keep a human in the loop
- Chain multiple Claude calls for multi-step reasoning on complex articles

n8n's visual workflow builder makes it straightforward to experiment with new nodes without rewriting code. Pair it with Claude's structured output and you have a remarkably capable content pipeline for near-zero marginal cost.`,
    tags_tool: ["n8n", "claude_code"],
    tags_role: ["content-creator", "solopreneur", "developer"],
    tags_workflow: ["automation", "content-curation", "pipeline"],
    source_urls: [
      {
        url: "https://www.youtube.com/watch?v=def456seed2",
        platform: "youtube" as const,
        creator: "Automation Academy",
      },
      {
        url: "https://www.reddit.com/r/n8n/comments/seed02",
        platform: "reddit" as const,
        creator: "u/automate_everything",
      },
    ],
    sourceLogEntries: [
      { url: "https://www.youtube.com/watch?v=def456seed2", platform: "youtube" },
      { url: "https://www.reddit.com/r/n8n/comments/seed02", platform: "reddit" },
    ],
    rawContentEntries: [
      {
        source_url: "https://www.youtube.com/watch?v=def456seed2",
        platform: "youtube",
        raw_extract: {
          title: "Automate Content Curation with n8n + Claude API",
          summary:
            "End-to-end tutorial building an RSS-to-CMS pipeline with n8n, Claude for filtering/summarization, and Supabase as the data store.",
          tips: [
            "Use Claude to score RSS items for relevance before enriching",
            "Deduplicate against existing content using slug lookups",
            "Add retry policies and dead-letter branches for resilience",
          ],
          tags_tool: ["n8n", "claude_code"],
          tags_role: ["content-creator"],
          tags_workflow: ["automation", "content-curation"],
          quality_signal: "high",
          source_creator: "Automation Academy",
        },
      },
      {
        source_url: "https://www.reddit.com/r/n8n/comments/seed02",
        platform: "reddit",
        raw_extract: {
          title: "My n8n + Claude content pipeline saves me 45 min/day",
          summary:
            "Solo operator shares results from two weeks of running an automated content pipeline built with n8n and Claude.",
          tips: [
            "Log token usage to a monitoring table",
            "Use environment variables for API keys in n8n",
            "Add Slack approval for human-in-the-loop publishing",
          ],
          tags_tool: ["n8n", "claude_code"],
          tags_role: ["solopreneur"],
          tags_workflow: ["automation", "pipeline"],
          quality_signal: "medium",
          source_creator: "u/automate_everything",
        },
      },
    ],
  },

  // ── 3. Cursor Editor ────────────────────────────────────────────────────
  {
    title: "Cursor Rules Files: How to Get Consistent Code Generation",
    slug: `cursor-rules-files-consistent-code-generation-${TODAY}`,
    summary:
      "Cursor's .cursorrules file is the secret to getting reliable, project-aware code generation. Learn how to structure rules for TypeScript projects, avoid common pitfalls, and integrate Cursor into a team workflow.",
    body: `## Why Code Generation Without Context Produces Garbage

Every developer who has used AI code generation has experienced this: you ask for a React component and get class components when your project uses hooks, or you ask for an API route and it imports from a framework you don't use. The model doesn't know your project's conventions.

Cursor's \`.cursorrules\` file solves this by injecting project-specific instructions into every prompt. Think of it as a system prompt that travels with your repo.

### Anatomy of a Good .cursorrules File

A well-structured rules file covers four areas:

#### 1. Tech Stack Declaration

\`\`\`
You are working in a Next.js 14 app using the App Router.
The database is Supabase (PostgreSQL). The ORM is raw SQL via
@supabase/supabase-js — do NOT use Prisma or Drizzle.
Styling: Tailwind CSS v4 with the tw-animate-css plugin.
State management: React Server Components by default;
use "use client" only when event handlers or hooks are needed.
\`\`\`

This single paragraph prevents the three most common hallucinations: wrong framework APIs, wrong ORM, and unnecessary client components.

#### 2. File and Naming Conventions

\`\`\`
- Components: PascalCase in src/components/ui/ (e.g., ContentCard.tsx)
- Server actions: src/app/actions/<domain>.ts
- Types: src/types/index.ts — always export from the barrel file
- Utilities: src/lib/<domain>/<file>.ts
- Tests: co-located as <file>.test.ts using vitest
\`\`\`

#### 3. Code Style Rules

\`\`\`
- Use "function" declarations for components, not arrow functions
- Prefer early returns over nested if/else
- All database queries go through the service client from src/lib/supabase/server.ts
- Never use "any" — define a type or use "unknown" with a type guard
- Error handling: wrap async calls in try/catch; log the error; return a typed Result object
\`\`\`

#### 4. Forbidden Patterns

\`\`\`
NEVER:
- Install new packages without asking first
- Use default exports (we use named exports everywhere)
- Put business logic in components — extract to lib/
- Commit console.log statements
- Use string literal types inline — add them to src/types/index.ts
\`\`\`

### Common Pitfalls

**Rules that are too vague.** "Write clean code" tells the model nothing. Be specific: "Functions should be under 30 lines. Extract helpers for complex conditionals."

**Contradictory rules.** If your rules say "use Server Components" but also "use useState for everything," the model will be confused. Audit your rules for internal consistency.

**Stale rules.** When you migrate from Pages Router to App Router, update the rules file. Outdated instructions are worse than no instructions because they actively mislead.

### Team Workflow Integration

1. **Commit .cursorrules to the repo** so every team member gets the same generation quality.
2. **Review rules in PRs** — when someone changes a convention, the rules file should update in the same PR.
3. **Pair with ESLint** — rules catch generation-time issues; ESLint catches anything that slips through.
4. **Add a CI check** that lints new code against key rules (e.g., no default exports, no \`any\`).

### Measuring the Impact

After introducing a \`.cursorrules\` file on a 6-person team:

- **PR revision requests** dropped by 35% in the first sprint
- **Time to first working generation** improved because developers stopped re-prompting for style corrections
- **Onboarding time** for new team members decreased since the rules file doubled as a conventions guide

Cursor's rules system is simple but high-leverage. Spend an hour writing a thorough rules file and you'll save that time back within your first week.`,
    tags_tool: ["cursor"],
    tags_role: ["developer", "tech-lead"],
    tags_workflow: ["code-generation", "developer-experience", "team-workflow"],
    source_urls: [
      {
        url: "https://www.youtube.com/watch?v=ghi789seed3",
        platform: "youtube" as const,
        creator: "DevTools Weekly",
      },
      {
        url: "https://www.reddit.com/r/cursor/comments/seed03",
        platform: "reddit" as const,
        creator: "u/cursor_power_user",
      },
    ],
    sourceLogEntries: [
      { url: "https://www.youtube.com/watch?v=ghi789seed3", platform: "youtube" },
      { url: "https://www.reddit.com/r/cursor/comments/seed03", platform: "reddit" },
    ],
    rawContentEntries: [
      {
        source_url: "https://www.youtube.com/watch?v=ghi789seed3",
        platform: "youtube",
        raw_extract: {
          title: "The Ultimate .cursorrules Guide for TypeScript Projects",
          summary:
            "Deep dive into writing effective Cursor rules files that produce consistent, project-aware code generation.",
          tips: [
            "Declare your full tech stack in the first paragraph",
            "List forbidden patterns explicitly to prevent hallucinations",
            "Commit .cursorrules so the whole team benefits",
          ],
          tags_tool: ["cursor"],
          tags_role: ["developer", "tech-lead"],
          tags_workflow: ["code-generation", "developer-experience"],
          quality_signal: "high",
          source_creator: "DevTools Weekly",
        },
      },
      {
        source_url: "https://www.reddit.com/r/cursor/comments/seed03",
        platform: "reddit",
        raw_extract: {
          title: "Our .cursorrules cut PR revisions by 35%",
          summary:
            "Team report on the measurable impact of adopting a shared .cursorrules file across a 6-person engineering team.",
          tips: [
            "Review rules changes in PRs alongside code changes",
            "Pair Cursor rules with ESLint for defense in depth",
            "Keep rules updated when conventions change",
          ],
          tags_tool: ["cursor"],
          tags_role: ["tech-lead"],
          tags_workflow: ["team-workflow"],
          quality_signal: "high",
          source_creator: "u/cursor_power_user",
        },
      },
    ],
  },

  // ── 4. ChatGPT for PMs ─────────────────────────────────────────────────
  {
    title: "ChatGPT Prompting Playbook for Product Managers",
    slug: `chatgpt-prompting-playbook-product-managers-${TODAY}`,
    summary:
      "A practical collection of ChatGPT prompts that product managers can use daily — from writing PRDs and user stories to competitive analysis, stakeholder updates, and sprint retrospective summaries.",
    body: `## Why PMs Need a Prompting System, Not Just Tips

Product managers sit at the intersection of business, design, and engineering. The work is heavily text-based: writing specs, summarizing research, crafting emails, and building presentations. ChatGPT can accelerate all of these, but only if you move beyond ad-hoc prompting.

This playbook organizes prompts into the five phases of a typical PM workflow.

### Phase 1: Discovery — User Research Synthesis

After running user interviews, drop your notes into ChatGPT with this structure:

\`\`\`
Here are notes from 8 user interviews about [feature area].
1. Identify the top 5 recurring themes.
2. For each theme, quote the most compelling user verbatim.
3. Rate each theme by frequency (how many users mentioned it)
   and intensity (how emotionally they spoke about it).
4. Suggest three "How Might We" questions based on the themes.
\`\`\`

This turns hours of affinity mapping into a 30-second operation. Always verify the quotes against your original notes — ChatGPT may paraphrase slightly.

### Phase 2: Definition — PRD and User Story Generation

Use a two-step prompt. First, generate the structure:

\`\`\`
I'm writing a PRD for [feature]. The audience is the engineering team.
Generate an outline with these sections: Problem Statement,
Goals & Non-Goals, User Stories, Technical Considerations,
Success Metrics, Open Questions.
\`\`\`

Then fill in each section with follow-up prompts. For user stories specifically:

\`\`\`
Write 8 user stories for [feature] in the format:
"As a [role], I want [capability] so that [benefit]."
Include acceptance criteria for each story.
Prioritize using MoSCoW (Must/Should/Could/Won't).
\`\`\`

### Phase 3: Analysis — Competitive Intelligence

ChatGPT can structure competitive analysis even without real-time web access if you paste in the data:

\`\`\`
Here are the pricing pages and feature lists for [Competitor A],
[Competitor B], and [Competitor C]. Create a comparison matrix with
these dimensions: pricing tiers, key features, integration options,
target audience, and notable gaps we could exploit.
\`\`\`

Pair this with a web-browsing-enabled model or plugin for the most up-to-date information.

### Phase 4: Communication — Stakeholder Updates

PMs spend a surprising amount of time writing status updates. Templatize it:

\`\`\`
Write a weekly stakeholder update email for [project name].
Tone: professional but concise. Structure:
- TL;DR (2 sentences)
- Progress this week (3-5 bullets)
- Blockers (if any)
- Next week's focus
- Key metric movement

Here are my raw notes: [paste notes]
\`\`\`

### Phase 5: Retrospective — Sprint Analysis

After a sprint, feed ChatGPT your retro notes:

\`\`\`
Here are our sprint retrospective notes (what went well,
what didn't, action items). Summarize into:
1. Three key wins to celebrate
2. The single biggest process improvement opportunity
3. A suggested experiment for next sprint to address the top issue
\`\`\`

### Prompting Principles for PMs

- **Always provide context about your audience.** A PRD for engineers reads differently than an executive summary for the C-suite.
- **Ask for structured output.** Tables, bullet lists, and numbered items are easier to drop into docs and slides.
- **Iterate in the same conversation.** ChatGPT's context window lets you refine outputs without re-explaining the project.
- **Fact-check everything.** AI-generated competitive intel or user quotes must be verified against primary sources.
- **Save your best prompts.** Build a team Notion page with proven prompts that anyone on the product team can reuse.

### What Not to Use ChatGPT For

- Final customer-facing copy (always have marketing review)
- Decisions that require real-time data you haven't provided
- Performance reviews or sensitive HR communications
- Anything involving confidential user data without proper data handling agreements

This playbook is a starting point. The best PM prompts are the ones you refine over weeks of daily use. Start with one workflow phase, build the habit, and expand from there.`,
    tags_tool: ["chatgpt"],
    tags_role: ["product-manager", "team-lead"],
    tags_workflow: ["writing", "research", "stakeholder-communication"],
    source_urls: [
      {
        url: "https://www.youtube.com/watch?v=jkl012seed4",
        platform: "youtube" as const,
        creator: "Product School",
      },
      {
        url: "https://www.reddit.com/r/ProductManagement/comments/seed04",
        platform: "reddit" as const,
        creator: "u/pm_toolbox",
      },
    ],
    sourceLogEntries: [
      { url: "https://www.youtube.com/watch?v=jkl012seed4", platform: "youtube" },
      {
        url: "https://www.reddit.com/r/ProductManagement/comments/seed04",
        platform: "reddit",
      },
    ],
    rawContentEntries: [
      {
        source_url: "https://www.youtube.com/watch?v=jkl012seed4",
        platform: "youtube",
        raw_extract: {
          title: "ChatGPT for Product Managers: A Complete Prompting System",
          summary:
            "Structured approach to using ChatGPT across the PM workflow — from research synthesis to sprint retros.",
          tips: [
            "Organize prompts by PM workflow phase for systematic adoption",
            "Always specify the audience in your prompt for better output tone",
            "Use two-step prompts: outline first, then fill in sections",
          ],
          tags_tool: ["chatgpt"],
          tags_role: ["product-manager"],
          tags_workflow: ["writing", "research"],
          quality_signal: "high",
          source_creator: "Product School",
        },
      },
      {
        source_url: "https://www.reddit.com/r/ProductManagement/comments/seed04",
        platform: "reddit",
        raw_extract: {
          title: "My ChatGPT prompt library for PM work",
          summary:
            "PM shares a collection of daily-use prompts for user story generation, stakeholder updates, and competitive analysis.",
          tips: [
            "Save proven prompts in a shared team Notion page",
            "Iterate within the same conversation for better refinements",
            "Always fact-check AI-generated competitive intelligence",
          ],
          tags_tool: ["chatgpt"],
          tags_role: ["product-manager", "team-lead"],
          tags_workflow: ["stakeholder-communication"],
          quality_signal: "medium",
          source_creator: "u/pm_toolbox",
        },
      },
    ],
  },
];

// ─── Seed Runner ────────────────────────────────────────────────────────────

async function seed() {
  console.log("Starting TipStack seed...\n");

  for (const piece of pieces) {
    const label = piece.slug;

    // 1. Insert sources_log entries
    console.log(`[${label}] Inserting sources_log entries...`);
    for (const entry of piece.sourceLogEntries) {
      const { error } = await supabase
        .from("sources_log")
        .upsert(
          { url: entry.url, platform: entry.platform },
          { onConflict: "url" }
        );
      if (error) {
        console.error(`  sources_log error for ${entry.url}:`, error.message);
      }
    }

    // 2. Insert raw_content entries
    console.log(`[${label}] Inserting raw_content entries...`);
    for (const entry of piece.rawContentEntries) {
      const { error } = await supabase.from("raw_content").insert({
        source_url: entry.source_url,
        platform: entry.platform,
        raw_extract: entry.raw_extract,
        status: "merged",
        batch_date: TODAY,
      });
      if (error) {
        console.error(
          `  raw_content error for ${entry.source_url}:`,
          error.message
        );
      }
    }

    // 3. Insert published content piece
    console.log(`[${label}] Inserting content piece...`);
    const { error } = await supabase.from("content").upsert(
      {
        title: piece.title,
        slug: piece.slug,
        summary: piece.summary,
        body: piece.body,
        status: "published",
        tags_tool: piece.tags_tool,
        tags_role: piece.tags_role,
        tags_workflow: piece.tags_workflow,
        source_urls: piece.source_urls,
        published_at: `${TODAY}T08:00:00Z`,
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.error(`  content error:`, error.message);
    } else {
      console.log(`  Published: "${piece.title}"`);
    }

    console.log();
  }

  console.log("Seed complete. Inserted 4 content pieces with sources and raw content.");
}

seed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
