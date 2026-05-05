import {
  DOCS_RELEASES_FEED,
  DOCS_WHATS_NEW_BASE,
  DOCS_MAX_RELEASES,
  DOCS_MIN_BULLET_POINTS,
} from "./config";
import { isUrlProcessed } from "@/lib/supabase/queries";
import type { FetchedItem } from "@/types";

interface ReleaseEntry {
  title: string;
  url: string;
  published: string;
  body: string;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function countBulletPoints(text: string): number {
  return (text.match(/^[\s]*[-*]\s/gm) || []).length;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchGitHubReleases(): Promise<FetchedItem[]> {
  const res = await fetch(DOCS_RELEASES_FEED);
  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub releases feed: ${res.status}`);
  }

  const xml = await res.text();
  const entries: ReleaseEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null && entries.length < DOCS_MAX_RELEASES) {
    const entry = match[1];
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const linkMatch = entry.match(/<link[^>]*href="([^"]*)"[^>]*\/>/);
    const publishedMatch = entry.match(/<updated>([\s\S]*?)<\/updated>/);
    const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);

    if (titleMatch && linkMatch) {
      entries.push({
        title: titleMatch[1].trim(),
        url: linkMatch[1].trim(),
        published: publishedMatch ? publishedMatch[1].trim() : "",
        body: contentMatch ? stripHtmlTags(contentMatch[1]) : "",
      });
    }
  }

  const items: FetchedItem[] = [];

  for (const release of entries) {
    if (countBulletPoints(release.body) < DOCS_MIN_BULLET_POINTS) continue;
    if (await isUrlProcessed(release.url)) continue;

    const content = release.body.slice(0, 12000);

    items.push({
      url: release.url,
      platform: "docs",
      content,
      creator: "Claude Code Team",
      title: release.title,
    });
  }

  return items;
}

async function fetchWhatsNew(): Promise<FetchedItem[]> {
  const now = new Date();
  const currentWeek = getISOWeekNumber(now);
  const previousWeek = currentWeek - 1;
  const year = now.getFullYear();

  const weekNumbers = [currentWeek, previousWeek].filter((w) => w > 0);
  const items: FetchedItem[] = [];

  for (const week of weekNumbers) {
    const weekStr = String(week).padStart(2, "0");
    const pageUrl = `${DOCS_WHATS_NEW_BASE}/${year}-w${weekStr}`;

    if (await isUrlProcessed(pageUrl)) continue;

    try {
      const res = await fetch(pageUrl);
      if (!res.ok) continue;

      const html = await res.text();
      const pageText = stripHtmlTags(html).slice(0, 12000);

      if (pageText.length < 100) continue;

      items.push({
        url: pageUrl,
        platform: "docs",
        content: pageText,
        creator: "Claude Code Team",
        title: `What's New — Week ${weekStr}`,
      });
    } catch {
      // Page not available yet, skip gracefully
    }
  }

  return items;
}

export async function fetchDocsItems(): Promise<FetchedItem[]> {
  const [releases, whatsNew] = await Promise.all([
    fetchGitHubReleases(),
    fetchWhatsNew(),
  ]);
  return [...releases, ...whatsNew];
}

export function extractFeatureKeywords(items: FetchedItem[]): string[] {
  const keywords = new Set<string>();

  const featurePatterns = [
    /`([a-z][\w-]+)`/g,
    /\*\*([A-Z][\w\s]{2,30})\*\*/g,
    /(?:new|add|introduce|support)\s+(?:for\s+)?([a-z][\w\s-]{2,30})/gi,
    /(?:##?\s*)(.{3,40})/gm,
  ];

  for (const item of items) {
    const text = item.content;

    for (const pattern of featurePatterns) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(text)) !== null) {
        const keyword = m[1].trim().toLowerCase();
        if (keyword.length >= 3 && keyword.length <= 40 && !keyword.includes("\n")) {
          keywords.add(keyword);
        }
      }
    }
  }

  return [...keywords].slice(0, 20);
}
