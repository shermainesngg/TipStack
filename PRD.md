# TipStack — Product Requirements Document

## 1. Executive Summary

**TipStack** is a web application that curates actionable AI workflow tips, tool updates, and best practices from YouTube and Reddit. It solves the problem of information overload — AI practitioners spend hours sifting through content across platforms, most of which is hype, duplicates, or irrelevant to their specific role and toolset.

TipStack runs an automated content pipeline that ingests source material, extracts structured insights using Claude Sonnet 4.6, deduplicates and quality-filters the results, then synthesizes related items into publishable content pieces. A human review step ensures accuracy before anything goes live.

**MVP Goal:** Launch a functional content pipeline that processes real YouTube and Reddit sources, paired with a clean public-facing feed where users can filter tips by tool, role, and workflow type.

---

## 2. Mission

**Mission Statement:** Make AI workflow knowledge accessible, actionable, and personalized — so practitioners spend less time searching and more time building.

**Core Principles:**
1. **Signal over noise** — Every published piece must contain a concrete, actionable takeaway
2. **Source transparency** — Always credit and link back to original creators
3. **Role-relevant** — Content is tagged so users see what matters to them
4. **Quality over quantity** — Human review gates all published content; no auto-publish
5. **Build lean** — Ship the smallest useful version, then iterate based on real usage

---

## 3. Target Users

### Primary Persona: AI-Augmented Practitioner
- **Who:** Developers, PMs, designers, ops engineers, and founders who actively use AI tools in their daily work
- **Technical comfort:** Moderate to high — comfortable with AI tools but time-constrained
- **Pain points:**
  - Overwhelmed by the volume of AI content across YouTube, Reddit, Twitter, newsletters
  - Hard to find tips specific to their tool (Claude Code vs Cursor vs Copilot) and role
  - Most content is surface-level hype; they want concrete workflows and techniques
  - No single source aggregates and filters this information

### Secondary Persona: AI-Curious Professional
- **Who:** Professionals exploring AI tools but unsure where to start
- **Technical comfort:** Low to moderate
- **Pain points:**
  - Don't know which AI tools are relevant to their role
  - Need curated, beginner-friendly tips rather than firehose content

---

## 4. MVP Scope

### In Scope

**Core Functionality**
- [x] Automated content pipeline: Ingest → Dedup + Quality Filter → Synthesize
- [x] YouTube transcript extraction and processing
- [x] Reddit post/comment extraction and processing
- [x] Claude Sonnet 4.6 for all AI processing stages
- [x] Human review workflow via Supabase Studio
- [x] Public-facing content feed (chronological, newest first)
- [x] Tag-based filtering (by tool, role, workflow type)
- [x] Individual content pages with SEO-friendly URLs (/content/[slug])

**Technical**
- [x] Inngest for durable pipeline orchestration (one source item per step)
- [x] Supabase Postgres database with RLS policies
- [x] Next.js App Router with ISR (on-demand revalidation via revalidateTag)
- [x] Vercel Hobby tier deployment
- [x] Email notification on pipeline completion (via Resend)

**Content Sources**
- [x] Hardcoded list of specific YouTube channels (see Section 7.1)
- [x] Hardcoded list of specific subreddits (see Section 7.1)
- [x] Deduplication via sources_log table

### Out of Scope (Future Phases)

- [ ] Verify stage (AI fact-checking before human review)
- [ ] Custom admin dashboard UI (using Supabase Studio for MVP)
- [ ] User accounts and authentication
- [ ] Personalized onboarding flow
- [ ] localStorage-based user preferences
- [ ] Analytics and tracking
- [ ] Dynamic source management (add/remove sources via UI)
- [ ] Newsletter / email digest
- [ ] Search functionality
- [ ] Social sharing features
- [ ] Comments or community features
- [ ] Twitter/X as a content source
- [ ] RSS feed output

---

## 5. User Stories

1. **As a developer using Claude Code**, I want to browse tips filtered by "Claude Code" + "Coding", so that I find workflow techniques specific to my daily tools without wading through irrelevant content.

