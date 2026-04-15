-- TipStack seed data
-- Simulates a complete pipeline run with realistic AI workflow tip content.
-- Run after applying 001_initial_schema.sql.

-- ═══════════════════════════════════════════════════════════════════════════════
-- sources_log — 8 processed URLs (4 YouTube, 4 Reddit)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO sources_log (id, url, platform, processed_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'https://www.youtube.com/watch?v=Kx3dGHqVbLo', 'youtube', '2026-04-11 08:12:00+00'),
  ('a1000000-0000-0000-0000-000000000002', 'https://www.youtube.com/watch?v=TfPQ9bRjHXk', 'youtube', '2026-04-11 08:14:30+00'),
  ('a1000000-0000-0000-0000-000000000003', 'https://www.youtube.com/watch?v=9wLcR4mN2Ds', 'youtube', '2026-04-11 08:17:00+00'),
  ('a1000000-0000-0000-0000-000000000004', 'https://www.youtube.com/watch?v=pLvEjR7MfWg', 'youtube', '2026-04-11 08:19:45+00'),
  ('a1000000-0000-0000-0000-000000000005', 'https://www.reddit.com/r/ClaudeAI/comments/1k2m8x9/claude_code_shortcuts_nobody_talks_about/', 'reddit', '2026-04-11 08:22:00+00'),
  ('a1000000-0000-0000-0000-000000000006', 'https://www.reddit.com/r/n8n/comments/1k3r4a2/automated_content_pipeline_with_claude_api/', 'reddit', '2026-04-11 08:24:30+00'),
  ('a1000000-0000-0000-0000-000000000007', 'https://www.reddit.com/r/cursor/comments/1k4t6b3/the_cursorrules_feature_is_underrated/', 'reddit', '2026-04-11 08:27:00+00'),
  ('a1000000-0000-0000-0000-000000000008', 'https://www.reddit.com/r/ChatGPTPro/comments/1k5v8c4/how_i_use_chatgpt_pro_for_stakeholder_comms/', 'reddit', '2026-04-11 08:29:15+00');

-- ═══════════════════════════════════════════════════════════════════════════════
-- raw_content — 8 extracted items (5 merged, 2 discarded, 1 filtered)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO raw_content (id, source_url, platform, raw_extract, status, batch_date, created_at) VALUES

-- ── merged (5) ──────────────────────────────────────────────────────────────

('b2000000-0000-0000-0000-000000000001',
 'https://www.youtube.com/watch?v=Kx3dGHqVbLo',
 'youtube',
 '{
    "title": "Claude Code Power User Tips — Save Your Context Window",
    "summary": "Walkthrough of lesser-known Claude Code CLI flags and prompt patterns that reduce token usage and speed up iteration.",
    "tips": [
      "Use /compact to summarize conversation history and free up context window space",
      "Prefix prompts with a file glob so Claude only reads relevant files",
      "Chain slash commands like /clear then /compact between large tasks",
      "Pipe linter output directly into Claude Code for targeted fixes",
      "Use CLAUDE.md to front-load project conventions so every prompt starts informed"
    ],
    "tags_tool": ["claude_code"],
    "tags_focus": ["prompt_engineering"],
    "tags_workflow": ["coding"],
    "quality_signal": 0.92,
    "source_creator": "IndyDevDan"
  }',
 'merged', '2026-04-11', '2026-04-11 08:30:00+00'),

('b2000000-0000-0000-0000-000000000002',
 'https://www.reddit.com/r/ClaudeAI/comments/1k2m8x9/claude_code_shortcuts_nobody_talks_about/',
 'reddit',
 '{
    "title": "Claude Code shortcuts nobody talks about",
    "summary": "Reddit thread listing underused CLI features including memory management tricks and multi-file editing patterns.",
    "tips": [
      "Create a CLAUDE.md at project root with build commands, test commands, and code style rules",
      "Use git diff piped into Claude Code so it reviews only your changes",
      "The /init command bootstraps a CLAUDE.md by scanning the repo automatically"
    ],
    "tags_tool": ["claude_code"],
    "tags_focus": ["prompt_engineering"],
    "tags_workflow": ["coding"],
    "quality_signal": 0.88,
    "source_creator": "u/prompt_engineer_42"
  }',
 'merged', '2026-04-11', '2026-04-11 08:32:00+00'),

