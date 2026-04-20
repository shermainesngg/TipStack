@AGENTS.md

# TipStack

AI workflow tip aggregation platform. Fetches content from YouTube, Reddit, and Twitter/X, runs it through a Claude-powered extraction/dedup/synthesis pipeline, and publishes curated tips to a Next.js frontend.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, `"use cache"` directive for ISR)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui (base-nova style), framer-motion for animations
- **Database**: Supabase (Postgres with RLS). Anon key for reads, service_role key for pipeline writes
- **AI**: Claude API via `@anthropic-ai/sdk` — model set in `src/lib/ai/anthropic.ts`
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
npx tsx scripts/fetch-youtube.ts    # Fetch new YouTube items
npx tsx scripts/fetch-reddit.ts     # Fetch new Reddit items
npx tsx scripts/fetch-twitter.ts    # Fetch new Twitter items
npx tsx scripts/fetch-news.ts       # Fetch AI news via Hacker News (focus topics)
npx tsx scripts/fetch-all.ts        # Fetch from all sources
npx tsx scripts/push-content.ts     # Push fetched content through pipeline
npx tsx scripts/seed.ts             # Seed database with sample content
```

## Project Structure

```
src/
  app/                        # Next.js App Router pages
    page.tsx                  # Home feed (featured + filtered list)
    content/[slug]/           # Individual content piece
    categories/[category]/    # Category landing pages
    domains/[domain]/         # Domain-filtered pages
    api/inngest/              # Inngest webhook endpoint
    api/revalidate/           # ISR revalidation endpoint
  components/
    ui/                       # shadcn/ui primitives
    category-layouts/         # Per-category custom layouts (7 categories)
    *.tsx                     # Feature components (feed, cards, filters, nav)
  lib/
    ai/anthropic.ts           # Claude client singleton + model constant
    pipeline/                 # Content pipeline stages
      ingest.ts               # Extract structured data from raw content via Claude
      dedup.ts                # Dedup + quality filter via Claude
      synthesize.ts           # Merge filtered items into publishable pieces via Claude
      notify.ts               # Email notification via Resend
      __tests__/              # Vitest tests for pipeline
    inngest/                  # Inngest function definitions + client
    supabase/
      server.ts               # Service-role client (pipeline writes)
      browser.ts              # Anon-key client (frontend reads)
      queries.ts              # All Supabase queries (reads use anon, writes use service)
    sources/
      youtube.ts, reddit.ts, twitter.ts   # Source fetchers
      config.ts               # Channel lists, subreddits, Twitter accounts, thresholds
    categories.ts             # Category configs, activity filters, inference logic
    domains.ts                # Domain configs
    tools.ts                  # Tool tag normalization + alias expansion
    utils.ts                  # cn() helper, formatFreshness()
  types/index.ts              # All TypeScript types (DB rows, pipeline, config)
scripts/                      # Manual CLI scripts for fetching + seeding
supabase/
  migrations/                 # Sequential SQL migrations (001-007)
  seed.sql                    # Seed data
```

## Database Schema

Three tables, all with RLS enabled:

- **`content`** — Published tips shown on the frontend. Has `tags_tool[]`, `tags_focus[]`, `tags_workflow[]`, `tags_domain[]`, `tags_category` (single enum), `content_type`, `source_urls` (JSONB). Status: `pending_review` | `published` | `rejected`
- **`raw_content`** — Extracted items before synthesis. `raw_extract` is JSONB containing the Claude extraction. Status: `ingested` | `filtered` | `merged` | `discarded`
- **`sources_log`** — URL dedup log to prevent reprocessing

Anon role can only SELECT published content. Service role has full access.

## Content Pipeline

Flow: **Fetch -> Extract -> Dedup -> Synthesize -> Notify**

1. **Fetch**: Pull new items from YouTube/Reddit/Twitter (source fetchers in `src/lib/sources/`)
2. **Extract** (`ingest.ts`): Each item gets a Claude call that returns structured data via tool_use
3. **Dedup** (`dedup.ts`): Batch Claude call scores quality (1-10), discards <5 and duplicates
4. **Synthesize** (`synthesize.ts`): Batch Claude call merges related items into publishable pieces
5. **Notify** (`notify.ts`): Email admin via Resend with pipeline stats

Orchestrated by Inngest with one step per item (Vercel Hobby timeout constraint).

## Patterns and Conventions

- **Imports**: Use `@/` path alias for all src imports. Absolute imports only.
- **Types**: All types live in `src/types/index.ts`. Use `snake_case` for DB column names, `camelCase` for TS function params.
- **Supabase clients**: `getReadClient()` (anon key) for frontend queries, `getServiceClient()` (service role) for pipeline writes. Never expose the service client to the browser.
- **Claude structured output**: All Claude calls use `tool_use` with `tool_choice: { type: "tool", name: "..." }` to guarantee parseable JSON. No free-form text parsing.
- **Tag normalization**: Tool tags go through `normalizeToolTag()` and `expandToolAliases()` in `src/lib/tools.ts` for consistent display and querying.
- **Categories**: 7 intent-based categories defined in `src/lib/categories.ts`. Each has a slug, colors, icon, and activity filters. Category inference logic maps workflow/focus/domain tags to categories.
- **Caching**: Pages use Next.js `"use cache"` directive with `cacheTag("content")` and `cacheLife("hours")`. ISR revalidation via `/api/revalidate` endpoint with `REVALIDATION_SECRET`.
- **Error handling**: Supabase queries throw on error. Pipeline stages propagate errors to Inngest for retry.
- **Components**: Server components by default. Client components only when needed (animations, interactivity). Use `"use client"` directive explicitly.
- **Styling**: Tailwind utility classes with hardcoded hex values from the design system (not CSS variables) for category/domain tints. `cn()` for conditional classes.

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
