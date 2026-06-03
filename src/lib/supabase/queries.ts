import "server-only";
import { createServiceClient } from "./server";
import { createBrowserClient } from "./browser";
import type { Platform, ExtractionResult, SourceUrl, Content, ContentSummary, ContentCategory, FeedPost, Skill, SkillType, FetchedSkillMeta, ChangelogEntry, ChangelogChange, ChangeCategory } from "@/types";
import { normalizeToolTag, expandToolAliases } from "@/lib/tools";

const CARD_COLUMNS = "id, title, slug, summary, content_type, status, tags_tool, tags_focus, tags_workflow, tags_domain, tags_category, source_urls, created_at, published_at";

/**
 * Lazy service client — only created when pipeline functions need it.
 * Avoids crashing the frontend at module load when env vars are missing.
 */
function getServiceClient() {
  return createServiceClient();
}

/**
 * Read-only client using the anon key. Safe for frontend server components.
 */
function getReadClient() {
  return createBrowserClient();
}

// ─── sources_log ────────────────────────────────────────────────────────────

/** Check if a URL has already been processed */
export async function isUrlProcessed(url: string): Promise<boolean> {
  const { data } = await getServiceClient()
    .from("sources_log")
    .select("id")
    .eq("url", url)
    .single();

  return !!data;
}

/** Log a URL as processed */
export async function logProcessedUrl(
  url: string,
  platform: Platform
): Promise<void> {
  const { error } = await getServiceClient()
    .from("sources_log")
    .insert({ url, platform });

  if (error) throw new Error(`Failed to log URL: ${error.message}`);
}

// ─── raw_content ────────────────────────────────────────────────────────────

/** Store an extracted item in raw_content */
export async function insertRawContent(params: {
  sourceUrl: string;
  platform: Platform;
  rawExtract: ExtractionResult;
  batchDate: string;
}): Promise<string> {
  const { data, error } = await getServiceClient()
    .from("raw_content")
    .insert({
      source_url: params.sourceUrl,
      platform: params.platform,
      raw_extract: params.rawExtract,
      status: "ingested",
      batch_date: params.batchDate,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert raw_content: ${error.message}`);
  return data.id;
}

/** Fetch all raw_content items with a given status for a batch date */
export async function getRawContentByStatus(
  status: string,
  batchDate: string
) {
  const { data, error } = await getServiceClient()
    .from("raw_content")
    .select("*")
    .eq("status", status)
    .eq("batch_date", batchDate);

  if (error)
    throw new Error(`Failed to fetch raw_content: ${error.message}`);
  return data;
}

/** Update the status of a raw_content item */
export async function updateRawContentStatus(
  id: string,
  status: string
): Promise<void> {
  const { error } = await getServiceClient()
    .from("raw_content")
    .update({ status })
    .eq("id", id);

  if (error)
    throw new Error(`Failed to update raw_content status: ${error.message}`);
}

// ─── content (writes — service client) ─────────────────────────────────────

/**
 * Minimum dedup quality score (1-10) for an article to auto-publish. Pieces at
 * or above this bar go straight to `published`; anything below is held as
 * `pending_review` for manual approval. Callers pass the source material's
 * quality score; when none is provided the piece auto-publishes.
 */
const AUTO_PUBLISH_MIN_SCORE = 7;

/** Insert a synthesized content piece */
export async function insertContent(params: {
  title: string;
  slug: string;
  summary: string;
  body: string;
  contentType: string;
  tagsTool: string[];
  tagsFocus: string[];
  tagsWorkflow: string[];
  tagsDomain: string[];
  tagsCategory: string;
  sourceUrls: SourceUrl[];
  qualityScore?: number;
  subTopic?: string;
  skillId?: string;
  practicalUseCase?: string;
  tryThis?: string;
}): Promise<string> {
  const autoPublish =
    params.qualityScore == null || params.qualityScore >= AUTO_PUBLISH_MIN_SCORE;

  const insertData: Record<string, unknown> = {
    title: params.title,
    slug: params.slug,
    summary: params.summary,
    body: params.body,
    content_type: params.contentType,
    status: autoPublish ? "published" : "pending_review",
    tags_tool: params.tagsTool,
    tags_focus: params.tagsFocus,
    tags_workflow: params.tagsWorkflow,
    tags_domain: params.tagsDomain,
    tags_category: params.tagsCategory,
    source_urls: params.sourceUrls,
  };

  if (autoPublish) {
    insertData.published_at = new Date().toISOString();
  }

  if (params.subTopic) {
    insertData.sub_topic = params.subTopic;
  }

  if (params.skillId) {
    insertData.skill_id = params.skillId;
  }

  if (params.practicalUseCase) {
    insertData.practical_use_case = params.practicalUseCase;
  }

  if (params.tryThis) {
    insertData.try_this = params.tryThis;
  }

  const { data, error } = await getServiceClient()
    .from("content")
    .insert(insertData)
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert content: ${error.message}`);
  return data.id;
}

// ─── content (reads — anon client, safe for frontend) ──────────────────────

/** Fetch published content for the public feed (excludes body for performance) */
export async function getPublishedContent(
  limit = 20,
  offset = 0
): Promise<ContentSummary[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch content: ${error.message}`);
  return data as ContentSummary[];
}

/** Fetch published content matching a tag in ANY column (OR logic) */
export async function getPublishedContentByTagAny(
  tag: string,
  limit = 20,
  offset = 0
): Promise<ContentSummary[]> {
  const expanded = expandToolAliases(tag);
  const toolList = `{${expanded.join(",")}}`;
  const tagList = `{${tag}}`;

  const { data, error } = await getReadClient()
    .from("content")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .or(
      `tags_tool.ov.${toolList},tags_focus.ov.${tagList},tags_workflow.ov.${tagList},tags_domain.ov.${tagList}`
    )
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch filtered content: ${error.message}`);
  return data as ContentSummary[];
}