('b2000000-0000-0000-0000-000000000003',
 'https://www.youtube.com/watch?v=TfPQ9bRjHXk',
 'youtube',
 '{
    "title": "Full Automated Blog Pipeline: n8n + Claude API + Supabase",
    "summary": "End-to-end tutorial building a content pipeline that ingests RSS feeds, summarizes with Claude, and publishes to a Supabase-backed site.",
    "tips": [
      "Use n8n webhook nodes to trigger pipelines from external events like new RSS items",
      "Batch API calls to Claude using n8n SplitInBatches node to stay within rate limits",
      "Store intermediate results in Supabase so failed runs can resume from the last checkpoint",
      "Add a human-in-the-loop approval step with n8n Wait node before publishing"
    ],
    "tags_tool": ["n8n", "claude"],
    "tags_focus": ["cost_optimization"],
    "tags_workflow": ["automation"],
    "quality_signal": 0.95,
    "source_creator": "Cole Medin"
  }',
 'merged', '2026-04-11', '2026-04-11 08:34:00+00'),

('b2000000-0000-0000-0000-000000000004',
 'https://www.reddit.com/r/n8n/comments/1k3r4a2/automated_content_pipeline_with_claude_api/',
 'reddit',
 '{
    "title": "My automated content pipeline with Claude API — lessons learned",
    "summary": "Practitioner shares production lessons on error handling, prompt versioning, and cost tracking in an n8n + Claude content pipeline.",
    "tips": [
      "Version your prompts in a separate JSON file so n8n workflows stay clean",
      "Use n8n error trigger workflows to send Slack alerts on pipeline failures",
      "Track token usage per run by logging Claude API response headers"
    ],
    "tags_tool": ["n8n", "claude"],
    "tags_focus": ["cost_optimization"],
    "tags_workflow": ["automation"],
    "quality_signal": 0.85,
    "source_creator": "u/automation_nerd"
  }',
 'merged', '2026-04-11', '2026-04-11 08:36:00+00'),

('b2000000-0000-0000-0000-000000000005',
 'https://www.youtube.com/watch?v=9wLcR4mN2Ds',
 'youtube',
 '{
    "title": "Cursor .cursorrules — The Feature You Are Sleeping On",
    "summary": "Deep dive into writing effective .cursorrules files with examples for React, Python, and Go projects.",
    "tips": [
      "Place a .cursorrules file in the repo root to give Cursor persistent context about your project",
      "Include your preferred tech stack, naming conventions, and testing patterns in the rules",
      "Use conditional rules that apply only to specific file globs like **/*.test.ts",
      "Keep rules under 500 lines — Cursor loads them into every prompt so brevity matters"
    ],
    "tags_tool": ["cursor"],
    "tags_focus": ["prompt_engineering"],
    "tags_workflow": ["coding"],
    "quality_signal": 0.91,
    "source_creator": "Wes Bos"
  }',
 'merged', '2026-04-11', '2026-04-11 08:38:00+00'),

-- ── discarded (2) — low quality or duplicate content ────────────────────────

('b2000000-0000-0000-0000-000000000006',
 'https://www.reddit.com/r/cursor/comments/1k4t6b3/the_cursorrules_feature_is_underrated/',
 'reddit',
 '{
    "title": "The .cursorrules feature is underrated",
    "summary": "Short thread mostly agreeing that .cursorrules is useful, with limited new information beyond the existing Cursor docs.",
    "tips": [
      "Use .cursorrules for project context"
    ],
    "tags_tool": ["cursor"],
    "tags_focus": ["prompt_engineering"],
    "tags_workflow": ["coding"],
    "quality_signal": 0.35,
    "source_creator": "u/vscode_refugee"
  }',
 'discarded', '2026-04-11', '2026-04-11 08:40:00+00'),

