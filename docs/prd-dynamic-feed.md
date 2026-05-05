# PRD: Dynamic Feed & Living Articles

**Status:** Ready for review
**Author:** Shermaine
**Date:** 2026-05-04
**Branch:** `feature/dynamic-feed`

---

## Problem

TipStack is currently article-based and passive. Content is published as static pieces that don't evolve, and there's no signal for what's *new*. For a team of AI-tool practitioners trying to stay current, this means manually checking the site and scanning through articles that may not have changed since the last visit. The platform doesn't communicate urgency or recency — everything looks the same whether it was published today or two weeks ago.

## Solution

Transform TipStack into a two-layer information system:

1. **Dynamic Feed** — A chronological stream of short-form posts summarizing what's new. Runs twice daily (morning + evening). Each post is a headline + key points distilled from one or more sources. Acts as the "alert layer."

2. **Living Articles** — One article per topic that accumulates knowledge over time. When new sources arrive about an existing topic, the article is updated with the new information, and a fresh feed post is created to alert users.

## Goals

- Team members can open TipStack once in the morning and once in the evening and immediately see what changed in the AI tooling world
- No important update gets buried in an unchanged article
- Content stays evergreen — articles grow richer over time instead of becoming stale

## Non-Goals (for now)

- User authentication or team features
- Engagement signals (bookmarks, upvotes)
- Topic/tool subscription notifications
- RSS or email digest

---

## Frontend Architecture

### Design Principles

Based on Next.js 16 official guidance:

- **Server Components for reads.** Fetch data directly via the data access layer — never via Route Handlers from server components (unnecessary HTTP round trip).
- **Route Handlers for client-side fetching.** Infinite scroll pagination uses a GET Route Handler, not server actions. Server actions are queued/sequential, POST-only, and uncacheable — wrong for read operations.
- **Server actions for mutations only.** Per Next.js docs: "Server Actions are queued. Using them for data fetching introduces sequential execution."
- **`server-only` guard on data access layer.** Prevents accidental import of service-role queries from client components.

### Rendering Strategy

Data changes exactly twice daily (pipeline runs at ~8 AM and ~8 PM SGT). This means aggressive server-side caching is safe. No client-side state management library needed.

| Page | Strategy | Caching |
|---|---|---|
| Feed (initial load) | Server Component + `"use cache"` | `cacheTag("feed")`, revalidated by pipeline |
| Feed (scroll pages) | Client Component → `GET /api/feed?cursor=X` → `useState` + `fetch` | Route Handler cacheable via CDN |
| Article detail | Server Component + `"use cache"` | `cacheTag("content")`, revalidated by pipeline |
| Browse/categories | Server Component + `"use cache"` | Same as current — no changes needed |

### Layered Architecture

```
┌─────────────────────────────────────────────────┐
│  View Layer                                     │
│  Server components: all page-level rendering    │
│  Client components: feed infinite scroll only   │
├─────────────────────────────────────────────────┤
│  Client State (feed page only)                  │
│  Plain React: useState + fetch                  │
│  - posts[] state, cursor state, loading state   │
│  - IntersectionObserver triggers next fetch     │
│  - Initial data passed as props from server     │
│  - No external dependencies                     │
├─────────────────────────────────────────────────┤
│  Data Access Layer                              │
│  src/lib/supabase/queries.ts                    │
│  - import 'server-only' guard                   │
│  - Read queries: anon key (getReadClient)       │
│  - Write queries: service key (getServiceClient)│
│  - getFeedPosts(cursor, limit) — new            │
│  - findMatchingArticle(tags) — new              │
│  - All other existing queries unchanged         │
├─────────────────────────────────────────────────┤
│  Server / API Layer                             │
│  Route Handlers:                                │
│  - GET /api/feed?cursor=X&limit=20 — pagination │
│  - POST /api/revalidate — cache busting         │
│  - /api/inngest — pipeline webhooks             │
│  Server components call queries.ts directly     │
│  (no Route Handler intermediary for SSR reads)  │
└─────────────────────────────────────────────────┘
```

### Data Flow: Feed Page

```
1. User visits /  (first load)
   → Server component calls getFeedPosts() directly
   → Renders initial feed HTML with "use cache"
   → Passes initial data + first cursor as props to client scroll component

2. Client hydrates
   → FeedScroll component initializes useState with server-provided posts
   → IntersectionObserver watches sentinel element at bottom of list

3. User scrolls to bottom
   → Observer fires → fetch('/api/feed?cursor=X')
   → Route Handler calls getFeedPosts(cursor) from queries.ts
   → Returns JSON → setPosts(prev => [...prev, ...newPosts])
   → Update cursor state for next page

4. User navigates to /content/[slug]
   → Server component renders article with "use cache"

5. User navigates back to /
   → Server component re-renders feed (fresh from "use cache")
   → Scroll position resets (acceptable — data changes 2x/day)

6. Pipeline runs (8 AM / 8 PM)
   → Pipeline calls POST /api/revalidate → busts "use cache"
   → Next visitor gets fresh server-rendered page
```