2. **As a PM exploring AI tools**, I want to filter by "PM" role, so that I see AI workflow tips relevant to product management rather than engineering-heavy content.

3. **As a time-pressed practitioner**, I want to see a chronological feed of curated tips, so that I can quickly scan what's new without reading full YouTube videos or Reddit threads.

4. **As a content consumer**, I want each tip to link back to its original source(s), so that I can dive deeper into topics that interest me.

5. **As a site visitor**, I want clean, fast-loading pages with SEO-friendly URLs, so that I can bookmark and share specific tips.

6. **As the site operator**, I want the pipeline to run automatically and notify me when content is ready for review, so that I can approve or reject items from Supabase Studio without manual triggering.

7. **As the site operator**, I want deduplication built into the pipeline, so that the same YouTube video or Reddit post isn't processed twice across runs.

8. **As a multi-tool user**, I want tips tagged with multiple tools (e.g., "Claude Code" + "Cursor"), so that I discover workflow combinations I hadn't considered.

---

## 6. Core Architecture & Patterns

### AI Integration Strategy

This pipeline uses a **Hybrid Pattern: Structured Pipeline + Smart Prompts** — the best practice for known-source content aggregation systems.

#### Why not multi-agent?

Multi-agent systems (subagent research → coordinator synthesis) are the right choice when:
- Sources are **unknown** and need to be discovered dynamically
- Tasks require **autonomous decision-making** (follow links, evaluate credibility, decide when to stop)
- The workflow is **open-ended** ("research what's happening in AI this week")

TipStack's pipeline has **none of these requirements**:
- Sources are **fixed** (known YouTube channels and subreddits)
- Fetching is **deterministic** (API calls, not browsing)
- Output format is **structured and predictable** (JSON with title, summary, tips, tags)

#### Why direct Anthropic API calls?

| Factor | Direct API Calls | Agent/Subagent Pattern |
|--------|-----------------|----------------------|
| Token cost per item | ~2,500 tokens | ~8,500 tokens (3.4x more — agent system prompts, tool definitions, reasoning loops) |
| Latency | Single request-response | Multiple round trips in agent loop |
| Output reliability | Structured JSON via tool_use | Freeform agent output, harder to parse |
| Debuggability | Deterministic — same input produces traceable output | Agent loops can take different paths each run |
| Hosting | Runs on Vercel serverless (free) | Needs persistent compute (VM, $10-30/mo minimum) |
| Error handling | Inngest retries the specific API call | Agent may retry internally in unpredictable ways |

#### Where agents would add value (post-MVP)

- **Dynamic source discovery** — "find new AI YouTube channels worth following"
- **Fact verification** — "check if this claim is true by searching the web"
- **Adaptive quality scoring** — "this source has been low-quality recently, adjust weight"

These stages genuinely need autonomous reasoning and would benefit from the Claude Agent SDK when added later.

#### The intelligence is in prompt quality, not architecture

Each pipeline stage uses a single, well-crafted API call with structured output. The quality of TipStack's content depends on **prompt engineering**, not on layering agents. Specifically:

- **Extraction prompts** include output schemas, example outputs, and clear instructions for what counts as "actionable"
- **Dedup prompts** receive the full batch for holistic comparison, not pairwise agent calls
- **Synthesis prompts** include all filtered items as context with examples of ideal published output

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│  Inngest (orchestration — scheduling, retries,      │
│           step-by-step execution)                   │
│                                                     │
│  1. FETCH (pure code, no AI)                        │
│     ├── youtube-transcript-sdk → transcript text    │
│     ├── reddit OAuth API → post/comment text        │
│     └── sources_log check → skip already-processed  │
│                                                     │
│  2. EXTRACT (single Anthropic API call per item)    │
│     └── Claude Sonnet 4.6 + structured output       │
│         Input: raw transcript/post text             │
│         Output: { title, summary, tips, tags }      │
│                                                     │
│  3. DEDUP + FILTER (batch Anthropic API call)       │
│     └── Claude sees all today's extractions         │
│         Input: array of extracted items             │
│         Output: { duplicates, quality_scores }      │
│                                                     │
│  4. SYNTHESIZE (batch Anthropic API call)           │
│     └── Claude sees all filtered items              │
│         Input: filtered items + output examples     │
│         Output: { content_pieces[] }                │
│                                                     │
│  5. STORE → Supabase (status: pending_review)       │
│  6. NOTIFY → Resend email to admin                  │
└─────────────────────────────────────────────────────┘
         │
    Human Review (Supabase Studio)
    Approve → status: published → revalidateTag()
         │
         ▼
  ┌─────────────┐
  │  Next.js    │  ISR — static pages rebuilt on approval
  │  Frontend   │
  └─────────────┘
