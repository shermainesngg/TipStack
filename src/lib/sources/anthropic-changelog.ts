import {
  CHANGELOG_RELEASES_FEED,
  CHANGELOG_WHATS_NEW_BASE,
  CHANGELOG_MAX_RELEASES,
  CHANGELOG_WHATS_NEW_WEEKS,
} from "./config";
import { isChangelogUrlProcessed, insertChangelogEntry } from "@/lib/supabase/queries";
import { callClaudeCode, pMap } from "@/lib/ai/claude-code";
import type { ChangelogUrgency } from "@/types";

interface RawChangelogItem {
  title: string;
  url: string;
  publishedAt: string;
  body: string;
}

interface ClassifiedEntry {
  urgency: ChangelogUrgency;
  headline: string;
  changes: string[];
  affected_tools: string[];
  version: string | null;
}

const CLASSIFICATION_SCHEMA = {
  type: "object",
  properties: {
    urgency: {
      type: "string",
      enum: ["breaking", "important", "informational"],
      description: "breaking = requires user action or may break existing workflows. important = significant new capability worth adopting. informational = minor fix or improvement.",
    },
    headline: {
      type: "string",
      description: "One short sentence (under 80 chars) summarizing the theme of this release. E.g. 'New plugin system and history search'.",
    },
    changes: {
      type: "array",
      items: { type: "string" },
      description: "2-5 bullet points, each a concise description of one change (under 100 chars each). Start each with a verb.",
    },
    affected_tools: {
      type: "array",
      items: { type: "string", enum: ["claude_code", "claude_api", "claude_desktop", "anthropic_sdk"] },
      description: "Which tools are affected by this change.",
    },
    version: {
      type: ["string", "null"],
      description: "Version string if applicable (e.g., 'v2.1.0'), or null if not a versioned release.",
    },
  },
  required: ["urgency", "headline", "changes", "affected_tools", "version"],
};

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function hasBreakingKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes("breaking change") || lower.includes("breaking:") || lower.includes("BREAKING");
}

async function fetchGitHubReleases(): Promise<RawChangelogItem[]> {
  const res = await fetch(CHANGELOG_RELEASES_FEED);
  if (!res.ok) {
    console.warn(`Failed to fetch GitHub releases feed: ${res.status}`);
    return [];
  }

  const xml = await res.text();
  const items: RawChangelogItem[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null && items.length < CHANGELOG_MAX_RELEASES) {
    const entry = match[1];
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const linkMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*\/>/);
    const publishedMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/);
    const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        url: linkMatch[1].trim(),
        publishedAt: publishedMatch ? publishedMatch[1].trim() : new Date().toISOString(),
        body: contentMatch ? stripHtmlTags(contentMatch[1]).slice(0, 8000) : "",
      });
    }
  }

  return items;
}

async function fetchWhatsNewPages(): Promise<RawChangelogItem[]> {
  const now = new Date();
  const currentWeek = getISOWeekNumber(now);
  const year = now.getFullYear();
  const items: RawChangelogItem[] = [];

  for (let i = 0; i < CHANGELOG_WHATS_NEW_WEEKS; i++) {
    const week = currentWeek - i;
    if (week <= 0) break;

    const weekStr = String(week).padStart(2, "0");
    const pageUrl = `${CHANGELOG_WHATS_NEW_BASE}/${year}-w${weekStr}`;

    if (await isChangelogUrlProcessed(pageUrl)) break;

    try {
      const res = await fetch(pageUrl);
      if (!res.ok) continue;

      const html = await res.text();
      const pageText = stripHtmlTags(html).slice(0, 8000);
      if (pageText.length < 100) continue;

      items.push({
        title: `What's New — Week ${weekStr}, ${year}`,
        url: pageUrl,
        publishedAt: new Date(year, 0, 1 + (week - 1) * 7).toISOString(),
        body: pageText,
      });
    } catch {
      // Page not available, skip
    }
  }

  return items;
}

async function classifyEntry(item: RawChangelogItem): Promise<ClassifiedEntry> {
  const result = await callClaudeCode<ClassifiedEntry>({
    systemPrompt: "You are a technical changelog classifier for AI developer tools. Classify each changelog entry by urgency and extract structured metadata. Be concise and precise.",
    userMessage: `Classify this changelog entry:\n\nTitle: ${item.title}\n\nContent:\n${item.body}`,
    jsonSchema: CLASSIFICATION_SCHEMA,
  });

  if (hasBreakingKeywords(item.body) && result.urgency !== "breaking") {
    result.urgency = "breaking";
  }

  return result;
}

export interface ChangelogFetchResult {
  inserted: number;
  skipped: number;
  errors: number;
}

export async function fetchAndClassifyChangelog(): Promise<ChangelogFetchResult> {
  const [releases, whatsNew] = await Promise.all([
    fetchGitHubReleases(),
    fetchWhatsNewPages(),
  ]);

  const allItems = [...releases, ...whatsNew];
  const stats: ChangelogFetchResult = { inserted: 0, skipped: 0, errors: 0 };

  const newItems: RawChangelogItem[] = [];
  for (const item of allItems) {
    if (await isChangelogUrlProcessed(item.url)) {
      stats.skipped++;
      break;
    }
    newItems.push(item);
  }

  if (newItems.length === 0) return stats;

  console.log(`Classifying ${newItems.length} new changelog entries...`);

  await pMap(newItems, async (item) => {
    try {
      const classified = await classifyEntry(item);

      await insertChangelogEntry({
        title: item.title,
        summary: classified.headline,
        headline: classified.headline,
        changes: classified.changes,
        urgency: classified.urgency,
        sourceUrl: item.url,
        affectedTools: classified.affected_tools,
        version: classified.version,
        publishedAt: item.publishedAt,
      });

      stats.inserted++;
      console.log(`  [${classified.urgency}] ${item.title}`);
    } catch (err) {
      stats.errors++;
      console.error(`  Failed to process "${item.title}":`, err);
    }
  }, 3);

  return stats;
}