('b2000000-0000-0000-0000-000000000007',
 'https://www.youtube.com/watch?v=pLvEjR7MfWg',
 'youtube',
 '{
    "title": "I Tried ChatGPT Pro for a Week as a PM",
    "summary": "Vlog-style video with light tips but mostly personal anecdotes and opinion.",
    "tips": [
      "ChatGPT Pro is good for writing emails"
    ],
    "tags_tool": ["gpt"],
    "tags_focus": ["governance"],
    "tags_workflow": ["writing"],
    "quality_signal": 0.30,
    "source_creator": "Lenny Rachitsky"
  }',
 'discarded', '2026-04-11', '2026-04-11 08:42:00+00'),

-- ── filtered (1) — passed ingestion but removed during quality check ────────

('b2000000-0000-0000-0000-000000000008',
 'https://www.reddit.com/r/ChatGPTPro/comments/1k5v8c4/how_i_use_chatgpt_pro_for_stakeholder_comms/',
 'reddit',
 '{
    "title": "How I use ChatGPT Pro for stakeholder comms",
    "summary": "PM describes a multi-prompt workflow for drafting status updates, executive summaries, and meeting agendas with ChatGPT Pro.",
    "tips": [
      "Create a reusable system prompt with your company jargon and acronyms",
      "Feed meeting transcripts into ChatGPT and ask for a three-tier summary: exec, team, and technical",
      "Use Custom GPTs to lock in formatting for recurring reports",
      "Paste the last three status updates and ask ChatGPT to draft the next one in the same voice"
    ],
    "tags_tool": ["gpt"],
    "tags_focus": ["governance"],
    "tags_workflow": ["writing"],
    "quality_signal": 0.72,
    "source_creator": "u/pm_workflow_hacker"
  }',
 'filtered', '2026-04-11', '2026-04-11 08:44:00+00');

-- ═══════════════════════════════════════════════════════════════════════════════
-- content — 4 published pieces with full markdown bodies
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO content (id, title, slug, summary, body, status, tags_tool, tags_focus, tags_workflow, source_urls, created_at, published_at) VALUES

-- ── Piece 1: Claude Code Shortcuts ──────────────────────────────────────────

('c3000000-0000-0000-0000-000000000001',
 '5 Claude Code Shortcuts That Save Hours of Context Window Wrestling',
 '5-claude-code-shortcuts-that-save-hours-2026-04-11',
 'Practical Claude Code CLI tips for managing context windows, reducing token usage, and iterating faster on large codebases.',
 '## Why Context Window Management Matters

If you have spent any time with Claude Code on a real codebase, you know the pain: halfway through a complex refactor the model starts "forgetting" files you discussed ten prompts ago. The context window is finite, and every token counts. The tips below — sourced from power users and community threads — address the problem head-on.

## 1. Use `/compact` Between Major Tasks

The `/compact` command asks Claude to summarize the conversation so far and collapse it into a shorter representation. Run it whenever you finish one logical unit of work (e.g., finishing a feature and moving on to tests). This can reclaim 40-60% of your context window without losing important decisions.

```bash
# After completing a feature branch
> /compact
```

## 2. Scope Prompts With File Globs

Instead of letting Claude scan your entire repo, prefix your prompt with a glob pattern so it only reads the files that matter:

```
> @src/lib/pipeline/*.ts Refactor the retry logic to use exponential backoff
```

This keeps irrelevant files out of context and makes responses faster and more focused.

## 3. Front-Load Conventions in CLAUDE.md

Create a `CLAUDE.md` file at your project root containing build commands, test commands, linting rules, and architectural decisions. Claude Code reads this file automatically at the start of every session, so you never waste tokens re-explaining your setup.

```markdown
# CLAUDE.md
- Build: `npm run build`
- Test: `npm run test`
- Style: Prefer named exports. Use TypeScript strict mode.
```

## 4. Pipe Linter Output Directly Into Claude

Rather than copy-pasting ESLint or TypeScript errors, pipe them straight in:

```bash
npx tsc --noEmit 2>&1 | claude "Fix these TypeScript errors"
```

Claude receives only the relevant diagnostics, keeps context lean, and generates targeted fixes.

## 5. Chain `/clear` and `/compact` for Long Sessions

For marathon coding sessions, periodically run `/clear` to wipe the slate, then immediately follow with `/compact` if you need to retain a summary. This two-step reset gives you a near-fresh context window while preserving key decisions.

## Bottom Line

Context window discipline is the difference between Claude Code feeling like a novelty and feeling like a genuine pair-programming partner. Small habits — scoping files, compacting often, and front-loading context — compound into dramatically better output over a full workday.',
 'published',
 ARRAY['claude_code'],
 ARRAY['prompt_engineering'],
 ARRAY['coding'],
 '[
    {"url": "https://www.youtube.com/watch?v=Kx3dGHqVbLo", "title": "Claude Code Power User Tips — Save Your Context Window", "platform": "youtube"},
    {"url": "https://www.reddit.com/r/ClaudeAI/comments/1k2m8x9/claude_code_shortcuts_nobody_talks_about/", "title": "Claude Code shortcuts nobody talks about", "platform": "reddit"}
  ]'::jsonb,
 '2026-04-11 09:00:00+00',
 '2026-04-11 10:00:00+00'),

