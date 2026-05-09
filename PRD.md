# TipStack Tier 1 — Product Requirements Document

## 1. Executive Summary

TipStack is an AI workflow tip aggregation platform that fetches content from YouTube, Reddit, Twitter/X, news, and documentation sources, runs it through a Claude-powered extraction/dedup/synthesis pipeline, and publishes curated tips to a Next.js frontend. It currently serves as a content site — users browse categories, read living articles, and scan feed posts.

This PRD covers **Tier 1 features** that transform TipStack from a passive content site into an **active team intelligence tool**. Research shows a wide-open gap in the market: no product bridges "AI news" to "what my team should do differently this week." Newsletters like TLDR AI and The Rundown cover announcements, but none translate changes into actionable workflow intelligence for engineering teams. Meanwhile, 93% of developers use AI tools but measured productivity gains hover at only ~10% — the gap is adoption quality, not adoption quantity.

**MVP goal:** Ship three features — Actionable Articles, Changelog Radar, and Weekly Email Digest — that make TipStack indispensable for a developer team staying current with Claude Code and AI tooling changes.

---

## 2. Mission

**Mission statement:** Help engineering teams adopt AI tools effectively by delivering actionable, stack-specific intelligence — not just news — so they spend less time evaluating and more time building.

**Core principles:**

1. **Actionable over informational** — Every piece of content should answer "what should I do differently?" not just "what happened?"
2. **Signal over noise** — Developers suffer from AI tool fatigue. Filter ruthlessly; surface only what changes their workflow.
3. **Team-first** — Design for the tech lead who needs their whole team productive, not just the individual tinkerer.
4. **Automated intelligence** — Use Claude to classify, summarize, and prioritize so humans don't have to triage manually.
5. **Incremental value** — Each feature stands alone and delivers value independently. No big-bang launches.

---

## 3. Target Users

### Primary Persona: Tech Lead / Engineering Manager
- **Role:** Leads a team of 4-15 developers using AI coding tools (Claude Code, Cursor, Copilot)
- **Technical comfort:** High — writes code daily, evaluates tools, sets team standards
- **Pain points:**
  - No structured way to keep the team current on AI tool changes
  - Gets burned by breaking changes they didn't know about (APIs change biweekly)
  - Can't justify AI tool ROI to leadership — 93% adoption but only 10% measured gains
  - Spends "unaccounted-for work" evaluating new tools and changes
- **Goal:** A single source that tells them what changed, what matters, and what the team should try

### Secondary Persona: Senior Developer / AI Power User
- **Role:** Individual contributor who uses AI tools extensively and shares findings with the team
- **Technical comfort:** Very high — experiments with new features, writes CLAUDE.md files, builds MCP integrations
- **Pain points:**
  - Subscribes to 5-10 newsletters that all cover the same announcements
  - Reads about tips but doesn't have a structured way to adopt them
  - Wants concrete "try this" exercises, not high-level overviews
- **Goal:** A curated feed of actionable techniques with practical exercises to try

---

## 4. MVP Scope

### In Scope

**Feature 1: Actionable Articles**
- [x] Add `practical_use_case` field to content table and synthesis pipeline
- [x] Add `try_this` field to content table and synthesis pipeline
- [x] Update Claude synthesis prompt to generate actionable sections for all content types except "update"
- [x] Render "When to Use This" and "Try This Now" styled sections on article pages
- [x] Update match-articles re-synthesis to include actionable fields

**Feature 2: Changelog Radar**
- [x] New `changelog_entries` database table with urgency levels
- [x] Automated fetcher for Anthropic GitHub releases (Atom feed)
- [x] Automated fetcher for Anthropic "What's New" documentation pages
- [x] Claude-powered urgency classification (breaking / important / informational)
- [x] Standalone `/changelog` page with timeline layout
- [x] Client-side urgency filter (All / Breaking / Important / Informational)
- [x] Changelog entry cards with urgency badges, affected tools, version labels
- [x] Navigation link in site header

**Feature 3: Weekly Email Digest**
- [x] Script to assemble digest data (top articles + breaking changes from past 7 days)
- [x] HTML email builder with inline CSS for broad email client support
- [x] Send via Resend to admin email
- [x] `--dry-run` flag for preview without sending
- [x] Breaking Changes section (only rendered if breaking entries exist)
- [x] Top Articles section with `practical_use_case` callouts

### Out of Scope