/** Fetch published content filtered by tags (excludes body for performance) */
export async function getPublishedContentByTags(
  tagsTool: string[],
  tagsFocus: string[],
  tagsWorkflow: string[],
  tagsDomain: string[],
  limit = 20,
  offset = 0
): Promise<ContentSummary[]> {
  let query = getReadClient()
    .from("content")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tagsTool.length > 0) {
    const expanded = tagsTool.flatMap(expandToolAliases);
    query = query.overlaps("tags_tool", expanded);
  }
  if (tagsFocus.length > 0) {
    query = query.overlaps("tags_focus", tagsFocus);
  }
  if (tagsWorkflow.length > 0) {
    query = query.overlaps("tags_workflow", tagsWorkflow);
  }
  if (tagsDomain.length > 0) {
    query = query.overlaps("tags_domain", tagsDomain);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch filtered content: ${error.message}`);
  return data as ContentSummary[];
}

/** Fetch distinct tag values across all published content */
export async function getAvailableTags(): Promise<{
  tools: string[];
  focuses: string[];
  workflows: string[];
  domains: string[];
}> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("tags_tool, tags_focus, tags_workflow, tags_domain")
    .eq("status", "published");

  if (error) throw new Error(`Failed to fetch tags: ${error.message}`);

  const tools = new Set<string>();
  const focuses = new Set<string>();
  const workflows = new Set<string>();
  const domains = new Set<string>();

  for (const row of data) {
    for (const t of row.tags_tool as string[]) {
      const normalized = normalizeToolTag(t);
      if (normalized) tools.add(normalized);
    }
    (row.tags_focus as string[]).forEach((t) => focuses.add(t));
    (row.tags_workflow as string[]).forEach((t) => workflows.add(t));
    (row.tags_domain as string[]).forEach((t) => domains.add(t));
  }

  return {
    tools: [...tools].sort(),
    focuses: [...focuses].sort(),
    workflows: [...workflows].sort(),
    domains: [...domains].sort(),
  };
}

/** Fetch a single published content piece by slug */
export async function getContentBySlug(
  slug: string
): Promise<Content | null> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
  return (data as Content) ?? null;
}

/** Check if any published content exists for a given domain tag */
export async function hasDomainContent(domain: string): Promise<boolean> {
  const { count, error } = await getReadClient()
    .from("content")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .overlaps("tags_domain", [domain]);

  if (error) throw new Error(`Failed to check domain: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Fetch published content filtered by a single domain (excludes body for performance) */
export async function getPublishedContentByDomain(
  domain: string,
  limit = 40,
  offset = 0
): Promise<ContentSummary[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select(CARD_COLUMNS)
    .eq("status", "published")
    .overlaps("tags_domain", [domain])
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch domain content: ${error.message}`);
  return data as ContentSummary[];
}

// ─── category queries ─────────────────────────────────────────────────────

/** Fetch published content by intent-based category (includes sub_topic) */
export async function getPublishedContentByCategory(
  category: string,
  limit = 40,
  offset = 0
): Promise<Content[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .eq("tags_category", category)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error)
    throw new Error(`Failed to fetch category content: ${error.message}`);
  return data as Content[];
}

/** Fetch published content by category with optional domain filter */
export async function getPublishedContentByCategoryAndDomain(
  category: string,
  domain: string | null,
  limit = 40,
  offset = 0
): Promise<Content[]> {
  let query = getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .eq("tags_category", category)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (domain) {
    query = query.overlaps("tags_domain", [domain]);
  }

  const { data, error } = await query;
  if (error)
    throw new Error(`Failed to fetch category+domain content: ${error.message}`);
  return data as Content[];
}

/** Fetch published content by category with optional tool filter */
export async function getPublishedContentByCategoryAndTool(
  category: string,
  tool: string | null,
  limit = 40,
  offset = 0
): Promise<Content[]> {
  let query = getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .eq("tags_category", category)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tool) {
    query = query.overlaps("tags_tool", expandToolAliases(tool));
  }

  const { data, error } = await query;
  if (error)
    throw new Error(`Failed to fetch category+tool content: ${error.message}`);
  return data as Content[];
}

/** Fetch published content by category with optional activity filter (matches across workflow, focus, and domain tags) */
export async function getPublishedContentByCategoryAndActivity(
  category: string,
  activityTags: string[] | null,
  limit = 40,
  offset = 0
): Promise<Content[]> {
  let query = getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .eq("tags_category", category)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (activityTags && activityTags.length > 0) {
    const tagList = `{${activityTags.join(",")}}`;
    query = query.or(
      `tags_workflow.ov.${tagList},tags_focus.ov.${tagList},tags_domain.ov.${tagList}`
    );
  }

  const { data, error } = await query;
  if (error)
    throw new Error(`Failed to fetch category+activity content: ${error.message}`);
  return data as Content[];
}

/** Return which activity filter keys have at least one matching content item in a category */
export async function getActiveFiltersForCategory(
  category: string,
  filters: { key: string; tags: string[] }[]
): Promise<string[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("tags_workflow, tags_focus, tags_domain")
    .eq("status", "published")
    .eq("tags_category", category);

  if (error)
    throw new Error(`Failed to fetch category filter data: ${error.message}`);

  const active: string[] = [];
  for (const filter of filters) {
    const hasMatch = data.some((row) => {
      const allTags = [
        ...(row.tags_workflow as string[]),
        ...(row.tags_focus as string[]),
        ...(row.tags_domain as string[]),
      ];
      return filter.tags.some((t) => allTags.includes(t));
    });
    if (hasMatch) active.push(filter.key);
  }
  return active;
}

/** Fetch distinct normalized tools for a specific category */
export async function getToolsForCategory(
  category: string
): Promise<string[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("tags_tool")
    .eq("status", "published")
    .eq("tags_category", category);

  if (error)
    throw new Error(`Failed to fetch category tools: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const row of data) {
    for (const rawTool of row.tags_tool as string[]) {
      const tool = normalizeToolTag(rawTool);
      if (!tool) continue;
      counts[tool] = (counts[tool] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tool]) => tool);
}