```

### Directory Structure

```
tipstack/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home feed
│   │   ├── content/
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # Individual content page
│   │   └── api/
│   │       ├── inngest/
│   │       │   └── route.ts    # Inngest webhook handler
│   │       └── revalidate/
│   │           └── route.ts    # On-demand ISR trigger
│   ├── components/             # UI components (shadcn/ui)
│   ├── lib/
│   │   ├── supabase/           # Supabase client + queries
│   │   ├── inngest/            # Inngest client + functions
│   │   ├── pipeline/           # Pipeline stage logic
│   │   │   ├── ingest.ts       # YouTube + Reddit extraction
│   │   │   ├── dedup.ts        # Dedup + quality filter
│   │   │   └── synthesize.ts   # Content synthesis
│   │   ├── sources/            # Source fetchers
│   │   │   ├── youtube.ts      # YouTube transcript fetching
│   │   │   └── reddit.ts       # Reddit OAuth + fetching
│   │   └── ai/                 # Claude API helpers
│   │       └── anthropic.ts    # Anthropic client + prompts
│   └── types/                  # TypeScript type definitions
├── inngest/                    # Inngest function definitions
├── supabase/
│   └── migrations/             # SQL migrations
├── public/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

### Key Design Patterns

- **Hybrid AI pattern (structured pipeline + smart prompts)** — Pipeline logic lives in code (predictable, debuggable); intelligence lives in well-crafted prompts with structured output schemas. No agents or subagents needed for MVP.
- **One Inngest step per source item** — Keeps each function invocation under Vercel Hobby's 10-second timeout. Each step = one fetch + one API call.
- **Structured output via tool_use** — All Claude API calls use tool_use with JSON schemas to guarantee parseable, typed responses. No freeform text parsing.
- **Batch context for holistic reasoning** — Dedup and synthesis stages pass the full batch of items in a single API call so Claude can reason across the entire set (find duplicates, group related items), rather than pairwise comparisons.
- **Status-driven pipeline** — Content and raw_content rows transition through status enums; each pipeline stage queries by status
- **ISR with on-demand revalidation** — Pages are statically generated and only rebuilt when content is approved (revalidateTag), not on a timer
- **Service role for writes, anon role for reads** — RLS enforces that the public frontend can only read published content

---

## 7. Features

### 7.1 Content Pipeline

#### MVP Content Sources

**YouTube Channels (MVP)**

| Creator | Channel Handle | ~Subscribers | Content Focus |
|---------|---------------|-------------|---------------|
| Cole Medin | @ColeMedin | ~174K | AI agents, RAG systems, n8n automation, context engineering. Hands-on code-along style. |
| Nate Herk | @NateHerk | ~641K | AI automation tutorials, n8n workflows, Claude Code tips, open-source AI tools. |
| Chase Hannegan | @Chase-H-AI | ~200K (cross-platform) | Claude Code, AI agents, n8n automation. Focuses on making AI accessible to non-technical users. |
| Simon Scrapes | @simonscrapes | ~65K | AI automation, AI agents, n8n workflows, business AI implementation. Practical, no-fluff. |

**Subreddits — Tier 1 (MVP)**

