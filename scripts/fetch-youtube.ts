import fs from "fs";
import path from "path";
import { YoutubeTranscript } from "youtube-transcript";
import { isUrlProcessed, KNOWN_TOOLS, type FetchedItem } from "./lib/shared";
import { YOUTUBE_CHANNELS } from "../src/lib/sources/config";

const CHANNELS = YOUTUBE_CHANNELS;

const VIDEOS_PER_CHANNEL = 5;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const EVERGREEN_SEARCH_QUERIES = [
  "AI coding workflow",
  "AI automation workflow",
  "AI agents tutorial",
];

const SEARCH_RESULTS_PER_QUERY = 5;
const SEARCH_MIN_VIEWS = 1000;

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched-youtube.json");

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getRecentVideos(channelId: string, limit: number) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`RSS fetch failed for ${channelId}: ${res.status}`);

  const xml = await res.text();
  const entries: { videoId: string; title: string; url: string }[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null && entries.length < limit) {
    const entry = match[1];
    const videoIdMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1].trim();
      entries.push({
        videoId,
        title: titleMatch[1].trim(),
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  }

  return entries;
}

async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    return segments.map((s) => s.text).join(" ");
  } catch {
    return null;
  }
}

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
}

async function searchYouTube(
  query: string,
  maxResults: number
): Promise<YouTubeSearchResult[]> {
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - 7);

  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    order: "relevance",
    publishedAfter: publishedAfter.toISOString(),
    relevanceLanguage: "en",
    key: YOUTUBE_API_KEY!,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube search failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  return json.items.map(
    (item: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
    })
  );
}

async function getVideoViewCount(videoId: string): Promise<number> {
  const params = new URLSearchParams({
    part: "statistics",
    id: videoId,
    key: YOUTUBE_API_KEY!,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`
  );

  if (!res.ok) return 0;

  const json = await res.json();
  if (!json.items || json.items.length === 0) return 0;
  return parseInt(json.items[0].statistics.viewCount, 10) || 0;
}

export function extractSearchQueriesFromReddit(
  redditTitles: string[]
): string[] {
  const titleText = redditTitles.join(" ").toLowerCase();
  const matchedQueries: Map<string, number> = new Map();

  for (const [keyword, query] of Object.entries(KNOWN_TOOLS)) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = titleText.match(regex);
    if (matches && matches.length > 0) {
      matchedQueries.set(query, (matchedQueries.get(query) ?? 0) + matches.length);
    }
  }

  return Array.from(matchedQueries.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([query]) => query);
}

// ─── Main ───────────────────────────────────────────────────────────────────

export async function fetchYouTube(redditTitles: string[] = [], docKeywords: string[] = []): Promise<FetchedItem[]> {
  const items: FetchedItem[] = [];

  // ── Channel RSS feeds ─────────────────────────────────────────────────
  console.log("=== Fetching YouTube content ===\n");

  for (const channel of CHANNELS) {
    console.log(`Channel: ${channel.name}`);
    try {
      const videos = await getRecentVideos(channel.channelId, VIDEOS_PER_CHANNEL);
      console.log(`  Found ${videos.length} recent videos`);

      for (const video of videos) {
        if (await isUrlProcessed(video.url)) {
          console.log(`  SKIP (already processed): ${video.title}`);
          continue;
        }

        console.log(`  Fetching transcript: ${video.title}`);
        const transcript = await getTranscript(video.videoId);

        if (!transcript) {
          console.log(`  SKIP (no transcript available)`);
          continue;
        }

        items.push({
          url: video.url,
          platform: "youtube",
          content: transcript.slice(0, 12000),
          creator: channel.name,
          title: video.title,
        });
        console.log(`  OK (${transcript.length} chars)`);
      }
    } catch (err) {
      console.error(`  ERROR fetching channel: ${err}`);
    }

    console.log();
  }

  // ── Search discovery ──────────────────────────────────────────────────
  if (YOUTUBE_API_KEY) {
    const dynamicQueries = extractSearchQueriesFromReddit(redditTitles);
    const docQueries = docKeywords.slice(0, 3);
    const allQueries = [...new Set([...dynamicQueries, ...docQueries, ...EVERGREEN_SEARCH_QUERIES])];

    console.log("=== YouTube search discovery ===\n");
    console.log(`  Dynamic queries from Reddit: ${dynamicQueries.length > 0 ? dynamicQueries.join(", ") : "(none)"}`);
    console.log(`  Doc keyword queries: ${docQueries.length > 0 ? docQueries.join(", ") : "(none)"}`);
    console.log(`  Evergreen queries: ${EVERGREEN_SEARCH_QUERIES.join(", ")}`);
    console.log(`  Total: ${allQueries.length} unique queries\n`);

    const seenVideoIds = new Set(
      items.map((i) => {
        const match = i.url.match(/v=([^&]+)/);
        return match ? match[1] : "";
      })
    );

    for (const query of allQueries) {
      console.log(`Search: "${query}"`);
      try {
        const results = await searchYouTube(query, SEARCH_RESULTS_PER_QUERY);
        console.log(`  Found ${results.length} results`);

        for (const result of results) {
          if (seenVideoIds.has(result.videoId)) {
            console.log(`  SKIP (already from RSS): ${result.title}`);
            continue;
          }

          const videoUrl = `https://www.youtube.com/watch?v=${result.videoId}`;

          if (await isUrlProcessed(videoUrl)) {
            console.log(`  SKIP (already processed): ${result.title}`);
            continue;
          }

          const views = await getVideoViewCount(result.videoId);
          if (views < SEARCH_MIN_VIEWS) {
            console.log(`  SKIP (${views} views < ${SEARCH_MIN_VIEWS}): ${result.title}`);
            continue;
          }

          console.log(`  Fetching transcript (${views} views): ${result.title}`);
          const transcript = await getTranscript(result.videoId);

          if (!transcript) {
            console.log(`  SKIP (no transcript available)`);
            continue;
          }

          items.push({
            url: videoUrl,
            platform: "youtube",
            content: transcript.slice(0, 12000),
            creator: result.channelTitle,
            title: result.title,
          });
          seenVideoIds.add(result.videoId);
          console.log(`  OK (${transcript.length} chars)`);
        }
      } catch (err) {
        console.error(`  ERROR searching: ${err}`);
      }

      console.log();
    }
  } else {
    console.log("=== Skipping YouTube search (no YOUTUBE_API_KEY) ===\n");
  }

  return items;
}

// ─── Standalone entry point ─────────────────────────────────────────────────

if (require.main === module) {
  fetchYouTube()
    .then((items) => {
      fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));
      console.log(`Done. ${items.length} items saved to ${OUTPUT_PATH}`);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