export interface CategoryMeta {
  tools: string[];
  latestPublishedAt: string | null;
  count: number;
}

/** Fetch top tools, latest update, and count per category (single query) */
export async function getCategoryToolsAndFreshness(): Promise<
  Record<string, CategoryMeta>
> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("tags_category, tags_tool, published_at")
    .eq("status", "published");

  if (error)
    throw new Error(`Failed to fetch category meta: ${error.message}`);

  const raw: Record<
    string,
    { toolCounts: Record<string, number>; latest: string | null; count: number }
  > = {};

  for (const row of data) {
    const cat = row.tags_category as string;
    if (!raw[cat]) raw[cat] = { toolCounts: {}, latest: null, count: 0 };
    raw[cat].count++;

    for (const rawTool of row.tags_tool as string[]) {
      const tool = normalizeToolTag(rawTool);
      if (!tool) continue;
      raw[cat].toolCounts[tool] = (raw[cat].toolCounts[tool] ?? 0) + 1;
    }

    const pub = row.published_at as string | null;
    if (pub && (!raw[cat].latest || pub > raw[cat].latest))
      raw[cat].latest = pub;
  }

  const result: Record<string, CategoryMeta> = {};
  for (const [cat, { toolCounts, latest, count }] of Object.entries(raw)) {
    result[cat] = {
      tools: Object.entries(toolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tool]) => tool),
      latestPublishedAt: latest,
      count,
    };
  }
  return result;
}