**Deferred to Tier 2:**
- [ ] Subscriber management (signup form, subscriber table, multi-recipient delivery)
- [ ] Slack/Teams webhook delivery for digests
- [ ] Scheduled/automated digest sending (Inngest cron)
- [ ] Changelog sources beyond Anthropic (Cursor, Copilot, MCP repos)
- [ ] Team accounts and authentication
- [ ] Skill trees / learning paths with progress tracking
- [ ] Shared bookmarks and team curation
- [ ] Difficulty/time estimates on actionable sections

**Deferred to Tier 3:**
- [ ] Team dashboard with skill gap analysis
- [ ] ROI tracking (GitHub/Jira integration)
- [ ] Personalized feeds based on team tool stack
- [ ] Role-based digest filtering (developer vs. manager vs. SRE)

---

## 5. User Stories

1. **As a tech lead**, I want every article to include a concrete "when to use this" scenario and a "try this now" exercise, **so that** I can forward articles to my team with clear next steps instead of just "interesting read."

   > *Example: An article about Claude Code's `/compact` command includes: "When to Use: When you're working on a large monorepo and Claude keeps losing context mid-session" and "Try This: Open your current project, run /compact with a task note, and compare context retention."*

2. **As a developer**, I want to see a dedicated changelog page showing Anthropic's recent releases with urgency labels, **so that** I know immediately when a breaking change requires me to update my workflow.

   > *Example: A "breaking" entry appears at the top: "Claude Code v2.1 removes --legacy-output flag. Affected: claude_code. Action: Update scripts using --output-format json instead."*

3. **As a tech lead**, I want to filter the changelog by urgency level, **so that** I can quickly scan just the breaking changes without scrolling through minor updates.

   > *Example: Clicking "Breaking" shows only entries tagged as breaking changes, with red urgency badges.*

4. **As an admin**, I want to run a script that generates and emails a weekly digest of top articles and breaking changes, **so that** I can share a curated summary with my team without manual curation.

   > *Example: Running `npx tsx scripts/send-digest.ts` sends an email with a "Breaking Changes" section (2 entries this week) and "Top Articles" section (8 articles with use-case callouts).*

5. **As an admin**, I want a `--dry-run` option for the digest script, **so that** I can preview the email content before sending it to verify quality and completeness.

   > *Example: Running `npx tsx scripts/send-digest.ts --dry-run` prints article titles, breaking change count, and preview text to the console without sending any email.*

6. **As a developer**, I want the changelog entries to show which tools are affected (e.g., `claude_code`, `claude_api`), **so that** I can quickly assess whether a change is relevant to my daily workflow.

   > *Example: A changelog entry shows pills: "claude_code" and "anthropic_sdk", indicating both the CLI and SDK are affected by this API change.*

7. **As a pipeline operator**, I want the changelog fetcher to automatically skip entries it has already processed, **so that** I can run the fetch script repeatedly without creating duplicates.

   > *Example: Running `npx tsx scripts/fetch-changelog.ts` twice in a row — the second run reports "Inserted: 0 new entries, Skipped: 12 already processed."*

---

## 6. Core Architecture & Patterns

### High-Level Architecture

TipStack follows a **fetch - process - publish** pipeline architecture. Tier 1 features extend this pattern:

```
                    EXISTING PIPELINE
┌─────────┐   ┌─────────┐   ┌───────┐   ┌───────────┐   ┌──────┐
│  Fetch   │-->│ Extract │-->│ Dedup │-->│ Synthesize│-->│ Feed │
│ (sources)│   │ (Claude)│   │(Claude│   │  (Claude)  │   │Posts │
└─────────┘   └─────────┘   └───────┘   └───────────┘   └──────┘
                                              │
                                    NEW: practical_use_case
                                    NEW: try_this

              CHANGELOG PIPELINE (NEW — bypasses main pipeline)
┌──────────────┐   ┌───────────┐   ┌──────────────────┐
│ Fetch Anthro- │-->│ Classify  │-->│ Insert directly  │
│ pic releases  │   │ (Claude)  │   │ to changelog_    │
│ + What's New  │   │ urgency   │   │ entries table    │
└──────────────┘   └───────────┘   └──────────────────┘

              DIGEST PIPELINE (NEW — reads from both)
┌──────────────┐   ┌───────────┐   ┌──────────────────┐
│ Query top     │-->│ Build HTML│-->│ Send via Resend  │
│ articles +    │   │ email     │   │ to admin         │
│ breaking chgs │   └───────────┘   └──────────────────┘
└──────────────┘
```