-- ── Piece 2: n8n + Claude Content Pipelines ─────────────────────────────────

('c3000000-0000-0000-0000-000000000002',
 'Building Automated Content Pipelines with n8n and Claude',
 'building-automated-content-pipelines-n8n-claude-2026-04-11',
 'A practitioner guide to designing resilient content pipelines using n8n for orchestration and Claude for summarization, with lessons on error handling and cost control.',
 '## The Promise of Automated Content Pipelines

Manually curating and summarizing content does not scale. Whether you are aggregating industry news, monitoring competitor blogs, or building a tip-of-the-day service, the pattern is the same: ingest, enrich with AI, review, publish. n8n and the Claude API make this surprisingly approachable.

## Architecture Overview

A typical pipeline has four stages:

1. **Ingest** — n8n polls RSS feeds, YouTube channels, or Reddit via webhook and schedule trigger nodes.
2. **Extract & Summarize** — Each new item is sent to the Claude API with a structured prompt that returns JSON: title, summary, tips, and quality score.
3. **Store & Filter** — Results land in Supabase. A quality threshold filters out low-signal content automatically.
4. **Review & Publish** — A human reviewer approves or rejects pieces via a simple dashboard. Approved items go live.

## Key Lessons From Production

### Batch Your API Calls

Use n8n''s **SplitInBatches** node to process items in groups of five or ten. This prevents rate-limit errors from the Claude API and makes retries manageable:

```
SplitInBatches (size: 5) → Claude API → Merge → Supabase Insert
```

### Make Pipelines Resumable

Store intermediate state in your database. If the Claude enrichment step fails on item 47 of 100, you should be able to restart from item 47 — not from scratch. Add a `status` column to your raw content table and update it at each stage.

### Version Your Prompts

Keep prompt templates in a separate JSON or YAML file, not inline in the n8n workflow. This lets you iterate on prompts without touching workflow logic, and you can track changes in version control.

### Add a Human-in-the-Loop Step

n8n''s **Wait** node can pause a workflow until a human clicks an approval link. For content that will be published publicly, this is worth the extra latency. Quality control prevents embarrassing hallucinations from reaching your audience.

### Track Costs Per Run

The Claude API response headers include token counts. Log `input_tokens` and `output_tokens` per run and set up a Slack alert if a single pipeline execution exceeds your budget threshold.

## Getting Started

If you already have an n8n instance and a Claude API key, you can have a minimal ingest-and-summarize pipeline running in under an hour. Start with a single RSS feed, get the prompt right, then expand to more sources.',
 'published',
 ARRAY['n8n', 'claude'],
 ARRAY['cost_optimization'],
 ARRAY['automation'],
 '[
    {"url": "https://www.youtube.com/watch?v=TfPQ9bRjHXk", "title": "Full Automated Blog Pipeline: n8n + Claude API + Supabase", "platform": "youtube"},
    {"url": "https://www.reddit.com/r/n8n/comments/1k3r4a2/automated_content_pipeline_with_claude_api/", "title": "My automated content pipeline with Claude API — lessons learned", "platform": "reddit"}
  ]'::jsonb,
 '2026-04-11 09:15:00+00',
 '2026-04-11 12:00:00+00'),