export async function getCategoryFreshness(category: string): Promise<string | null> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("published_at")
    .eq("status", "published")
    .eq("tags_category", category)
    .order("published_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(`Failed to fetch category freshness: ${error.message}`);
  return data[0]?.published_at ?? null;
}

// ─── feed stats ─────────────────────────────────────────────────────────────

export interface FeedStats {
  sourcesProcessed: number;
  toolsTracked: number;
  articlesPublished: number;
  lastIngestion: string | null;
}

export async function getFeedStats(): Promise<FeedStats> {
  const client = getReadClient();

  const [sourcesRes, toolsRes, contentCountRes, lastFeedPostRes] = await Promise.all([
    client.from("sources_log").select("id", { count: "exact", head: true }),
    client.from("content").select("tags_tool").eq("status", "published"),
    client.from("content").select("id", { count: "exact", head: true }).eq("status", "published"),
    client.from("feed_posts").select("published_at").order("published_at", { ascending: false }).limit(1),
  ]);

  const toolSet = new Set<string>();
  if (toolsRes.data) {
    for (const row of toolsRes.data) {
      for (const t of (row as { tags_tool: string[] }).tags_tool) {
        toolSet.add(t);
      }
    }
  }

  return {
    sourcesProcessed: sourcesRes.count ?? 0,
    toolsTracked: toolSet.size,
    articlesPublished: contentCountRes.count ?? 0,
    lastIngestion: (lastFeedPostRes.data?.[0] as { published_at: string } | undefined)?.published_at ?? null,
  };
}

// ─── feed_posts ─────────────────────────────────────────────────────────────

const FEED_COLUMNS = "id, headline, summary, source_urls, topic_content_id, source_platforms, priority, published_at";

