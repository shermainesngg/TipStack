# Feature: Article Search

Validate documentation and codebase patterns before implementing. Pay attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description
Add a search-as-you-type article search to the TipStack navbar. Users type into a search input in the header, and after 3+ characters with a 300ms debounce, a dropdown overlay shows matching published articles with category badges, sub-topics, and highlighted matching terms. The dropdown supports infinite scroll (5 results per batch). Available on both desktop and mobile.

## User Story
As a TipStack visitor
I want to search for articles by keyword directly from the navigation bar
So that I can quickly find relevant tips and guides without browsing through categories manually

## Problem Statement
Users currently have no way to find specific articles except by browsing categories or scrolling the feed. As the article count grows, this becomes increasingly impractical.

## Solution Statement
Postgres full-text search on the `content` table with a GIN index, exposed via an API route, consumed by a client-side search component in the header with a dropdown overlay showing ranked results.

## Feature Metadata
- **Type**: New Capability
- **Complexity**: Medium
- **Systems Affected**: Database (new migration), API layer (new route), Header nav (new component), Supabase queries
- **Dependencies**: None — uses existing Postgres/Supabase stack

---

## CONTEXT REFERENCES

### Files to Read Before Implementing
- `src/components/header-nav.tsx` — Current navbar component to extend with search input
- `src/app/layout.tsx` (lines 50-67) — Header structure; search component mounts here
- `src/lib/supabase/queries.ts` (lines 1-22) — Client setup pattern (`getReadClient()` for frontend reads)
- `src/lib/supabase/queries.ts` (lines 168-180) — `getPublishedContent()` pattern to mirror for search query
- `src/lib/supabase/queries.ts` (line 7) — `CARD_COLUMNS` constant for select fields
- `src/lib/supabase/browser.ts` — Anon client used from frontend (via `getReadClient()`)
- `src/app/api/feed/route.ts` — Existing API route pattern to mirror for `/api/search`
- `src/components/content-card.tsx` (lines 51-71) — Card rendering pattern for reference
- `src/lib/categories.ts` (lines 14-92) — Category configs with colors/labels for badges
- `src/types/index.ts` (lines 20-47) — `Content` and `ContentSummary` types

### New Files to Create
- `supabase/migrations/021_add_content_search_index.sql` — FTS tsvector column + GIN index
- `src/app/api/search/route.ts` — Search API endpoint
- `src/components/search-overlay.tsx` — Client component: input + dropdown with results

### Patterns to Follow
- API routes return `Response.json({...})` (see `src/app/api/feed/route.ts`)
- All DB queries go through `src/lib/supabase/queries.ts` — never call Supabase directly from components or routes
- Read queries use `getReadClient()` (anon key, RLS-safe)
- Client components use `"use client"` directive explicitly
- Styling uses hardcoded hex values from design system, `cn()` for conditional classes
- Category badge colors come from `getCategoryConfig(slug)` in `src/lib/categories.ts`

---

## IMPLEMENTATION PLAN

### Phase 1: Database — FTS Index
Add a generated `tsvector` column on the `content` table combining title, summary, body, tags, sub_topic, practical_use_case, and try_this. Create a GIN index for fast lookup. Add a SQL function `search_content` that accepts a query string and returns ranked results with headline snippets.

### Phase 2: Query Layer
Add a `searchContent()` function to `queries.ts` that calls the `search_content` Postgres function via Supabase RPC. Returns results with title, summary snippet (with highlight markers), category, sub_topic, slug, and relevance rank.

### Phase 3: API Route
Create `/api/search` route accepting `?q=term&cursor=0&limit=5`. Validates minimum 3-char query, calls `searchContent()`, returns paginated JSON.

### Phase 4: Search UI Component
Build `SearchOverlay` client component:
- Search input with magnifying glass icon
- Dropdown overlay with max-height ~400px, internal scroll
- Each result: title (highlighted), category badge (colored), sub-topic, summary snippet (highlighted)
- Infinite scroll: loads 5 more when scrolling near bottom
- Closes on Escape, click outside, or result click
- Mobile: search icon expands to full-width input

### Phase 5: Integration
Mount `SearchOverlay` in the header (`layout.tsx`) between `HeaderNav` and the mobile drawer.

---

## STEP-BY-STEP TASKS

### CREATE `supabase/migrations/021_add_content_search_index.sql`
- **IMPLEMENT**: Add a generated `tsvector` column `search_vector` on `content` table:
  ```sql
  ALTER TABLE content
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(sub_topic, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(practical_use_case, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(try_this, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags_tool, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags_focus, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags_workflow, ' '), '')), 'C')
  ) STORED;
  ```