-- ── Piece 3: Cursor .cursorrules ────────────────────────────────────────────

('c3000000-0000-0000-0000-000000000003',
 'Cursor''s Hidden .cursorrules Feature: A Developer''s Guide',
 'cursors-hidden-cursorrules-feature-guide-2026-04-12',
 'How to write effective .cursorrules files that give Cursor persistent project context, with examples for React, Python, and Go codebases.',
 '## What Is .cursorrules?

Cursor reads a `.cursorrules` file from your repository root every time you open the project. Think of it as a system prompt that persists across sessions — it tells Cursor about your stack, conventions, and preferences without you having to repeat yourself.

## Why Bother?

Without project-level context, AI code assistants treat every repo the same way. They might suggest CommonJS when you use ESM, or propose Jest tests when your project uses Vitest. A well-written `.cursorrules` file eliminates an entire category of unhelpful suggestions.

## Anatomy of a Good .cursorrules File

A strong rules file covers four areas:

### 1. Tech Stack Declaration

```
This is a Next.js 15 project using TypeScript, Tailwind CSS, and Supabase.
State management uses Zustand. Testing uses Vitest and Playwright.
```

### 2. Naming and Style Conventions

```
- Use named exports, not default exports.
- Component files use PascalCase: UserCard.tsx
- Utility files use camelCase: formatDate.ts
- All database queries go through src/lib/db/ — never call Supabase directly from components.
```

### 3. Testing Patterns

```
- Every new utility function must have a corresponding .test.ts file.
- Use describe/it blocks, not test() syntax.
- Mock external services with msw, not manual jest.fn() stubs.
```

### 4. Conditional Rules With File Globs

You can scope rules to specific parts of the codebase:

```
For files matching **/*.test.ts:
  - Always import { describe, it, expect } from "vitest"
  - Use factory functions for test data, never raw object literals
```

## Practical Tips

- **Keep it under 500 lines.** Cursor loads the entire file into every prompt, so verbosity costs you context window space.
- **Update it as your stack evolves.** A stale rules file is worse than none — it teaches the AI the wrong patterns.
- **Commit it to the repo.** The whole team benefits from shared AI context, and you can track changes in pull request reviews.
- **Start with pain points.** If Cursor keeps suggesting the wrong import style, add a rule for that. Grow the file organically based on real friction.

## Example for a Python FastAPI Project

```
This is a Python 3.12 FastAPI project using SQLAlchemy 2.0 and Pydantic v2.
- Use async def for all route handlers.
- Models go in src/models/, schemas in src/schemas/.
- Use Annotated[Depends(...)] for dependency injection.
- Write tests with pytest-asyncio. Use httpx.AsyncClient, not TestClient.
```

## Bottom Line

A `.cursorrules` file is ten minutes of up-front work that pays dividends on every single Cursor interaction. If you are using Cursor without one, you are leaving significant productivity on the table.',
 'published',
 ARRAY['cursor'],
 ARRAY['prompt_engineering'],
 ARRAY['coding'],
 '[
    {"url": "https://www.youtube.com/watch?v=9wLcR4mN2Ds", "title": "Cursor .cursorrules — The Feature You Are Sleeping On", "platform": "youtube"},
    {"url": "https://www.reddit.com/r/cursor/comments/1k4t6b3/the_cursorrules_feature_is_underrated/", "title": "The .cursorrules feature is underrated", "platform": "reddit"}
  ]'::jsonb,
 '2026-04-12 09:00:00+00',
 '2026-04-12 10:30:00+00'),