/** Fetch feed posts with cursor-based pagination (newest first, 30-day window) */
export async function getFeedPosts(
  cursor: string | null,
  limit = 20,
  platforms?: Platform[]
): Promise<FeedPost[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = getReadClient()
    .from("feed_posts")
    .select(`${FEED_COLUMNS}, content!inner(slug, tags_category, sub_topic, tags_focus)`)
    .gte("published_at", thirtyDaysAgo)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("published_at", cursor);
  }

  if (platforms && platforms.length > 0) {
    query = query.overlaps("source_platforms", platforms);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch feed posts: ${error.message}`);

  return (data as Record<string, unknown>[]).map((row) => {
    const content = row.content as { slug: string; tags_category: string; sub_topic: string | null; tags_focus: string[] } | null;
    return {
      ...(row as unknown as FeedPost),
      topic_slug: content?.slug,
      topic_category: content?.tags_category as FeedPost["topic_category"],
      topic_sub_topic: content?.sub_topic ?? undefined,
      topic_tags_focus: content?.tags_focus ?? [],
    };
  });
}

// ─── topic matching (service client — pipeline only) ────────────────────────

// A living article that has accumulated this many focus tags or sources has lost
// topical focus — it's a "magnet" that absorbs loosely-related items. Merging into
// one produces a sprawling article that no feed headline can honestly describe, so
// we refuse the merge and let the incoming item become its own focused article.
const MAX_HOST_FOCUS_TAGS = 8;
const MAX_HOST_SOURCES = 8;

/**
 * Find an existing published article matching incoming tags via array overlap.
 *
 * Two guards keep merges honest:
 * 1. **Category gate** — a security tip must not merge into a Claude Code features
 *    comparison just because they share the ubiquitous `claude_code` tag. Living
 *    articles live on per-category pages, so cross-category merges are wrong by design.
 * 2. **Breadth guard** — magnet articles (too many focus tags or sources) are skipped,
 *    and overlap is normalized by host breadth so a focused host always beats a broad
 *    one at equal raw overlap. This stops a narrow item from being absorbed into a
 *    sprawling guide and then surfaced under a specific feed headline.
 */
export async function findMatchingArticle(
  tagsTool: string[],
  tagsFocus: string[],
  category: ContentCategory
): Promise<(Content & { overlap: number }) | null> {
  if (tagsTool.length === 0 || tagsFocus.length === 0) return null;

  const { data, error } = await getServiceClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .eq("tags_category", category)
    .overlaps("tags_tool", tagsTool)
    .overlaps("tags_focus", tagsFocus)
    .order("published_at", { ascending: false })
    .limit(10);

  if (error) throw new Error(`Failed to find matching article: ${error.message}`);
  if (!data || data.length === 0) return null;

  let bestMatch: (Content & { overlap: number }) | null = null;
  let bestScore = 0;

  for (const row of data) {
    const hostFocus = (row.tags_focus as string[]) ?? [];
    const hostTool = (row.tags_tool as string[]) ?? [];
    const hostSources = (row.source_urls as unknown[]) ?? [];

    // Skip magnets — never merge into an article that has lost focus.
    if (hostFocus.length >= MAX_HOST_FOCUS_TAGS || hostSources.length >= MAX_HOST_SOURCES) {
      continue;
    }

    const toolOverlap = hostTool.filter((t: string) => tagsTool.includes(t)).length;
    const focusOverlap = hostFocus.filter((t: string) => tagsFocus.includes(t)).length;
    if (focusOverlap < 1) continue;

    const overlap = toolOverlap + focusOverlap;
    // Normalize by host breadth so a tight, on-topic article wins over a broad one.
    const score = overlap / Math.sqrt(hostTool.length + hostFocus.length);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { ...(row as Content), overlap };
    }
  }

  return bestMatch;
}

/** Update an existing content article (living article re-synthesis) */
export async function updateContentArticle(
  id: string,
  params: {
    title: string;
    summary: string;
    body: string;
    sourceUrls: SourceUrl[];
    tagsTool: string[];
    tagsFocus: string[];
    tagsWorkflow: string[];
    tagsDomain: string[];
    subTopic?: string;
    practicalUseCase?: string;
    tryThis?: string;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    title: params.title,
    summary: params.summary,
    body: params.body,
    source_urls: params.sourceUrls,
    tags_tool: params.tagsTool,
    tags_focus: params.tagsFocus,
    tags_workflow: params.tagsWorkflow,
    tags_domain: params.tagsDomain,
    updated_at: new Date().toISOString(),
  };

  if (params.subTopic) {
    updateData.sub_topic = params.subTopic;
  }

  if (params.practicalUseCase) {
    updateData.practical_use_case = params.practicalUseCase;
  }

  if (params.tryThis) {
    updateData.try_this = params.tryThis;
  }

  const { error } = await getServiceClient()
    .from("content")
    .update(updateData)
    .eq("id", id);

  if (error) throw new Error(`Failed to update content article: ${error.message}`);
}

// ─── staleness & review ──────────────────────────────────────────────────────

/** Flag an article for review (staleness detection) */
export async function flagArticleForReview(
  id: string,
  reason: string
): Promise<void> {
  const { error } = await getServiceClient()
    .from("content")
    .update({ needs_review: true, review_reason: reason })
    .eq("id", id);

  if (error) throw new Error(`Failed to flag article for review: ${error.message}`);
}

/** Get all articles that need review */
export async function getArticlesNeedingReview(): Promise<Content[]> {
  const { data, error } = await getServiceClient()
    .from("content")
    .select("*")
    .eq("needs_review", true);

  if (error) throw new Error(`Failed to fetch articles needing review: ${error.message}`);
  return data as Content[];
}

/** Clear the review flag on an article */
export async function clearReviewFlag(id: string): Promise<void> {
  const { error } = await getServiceClient()
    .from("content")
    .update({ needs_review: false, review_reason: null })
    .eq("id", id);

  if (error) throw new Error(`Failed to clear review flag: ${error.message}`);
}

// ─── sub-topics ──────────────────────────────────────────────────────────────

/** Get distinct sub-topics for a category */
export async function getSubTopicsForCategory(
  category: string
): Promise<string[]> {
  const { data, error } = await getServiceClient()
    .from("content")
    .select("sub_topic")
    .eq("tags_category", category)
    .not("sub_topic", "is", null)
    .eq("status", "published");

  if (error) throw new Error(`Failed to fetch sub-topics: ${error.message}`);

  const unique = [...new Set((data as { sub_topic: string }[]).map((r) => r.sub_topic))];
  return unique.sort();
}

/** Fetch published content by category and sub-topic */
export async function getPublishedContentBySubTopic(
  category: string,
  subTopic: string
): Promise<Content[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .eq("tags_category", category)
    .eq("sub_topic", subTopic)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch content by sub-topic: ${error.message}`);
  return data as Content[];
}