| Subreddit | ~Subscribers | Why | Notes |
|-----------|-------------|-----|-------|
| r/ClaudeAI | ~729K | Direct source for Claude tips, workflows, prompt techniques. Highly practical. | Filter out "Claude down?" posts — use flair/score filtering. |
| r/ChatGPTPro | ~573K | Professional/advanced LLM usage — workflows, prompts, case studies. Higher signal than r/ChatGPT. | Some prompt spam, but "pro" focus keeps it actionable. |
| r/ChatGPTCoding | ~370K | Coding with LLMs — code generation techniques, developer workflow tips. | Overlaps with r/ChatGPTPro but more developer-oriented. |
| r/cursor | ~131K | Primary community for Cursor AI editor — .cursorrules sharing, coding productivity. | Narrow scope (one tool) but highly relevant to developer audience. |
| r/LocalLLaMA | ~682K | Power-user community — benchmarks, tool comparisons, alternative tools. | Can be hardware-focused; best for tool comparison and workflow extraction. |

**Subreddits — Tier 2 (Post-MVP)**

| Subreddit | ~Subscribers | Why | Notes |
|-----------|-------------|-----|-------|
| r/PromptEngineering | ~358K | Prompt techniques (chain-of-thought, system prompts, structured outputs). | Quality varies — needs heavy filtering. |
| r/OpenAI | ~2.7M | First place for OpenAI product updates and new features. | Very noisy. Best for breaking news only. |
| r/aipromptprogramming | ~213K | AI-assisted programming, code generation workflows. | Some spam/self-promotion. |
| r/n8n | ~232K | Workflow automation with heavy AI integration. Actionable automation recipes. | Specific to n8n, but patterns are transferable. |
| r/AIAssisted | ~157K | "For people who actually use AI, not just talk about it." | Smaller community, lower volume but good quality. |

**Subreddits explicitly skipped:** r/ChatGPT (too noisy, meme-heavy), r/singularity (speculation/hype), r/ArtificialIntelligence (mostly news links), r/MachineLearning (academic/research focus).

#### Stage 1: Ingest (Fetch + Extract)

**Purpose:** Fetch new content from configured sources, extract structured data using a single Claude API call per item.

**Fetch layer (pure code, no AI):**
- Fetch YouTube transcripts via `youtube-transcript-sdk`
- Fetch Reddit posts via OAuth API (60 req/min limit)
- Check `sources_log` to skip already-processed URLs

**Extract layer (one Anthropic API call per item):**
- **Method:** `anthropic.messages.create()` with `tool_use` for structured output
- **Input:** Raw transcript or post text
- **Output schema (enforced via tool_use):**
  ```json
  {
    "title": "string — concise descriptive title",
    "summary": "string — 2-3 sentence overview",
    "tips": ["string — each concrete, actionable tip extracted"],
    "tags_tool": ["claude_code", "cursor", ...],
    "tags_role": ["developer", "pm", ...],
    "tags_workflow": ["coding", "automation", ...],
    "quality_signal": "high | medium | low",
    "source_creator": "string — channel/author name"
  }
  ```
- **Why single API call:** Extraction from a single transcript is a bounded, well-defined task. One prompt with a clear schema produces reliable structured output. No agent reasoning loop needed.
- **Storage:** Write to `raw_content` table (status: `ingested`) + log URL to `sources_log`

#### Stage 2: Dedup + Quality Filter (Batch API Call)

**Purpose:** Remove duplicates and low-quality items from the ingested batch in a single pass.