### Key Design Decisions

- **Changelog entries bypass the main pipeline.** They're already structured data from official sources — no need for extraction, dedup, or synthesis. They go directly into the `changelog_entries` table.
- **Actionable fields are optional.** The `practical_use_case` and `try_this` fields are nullable and excluded from the schema's `required` array. Existing content renders without them; "update" type content omits them by design.
- **Client-side filtering for changelog.** With a max of ~50 entries, client-side filtering is simpler and avoids re-fetching. No server-side pagination needed initially.
- **Digest is pull, not push.** Admin runs a script manually. No scheduler, no subscriber management. Validates the format before investing in automation.

### Design Patterns

- **Single AI interface:** All Claude calls go through `callClaudeCode()` in `src/lib/ai/claude-code.ts` with JSON schema enforcement
- **Single query source of truth:** All Supabase operations live in `src/lib/supabase/queries.ts`
- **Server components by default:** Client components only for interactivity (changelog filter)
- **Sequential migrations:** Numbered `NNN_descriptive-name.sql` files in `supabase/migrations/`
- **Pipeline scripts:** `scripts/` directory, each script imports shim - dotenv - calls library functions

---

## 7. Features

### Feature 1: Actionable Articles

**Purpose:** Transform passive articles into actionable intelligence by adding structured "when to use this" and "try this now" sections.

**Schema additions (content table):**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `practical_use_case` | TEXT | Yes | Concrete scenario starting with "When you..." or "If you..." (2-4 sentences) |
| `try_this` | TEXT | Yes | Specific action starting with imperative verb, completable in under 5 minutes |

**Synthesis prompt changes:**
- Instruct Claude to generate both fields for all content types except "update"
- `practical_use_case`: must describe a concrete scenario where the technique applies
- `try_this`: must include exact commands or steps, completable in <5 minutes

**UI rendering:**
- "When to Use This" box: sage green tint (`bg-[#f0f8f2]` / `dark:bg-[#1a2b1e]`)
- "Try This Now" box: purple tint (`bg-[#f3eff8]` / `dark:bg-[#221e2e]`)
- Placed after article body, before source attribution
- Omitted entirely when both fields are null (backward compatible with existing content)

---

### Feature 2: Changelog Radar

**Purpose:** Track Anthropic's official releases and documentation changes, classify them by urgency, and surface them on a dedicated page so teams never miss a breaking change.

**Data model — `changelog_entries` table:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | |
| `title` | TEXT | NOT NULL | Release or change title |
| `summary` | TEXT | NOT NULL | 2-3 sentence summary from Claude classification |
| `urgency` | TEXT | NOT NULL, CHECK IN (breaking, important, informational) | Urgency level |
| `source_url` | TEXT | NOT NULL, UNIQUE | Dedup key — prevents reprocessing |
| `affected_tools` | TEXT[] | NOT NULL, DEFAULT '{}' | e.g., `['claude_code', 'claude_api']` |
| `version` | TEXT | Nullable | Version string if applicable (e.g., "v2.1.0") |
| `published_at` | TIMESTAMPTZ | NOT NULL | Original publish date |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When we ingested it |

**Fetcher sources:**
1. **GitHub Releases Atom feed** — `https://github.com/anthropics/claude-code/releases.atom`
2. **Anthropic "What's New" pages** — weekly documentation changelog pages

**Claude classification schema:**
- `urgency`: breaking (requires user action), important (significant new capability), informational (minor fix/improvement)
- `summary`: 2-3 sentences on what changed and why it matters
- `affected_tools`: canonical names (`claude_code`, `claude_api`, `claude_desktop`, `anthropic_sdk`)

**Page design (`/changelog`):**
- Timeline layout grouped by month, newest first
- Urgency filter tabs: All | Breaking | Important | Informational
- Each entry card shows: urgency badge, title, summary, version (if present), affected tool pills, published date, link to source
- Urgency badge colors: breaking = red (`#8B4A4A`), important = amber (`#7B6230`), informational = sage (`#4E7E5E`)

---

### Feature 3: Weekly Email Digest

**Purpose:** Deliver a curated weekly summary to the admin via email, combining the highest-signal articles and any breaking changelog entries from the past 7 days.