### New Dependencies

None. Infinite scroll uses plain `useState` + `fetch` + `IntersectionObserver` — no external libraries required.

---

## Design

### Feed Posts

A feed post is a lightweight content unit designed for scanning:

| Field | Description |
|---|---|
| `headline` | 1-line summary of what's new (e.g., "New Claude Code harness patterns from 2 YouTube tutorials") |
| `summary` | 2-4 bullet points with the key takeaways |
| `source_urls` | Links to the original sources that generated this post |
| `topic_content_id` | FK to `content.id` — links to the living article |
| `published_at` | Timestamp from the pipeline run |
| `source_platforms` | Array of platforms that contributed (e.g., `["youtube", "reddit"]`) |

Feed posts are **immutable** once created — they represent a point-in-time snapshot of "what just arrived."

### Living Articles

Living articles are the existing `content` rows, but with updated behavior:

- **One article per topic.** Topic identity is determined by matching on `tags_tool` + `tags_focus`. Matching uses **set intersection with a threshold**: if incoming content shares at least one tool tag AND one focus tag with an existing article, it's considered the same topic. If multiple articles match, the one with the highest tag overlap wins.
- **Append, don't replace.** When new sources arrive for an existing topic, the article body is updated (via Claude re-synthesis) to incorporate the new information. The `source_urls` array grows. `updated_at` is bumped. No version history — just an "Updated on [date]" line displayed on the article.
- **New topics auto-create articles.** If incoming content doesn't match any existing article's tag combination, a new article is created automatically.

### Source-Specific Quality Thresholds

Not all sources are equal. Reddit and X/Twitter content is noisier and more opinion-driven:

| Source | Quality Threshold | Rationale |
|---|---|---|
| YouTube | 5/10 (current) | Long-form, usually demonstrates real workflows |
| News/HN | 5/10 (current) | Curated by community voting |
| Reddit | 7/10 | High noise ratio, many low-effort posts |
| Twitter/X | 7/10 | Hot takes, often lacks actionable detail |

The dedup stage already scores quality 1-10. This change only adjusts the cutoff per platform.

### Feed UX

- **Homepage becomes the feed.** Chronological, newest-first, infinite scroll.
- **Each feed post is a card** with: headline, summary bullets, source icons, and a link to the living article.
- **Date separators** in the stream (e.g., "May 4, 2026") so users can orient themselves temporally. Posts show relative time ("2h ago") within the current day, absolute date for older posts.
- **30-day archive cutoff.** Posts older than 30 days are hidden from the feed by default to keep it focused. The data is retained in the database.
- **Empty state** for when a pipeline run produces nothing new: "No new updates. Check back later."
- **Existing navigation** (categories, domains, tools) stays intact for browsing the article layer.

### Pipeline Changes

The current pipeline: **Fetch → Extract → Dedup → Synthesize → Notify**

Becomes: **Fetch → Extract → Dedup → Synthesize → Match & Update Articles → Generate Feed Posts → Notify**

New stages:

1. **Match & Update Articles** — After synthesis produces structured content, match against existing articles by `tags_tool` + `tags_focus` (set intersection, highest overlap wins). If match found, re-synthesize the article by sending Claude the **full existing article body + new source material** and asking it to produce an updated, cohesive article. If no match, create a new article.

2. **Generate Feed Posts** — For each new/updated article from this pipeline run, create a feed post summarizing what was added. This is a Claude `tool_use` call (consistent with existing pipeline pattern) that takes the new source material and produces a headline + summary bullets.

### Twice-Daily Scheduling

- **Morning run:** ~8:00 AM SGT (covers overnight US/Europe activity)
- **Evening run:** ~8:00 PM SGT (covers daytime US activity)
- Implemented via Inngest cron triggers on the existing pipeline functions.

---

## Entity Relationships

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  FeedPost    │        │   Content    │        │  RawContent  │
│  (feed card) │───────→│  (article)   │←───────│  (pipeline)  │
│              │   FK   │              │  merge  │              │
├──────────────┤  id    ├──────────────┤        ├──────────────┤
│ headline     │        │ title        │        │ source_url   │
│ summary      │        │ slug (url)   │        │ platform     │
│ source_urls  │        │ summary      │        │ raw_extract  │
│ topic_cont…  │        │ body         │        │ status       │
│ source_plat… │        │ tags_tool[]  │        │ batch_date   │
│ published_at │        │ tags_focus[] │        └──────────────┘
└──────────────┘        │ tags_domain[]│
  many                  │ source_urls  │        ┌──────────────┐
    ↓                   │ updated_at   │        │  SourceLog   │
  one article           │ status       │        │  (url dedup) │
                        └──────────────┘        ├──────────────┤
                                                │ url (unique) │
                                                │ platform     │
                                                └──────────────┘