- **IMPLEMENT**: Create GIN index: `CREATE INDEX idx_content_search ON content USING GIN (search_vector);`
- **IMPLEMENT**: Create `search_content` RPC function:
  ```sql
  CREATE OR REPLACE FUNCTION search_content(
    search_query text,
    result_limit int DEFAULT 5,
    result_offset int DEFAULT 0
  )
  RETURNS TABLE (
    id uuid,
    title text,
    slug text,
    summary text,
    tags_category text,
    sub_topic text,
    tags_tool text[],
    tags_focus text[],
    tags_workflow text[],
    published_at timestamptz,
    source_urls jsonb,
    rank real,
    headline_title text,
    headline_summary text
  )
  LANGUAGE sql STABLE
  AS $$
    SELECT
      c.id, c.title, c.slug, c.summary,
      c.tags_category, c.sub_topic,
      c.tags_tool, c.tags_focus, c.tags_workflow,
      c.published_at, c.source_urls,
      ts_rank_cd(c.search_vector, websearch_to_tsquery('english', search_query)) AS rank,
      ts_headline('english', c.title, websearch_to_tsquery('english', search_query),
        'StartSel=<mark>, StopSel=</mark>, MaxFragments=0') AS headline_title,
      ts_headline('english', c.summary, websearch_to_tsquery('english', search_query),
        'StartSel=<mark>, StopSel=</mark>, MaxFragments=1, MaxWords=30, MinWords=15') AS headline_summary
    FROM content c
    WHERE c.status = 'published'
      AND c.search_vector @@ websearch_to_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT result_limit
    OFFSET result_offset;
  $$;
  ```
- **IMPLEMENT**: Grant anon access: `GRANT EXECUTE ON FUNCTION search_content TO anon;`
- **GOTCHA**: `websearch_to_tsquery` handles multi-word input gracefully (implicit AND). Users can also use quotes for exact phrases and `-` for exclusion.
- **GOTCHA**: The generated column requires Postgres 12+. Supabase uses 15+, so this is safe.
- **VALIDATE**: `npx supabase db push` or apply migration manually in Supabase dashboard

### UPDATE `src/lib/supabase/queries.ts`
- **IMPLEMENT**: Add a `SearchResult` interface and `searchContent()` function:
  ```ts
  export interface SearchResult {
    id: string;
    title: string;
    slug: string;
    summary: string;
    tags_category: ContentCategory;
    sub_topic: string | null;
    tags_tool: string[];
    tags_focus: string[];
    tags_workflow: string[];
    published_at: string;
    source_urls: SourceUrl[];
    rank: number;
    headline_title: string;
    headline_summary: string;
  }

  export async function searchContent(
    query: string,
    limit = 5,
    offset = 0
  ): Promise<SearchResult[]> {
    const { data, error } = await getReadClient()
      .rpc("search_content", {
        search_query: query,
        result_limit: limit,
        result_offset: offset,
      });

    if (error) throw new Error(`Search failed: ${error.message}`);
    return (data ?? []) as SearchResult[];
  }
  ```
- **PATTERN**: Mirror `getPublishedContent()` at line 168 — same error handling pattern
- **IMPORTS**: Add `SearchResult` to the exports. `ContentCategory` and `SourceUrl` already imported.
- **VALIDATE**: `npx tsc --noEmit`

### CREATE `src/app/api/search/route.ts`
- **IMPLEMENT**: GET handler accepting `q`, `limit`, `offset` search params:
  ```ts
  import type { NextRequest } from "next/server";
  import { searchContent } from "@/lib/supabase/queries";

  export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 5), 20);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    if (q.length < 3) {
      return Response.json({ results: [], hasMore: false });
    }

    const results = await searchContent(q, limit + 1, offset);
    const hasMore = results.length > limit;

    return Response.json({
      results: hasMore ? results.slice(0, limit) : results,
      hasMore,
    });
  }
  ```
- **PATTERN**: Mirror `src/app/api/feed/route.ts` — same structure, `Response.json()` return
- **GOTCHA**: Fetch `limit + 1` to determine `hasMore` without a separate count query
- **VALIDATE**: `curl "http://localhost:3000/api/search?q=claude+code"` should return JSON

### CREATE `src/components/search-overlay.tsx`
- **IMPLEMENT**: `"use client"` component with:
  - State: `query`, `results`, `isOpen`, `isLoading`, `offset`, `hasMore`
  - Refs: input ref, dropdown ref, scroll container ref
  - Debounced fetch (300ms) triggered when `query.length >= 3`
  - Dropdown renders below the input with `position: absolute`, `z-50`, max-height ~400px, `overflow-y-auto`
  - Each result item is a `<Link>` to `getArticleUrl(result.tags_category, result.slug)`:
    - Title rendered with `dangerouslySetInnerHTML` for `headline_title` (contains `<mark>` tags)
    - Category badge: colored pill using `getCategoryConfig(result.tags_category)` — use the `accent` and `tint` classes
    - Sub-topic label (if present)
    - Summary snippet via `headline_summary` with `dangerouslySetInnerHTML`
  - Infinite scroll: `IntersectionObserver` on a sentinel div at bottom of list; when visible and `hasMore`, fetch next batch (`offset += 5`) and append
  - Close dropdown: `useEffect` with click-outside listener, Escape key handler
  - On result click: close dropdown, clear query
  - Desktop: search input inline in the nav, ~240px wide, expands on focus
  - Mobile: search icon button (visible below `sm`), clicking opens full-width input overlay