**Digest assembly:**
- Query top 10 published content pieces from the past 7 days (sorted by recency)
- Query all breaking changelog entries from the past 7 days
- Combine into a structured `DigestData` object

**Email structure:**
1. **Header:** "TipStack Weekly Digest — Week of {date}"
2. **Breaking Changes section** (conditional — only shown if entries exist)
   - Red/coral accent header
   - Each entry: title, summary, affected tools, source link
3. **Top Articles section**
   - Each article: title (linked to site), summary, `practical_use_case` callout (if present)
4. **Footer:** Link to TipStack site

**Email design constraints:**
- Inline CSS only (email clients strip `<style>` tags)
- Table-based layout for broad client support (Gmail, Apple Mail, Outlook)
- Max-width 600px centered container
- TipStack color palette: `#1A1A2E` text, `#EDF2EC` background, `#6B47A8` link purple

**Subject line:**
- With breaking changes: "TipStack Weekly: 2 breaking changes + 8 articles"
- Without: "TipStack Weekly: 10 new articles this week"

**Script interface:**
```bash
npx tsx scripts/send-digest.ts            # Send digest email
npx tsx scripts/send-digest.ts --dry-run  # Preview without sending
```

---

## 8. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16 (App Router) | Frontend + API routes |
| Language | TypeScript | Strict mode | Type safety across pipeline + frontend |
| Styling | Tailwind CSS | v4 | Utility-first styling |
| Components | shadcn/ui | base-nova | UI primitives |
| Animation | framer-motion | Latest | Page transitions, card animations |
| Database | Supabase (Postgres) | Latest | Data storage with RLS |
| AI | Claude Code CLI | Latest | Content extraction, classification, synthesis |
| Email | Resend | Latest | Digest and notification delivery |
| Orchestration | Inngest | Latest | Pipeline retry/scheduling (existing) |
| Testing | Vitest | Latest | Unit tests |

**New dependencies:** None. All Tier 1 features use existing dependencies (Resend, Supabase client, Claude Code CLI).

---

## 9. Security & Configuration

### Authentication / Authorization
- No user authentication in Tier 1 (deferred to Tier 2 team accounts)
- Supabase RLS enforces access:
  - **Anon role:** SELECT only on published content and all changelog entries
  - **Service role:** Full CRUD for pipeline writes
- Digest is admin-only — sent to `ADMIN_EMAIL` env var, triggered by manual script execution

### Configuration (Environment Variables)

Existing variables used by Tier 1 features (no new env vars required):