**Method:** One Anthropic API call with the **full batch** as context.
- **Input:** Array of all `raw_content` items where status = `ingested` for current batch
- **Output schema (enforced via tool_use):**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "action": "keep | discard",
        "reason": "string — why kept or discarded",
        "duplicate_of": "uuid | null",
        "quality_score": 1-10
      }
    ]
  }
  ```
- **Why batch, not pairwise:** Passing all items in one call lets Claude find duplicates holistically (A≈B≈D) rather than expensive O(n²) pairwise comparisons. Also catches near-duplicates across platforms (same tip covered in a YouTube video and Reddit post).
- **Quality criteria in prompt:** Actionability (does it contain a concrete technique?), specificity (tool/workflow-specific, not generic advice), novelty (not already well-known).
- **Storage:** Update `raw_content` status to `filtered` or `discarded`

#### Stage 3: Synthesize (Batch API Call)

**Purpose:** Combine related filtered items into publishable content pieces.

**Method:** One Anthropic API call with **all filtered items** + examples of ideal output.
- **Input:** All `raw_content` items where status = `filtered`, plus 2-3 example published pieces (few-shot prompting)
- **Output schema (enforced via tool_use):**
  ```json
  {
    "content_pieces": [
      {
        "title": "string",
        "slug": "string — URL-safe, human-readable",
        "summary": "string — 2-3 sentences for card display",
        "body": "string — markdown, detailed breakdown with steps",
        "tags_tool": ["string"],
        "tags_role": ["string"],
        "tags_workflow": ["string"],
        "source_items": ["raw_content_id", ...],
        "source_urls": [{"url": "string", "platform": "string", "creator": "string"}]
      }
    ]
  }
  ```
- **Why single call with full context:** Synthesis requires seeing all items at once to group related tips (e.g., 3 different sources all covering Claude Code's new feature → one comprehensive piece). An agent loop adds latency and tokens without improving grouping quality.
- **Few-shot examples in prompt:** Include 2-3 examples of well-written published pieces to anchor tone, depth, and format.
- **Storage:** Write to `content` table (status: `pending_review`) + trigger email notification

### 7.2 Content Feed (Frontend)

- **Card-based layout** displaying title, summary, tags, and publication date
- **Tag filter UI** with three filter groups: Tool, Role, Workflow Type
- **Chronological ordering** (newest first)
- **ISR-powered** — pages served from static cache, rebuilt on content approval

### 7.3 Content Detail Page

- **URL:** `/content/[slug]` (SEO-friendly, human-readable)
- **Displays:** Full title, body (detailed breakdown/steps), tags, source links
- **Source attribution:** Links back to original YouTube videos and Reddit posts

### 7.4 Admin Workflow

- **Review via Supabase Studio:** Filter `content` table by status = `pending_review`
- **Approve:** Change status to `published`, set `published_at` timestamp
- **Reject:** Change status to `rejected`
- **Revalidation:** Approval triggers ISR revalidation via API route + `revalidateTag()`

---

## 8. Technology Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | Next.js (App Router) | Latest stable, ISR with on-demand revalidation |
| UI Library | Tailwind CSS + shadcn/ui | Copy-paste components, not an npm dependency |
| Hosting | Vercel | Hobby tier (free), 10s function timeout |
| Database | Supabase (Postgres) | Free tier, new project to be created |
| Pipeline | Inngest | Free tier, durable multi-step functions |
| AI / LLM | Anthropic API | Claude Sonnet 4.6 for all pipeline stages |
| YouTube | youtube-transcript-sdk | Transcript extraction (no Data API needed) |
| Reddit | OAuth + fetch | 60 req/min rate limit, snoowrap optional |
| Email | Resend | Pipeline completion notifications |
| Language | TypeScript | Strict mode |

---

## 9. Security & Configuration

### Authentication & Authorization
- **No user auth for MVP** — public read-only site
- **Supabase RLS policies:**
  - `anon` role: SELECT on `content` WHERE status = `published`
  - `service_role`: Full CRUD access for pipeline operations
- **Admin access:** Via Supabase Studio (password-protected dashboard)

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API access for pipeline AI stages |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public, read-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-side only, pipeline writes) |
| `YOUTUBE_API_KEY` | YouTube video metadata (if needed beyond transcripts) |
| `REDDIT_CLIENT_ID` | Reddit OAuth app client ID |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth app client secret |
| `INNGEST_EVENT_KEY` | Inngest event sending |
| `INNGEST_SIGNING_KEY` | Inngest webhook verification |
| `RESEND_API_KEY` | Email notification sending |

### Security Scope
- **In scope:** RLS enforcement, service_role key protection, HTTPS everywhere
- **Out of scope for MVP:** Rate limiting on public API, CSRF (no forms), WAF, DDoS protection (Vercel handles basics)

---

## 10. API Specification

### Internal API Routes

#### `POST /api/inngest`
- **Purpose:** Inngest webhook handler — receives and dispatches pipeline events
- **Auth:** Verified via `INNGEST_SIGNING_KEY`
- **Managed by:** Inngest SDK

#### `POST /api/revalidate`
- **Purpose:** Trigger ISR revalidation when content is approved
- **Auth:** Secret token in request header
- **Request:**
  ```json
  {
    "tag": "content",
    "secret": "REVALIDATION_SECRET"
  }
  ```
- **Response:**
  ```json
  { "revalidated": true }
  ```

### Supabase Queries (Server-Side)

#### Fetch published content (feed)
```sql
SELECT id, title, slug, summary, tags_tool, tags_role, tags_workflow, published_at
FROM content
WHERE status = 'published'
ORDER BY published_at DESC
LIMIT 20 OFFSET ?
```

#### Fetch single content piece
```sql
SELECT *
FROM content
WHERE slug = ? AND status = 'published'
```

#### Fetch with tag filter
```sql
SELECT id, title, slug, summary, tags_tool, tags_role, tags_workflow, published_at
FROM content
WHERE status = 'published'
  AND (tags_tool && ARRAY[?] OR tags_role && ARRAY[?] OR tags_workflow && ARRAY[?])