```

- **FeedPost → Content**: Many-to-one via `topic_content_id` (UUID FK to `content.id`). Multiple feed posts can reference the same article as it gets updated over time. The article's `slug` is used for frontend routing (`/content/[slug]`), but the internal relationship uses the immutable `id`.
- **RawContent → Content**: Many-to-many (implicit, via pipeline synthesis). Multiple raw items get merged into one content piece.
- **SourceLog**: Standalone dedup table, no FK relationships.

### Feed Pagination Query

The single client-side fetch pattern in the app. All other data fetching is server components calling `queries.ts` directly, cached via `"use cache"` + `cacheTag`.

```
Client Component (FeedScroll)
│
└── fetch('/api/feed?cursor=X&limit=20')
    Returns: FeedPost[] (joined with content.slug for link URL)
    DB query: feed_posts LEFT JOIN content ON topic_content_id = content.id
              WHERE published_at > now() - 30 days
              AND published_at < $cursor
              ORDER BY published_at DESC
              LIMIT 20
    Cursor: published_at of last item in current page
    State: useState<FeedPost[]> initialized from server component props
```

---

## Schema Changes

### New table: `feed_posts`

```sql
create table feed_posts (
  id                uuid primary key default gen_random_uuid(),
  headline          text not null,
  summary           text not null,
  source_urls       jsonb not null default '[]',
  topic_content_id  uuid not null references content(id),
  source_platforms  text[] not null default '{}',
  pipeline_run_id   uuid,
  published_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index idx_feed_posts_published on feed_posts (published_at desc);
create index idx_feed_posts_topic on feed_posts (topic_content_id);

alter table feed_posts enable row level security;
create policy "anon_read" on feed_posts for select using (true);
create policy "service_write" on feed_posts for all to service_role
  using (true) with check (true);
```

### Modifications to `content` table

```sql
alter table content add column updated_at timestamptz;

-- Backfill updated_at with created_at for existing rows
update content set updated_at = created_at where updated_at is null;

-- GIN indexes for topic matching via array overlap (&&)
create index idx_content_tags_tool on content using gin (tags_tool);
create index idx_content_tags_focus on content using gin (tags_focus);
```

Topic matching uses Postgres array overlap operators directly — no derived `topic_key` column needed:

```sql
-- Find matching article for incoming content
select *, 
  cardinality(tags_tool & $1::text[]) + cardinality(tags_focus & $2::text[]) as overlap
from content
where tags_tool && $1::text[]
  and tags_focus && $2::text[]
  and status = 'published'
order by overlap desc
limit 1;
```

---

## Implementation Plan

### Phase 1: Schema & Pipeline (backend)

1. Add `feed_posts` table migration + RLS policies + indexes
2. Add `updated_at` column to `content`, backfill existing rows, add GIN indexes on tag arrays
3. Add `import 'server-only'` guard to `queries.ts`
4. Implement topic matching logic (`matchOrCreateArticle()`) — Postgres array overlap (`&&`), highest overlap wins
5. Implement article re-synthesis (full article + new sources → updated article via Claude `tool_use`)
6. Implement feed post generation (Claude `tool_use` call: new sources → headline + bullets)
7. Wire new stages into the Inngest pipeline (one step per item for Vercel timeout safety)
8. Adjust quality thresholds per source platform in dedup stage

### Phase 2: Feed UI (frontend)

9. Add Route Handler: `GET /api/feed?cursor=X&limit=20` — calls `getFeedPosts()` from queries.ts, returns JSON
10. Build feed post card component
11. Build `FeedScroll` client component: `useState` + `fetch` + `IntersectionObserver` for infinite scroll
12. Rebuild homepage: server component (SSR initial page via `"use cache"`, passes initial data as props) + `FeedScroll` client component
13. Add date separator component between feed post groups
14. Add empty state component
15. Link feed posts to living article pages (join content.slug for URL)
16. Add "Updated on [date]" indicator on article pages

### Phase 3: Scheduling & Polish

17. Configure Inngest cron for twice-daily runs
18. Update notify stage to include feed post counts
19. Test full pipeline end-to-end with real sources
20. Handle edge cases (article slug conflicts, orphaned feed posts)

---

## Decisions Log

| Question | Decision |
|---|---|
| Feed post grouping | Individual cards in the stream, with date separators between days |
| Article versioning | No version history; just display "Updated on [date]" on the article |
| Feed post expiry | Posts older than 30 days hidden from feed (data retained in DB) |
| Rendering strategy | Server Components + `"use cache"` for all pages. Plain React `useState` + `fetch` for feed infinite scroll. |
| State management | No libraries. `useState` for scroll state on feed page. All other pages are pure server components with zero client JS. |
| Pagination endpoint | Route Handler (`GET /api/feed`), not server actions. Server actions are queued/sequential/POST-only — wrong for reads. |
| Data access guard | `import 'server-only'` on queries.ts to prevent client-side import of service-role queries |
| FK strategy | `feed_posts.topic_content_id` → `content.id` (UUID). Slug used for URL routing only, not as FK |
| Topic matching | Postgres array overlap (`&&`) on `tags_tool` + `tags_focus` with GIN indexes. No derived `topic_key` column |