- **PATTERN**: Category badge colors from `getCategoryConfig()` — use `config.tint` for background, `config.accent` for text
- **IMPORTS**: `Link` from `next/link`, `getArticleUrl` and `getCategoryConfig` from `@/lib/categories`, `useRef`, `useState`, `useEffect`, `useCallback` from `react`
- **GOTCHA**: `dangerouslySetInnerHTML` for highlighted snippets — the `<mark>` tags come from Postgres `ts_headline` which only outputs these specific tags, so injection risk is bounded by the DB function. Sanitize by stripping any tags except `<mark>` as an extra safety layer.
- **GOTCHA**: Reset `results` and `offset` when `query` changes
- **GOTCHA**: Abort in-flight fetch when query changes (use `AbortController`)
- **VALIDATE**: `npm run build` — verify no hydration errors

### UPDATE `src/app/layout.tsx`
- **IMPLEMENT**: Import and mount `SearchOverlay` in the header, between `HeaderNav` and the mobile drawer `div`:
  ```tsx
  <Suspense>
    <HeaderNav />
  </Suspense>
  <SearchOverlay />
  <div className="ml-auto">
  ```
- **GOTCHA**: `SearchOverlay` is a client component — no need for `Suspense` wrapper since it renders synchronously on mount (no data fetching in initial render)
- **VALIDATE**: `npm run dev` — verify search appears in header on both desktop and mobile

---

## TESTING STRATEGY

### Manual Testing
- Type "claude" — results appear after 300ms, titles/summaries show highlighted "claude"
- Type "xy" — no results (under 3 chars), no API call fired
- Scroll to bottom of results — more load automatically
- Click a result — navigates to article, dropdown closes
- Press Escape — dropdown closes
- Click outside — dropdown closes
- Resize to mobile — search icon appears, expands to full-width on tap
- Search for a tag name (e.g. "mcp") — articles with that tag appear
- Search with no matches — "No articles found" message displayed

### Edge Cases
- Rapid typing (debounce cancels stale requests)
- Empty results after having results (switching query)
- Network error during search (show error state or silently fail)
- Very long query string (API truncates or handles gracefully)
- Special characters in query (websearch_to_tsquery handles this)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
npm run lint
npx tsc --noEmit
```

### Level 2: Build
```bash
npm run build
```

### Level 3: Manual Validation
```bash
npm run dev
# Test search in browser at localhost:3000
# Verify API: curl "http://localhost:3000/api/search?q=claude+code"
```

---

## ACCEPTANCE CRITERIA
- [ ] Postgres FTS index exists on content table with weighted fields
- [ ] `/api/search?q=term` returns ranked results with highlighted snippets
- [ ] Search input visible in navbar on desktop, icon-triggered on mobile
- [ ] Results appear as-you-type after 3+ chars with 300ms debounce
- [ ] Each result shows: highlighted title, category badge (colored), sub-topic, highlighted summary
- [ ] Infinite scroll loads 5 more results per batch
- [ ] Dropdown closes on Escape, click outside, or result selection
- [ ] No regressions in existing header nav or page rendering
- [ ] `npm run build` passes with zero errors

---

## NOTES

### Design Decisions
- **Postgres FTS over ilike**: Proper stemming, ranking, and `ts_headline` for snippet generation. GIN index keeps it fast.
- **`websearch_to_tsquery` over `plainto_tsquery`**: Supports quoted phrases and exclusions naturally, more forgiving with input.
- **Generated column over trigger**: Simpler, auto-maintained, no trigger management. Small write overhead is negligible for this table's update frequency.
- **RPC function over raw query**: Supabase JS client doesn't expose `ts_rank` or `ts_headline` directly. RPC keeps the complex SQL in Postgres and the client call clean.
- **`limit + 1` pattern**: Determines `hasMore` without a COUNT query, which would be slower on large result sets.
- **`dangerouslySetInnerHTML` for highlights**: Necessary for `<mark>` tags from `ts_headline`. Risk is minimal since the tags are generated by Postgres, not user input. Additional sanitization strips non-`<mark>` tags.

### Risks
- **Migration on production**: Adding a generated column rewrites the table. With a small content table (hundreds of rows) this is instant. Would be a concern at millions of rows.
- **FTS language**: Hardcoded to `'english'` — fine for this project's content but would need `'simple'` config for multilingual.
