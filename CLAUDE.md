@AGENTS.md

# TipStack

AI workflow tip aggregation platform. Fetches content from YouTube, Reddit, Twitter/X, news, and docs sources, runs it through a Claude-powered extraction/dedup/synthesis pipeline, and publishes curated tips to a Next.js frontend.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, `"use cache"` directive for ISR)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui (base-nova style), framer-motion for animations
- **Database**: Supabase (Postgres with RLS). Anon key for reads, service_role key for pipeline writes
- **AI**: Claude Code CLI via `src/lib/ai/claude-code.ts` — shells out to `claude -p` with JSON schema enforcement
- **Orchestration**: Inngest for multi-step pipeline functions (one step per item to stay under Vercel timeouts)
- **Email**: Resend for admin pipeline notifications
- **Testing**: Vitest with `vi.mock()`, path alias `@/` resolved in vitest.config.ts
- **Linting**: ESLint 9 flat config with next/core-web-vitals + next/typescript

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
npx vitest        # Run tests
```

### Pipeline Scripts (run manually)

```bash
npx tsx scripts/fetch-youtube.ts     # Fetch new YouTube items
npx tsx scripts/fetch-reddit.ts      # Fetch new Reddit items
npx tsx scripts/fetch-twitter.ts     # Fetch new Twitter items
npx tsx scripts/fetch-news.ts        # Fetch AI news via Hacker News
npx tsx scripts/fetch-docs.ts        # Fetch from documentation sources
npx tsx scripts/fetch-all.ts         # Fetch from all sources
npx tsx scripts/process-fetched.ts   # Run extraction on fetched items
npx tsx scripts/push-content.ts      # Push extracted content through dedup + synthesis
npx tsx scripts/seed-feed-posts.ts   # Generate feed posts from published content
npx tsx scripts/seed.ts              # Seed database with sample content
```

## Project Structure

```
src/
  app/                        # Next.js App Router pages
    page.tsx                  # Home feed (feed posts + stats)
    timeline/                 # Timeline view
    content/[slug]/           # Individual content piece (living article)
    categories/[category]/    # Category landing pages (7 categories)
    domains/[domain]/         # Domain-filtered pages
    api/inngest/              # Inngest webhook endpoint
    api/feed/                 # Feed pagination API
    api/revalidate/           # ISR revalidation endpoint
  components/
    ui/                       # shadcn/ui primitives
    category-layouts/         # Per-category custom layouts (7 categories)
    *.tsx                     # Feature components (feed, cards, filters, nav)
  lib/
    ai/claude-code.ts         # Claude Code CLI wrapper (callClaudeCode + pMap concurrency)
    pipeline/                 # Content pipeline stages
      ingest.ts               # Batch extraction via Claude (EXTRACT_BATCH_SIZE = 5)
      dedup.ts                # Dedup + quality filter
      synthesize.ts           # Merge items into publishable content pieces
      match-articles.ts       # Match new content to existing living articles
      generate-feed-posts.ts  # Generate news-style feed posts
      notify.ts               # Email notification via Resend
      __tests__/              # Vitest tests for pipeline
    inngest/                  # Inngest function definitions + client
    supabase/
      server.ts               # Service-role client (pipeline writes)
      browser.ts              # Anon-key client (frontend reads)
      queries.ts              # All DB operations — single source of truth
    sources/
      youtube.ts, reddit.ts, twitter.ts, docs.ts  # Source fetchers
      config.ts               # Channel lists, subreddits, accounts, thresholds
    categories.ts             # 7 intent-based categories with colors/icons/filters
    domains.ts                # Domain configs
    tools.ts                  # Tool tag normalization + alias expansion
    utils.ts                  # cn() helper, formatFreshness()
  types/index.ts              # All TypeScript types (DB rows, pipeline, config)
scripts/                      # Manual CLI scripts for fetching + seeding
supabase/
  migrations/                 # Sequential SQL migrations (001-012)
  seed.sql                    # Seed data