ORDER BY published_at DESC
```

---

## 11. Success Criteria

### MVP Success Definition
The MVP is successful when the pipeline can process real YouTube and Reddit sources end-to-end, a human can review and approve content via Supabase Studio, and approved content appears on a public feed with working tag filters.

### Functional Requirements
- [x] Pipeline ingests content from at least 3 YouTube channels and 2 subreddits
- [x] Dedup correctly prevents reprocessing of the same source URL
- [x] Claude extraction produces structured, tagged content with actionable tips
- [x] Quality filter removes low-signal content (>50% of raw items filtered out)
- [x] Synthesized content pieces are coherent and readable
- [x] Admin can approve/reject via Supabase Studio
- [x] Approved content appears on public feed within seconds (ISR revalidation)
- [x] Tag filtering works across all three dimensions (tool, role, workflow)
- [x] Content pages load in under 2 seconds (static via ISR)
- [x] Email notification fires when pipeline batch completes

### Quality Indicators
- Published content is specific and actionable (not vague AI hype)
- Tags are accurate and consistent across content pieces
- Source attribution is correct and links are valid
- No duplicate or near-duplicate content published

---

## 12. Implementation Phases

### Phase 1: Database & Pipeline Foundation
**Goal:** Set up infrastructure and build the ingest stage with working extraction

**Deliverables:**

*Project Setup*
- [ ] Scaffold Next.js project with TypeScript, Tailwind CSS, and shadcn/ui
- [ ] Install dependencies: `@anthropic-ai/sdk`, `inngest`, `@supabase/supabase-js`, `youtube-transcript`
- [ ] Create `.env.local` with all environment variables (see Section 9): `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `YOUTUBE_API_KEY`, `RESEND_API_KEY`
- [ ] Create source config module (`src/lib/sources/config.ts`) with hardcoded YouTube channel IDs and subreddit names

*Database*
- [ ] Create Supabase project
- [ ] Apply schema: `content`, `raw_content`, `sources_log` tables (see Section 5)
- [ ] Apply indexes (content.status, content.published_at, content.slug, raw_content.status+batch_date, sources_log.url)
- [ ] Apply RLS policies (anon: read published content only; service_role: full access)

*External Service Registration*
- [ ] Register Reddit OAuth app at reddit.com/prefs/apps → obtain `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`
- [ ] Obtain YouTube Data API key (needed for listing recent uploads by channel — transcript SDK only handles individual video transcripts)
- [ ] Create Inngest account and obtain `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`

*Inngest Pipeline Wiring*
- [ ] Create Inngest client (`src/lib/inngest/client.ts`)
- [ ] Create Inngest serve handler (`src/app/api/inngest/route.ts`)
- [ ] Define pipeline function skeleton (`src/lib/inngest/pipeline.ts`)
- [ ] Verify local dev setup: `next dev` + `npx inngest-cli@latest dev` running together