-- ── Piece 4: ChatGPT Pro for PMs ────────────────────────────────────────────

('c3000000-0000-0000-0000-000000000004',
 'How PMs Are Using ChatGPT Pro for Stakeholder Communication',
 'how-pms-use-chatgpt-pro-stakeholder-communication-2026-04-13',
 'A product manager''s playbook for using ChatGPT Pro to draft status updates, executive summaries, and meeting agendas faster — with prompt templates included.',
 '## The PM Communication Bottleneck

Product managers spend a disproportionate amount of time on written communication: status updates, executive summaries, meeting agendas, post-mortem reports, and roadmap narratives. The content is often repetitive in structure but unique in detail. This is exactly the kind of work where ChatGPT Pro shines.

## Strategy 1: Create a Reusable System Prompt

Start by creating a Custom GPT (or a saved system prompt) that includes your company''s jargon, acronym glossary, and preferred tone. This eliminates the need to re-explain context every session:

```
You are a writing assistant for a PM at a B2B SaaS company.
Our product is called Orion (a financial dashboard).
Key stakeholders: VP of Engineering (Sara), Head of Design (Marcus), CFO (James).
Tone: concise, data-informed, optimistic but honest.
Acronyms: ARR = Annual Recurring Revenue, NPS = Net Promoter Score,
WAU = Weekly Active Users.
```

## Strategy 2: Three-Tier Summary Generation

After a meeting or milestone, feed the raw notes or transcript into ChatGPT and request summaries at three levels of detail:

- **Executive tier** — two to three sentences for the C-suite, focused on business impact.
- **Team tier** — a paragraph covering decisions made, owners assigned, and next steps.
- **Technical tier** — detailed notes including specific metrics, edge cases discussed, and open questions.

This one prompt replaces what used to be three separate writing tasks.

## Strategy 3: Status Update Continuity

Paste your last three weekly status updates and ask ChatGPT to draft the next one in the same voice and format. The model picks up on your structure (sections, bullet style, level of detail) and produces a first draft that needs only light editing:

```
Here are my last 3 weekly updates. Draft next week''s update
covering: shipped v2.3 billing module, NPS rose to 62,
onboarding redesign delayed by 1 sprint.
```

## Strategy 4: Meeting Agenda Generation

Provide the meeting topic, attendees, and desired outcomes. ChatGPT generates a timed agenda with discussion prompts:

```
Meeting: Q2 Roadmap Review
Attendees: Engineering, Design, Product
Duration: 60 min
Desired outcomes: Finalize Q2 priorities, assign owners, flag risks

Generate a timed agenda with discussion prompts for each section.
```

## Tips for Quality Control

- **Always review before sending.** LLMs can hallucinate metrics or misattribute decisions. The draft saves time; your judgment ensures accuracy.
- **Keep a prompt library.** Save your best-performing prompts in a shared Notion page so other PMs on the team can reuse them.
- **Track what you delegate vs. what you write.** Over time, you will develop an intuition for which communication tasks benefit from AI assistance and which require your direct voice.

## Bottom Line

ChatGPT Pro does not replace the PM''s judgment, domain knowledge, or stakeholder relationships. What it does replace is the blank-page problem. Starting from a solid draft instead of a blinking cursor can save two to three hours per week — time better spent talking to customers or refining strategy.',
 'published',
 ARRAY['gpt'],
 ARRAY['governance'],
 ARRAY['writing'],
 '[
    {"url": "https://www.youtube.com/watch?v=pLvEjR7MfWg", "title": "I Tried ChatGPT Pro for a Week as a PM", "platform": "youtube"},
    {"url": "https://www.reddit.com/r/ChatGPTPro/comments/1k5v8c4/how_i_use_chatgpt_pro_for_stakeholder_comms/", "title": "How I use ChatGPT Pro for stakeholder comms", "platform": "reddit"}
  ]'::jsonb,
 '2026-04-13 09:00:00+00',
 '2026-04-13 11:00:00+00');
