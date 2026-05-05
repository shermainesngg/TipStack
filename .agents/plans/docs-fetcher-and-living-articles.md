# Feature: Documentation Fetcher & Living Articles Pipeline

## Feature Description

Add Claude Code documentation (GitHub releases + What's New weekly pages) as a first-class content source, update the pipeline to generate feed posts from ALL sources, and implement article rewriting with staleness detection — so the feed is a daily stream of everything Claude Code-related, and categories are an ever-growing, always-current knowledge base.

## User Story

As a user of TipStack, I want to see daily updates from official Claude Code releases AND community content in my feed, and when I click through to a category I find a well-organized, up-to-date article that synthesizes everything known about that topic — so I never miss a feature and always have a reliable reference.

## Problem Statement

Current pipeline fetches only from community sources (YouTube, Reddit, Twitter, news). This means:
- New Claude Code features may be missed or arrive late (only when community covers them)
- No authoritative source anchors the content
- Articles don't update when new information arrives
- No staleness detection when breaking changes invalidate existing content

## Solution Statement

1. Add a docs fetcher that pulls from GitHub Releases Atom feed + What's New weekly pages
2. Run docs fetch first so feature keywords feed YouTube/Twitter search discovery
3. Articles are fully rewritten (not appended) when new content matches an existing topic
4. Staleness detection flags articles for review when docs contradict them
5. Conflicting community opinions are included as "community notes"
6. Articles split when they exceed a size threshold
7. Dynamic sub-topics: Claude assigns a human-friendly `sub_topic` to each article during creation/rewrite. Category pages group articles by sub-topic. New sub-topics are automatically created when an article doesn't fit existing ones.

## Feature Metadata

- **Category**: Pipeline / Data Fetching / Content Generation
- **Priority**: High
- **Complexity**: Medium-High (touches types, sources, pipeline, migrations, frontend)
- **Dependencies**: Existing pipeline infrastructure (Inngest, Claude API, Supabase)

---

## Context References

### Files to Read (with key line numbers)

| File | Lines | Purpose |
|------|-------|---------|
| `src/types/index.ts` | 7 (Platform), 78-84 (FetchedItem), 20-37 (Content), 123-134 (FeedPost) | Core type definitions to extend |
| `src/lib/sources/config.ts` | 3-119 | Source config pattern to mirror |
| `src/lib/sources/youtube.ts` | 77-104 | Fetcher pattern to mirror |
| `scripts/fetch-all.ts` | 10-17 | Orchestration order to update |
| `src/lib/pipeline/match-articles.ts` | 84-130 (matchAndUpdateArticles), 162-238 (resynthesizeArticle) | Article matching/rewrite to enhance |
| `src/lib/pipeline/generate-feed-posts.ts` | 45-104 | Feed post generation (no changes needed) |
| `src/lib/pipeline/dedup.ts` | 151-156 | Quality thresholds to extend |
| `src/lib/inngest/pipeline.ts` | 29-149 | Inngest steps to update |
| `src/lib/supabase/queries.ts` | 27-35 (isUrlProcessed), 546-578 (findMatchingArticle), 581-610 (updateContentArticle) | Query functions |
| `src/lib/categories.ts` | 197-217 | Category inference (no changes needed) |
| `supabase/migrations/009_add_feed_posts.sql` | All | Feed posts schema reference |
| `supabase/migrations/010_content_updated_at_and_gin.sql` | All | Existing updated_at column |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/sources/docs.ts` | Documentation fetcher (GitHub releases + What's New) |
| `scripts/fetch-docs.ts` | Standalone docs fetch script |
| `supabase/migrations/012_article_staleness.sql` | Add needs_review flag + version tracking to content table |

### Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `"docs"` to Platform, add staleness fields + sub_topic to Content |
| `src/lib/sources/config.ts` | Add docs source configuration |
| `scripts/fetch-all.ts` | Add docs fetch first, pass keywords to YouTube |
| `src/lib/pipeline/dedup.ts` | Add docs quality threshold (>=3) |
| `src/lib/pipeline/match-articles.ts` | Enhance resynthesize to do full rewrite, add community notes, add article splitting, assign sub_topic |
| `src/lib/inngest/pipeline.ts` | Add docs fetch step, add staleness detection step |
| `src/lib/supabase/queries.ts` | Add staleness queries, sub-topic queries, update article queries |
| `src/lib/categories.ts` | Add sub-topic constants/defaults per category (optional seeding) |
| `src/app/categories/[category]/page.tsx` | Render articles grouped by sub_topic dynamically |

### Documentation Links

- GitHub Releases Atom feed: `https://github.com/anthropics/claude-code/releases.atom`
- What's New pages: `https://code.claude.com/docs/en/whats-new/index`
- Sitemap: `https://code.claude.com/docs/sitemap.xml`
- LLMs.txt manifest: `https://code.claude.com/docs/llms.txt`

### Patterns to Follow

- Fetcher signature: `async function fetchDocsItems(): Promise<FetchedItem[]>` (mirror youtube.ts:77)
- Config pattern: Export constants with typed arrays (mirror config.ts)
- URL dedup: Check `isUrlProcessed(url)` before processing (mirror youtube.ts:88)
- Inngest step pattern: `step.run("step-name", async () => { ... })` (mirror pipeline.ts:40)
- Claude tool_use for structured output (mirror ingest.ts:9-92)

---

## Implementation Plan

### Phase 1: Types & Configuration

Extend the type system and add docs source configuration.

### Phase 2: Documentation Fetcher

Build the fetcher that pulls from GitHub Releases + What's New pages.

### Phase 3: Pipeline Integration

Wire the docs fetcher into the Inngest pipeline and fetch-all script, including keyword extraction for search discovery.

### Phase 4: Article Rewrite Enhancement

Upgrade match-articles.ts to do full rewrites (not appends), include community notes for conflicts, and split oversized articles.

### Phase 5: Staleness Detection

Add version tracking and needs_review flagging when docs changes contradict existing articles.

### Phase 6: Dynamic Sub-Topics

Claude assigns a `sub_topic` to each article during creation/rewrite. Category pages dynamically render articles grouped by sub-topic. New sub-topics appear automatically.

### Phase 7: Migration & Database

Add the schema changes needed for staleness tracking and sub-topics.

---

## Step-by-Step Tasks

### Phase 1: Types & Configuration

**Task 1.1** — UPDATE `src/types/index.ts` line 7
- Add `"docs"` to Platform type: `type Platform = "youtube" | "reddit" | "twitter" | "news" | "docs";`

**Task 1.2** — UPDATE `src/types/index.ts` after line 37 (Content interface)
- Add fields to Content interface:
  - `needs_review?: boolean`
  - `review_reason?: string`
  - `based_on_version?: string`
  - `last_rewritten_at?: string`
  - `sub_topic?: string` — human-friendly grouping within a category (e.g., "System Prompts", "Hook Patterns")

**Task 1.3** — UPDATE `src/lib/sources/config.ts` after line 119
- ADD docs source configuration:
  ```typescript
  export const DOCS_GITHUB_REPO = "anthropics/claude-code";
  export const DOCS_RELEASES_FEED = "https://github.com/anthropics/claude-code/releases.atom";
  export const DOCS_WHATS_NEW_BASE = "https://code.claude.com/docs/en/whats-new";
  export const DOCS_MAX_RELEASES = 5; // most recent releases per fetch
  export const DOCS_MIN_BULLET_POINTS = 3; // skip patch releases with < 3 changes
  ```

---

### Phase 2: Documentation Fetcher

**Task 2.1** — CREATE `src/lib/sources/docs.ts`
- MIRROR the pattern from `src/lib/sources/youtube.ts`
- Implement `fetchGitHubReleases()`:
  - Fetch Atom feed from `DOCS_RELEASES_FEED` using native fetch
  - Parse XML (same pattern as youtube.ts RSS parsing)
  - Extract: version tag, published date, release body (markdown bullet points)
  - Each release = one FetchedItem with `platform: "docs"`, `content: releaseBody`, `creator: "Claude Code Team"`, `title: "Claude Code vX.Y.Z"`, `url: releasePageUrl`
  - Skip releases with fewer than `DOCS_MIN_BULLET_POINTS` bullet points (trivial patches)
  - Check `isUrlProcessed(url)` to skip already-fetched releases

**Task 2.2** — ADD to `src/lib/sources/docs.ts`
- Implement `fetchWhatsNew()`:
  - Calculate current ISO week number
  - Fetch `${DOCS_WHATS_NEW_BASE}/2026-wXX` (current week) and previous week
  - Extract text content from HTML (strip tags, keep headings + bullet points)
  - Each weekly page = one FetchedItem with `platform: "docs"`, `content: pageText`, `creator: "Claude Code Team"`, `title: "What's New — Week XX"`, `url: pageUrl`
  - Check `isUrlProcessed(url)` to skip already-fetched weeks

**Task 2.3** — ADD to `src/lib/sources/docs.ts`
- Implement `fetchDocsItems()` (main export):
  - Call `fetchGitHubReleases()` + `fetchWhatsNew()`
  - Combine results into single `FetchedItem[]`
  - Return combined array

**Task 2.4** — ADD to `src/lib/sources/docs.ts`
- Implement `extractFeatureKeywords(items: FetchedItem[]): string[]`:
  - Parse release bullet points and What's New headings
  - Extract feature names, command names, and concept terms (e.g., "agent harness", "voice dictation", "routines")
  - Return deduplicated keyword list for search discovery
  - Use simple regex/heuristics — no Claude call needed here

**Task 2.5** — CREATE `scripts/fetch-docs.ts`
- MIRROR pattern from `scripts/fetch-youtube.ts`
- Import `fetchDocsItems` from `@/lib/sources/docs`
- Run fetcher, log results, write to `scripts/data/fetched-docs.json`

---

### Phase 3: Pipeline Integration

**Task 3.1** — UPDATE `scripts/fetch-all.ts` line 10-17
- CHANGE execution order:
  1. Docs fetch runs FIRST: `const docsItems = await fetchDocs()`
  2. Extract keywords: `const docKeywords = extractFeatureKeywords(docsItems)`
  3. Reddit runs second (unchanged)
  4. YouTube runs third, now with BOTH Reddit titles AND docKeywords as search terms: `fetchYouTube(redditTitles, docKeywords)`
  5. Twitter + News in parallel (unchanged)
- UPDATE results combination to include docsItems

**Task 3.2** — UPDATE `src/lib/sources/youtube.ts` line 77
- CHANGE `fetchYouTubeItems()` signature to accept optional `docKeywords?: string[]` parameter
- ADD docKeywords to the search queries list (alongside evergreen queries and Reddit-derived queries)
- Limit: use top 3 doc keywords to avoid quota exhaustion

**Task 3.3** — UPDATE `src/lib/pipeline/dedup.ts` line 151-156
- ADD docs platform threshold:
  ```typescript
  docs: 3  // Authoritative source, minimal filtering — only skip trivial patch notes
  ```

**Task 3.4** — UPDATE `src/lib/inngest/pipeline.ts`
- ADD new step before YouTube fetch (around line 40):
  ```typescript
  const docsItems = await step.run("fetch-docs", async () => {
    const { fetchDocsItems } = await import("@/lib/sources/docs");
    return fetchDocsItems();
  });
  ```
- ADD keyword extraction step:
  ```typescript
  const docKeywords = await step.run("extract-doc-keywords", async () => {
    const { extractFeatureKeywords } = await import("@/lib/sources/docs");
    return extractFeatureKeywords(docsItems);
  });
  ```
- UPDATE YouTube fetch step to pass docKeywords
- ADD staleness detection step after article matching (Phase 5)

---

### Phase 4: Article Rewrite Enhancement

**Task 4.1** — UPDATE `src/lib/pipeline/match-articles.ts` lines 162-238 (resynthesizeArticle)
- CHANGE the Claude system prompt to enforce FULL REWRITE, not incremental append:
  - "Rewrite this article from scratch incorporating all source material. The output must read as one cohesive piece, not a patchwork of additions."
  - "Source authority: Official documentation is canonical. Community content adds examples, gotchas, and practical context but does not override official docs."
  - "If community sources conflict with official docs, include as a clearly labeled community note: 'Community insight: some users report [X]'"
- ADD to the Claude tool schema:
  - `community_notes?: string[]` — conflicting or supplementary community observations
- UPDATE the article body template to include community notes section at the end (if any exist)

**Task 4.2** — UPDATE `src/lib/pipeline/match-articles.ts` after resynthesizeArticle
- ADD `checkArticleSize(articleBody: string): boolean`:
  - Returns true if body exceeds 2000 words
- ADD `splitArticle(article: Content, rawItems: RawContent[]): SynthesizedPiece[]`:
  - When article exceeds threshold, call Claude to identify logical split points
  - Claude tool returns: `{ pieces: [{ title, slug_suffix, body, tags_focus }] }`
  - Each sub-piece becomes a new article under the same category
  - Original article becomes an overview/index linking to sub-articles
  - Example: "Hooks & Config" → "Hooks: Basics", "Hooks: Advanced Patterns", "Hooks: CI/CD Integration"

**Task 4.3** — UPDATE `src/lib/pipeline/match-articles.ts` matchAndUpdateArticles function (line 84-130)
- AFTER resynthesizing, call `checkArticleSize()` on the updated article
- IF too large, call `splitArticle()` and create the sub-articles via `insertContent()`
- UPDATE the original article body to be an overview with links
- Return all new article IDs in MatchResult[] so feed posts are generated for splits too

**Task 4.4** — UPDATE `src/lib/pipeline/match-articles.ts` resynthesizeArticle
- ADD source attribution to the rewrite prompt:
  - "Include a 'Sources' section at the end listing: source type (YouTube/Reddit/Docs/Twitter), creator name, and link"
  - Claude includes `sources_attribution: [{ platform, creator, url, contribution_summary }]`
- STORE attribution in the article's `source_urls` JSONB field (already exists, enhance structure)

---

### Phase 5: Staleness Detection

**Task 5.1** — CREATE staleness detection logic in `src/lib/pipeline/match-articles.ts`
- ADD `detectStaleness(docsItems: FetchedItem[], existingArticles: Content[]): StaleArticle[]`:
  - For each docs item (release note / what's new), extract mentioned features/commands
  - For each existing article, check if its topic tags overlap with the docs item's features
  - If overlap found AND the docs item mentions "breaking change", "removed", "deprecated", "renamed", or "replaced" → flag article as stale
  - Return: `{ articleId, reason: string, triggeringDocsUrl: string }[]`

**Task 5.2** — UPDATE `src/lib/supabase/queries.ts`
- ADD `flagArticleForReview(id: string, reason: string): Promise<void>`:
  - Updates content row: `needs_review = true`, `review_reason = reason`
- ADD `getArticlesNeedingReview(): Promise<Content[]>`:
  - Selects content where `needs_review = true`
- ADD `clearReviewFlag(id: string): Promise<void>`:
  - Resets `needs_review = false`, `review_reason = null`

**Task 5.3** — UPDATE `src/lib/inngest/pipeline.ts`
- ADD staleness detection step after match-articles step:
  ```typescript
  const staleArticles = await step.run("detect-staleness", async () => {
    const { detectStaleness } = await import("@/lib/pipeline/match-articles");
    const publishedArticles = await getPublishedContent(100, 0);
    return detectStaleness(docsItems, publishedArticles);
  });
  ```
- ADD flagging step:
  ```typescript
  await step.run("flag-stale-articles", async () => {
    for (const stale of staleArticles) {
      await flagArticleForReview(stale.articleId, stale.reason);
    }
  });
  ```
- Include stale article count in admin notification email

---

### Phase 6: Dynamic Sub-Topics

**Task 6.1** — UPDATE `src/lib/pipeline/match-articles.ts` createNewArticle function (line 240-352)
- ADD sub-topic assignment to the Claude synthesis prompt:
  - Provide Claude with: the article's inferred category + list of existing sub-topics for that category
  - Claude must return a `sub_topic` field: either pick an existing sub-topic name OR create a new one
  - Prompt guidance: "Assign a human-friendly sub-topic name (2-4 words, title case). This groups the article on the category page. Examples: 'System Prompts', 'Hook Patterns', 'Git Workflows'. Prefer existing sub-topics when the article fits. Only create a new sub-topic if the article covers genuinely new ground."
- ADD `sub_topic` to the RESYNTHESIZE_TOOL and CREATE_ARTICLE_TOOL schemas
- STORE `sub_topic` in the content row via insertContent()

**Task 6.2** — UPDATE `src/lib/pipeline/match-articles.ts` resynthesizeArticle function (line 162-238)
- ADD same sub-topic logic to rewrites:
  - Pass existing article's current `sub_topic` to Claude
  - Claude can keep the same sub-topic OR reassign if the article's scope shifted after merging new content
  - Include existing sub-topics for the category as context

**Task 6.3** — UPDATE `src/lib/supabase/queries.ts`
- ADD `getSubTopicsForCategory(category: string): Promise<string[]>`:
  - `SELECT DISTINCT sub_topic FROM content WHERE tags_category = $1 AND sub_topic IS NOT NULL ORDER BY sub_topic`
  - Returns the list of existing sub-topics for a category (fed to Claude during synthesis)
- ADD `getPublishedContentBySubTopic(category: string, subTopic: string): Promise<Content[]>`:
  - Fetches articles filtered by category AND sub_topic
- UPDATE `getPublishedContentByCategory()` to include `sub_topic` in returned fields

**Task 6.4** — UPDATE `src/app/categories/[category]/page.tsx`
- CHANGE from static layout to dynamic sub-topic grouping:
  - Fetch all articles for the category
  - Group by `sub_topic` field
  - Render each sub-topic as a section heading with its articles listed below
  - Sub-topics ordered by: most recently updated first (articles with freshest `updated_at`)
  - Articles within a sub-topic ordered by: `published_at` desc
  - New sub-topics appear automatically — no code change needed when Claude creates one

**Task 6.5** — UPDATE `src/components/category-layouts/` (all layout files)
- REMOVE hardcoded sub-category sections from existing layout components
- REPLACE with a shared dynamic layout that renders sub-topics from data:
  ```tsx
  // Shared pattern for all category pages
  {subTopics.map(({ name, articles }) => (
    <section key={name}>
      <h2>{name}</h2>
      {articles.map(article => <ArticleCard key={article.id} {...article} />)}
    </section>
  ))}
  ```
- Each category page still uses its own accent colors/icon from CategoryConfig
- The content within is fully dynamic

**Task 6.6** — UPDATE `src/components/category-nav.tsx` (if applicable)
- ADD sub-topic navigation within a category page:
  - Show sub-topic names as anchor links or tabs at the top of the category page
  - Clicking scrolls/filters to that sub-topic section
  - Count badge showing number of articles per sub-topic

---

### Phase 7: Migration & Database

**Task 7.1** — CREATE `supabase/migrations/012_article_staleness_and_subtopics.sql`
```sql
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS based_on_version text,
  ADD COLUMN IF NOT EXISTS sub_topic text;

CREATE INDEX idx_content_needs_review ON content (needs_review) WHERE needs_review = true;
CREATE INDEX idx_content_sub_topic ON content (tags_category, sub_topic);
```

**Task 7.2** — UPDATE `supabase/migrations/012_article_staleness_and_subtopics.sql`
- ADD `"docs"` to sources_log platform check constraint (if one exists)
- ADD index for docs platform filtering:
  ```sql
  CREATE INDEX idx_sources_log_platform ON sources_log (platform) WHERE platform = 'docs';
  ```

---

## Testing Strategy

### Unit Tests

| Test | File | Validates |
|------|------|-----------|
| Docs fetcher parses Atom XML correctly | `src/lib/pipeline/__tests__/docs-fetcher.test.ts` | XML parsing, FetchedItem shape |
| Keyword extraction finds feature names | `src/lib/pipeline/__tests__/docs-fetcher.test.ts` | Regex/heuristic extraction |
| Staleness detection flags correctly | `src/lib/pipeline/__tests__/staleness.test.ts` | Overlap detection, trigger words |
| Article split logic respects threshold | `src/lib/pipeline/__tests__/match-articles.test.ts` | Word count check, split output shape |
| Dedup applies docs threshold (>=3) | `src/lib/pipeline/__tests__/dedup.test.ts` | Platform-specific scoring |
| Sub-topic assigned during article creation | `src/lib/pipeline/__tests__/match-articles.test.ts` | Claude returns sub_topic, stored in DB |
| Sub-topic reuse for related articles | `src/lib/pipeline/__tests__/match-articles.test.ts` | Existing sub-topics passed to Claude, reused when appropriate |
| getSubTopicsForCategory returns distinct values | `src/lib/supabase/__tests__/queries.test.ts` | Query correctness |

### Integration Tests

| Test | Validates |
|------|-----------|
| Full pipeline with docs items | End-to-end: fetch docs → extract → dedup → match → feed post |
| Article rewrite preserves source attribution | Re-synthesis includes Sources section |
| Staleness flag persists and clears | DB round-trip for needs_review |

### Manual Validation

| Check | How |
|-------|-----|
| Docs fetch returns real data | `npx tsx scripts/fetch-docs.ts` → inspect output |
| Feed shows docs-sourced posts | Run pipeline → check `/api/feed` response |
| Article rewrite is coherent | Trigger rewrite → read article body for Frankenstein patterns |
| Staleness email notification | Trigger with known breaking change → check admin email |
| Sub-topics appear on category page | Navigate to `/categories/workflow-patterns` → verify grouped sections |
| New sub-topic auto-created | Push content on a new topic → verify new section appears without code changes |
| Sub-topic nav works | Click anchor link at top of category page → scrolls to correct section |

---

## Validation Commands

```bash
# Level 1: Types compile
npx tsc --noEmit

# Level 2: Tests pass
npx vitest run src/lib/pipeline/__tests__/

# Level 3: Standalone docs fetch works
npx tsx scripts/fetch-docs.ts

# Level 4: Full pipeline runs end-to-end
npx tsx scripts/fetch-all.ts && npx tsx scripts/push-content.ts
```

---

## Acceptance Criteria

- [ ] `fetchDocsItems()` returns FetchedItem[] from GitHub releases + What's New pages
- [ ] Docs items appear in feed with correct platform badge and hover summaries
- [ ] Doc keywords feed YouTube/Twitter search discovery (new features become search terms)
- [ ] Article rewrite produces coherent single-voice output (not patchwork)
- [ ] Conflicting community info appears as labeled community notes
- [ ] Articles split when exceeding 2000 words into logically separated sub-articles
- [ ] Staleness detection flags articles when docs mention breaking/removed/deprecated features
- [ ] Source attribution appears at end of each article (platform, creator, link)
- [ ] Pipeline runs successfully with docs as first fetch step
- [ ] Dedup applies >=3 threshold for docs (minimal filtering)
- [ ] Feed posts link to category article page on click (existing behavior preserved)
- [ ] `needs_review` flag visible in admin flow
- [ ] New articles are assigned a `sub_topic` by Claude during synthesis
- [ ] Category pages dynamically group articles by sub-topic (no hardcoded sections)
- [ ] New sub-topics appear automatically when Claude assigns one that doesn't exist yet
- [ ] Existing sub-topics are reused when new articles fit the same grouping
- [ ] Sub-topic navigation (anchor links/tabs) visible at top of category page

---

## Notes

- **Article rewrite cost**: Full rewrite per merge means more Claude tokens than append. Budget ~4K tokens per rewrite. With 2 pipeline runs/day and ~5 article updates each, that's ~40K tokens/day for rewrites alone. Acceptable for quality.
- **Atom feed polling**: GitHub's Atom feed is cached. Fetching more than once per hour won't yield new results. Daily fetch (matching existing pipeline cadence) is ideal.
- **What's New page availability**: These pages appear weekly. If current week's page 404s, gracefully skip and try previous week only.
- **Article splitting UX**: When an article splits, existing feed posts still link to the original (now overview) article. The overview links to sub-articles. No broken links.
- **Rate limits**: GitHub public endpoints are 60 req/hour unauthenticated. Our usage (~5 requests per fetch) is well within limits. If needed, authenticate with a GitHub token for 5000 req/hour.
- **Content truncation**: Release bodies can be long. Truncate to 12000 chars (matching existing pattern) before passing to Claude extraction.
- **Sub-topic naming**: Claude picks human-friendly names (2-4 words, title case). To prevent drift/duplicates (e.g., "Hook Patterns" vs "Hooks Configuration"), the prompt always provides existing sub-topics for the category as context. Claude must pick an existing one unless the article is genuinely novel.
- **Sub-topic ordering**: Category pages show sub-topics ordered by freshness (most recently updated articles first). This means active topics float to the top naturally.
- **Category layout migration**: Existing hardcoded layout components (`*-layout.tsx`) will be replaced by a single dynamic layout pattern. The per-category accent colors/icons from CategoryConfig are preserved — only the content sections become dynamic.
