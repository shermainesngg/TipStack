import { createServiceClient } from "./server";
import { createBrowserClient } from "./browser";
import type { Platform, ExtractionResult, SourceUrl, Content, ContentSummary } from "@/types";
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
}): Promise<string> {
  const { data, error } = await getServiceClient()
    .from("content")
    .insert({
      title: params.title,
      slug: params.slug,
      summary: params.summary,
      body: params.body,
      content_type: params.contentType,
      status: "pending_review",
      tags_tool: params.tagsTool,
      tags_focus: params.tagsFocus,
      tags_workflow: params.tagsWorkflow,
      tags_domain: params.tagsDomain,
      tags_category: params.tagsCategory,
      source_urls: params.sourceUrls,
    })
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

/** Fetch published content by intent-based category */
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
    .order("published_at", { ascending: false })
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
