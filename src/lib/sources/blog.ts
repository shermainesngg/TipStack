import {
  BLOG_FEEDS,
  BLOG_MAX_ENTRIES,
  BLOG_MIN_CONTENT_CHARS,
  BLOG_MAX_CONTENT_CHARS,
  type BlogFeedConfig,
} from "./config";
import type { FetchedItem } from "@/types";

// ─── AI relevance pre-filter ─────────────────────────────────────────────────
// Blog feeds are not pre-scoped to AI, so drop obviously off-topic posts before
// they cost a Claude extraction call. The dedup quality filter is the backstop.
// Match whole words (not substrings) so "ai" doesn't hit "California"/"email" etc.
const AI_PATTERNS: RegExp[] = [
  /\b(ai|llm|gpt|chatgpt|gpts?|claude|cursor|copilot|agent|agents|agentic|prompt|prompts|anthropic|openai|gemini|mcp|model|models|rag|embedding|embeddings|vector|langchain|ollama|inference|token|tokens|aider|codex)\b/i,
  /fine-?tun/i,
  /vibe cod/i,
];

function isRelevant(text: string): boolean {
  return AI_PATTERNS.some((re) => re.test(text));
}

// ─── HTML cleaning ───────────────────────────────────────────────────────────
// Feed bodies arrive as entity-escaped HTML (e.g. "&lt;p&gt;"), so decode
// entities first, then strip tags.
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // decode &amp; last to avoid double-decoding
}

function stripHtml(html: string): string {
  return decodeEntities(html)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip URL fragments so dedup/source URLs are canonical (e.g. "#atom-everything") */
function canonicalUrl(url: string): string {
  return url.split("#")[0].trim();
}

interface ParsedEntry {
  title: string;
  url: string;
  body: string;
}

function parseEntries(xml: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match: RegExpExecArray | null;

  while ((match = entryRegex.exec(xml)) !== null && entries.length < BLOG_MAX_ENTRIES) {
    const entry = match[1];
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    // Prefer the alternate (permalink) link; fall back to the first link href.
    const linkMatch =
      entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]*)"[^>]*\/?>/) ||
      entry.match(/<link[^>]*href="([^"]*)"[^>]*rel="alternate"[^>]*\/?>/) ||
      entry.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/);
    // Prefer full <content>, fall back to <summary>.
    const bodyMatch =
      entry.match(/<content[^>]*>([\s\S]*?)<\/content>/) ||
      entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);

    if (!titleMatch || !linkMatch) continue;

    entries.push({
      title: decodeEntities(titleMatch[1].trim()),
      url: canonicalUrl(linkMatch[1]),
      body: bodyMatch ? stripHtml(bodyMatch[1]) : "",
    });
  }

  return entries;
}

async function fetchFeed(
  feed: BlogFeedConfig,
  isUrlProcessed: (url: string) => Promise<boolean>
): Promise<FetchedItem[]> {
  const res = await fetch(feed.url, { headers: { "User-Agent": "TipStack/1.0" } });
  if (!res.ok) {
    throw new Error(`Failed to fetch blog feed ${feed.name}: ${res.status}`);
  }

  const xml = await res.text();
  const items: FetchedItem[] = [];

  for (const entry of parseEntries(xml)) {
    if (entry.body.length < BLOG_MIN_CONTENT_CHARS) continue;
    // Judge relevance on prose only — Simon tags even off-topic asides with AI
    // tags, so the trailing "Tags: ..." line is a false-positive magnet.
    const prose = entry.body.replace(/\s*Tags:\s*[\w,\s/-]*$/i, "");
    if (!isRelevant(`${entry.title} ${prose}`)) continue;
    if (await isUrlProcessed(entry.url)) continue;

    items.push({
      url: entry.url,
      platform: "blog",
      content: entry.body.slice(0, BLOG_MAX_CONTENT_CHARS),
      creator: feed.author,
      title: entry.title,
    });
  }

  return items;
}

/** Fetch new items from all configured blog feeds. */
export async function fetchBlogItems(
  isUrlProcessed: (url: string) => Promise<boolean>
): Promise<FetchedItem[]> {
  const results = await Promise.all(
    BLOG_FEEDS.map(async (feed) => {
      try {
        return await fetchFeed(feed, isUrlProcessed);
      } catch (err) {
        console.error(`  ERROR (${feed.name}): ${err}`);
        return [] as FetchedItem[];
      }
    })
  );
  return results.flat();
}