*Source Fetchers*
- [ ] Implement YouTube video discovery — use YouTube Data API `playlistItems.list` on each channel's uploads playlist (channel ID → uploads playlist ID) or parse RSS feed (`youtube.com/feeds/videos.xml?channel_id=X`) to get recent video IDs
- [ ] Implement YouTube transcript fetcher — `youtube-transcript` SDK to get transcript text for each video ID
- [ ] Implement Reddit OAuth fetcher — token exchange + fetch posts from configured subreddits (handle 60 req/min rate limit)
- [ ] Both fetchers check `sources_log` to skip already-processed URLs

*Claude Extraction*
- [ ] Draft extraction prompt with `tool_use` output schema (title, summary, tips, tags — see Stage 1 spec in Section 7.1)
- [ ] Test prompt against 3-5 real transcripts/posts, iterate on quality (are tips specific and actionable? are tags accurate?)
- [ ] Build extraction function (`src/lib/pipeline/ingest.ts`) that calls Anthropic API with structured output
- [ ] Write extracted data to `raw_content` table (status: `ingested`) + log URL to `sources_log`

*Integration*
- [ ] Wire fetchers + extraction into Inngest pipeline function (one step per source item, each <10s)
- [ ] End-to-end local test: trigger pipeline → fetch from 2-3 real sources → verify structured data in `raw_content` table

**Validation:** Pipeline ingests content from at least 2 YouTube videos and 2 Reddit posts. Extracted data in `raw_content` has accurate titles, actionable tips, and correct tags. Each Inngest step completes under 10s. Sources_log prevents reprocessing on second run.

### Phase 2: Pipeline Completion
**Goal:** Complete dedup, quality filter, and synthesis stages

**Deliverables:**
- [ ] Build dedup + quality filter stage (Claude-powered semantic comparison)
- [ ] Build synthesis stage (group related items, generate publishable content)
- [ ] Write synthesized content to content table (status: pending_review)
- [ ] Implement email notification on pipeline completion
- [ ] End-to-end pipeline test with real sources

**Validation:** Full pipeline run produces pending_review content that is coherent, tagged, and deduplicated. Admin can approve via Supabase Studio.

### Phase 3: Frontend & Public Launch
**Goal:** Build the public-facing feed and content pages

**Deliverables:**
- [ ] Build home feed page (card layout, chronological)
- [ ] Build tag filter UI (tool, role, workflow type)
- [ ] Build individual content page (/content/[slug])
- [ ] Implement ISR with on-demand revalidation (revalidateTag)
- [ ] Build revalidation API route (triggered on content approval)
- [ ] Style with Tailwind + shadcn/ui components
- [ ] Deploy to Vercel

**Validation:** Approved content renders on the public site. Tag filters work correctly. Pages load fast via ISR cache.

### Phase 4: Polish & Operational Readiness
**Goal:** Harden the system for ongoing operation

**Deliverables:**
- [ ] Error handling and retry logic in pipeline stages
- [ ] Rate limit handling for Reddit API (60 req/min)
- [ ] Pipeline scheduling (e.g., daily or twice-daily runs via Inngest cron)
- [ ] SEO basics (meta tags, Open Graph, sitemap)
- [ ] Mobile-responsive layout refinements
- [ ] Monitor first week of real pipeline runs and fix issues

**Validation:** Pipeline runs reliably on schedule. Site is accessible, responsive, and SEO-indexable.

---

## 13. Future Considerations

### AI Architecture Evolution Path

The MVP uses direct API calls (Hybrid Pattern). As TipStack grows, specific stages can be upgraded to agentic patterns where the added cost and complexity are justified:

| Stage | MVP (Direct API) | Future (Agent-Based) | When to Upgrade |
|-------|-----------------|---------------------|-----------------|
| Source discovery | Hardcoded list | Agent browses platforms, evaluates new channels/subreddits | When you want to auto-discover high-quality sources |
| Extraction | Single API call + structured output | Same — no benefit from agents here | Never (bounded task, structured output) |
| Dedup + Filter | Batch API call | Same — no benefit from agents here | Never (bounded task, structured output) |
| Synthesis | Batch API call + few-shot examples | Agent with web search to enrich content with additional context | When published content needs external fact-checking or deeper context |
| Verification | Skipped (human review) | Agent with web search tools to fact-check claims | When volume makes human-only review a bottleneck |
| Source monitoring | Manual check for new videos/posts | Agent periodically evaluates source quality and adjusts weights | When source list grows beyond ~20 and quality varies |

**Technology for agent stages:** Use the **Claude Agent SDK** (`claude_agent_sdk`) when introducing agentic stages. It provides tool orchestration, multi-step reasoning, and web search capabilities out of the box — preferred over building custom agent loops.

### Post-MVP Enhancements
- **Verify stage** — AI fact-checking layer before human review to reduce false positives
- **Custom admin dashboard** — Replace Supabase Studio with a purpose-built review UI (approve/reject/edit in one click)
- **User accounts & preferences** — Personalized feeds based on saved tool/role preferences
- **Search** — Full-text search across published content
- **Newsletter digest** — Weekly email with top tips, powered by Resend

### Integration Opportunities
- **Twitter/X** as an additional content source
- **RSS feed output** for power users
- **Slack/Discord bot** that posts new tips to team channels
- **Browser extension** that surfaces relevant tips based on the tool you're currently using

### Advanced Features
- **Trending topics** — Detect and highlight emerging tools or techniques
- **Tip chains** — Link related tips into learning paths
- **Community submissions** — Let users suggest sources or submit tips
- **Analytics dashboard** — Track which tags, tools, and topics drive the most engagement

---

## 14. Risks & Mitigations

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **Vercel 10s timeout** causes pipeline failures | Pipeline can't complete processing | Each source item is its own Inngest step (<10s). Monitor step durations; split further if needed. |
| 2 | **Claude extraction quality** is inconsistent or hallucinates tips | Published content contains inaccurate information | Human review gates all content. Iterate on extraction prompts. Verify stage planned for post-MVP. |
| 3 | **Reddit API rate limiting** (60 req/min) slows ingestion | Pipeline takes too long or fails mid-run | Batch Reddit fetches with delays. Inngest handles retries. Track rate limit headers. |
| 4 | **YouTube transcripts unavailable** for some videos | Missing content from key sources | Fall back gracefully (skip item, log warning). Use video description/title as fallback extraction input. |
| 5 | **Low content volume** — not enough quality tips after filtering | Feed feels empty, users don't return | Start with high-signal sources. Lower quality threshold initially. Expand source list quickly if needed. |

---

## 15. Appendix

### Key Dependencies

| Dependency | Purpose | Link |
|-----------|---------|------|
| Next.js | React framework with App Router + ISR | https://nextjs.org |
| Supabase | Postgres database + auth + RLS | https://supabase.com |
| Inngest | Durable function orchestration | https://inngest.com |
| Anthropic SDK | Claude API client | https://docs.anthropic.com |
| youtube-transcript-sdk | YouTube transcript extraction | npm package |
| shadcn/ui | UI component library | https://ui.shadcn.com |
| Resend | Transactional email | https://resend.com |
| Tailwind CSS | Utility-first CSS | https://tailwindcss.com |

### Content Tagging Taxonomy

| Category | Example Values |
|----------|---------------|
| **Tool** | Claude Code, Cursor, GPT, Copilot, OpenClaw, Windsurf, v0, Bolt |
| **Role** | Developer, PM, Designer, Ops, Founder, Data Scientist, Marketer |
| **Workflow Type** | Coding, Writing, Automation, Research, Debugging, Design, Testing |

### Related Projects (User's Existing Work)
- **RedditMiner** — Reddit data extraction patterns (reusable for Reddit source fetcher)
- **AINewsTracker** — News aggregation patterns
- **Orion** — SvelteKit dashboard (prior art for dashboard UI patterns)