// ─── skills ────────────────────────────────────────────────────────────────

/** Upsert a skill — insert or update on repo_url conflict */
export async function upsertSkill(meta: FetchedSkillMeta & { skillType: SkillType; skillSubcategory?: string; summary?: string; useCase?: string }): Promise<string> {
  const { data, error } = await getServiceClient()
    .from("skills")
    .upsert(
      {
        name: meta.name,
        description: meta.description,
        repo_url: meta.repoUrl,
        author: meta.author,
        skill_type: meta.skillType,
        skill_subcategory: meta.skillSubcategory ?? null,
        summary: meta.summary ?? null,
        use_case: meta.useCase ?? null,
        stars: meta.stars,
        last_updated: meta.lastUpdated,
        install_command: meta.installCommand,
        topics: meta.topics,
        readme_excerpt: meta.readmeExcerpt?.slice(0, 2000) ?? null,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "repo_url" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`Failed to upsert skill: ${error.message}`);
  return data.id;
}

/** Fetch active skills, optionally filtered by type */
export async function getActiveSkills(skillType?: SkillType): Promise<Skill[]> {
  let query = getReadClient()
    .from("skills")
    .select("*")
    .eq("status", "active")
    .order("stars", { ascending: false });

  if (skillType) {
    query = query.eq("skill_type", skillType);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch skills: ${error.message}`);
  return data as Skill[];
}

/** Fetch active skills grouped by skill_type */
export async function getSkillsByType(): Promise<Record<string, Skill[]>> {
  const { data, error } = await getReadClient()
    .from("skills")
    .select("*")
    .eq("status", "active")
    .order("stars", { ascending: false });

  if (error) throw new Error(`Failed to fetch skills by type: ${error.message}`);

  const grouped: Record<string, Skill[]> = {};
  for (const skill of data as Skill[]) {
    if (!grouped[skill.skill_type]) grouped[skill.skill_type] = [];
    grouped[skill.skill_type].push(skill);
  }
  return grouped;
}

/** Fetch published content linked to a specific skill */
export async function getContentForSkill(skillId: string): Promise<Content[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .eq("skill_id", skillId)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch content for skill: ${error.message}`);
  return data as Content[];
}

// ─── changelog_entries + changelog_changes ────────────────────────────────

const CHANGELOG_WITH_CHANGES = "id, title, headline, source_url, version, published_at, created_at, changelog_changes(*)";

function mapChangelogRows(rows: Record<string, unknown>[]): ChangelogEntry[] {
  return rows.map((row) => ({
    ...(row as unknown as Omit<ChangelogEntry, "changes">),
    changes: (row.changelog_changes as ChangelogChange[]) ?? [],
  }));
}

/** Check if a changelog URL has already been processed */
export async function isChangelogUrlProcessed(sourceUrl: string): Promise<boolean> {
  const { data } = await getServiceClient()
    .from("changelog_entries")
    .select("id")
    .eq("source_url", sourceUrl)
    .single();

  return !!data;
}

/** Insert a changelog entry with its individual changes */
export async function insertChangelogEntry(params: {
  title: string;
  headline: string | null;
  sourceUrl: string;
  version: string | null;
  publishedAt: string;
  changes: { description: string; category: ChangeCategory; affectedTools: string[] }[];
}): Promise<string> {
  const client = getServiceClient();

  const { data, error } = await client
    .from("changelog_entries")
    .insert({
      title: params.title,
      headline: params.headline,
      source_url: params.sourceUrl,
      version: params.version,
      published_at: params.publishedAt,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert changelog entry: ${error.message}`);

  if (params.changes.length > 0) {
    const { error: changesError } = await client
      .from("changelog_changes")
      .insert(
        params.changes.map((c) => ({
          changelog_entry_id: data.id,
          description: c.description,
          category: c.category,
          affected_tools: c.affectedTools,
        }))
      );

    if (changesError) throw new Error(`Failed to insert changelog changes: ${changesError.message}`);
  }

  return data.id;
}

/** Fetch all changelog entries with changes (read client, newest first) */
export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  const { data, error } = await getReadClient()
    .from("changelog_entries")
    .select(CHANGELOG_WITH_CHANGES)
    .order("published_at", { ascending: false });

  if (error) {
    if (error.message.includes("schema cache")) return [];
    throw new Error(`Failed to fetch changelog entries: ${error.message}`);
  }
  return mapChangelogRows(data as Record<string, unknown>[]);
}

/** Fetch recent entries that contain at least one breaking change */
export async function getRecentBreakingChanges(days = 7): Promise<ChangelogEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await getReadClient()
    .from("changelog_changes")
    .select("changelog_entry_id")
    .eq("category", "breaking_change")
    .gte("created_at", since);

  if (error) throw new Error(`Failed to fetch breaking changes: ${error.message}`);

  const entryIds = [...new Set((data as { changelog_entry_id: string }[]).map((r) => r.changelog_entry_id))];
  if (entryIds.length === 0) return [];

  const { data: entries, error: entriesError } = await getReadClient()
    .from("changelog_entries")
    .select(CHANGELOG_WITH_CHANGES)
    .in("id", entryIds)
    .order("published_at", { ascending: false });

  if (entriesError) throw new Error(`Failed to fetch breaking entries: ${entriesError.message}`);
  return mapChangelogRows(entries as Record<string, unknown>[]);
}

/** Fetch recent changelog entries (for daily digest) */
export async function getRecentChangelogEntries(days = 1): Promise<ChangelogEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await getReadClient()
    .from("changelog_entries")
    .select(CHANGELOG_WITH_CHANGES)
    .gte("published_at", since)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch recent changelog entries: ${error.message}`);
  return mapChangelogRows(data as Record<string, unknown>[]);
}

/** Fetch recent published content (for digest) */
export async function getRecentPublishedContent(days = 7, limit = 10): Promise<Content[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch recent content: ${error.message}`);
  return data as Content[];
}

// ─── feed_posts ─────────────────────────────────────────────────────────────

/** Insert a feed post */
export async function insertFeedPost(params: {
  headline: string;
  summary: string;
  priority?: number;
  sourceUrls: SourceUrl[];
  topicContentId: string;
  sourcePlatforms: string[];
  pipelineRunId?: string;
}): Promise<string> {
  const { data, error } = await getServiceClient()
    .from("feed_posts")
    .insert({
      headline: params.headline,
      summary: params.summary,
      priority: params.priority ?? 5,
      source_urls: params.sourceUrls,
      topic_content_id: params.topicContentId,
      source_platforms: params.sourcePlatforms,
      pipeline_run_id: params.pipelineRunId ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert feed post: ${error.message}`);
  return data.id;
}

/** Keep only the N most recent feed posts, delete the rest */
export async function pruneOldFeedPosts(keep = 16): Promise<number> {
  const client = getServiceClient();

  const { data: recent } = await client
    .from("feed_posts")
    .select("id")
    .order("published_at", { ascending: false })
    .limit(keep);

  if (!recent || recent.length < keep) return 0;

  const keepIds = recent.map((r) => r.id);

  const { data: old, error } = await client
    .from("feed_posts")
    .delete()
    .not("id", "in", `(${keepIds.join(",")})`)
    .select("id");

  if (error) throw new Error(`Failed to prune feed posts: ${error.message}`);
  return old?.length ?? 0;
}

// ─── search ───────────────────────────────────────────────────────────────────

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