| Variable | Used By | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` | Digest | Email sending |
| `RESEND_FROM_EMAIL` | Digest | Sender address |
| `ADMIN_EMAIL` | Digest | Recipient |
| `NEXT_PUBLIC_SUPABASE_URL` | Changelog page | Frontend reads |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Changelog page | Frontend reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Changelog fetcher, pipeline | Backend writes |

### Security Scope

**In scope:**
- RLS policies on `changelog_entries` table (anon read, service_role write)
- `source_url UNIQUE` constraint prevents duplicate entry injection
- Digest script validates env vars before sending

**Out of scope:**
- Rate limiting on `/changelog` page (low traffic expected)
- Email authentication (SPF/DKIM — handled by Resend)
- Subscriber email validation (no subscribers in Tier 1)

---

## 10. API Specification

No new API endpoints in Tier 1. All operations are either:
- **Server-side data fetching** (Next.js server components querying Supabase directly)
- **CLI scripts** (manual pipeline execution)

The existing `/api/revalidate` endpoint will be used to bust the changelog page cache after new entries are fetched.

---

## 11. Success Criteria

### MVP Success Definition
Tier 1 is successful when a tech lead can:
1. Read an article and know exactly when to apply the technique and what to try first
2. Check a changelog page and see urgency-labeled Anthropic releases without visiting multiple sources
3. Send a weekly digest email to themselves summarizing the week's top content and breaking changes

### Functional Requirements

- [x] New articles generated by the pipeline include `practical_use_case` and `try_this` fields
- [x] Article pages render actionable sections with proper styling and dark mode support
- [x] "update" type articles correctly omit actionable sections
- [x] Changelog fetcher successfully parses Anthropic GitHub releases
- [x] Changelog fetcher successfully parses "What's New" documentation pages
- [x] Claude correctly classifies urgency (breaking/important/informational)
- [x] `/changelog` page renders with timeline layout and urgency badges
- [x] Urgency filter correctly filters entries client-side
- [x] Digest script assembles top articles + breaking changes from past 7 days
- [x] Digest email renders correctly in Gmail, Apple Mail, and Outlook
- [x] `--dry-run` flag prints preview without sending email
- [x] Repeated changelog fetches don't create duplicate entries

### Quality Indicators
- Changelog urgency classification accuracy > 90% (spot-check 20 entries)
- `practical_use_case` fields are specific scenarios, not generic advice
- `try_this` fields include exact commands or steps, not vague suggestions
- Email renders without layout breaks in top 3 email clients

### User Experience Goals
- Changelog page loads in < 2 seconds
- Urgency filter response is instant (client-side)
- Actionable sections are visually distinct from article body (clear tint boxes)
- Digest email is scannable in under 60 seconds

---

## 12. Implementation Phases

### Phase 1: Actionable Articles (Est. 2-3 hours)

**Goal:** Make every new article actionable with practical use cases and exercises.

**Deliverables:**
- [x] Database migration `016_add_actionable_fields.sql`
- [x] Updated `Content` and `SynthesizedPiece` types
- [x] Updated synthesis schema and prompt
- [x] Updated `match-articles.ts` schemas
- [x] Updated `insertContent()` and `updateContentArticle()` queries
- [x] `ActionableSections` component on article page

**Validation:**
- `npx tsc --noEmit` passes
- Run pipeline with test items — verify `practical_use_case` and `try_this` are populated in DB
- Visit article page — actionable sections render with correct styling

### Phase 2: Changelog Radar (Est. 4-6 hours)

**Goal:** Launch the changelog page with automated Anthropic source fetching.

**Deliverables:**
- [x] Database migration `017_add_changelog_entries.sql`
- [x] `ChangelogEntry` type and `ChangelogUrgency` type
- [x] Changelog source config
- [x] Anthropic changelog fetcher with Claude classification
- [x] Changelog queries (insert, fetch, dedup check, recent breaking)
- [x] `scripts/fetch-changelog.ts` script
- [x] `/changelog` page with timeline layout
- [x] Changelog entry card component
- [x] Urgency filter component
- [x] Navigation link

**Validation:**
- Run `npx tsx scripts/fetch-changelog.ts` — entries appear in database
- Visit `/changelog` — page renders, urgency badges display correctly
- Filter works — clicking "Breaking" shows only breaking entries
- Run fetcher again — no duplicates created
- Dev server builds without errors

### Phase 3: Weekly Digest (Est. 2-3 hours)

**Goal:** Enable admin to send a curated weekly email digest.

**Deliverables:**
- [x] `getRecentPublishedContent()` query
- [x] Digest assembly module (`src/lib/pipeline/digest.ts`)
- [x] HTML email builder with inline CSS
- [x] `scripts/send-digest.ts` with `--dry-run` support

**Validation:**
- `npx tsx scripts/send-digest.ts --dry-run` prints meaningful preview
- `npx tsx scripts/send-digest.ts` sends email to admin
- Email renders correctly in Gmail
- Breaking changes section appears (or is correctly omitted if none)
- Articles show `practical_use_case` callouts when available

### Phase 4: Integration Testing & Polish (Est. 1-2 hours)

**Goal:** End-to-end verification and edge case handling.

**Deliverables:**
- [x] Full pipeline run producing content with actionable fields
- [x] Changelog fetch + page rendering verified
- [x] Digest sent with real data from both content + changelog tables
- [x] Dark mode verified on changelog page and article actionable sections
- [x] Empty state handled (no changelog entries, no recent articles)

**Validation:**
- Complete end-to-end flow works: fetch - process - view - digest
- No TypeScript errors (`npx tsc --noEmit`)
- No ESLint errors (`npm run lint`)
- Production build succeeds (`npm run build`)

---

## 13. Future Considerations

### Tier 2 (Post-MVP)
- **Subscriber management** — signup form, subscriber table, multi-recipient digest delivery
- **Slack/Teams integration** — webhook-based digest delivery to team channels
- **Scheduled digests** — Inngest cron function for automated weekly sends
- **Expanded changelog sources** — Cursor, Copilot, Windsurf, popular MCP server repos
- **Skill trees** — map skills to content, create learning paths, track team progress
- **Prompt/rule library** — forkable CLAUDE.md files and MCP configs

### Tier 3 (Team Platform)
- **Team accounts** — authentication, team creation, role-based access
- **Team dashboard** — skill gap analysis ("your team uses 4 of 12 workflow patterns")
- **ROI tracking** — connect to GitHub/Jira to correlate tip adoption with cycle time
- **Personalized feeds** — filter by team's actual tool stack
- **Micro-challenges** — gamified 5-minute exercises with completion tracking

### Evolution Path (Validated by Precedent)
```
Content aggregator (current)
  --> Filtered team digest (Tier 1) <-- YOU ARE HERE
    --> Shared curation + skill tracking (Tier 2)
      --> Team analytics + ROI dashboards (Tier 3)
