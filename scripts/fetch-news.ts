import fs from "fs";
import path from "path";
import { isUrlProcessed, sleep, type FetchedItem } from "./lib/shared";

const FOCUS_QUERIES: { focus: string; queries: string[] }[] = [
  {
    focus: "security",
    queries: [
      "AI security",
      "prompt injection",
      "LLM vulnerability",
      "AI jailbreak",
    ],
  },
  {
    focus: "governance",
    queries: [
      "AI regulation",
      "AI governance",
    ],
  },
  {
    focus: "privacy",
    queries: [
      "AI privacy",
      "LLM data leak",
    ],
  },
  {
    focus: "cost_optimization",
    queries: [
      "AI cost",
      "LLM inference cost",
    ],
  },
  {
    focus: "model_updates",
    queries: [
      "Claude model",
      "GPT model",
      "Gemini model",
    ],
  },
  {
    focus: "evaluation",
    queries: [
      "AI benchmark",
      "LLM evaluation",
    ],
  },
  {
    focus: "enterprise",
    queries: [
      "AI agent",
      "AI deployment",
    ],
  },
  {
    focus: "open_source",
    queries: [
      "open source LLM",
      "open source AI",
    ],
  },
];

const HN_MIN_POINTS = 15;
const HN_RESULTS_PER_QUERY = 10;
const DAYS_LOOKBACK = 30;
const MAX_COMMENTS_TO_FETCH = 5;

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched-news.json");

// ─── Hacker News Algolia API ───────────────────────────────────────────────

interface HNHit {
  objectID: string;
  title: string;
  url: string | null;
  story_text: string | null;
  author: string;
  points: number;
  num_comments: number;
  created_at_i: number;
}

interface HNItem {
  id: number;
  text: string | null;
  children?: HNItem[];
}

async function searchHN(query: string, minTimestamp: number): Promise<HNHit[]> {
  // HN's Algolia index returns 400 for a `points` numericFilter and for raw
  // `>`/`,` characters in the query string. So we filter by timestamp only
  // (URL-encoded via URLSearchParams) and apply the points threshold client-side.
  // We over-fetch to leave enough qualifying stories after the points filter.
  const params = new URLSearchParams({
    query,
    tags: "story",
    numericFilters: `created_at_i>${minTimestamp}`,
    hitsPerPage: String(HN_RESULTS_PER_QUERY * 3),
  });
  const url = `https://hn.algolia.com/api/v1/search?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN search failed: ${res.status}`);
  const json = await res.json();
  return (json.hits as HNHit[])
    .filter((h) => h.points >= HN_MIN_POINTS)
    .slice(0, HN_RESULTS_PER_QUERY);
}

async function fetchTopComments(storyId: string): Promise<string[]> {
  const url = `https://hn.algolia.com/api/v1/items/${storyId}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const item: HNItem = await res.json();

  const comments: string[] = [];
  for (const child of item.children ?? []) {
    if (child.text && comments.length < MAX_COMMENTS_TO_FETCH) {
      const clean = child.text
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'");
      if (clean.length > 50) {
        comments.push(clean);
      }
    }
  }
  return comments;
}

// ─── Main ──────────────────────────────────────────────────────────────────

export async function fetchNews(): Promise<FetchedItem[]> {
  console.log("=== Fetching news from Hacker News ===\n");

  const items: FetchedItem[] = [];
  const seenUrls = new Set<string>();
  const cutoff = Math.floor(Date.now() / 1000) - DAYS_LOOKBACK * 86400;

  for (const { focus, queries } of FOCUS_QUERIES) {
    console.log(`Focus: ${focus}`);

    for (const query of queries) {
      console.log(`  Search: "${query}"`);
      try {
        const hits = await searchHN(query, cutoff);
        let kept = 0;

        for (const hit of hits) {
          const hnUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;

          if (seenUrls.has(hnUrl)) continue;
          if (await isUrlProcessed(hnUrl)) {
            console.log(`    SKIP (already processed): ${hit.title}`);
            continue;
          }

          const comments = await fetchTopComments(hit.objectID);

          let content = `# ${hit.title}\n\n`;
          if (hit.story_text) {
            content += hit.story_text
              .replace(/<[^>]+>/g, "")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">") + "\n\n";
          }
          if (hit.url) {
            content += `Source: ${hit.url}\n\n`;
          }
          if (comments.length > 0) {
            content += "## Community Discussion\n\n";
            for (const c of comments) {
              content += `- ${c}\n\n`;
            }
          }

          seenUrls.add(hnUrl);
          items.push({
            url: hnUrl,
            platform: "news" as FetchedItem["platform"],
            content: content.slice(0, 15000),
            creator: `u/${hit.author}`,
            title: hit.title,
          });
          console.log(`    OK (${hit.points} pts, ${hit.num_comments} comments): ${hit.title}`);
          kept++;
        }

        if (kept === 0) console.log(`    No qualifying stories`);
      } catch (err) {
        console.error(`    ERROR: ${err}`);
      }

      await sleep(500);
    }
    console.log();
  }

  console.log(`Total: ${items.length} news items fetched`);
  return items;
}

// ─── Standalone entry point ────────────────────────────────────────────────

if (require.main === module) {
  fetchNews()
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
