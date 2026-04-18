import { createServiceClient } from "./server";
import { createBrowserClient } from "./browser";
import type { Platform, ExtractionResult, SourceUrl, Content } from "@/types";

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

/** Fetch published content for the public feed */
export async function getPublishedContent(
  limit = 20,
  offset = 0
): Promise<Content[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch content: ${error.message}`);
  return data as Content[];
}

/** Fetch published content filtered by tags (array overlap) */
export async function getPublishedContentByTags(
  tagsTool: string[],
  tagsFocus: string[],
  tagsWorkflow: string[],
  tagsDomain: string[],
  limit = 20,
  offset = 0
): Promise<Content[]> {
  let query = getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tagsTool.length > 0) {
    query = query.overlaps("tags_tool", tagsTool);
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
  return data as Content[];
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
    (row.tags_tool as string[]).forEach((t) => tools.add(t));
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

/** Fetch published content filtered by a single domain */
export async function getPublishedContentByDomain(
  domain: string,
  limit = 40,
  offset = 0
): Promise<Content[]> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("*")
    .eq("status", "published")
    .overlaps("tags_domain", [domain])
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to fetch domain content: ${error.message}`);
  return data as Content[];
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

/** Fetch content counts per category for the home page */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await getReadClient()
    .from("content")
    .select("tags_category")
    .eq("status", "published");

  if (error)
    throw new Error(`Failed to fetch category counts: ${error.message}`);

  const counts: Record<string, number> = {};
  for (const row of data) {
    const cat = row.tags_category as string;
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}