```
This mirrors Feedly's evolution: individual RSS - AI-filtered team boards - enterprise threat intelligence at $18+/user/month.

---

## 14. Risks & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|------------|------------|
| 1 | **Changelog urgency misclassification** — Claude labels a breaking change as "informational" and teams miss it | High | Medium | Add fallback rule: if release body contains "BREAKING" or "breaking change", force urgency to `breaking` regardless of Claude's classification. Spot-check 20 entries post-launch. |
| 2 | **Anthropic changes their release format** — What's New page structure or Atom feed URL changes, breaking the fetcher | Medium | Medium | Fetcher handles 404s gracefully (skip and log). Monitor fetch script output for unexpected zero-entry runs. URL changes are detectable and fixable quickly. |
| 3 | **Synthesis prompt length increase degrades quality** — Adding actionable field instructions makes the prompt too long, reducing output quality | Medium | Low | Actionable instructions add ~15 lines to a 190-line prompt — well within limits. Monitor token usage and output quality for the first 3 pipeline runs. |
| 4 | **Email rendering inconsistency** — Digest HTML breaks in Outlook or older email clients | Low | Medium | Use table-based layout with inline CSS (no flexbox/grid). Test in Gmail, Apple Mail, Outlook before first real send. Keep design simple — no complex layouts. |
| 5 | **Low engagement with actionable sections** — Teams read articles but ignore "Try This" exercises | Medium | Medium | This is a content quality problem, not a technical one. Iterate on the synthesis prompt to generate more specific, compelling exercises. Track via future analytics (Tier 2). |

---

## 15. Appendix

### Related Documents
- **Implementation Plan:** `.claude/plans/playful-doodling-acorn.md`
- **Project Instructions:** `CLAUDE.md`
- **Design System:** Invoke `tipstack-ui` skill for authoritative colors, typography, spacing

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/pipeline/synthesize.ts` | Synthesis schema + prompt (actionable fields) |
| `src/lib/pipeline/match-articles.ts` | Re-synthesis schemas (actionable fields) |
| `src/lib/supabase/queries.ts` | All database operations |
| `src/types/index.ts` | All TypeScript type definitions |
| `src/app/content/[slug]/page.tsx` | Article page rendering |
| `src/lib/pipeline/notify.ts` | Existing Resend email pattern |
| `src/lib/sources/config.ts` | Source configuration |
| `src/lib/ai/claude-code.ts` | Claude Code CLI wrapper |

### Database Schema (New Tables)

```sql
-- changelog_entries (new)
CREATE TABLE changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('breaking', 'important', 'informational')),
  source_url TEXT UNIQUE NOT NULL,
  affected_tools TEXT[] NOT NULL DEFAULT '{}',
  version TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- content (modified — two new columns)
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS practical_use_case TEXT,
  ADD COLUMN IF NOT EXISTS try_this TEXT;
```

### New Files to Create

| File | Type | Purpose |
|------|------|---------|
| `supabase/migrations/016_add_actionable_fields.sql` | Migration | Add columns to content |
| `supabase/migrations/017_add_changelog_entries.sql` | Migration | Create changelog table |
| `src/lib/sources/anthropic-changelog.ts` | Fetcher | Parse Anthropic releases |
| `scripts/fetch-changelog.ts` | Script | Run changelog fetcher |
| `src/app/changelog/page.tsx` | Page | Changelog Radar page |
| `src/components/changelog-entry-card.tsx` | Component | Entry card with urgency badge |
| `src/components/changelog-filter.tsx` | Component | Urgency filter tabs |
| `src/lib/pipeline/digest.ts` | Module | Digest assembly + email builder |
| `scripts/send-digest.ts` | Script | Send weekly digest |