```

## Database Schema

Four tables, all with RLS enabled:

- **`content`** — Published living articles. Has `tags_tool[]`, `tags_focus[]`, `tags_workflow[]`, `tags_domain[]`, `tags_category` (single enum), `content_type`, `source_urls` (JSONB), `sub_topic`, `needs_review`, `review_reason`, `based_on_version`, `last_rewritten_at`. Status: `pending_review` | `published` | `rejected`
- **`raw_content`** — Extracted items before synthesis. `raw_extract` is JSONB. Status: `ingested` | `filtered` | `merged` | `discarded`
- **`sources_log`** — URL dedup log to prevent reprocessing
- **`feed_posts`** — News-style feed entries linking to content articles. Has `headline`, `summary`, `source_urls`, `topic_content_id` (FK to content), `source_platforms[]`, `pipeline_run_id`

Anon role can only SELECT published content. Service role has full access.

## Content Pipeline

Flow: **Fetch -> Extract -> Dedup -> Match -> Synthesize -> Feed Posts -> Notify**

1. **Fetch**: Pull new items from sources (scripts in `scripts/`)
2. **Extract** (`ingest.ts`): Batch Claude calls extract structured data with quality scores (JSON schema enforcement)
3. **Dedup** (`dedup.ts`): Claude scores quality (1-10), discards <5 and duplicates
4. **Match** (`match-articles.ts`): Find existing living articles matching new content by tag overlap
5. **Synthesize** (`synthesize.ts`): Merge related items into publishable pieces or update existing articles
6. **Feed Posts** (`generate-feed-posts.ts`): Generate news-style feed posts for new/updated content
7. **Notify** (`notify.ts`): Email admin via Resend with pipeline stats

AI calls use `callClaudeCode()` which shells out to the Claude CLI with `--output-format json` and JSON schema instructions. Concurrency managed by `pMap()` (default 5 concurrent).

## Patterns and Conventions

- **Imports**: Use `@/` path alias for all src imports. Absolute imports only.
- **Types**: All types live in `src/types/index.ts`. Use `snake_case` for DB column names, `camelCase` for TS function params.
- **Supabase clients**: `getReadClient()` (anon key) for frontend queries, `getServiceClient()` (service role) for pipeline writes. Never expose the service client to the browser. `queries.ts` is the only file that touches Supabase directly.
- **Claude structured output**: All Claude calls go through `callClaudeCode()` in `src/lib/ai/claude-code.ts`. Pass a JSON schema — the wrapper enforces JSON-only responses. No free-form text parsing.
- **Tag normalization**: Tool tags go through `normalizeToolTag()` and `expandToolAliases()` in `src/lib/tools.ts` for consistent display and querying.
- **Categories**: 7 intent-based categories defined in `src/lib/categories.ts`: `claude_code_features`, `security_and_guardrails`, `github_skills`, `prompting_and_rules`, `workflow_patterns`, `mcp_and_integrations`, `debugging_and_testing`.
- **Caching**: Pages use `"use cache"` directive with `cacheTag()` and `cacheLife("hours")`. ISR revalidation via `/api/revalidate` endpoint with `REVALIDATION_SECRET`.
- **Error handling**: Supabase queries throw on error. Pipeline stages propagate errors to Inngest for retry.
- **Components**: Server components by default. Client components only when needed (animations, interactivity). Use `"use client"` directive explicitly.
- **Styling**: Tailwind utility classes with hardcoded hex values from the design system. `cn()` for conditional classes.
- **Pipeline batch size**: Extraction batches 5 items per Claude call (configurable via `EXTRACT_BATCH_SIZE`).

## Environment Variables

See `.env.example` for the full list. Key groups:
- `ANTHROPIC_API_KEY` — Claude API for pipeline
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase
- `YOUTUBE_API_KEY`, `REDDIT_CLIENT_ID/SECRET` — Source APIs
- `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` — Inngest orchestration
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_EMAIL` — Email notifications
- `REVALIDATION_SECRET` — ISR cache busting

## Frontend Design System

Always invoke the `tipstack-ui` skill before writing any frontend code. It contains the authoritative color palette, typography, spacing, component patterns, and interaction behaviors for TipStack. Do not improvise these values.

## Behavioral Guidelines

### Think Before Coding
- State assumptions explicitly before making changes to pipeline stages — a wrong assumption about data flow cascades across extract/dedup/synthesize/match.
- Check which Supabase client a function uses before modifying queries. Mixing up service vs read client breaks RLS silently.

### Simplicity First
- No unnecessary abstractions. The pipeline stages are intentionally flat — each file does one thing with one Claude call pattern.
- Don't add retry logic or error recovery in pipeline code — Inngest handles retries at the orchestration layer.
- `callClaudeCode()` is the single AI interface. Don't introduce alternative AI call patterns.

### Surgical Changes
- When modifying pipeline stages, only change the specific schema/prompt — don't refactor the surrounding `callClaudeCode` pattern or batch logic.
- When adding a column, follow the migration numbering convention (next: `013_*.sql`) and update `src/types/index.ts` + `queries.ts` together.
- When adding a new source fetcher, follow the existing pattern in `src/lib/sources/` and add the platform to the `Platform` type.

### Goal-Driven Execution
- Pipeline changes need the full chain verified: does the extraction schema change flow through dedup, synthesis, and into the content table?
- Frontend changes should be tested against the actual feed data shape (check `FeedPost` and `Content` types before assuming field availability).
- New categories or tags must be added to the type enum AND the Claude extraction schema in `ingest.ts`.
