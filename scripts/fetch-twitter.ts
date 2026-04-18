import fs from "fs";
import path from "path";
import { Scraper, SearchMode } from "@the-convocation/twitter-scraper";
import { isUrlProcessed, isActionableAIContent, type FetchedItem } from "./lib/shared";

const TWITTER_ACCOUNTS = [
  { handle: "AnthropicAI", name: "Anthropic" },
  { handle: "OpenAI", name: "OpenAI" },
  { handle: "cursor_ai", name: "Cursor" },
  { handle: "LangChainAI", name: "LangChain" },
  { handle: "naboringn8n", name: "n8n" },
  { handle: "mcaborkadam", name: "McKay Wrigley" },
  { handle: "swyx", name: "swyx" },
  { handle: "simonw", name: "Simon Willison" },
];

const TWITTER_TWEETS_PER_ACCOUNT = 20;
const TWITTER_MIN_LIKES = 10;
const TWITTER_SEARCH_QUERIES = [
  "AI coding workflow tip",
  "Claude Code tip",
  "cursor AI tip",
  "AI agent workflow",
  "vibe coding",
];
const TWITTER_SEARCH_RESULTS_PER_QUERY = 20;
const TWITTER_SEARCH_MIN_LIKES = 25;

const OUTPUT_PATH = path.resolve(__dirname, "data", "fetched-twitter.json");

// ─── Auth ───────────────────────────────────────────────────────────────────

function parseCookiesEnv(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return trimmed.split("; ").map((p) => p.trim() + "; Domain=.x.com; Path=/");
}

async function getAuthenticatedScraper(): Promise<Scraper> {
  const scraper = new Scraper();

  const cookiesEnv = process.env.TWITTER_COOKIES;
  if (cookiesEnv) {
    try {
      await scraper.setCookies(parseCookiesEnv(cookiesEnv));
      if (await scraper.isLoggedIn()) {
        console.log("  Restored session from cookies");
        return scraper;
      }
    } catch {
      console.log("  Stored cookies invalid, falling back to login");
    }
  }

  const username = process.env.TWITTER_USERNAME;
  const password = process.env.TWITTER_PASSWORD;
  if (!username || !password) {
    throw new Error("Cookies expired and no TWITTER_USERNAME/TWITTER_PASSWORD set");
  }

  await scraper.login(username, password, process.env.TWITTER_EMAIL);
  console.log("  Logged in successfully");
  return scraper;
}

// ─── Xpoz.ai Fallback ──────────────────────────────────────────────────────

async function fetchViaXpoz(): Promise<FetchedItem[]> {
  const xpozKey = process.env.XPOZ_API_KEY;
  if (!xpozKey) return [];

  console.log("\n  Trying Xpoz.ai fallback...\n");
  const items: FetchedItem[] = [];

  const queries = [
    ...TWITTER_SEARCH_QUERIES,
    ...TWITTER_ACCOUNTS.map((a) => `from:${a.handle}`),
  ];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.xpoz.ai/v1/search?query=${encodeURIComponent(query)}&max_results=20`,
        { headers: { Authorization: `Bearer ${xpozKey}` } }
      );
      if (!res.ok) {
        console.error(`    Xpoz failed for "${query}": ${res.status}`);
        continue;
      }
      const json = await res.json();
      for (const tweet of json.data ?? []) {
        if (tweet.like_count < TWITTER_SEARCH_MIN_LIKES) continue;
        const tweetUrl = `https://x.com/${tweet.author_username}/status/${tweet.id}`;
        if (await isUrlProcessed(tweetUrl)) continue;
        if (!isActionableAIContent(tweet.text)) continue;

        items.push({
          url: tweetUrl,
          platform: "twitter",
          content: tweet.text,
          creator: `@${tweet.author_username}`,
          title: tweet.text.slice(0, 120),
        });
        console.log(`    Xpoz OK (@${tweet.author_username}): ${tweet.text.slice(0, 60)}...`);
      }
    } catch (err) {
      console.error(`    Xpoz error for "${query}": ${err}`);
    }
  }

  return items;
}

// ─── Main ───────────────────────────────────────────────────────────────────

export async function fetchTwitter(): Promise<FetchedItem[]> {
  const hasCookies = !!process.env.TWITTER_COOKIES;
  const hasCreds = !!(process.env.TWITTER_USERNAME && process.env.TWITTER_PASSWORD);

  if (!hasCookies && !hasCreds) {
    console.log("=== Skipping Twitter (set TWITTER_COOKIES or TWITTER_USERNAME+TWITTER_PASSWORD) ===\n");
    return [];
  }

  console.log("=== Fetching Twitter/X content ===\n");

  const items: FetchedItem[] = [];

  try {
    const scraper = await getAuthenticatedScraper();
    const seenUrls = new Set<string>();

    // ── Account feeds ──────────────────────────────────────────────────
    for (const account of TWITTER_ACCOUNTS) {
      console.log(`\n  Account: @${account.handle}`);
      try {
        let count = 0;
        let kept = 0;
        for await (const tweet of scraper.getTweets(account.handle, TWITTER_TWEETS_PER_ACCOUNT)) {
          if (count >= TWITTER_TWEETS_PER_ACCOUNT) break;
          count++;

          if (!tweet.id || !tweet.text || !tweet.username) continue;
          if (tweet.isRetweet) continue;
          if ((tweet.likes ?? 0) < TWITTER_MIN_LIKES) continue;

          const tweetUrl = `https://x.com/${tweet.username}/status/${tweet.id}`;
          if (seenUrls.has(tweetUrl)) continue;
          if (await isUrlProcessed(tweetUrl)) {
            console.log(`    SKIP (already processed): ${tweet.text.slice(0, 60)}...`);
            continue;
          }
          if (!isActionableAIContent(tweet.text)) {
            console.log(`    SKIP (not AI content): ${tweet.text.slice(0, 60)}...`);
            continue;
          }

          seenUrls.add(tweetUrl);
          items.push({
            url: tweetUrl,
            platform: "twitter",
            content: tweet.text,
            creator: `@${tweet.username}`,
            title: tweet.text.slice(0, 120),
          });
          console.log(`    OK (${tweet.likes} likes): ${tweet.text.slice(0, 60)}...`);
          kept++;
        }
        console.log(`    ${kept} tweets kept from ${count} checked`);
      } catch (err) {
        console.error(`    ERROR: ${err}`);
      }
    }

    // ── Search discovery ──────────────────────────────────────────────
    console.log("\n  --- Twitter search discovery ---\n");

    for (const query of TWITTER_SEARCH_QUERIES) {
      console.log(`  Search: "${query}"`);
      try {
        let count = 0;
        let kept = 0;
        for await (const tweet of scraper.searchTweets(query, TWITTER_SEARCH_RESULTS_PER_QUERY, SearchMode.Top)) {
          if (count >= TWITTER_SEARCH_RESULTS_PER_QUERY) break;
          count++;

          if (!tweet.id || !tweet.text || !tweet.username) continue;
          if (tweet.isRetweet) continue;
          if ((tweet.likes ?? 0) < TWITTER_SEARCH_MIN_LIKES) continue;

          const tweetUrl = `https://x.com/${tweet.username}/status/${tweet.id}`;
          if (seenUrls.has(tweetUrl)) continue;
          if (await isUrlProcessed(tweetUrl)) continue;

          seenUrls.add(tweetUrl);
          items.push({
            url: tweetUrl,
            platform: "twitter",
            content: tweet.text,
            creator: `@${tweet.username}`,
            title: tweet.text.slice(0, 120),
          });
          console.log(`    OK (${tweet.likes} likes, @${tweet.username}): ${tweet.text.slice(0, 60)}...`);
          kept++;
        }
        console.log(`    ${kept} tweets kept from ${count} checked`);
      } catch (err) {
        console.error(`    ERROR: ${err}`);
      }
    }

    // Export cookies for next run
    try {
      const cookies = await scraper.getCookies();
      console.log(`\n  TIP: Save cookies for next run by setting TWITTER_COOKIES='${JSON.stringify(cookies)}'`);
    } catch {
      // non-critical
    }
  } catch (err) {
    console.error(`  Twitter scraper failed: ${err}`);
    const fallbackItems = await fetchViaXpoz();
    items.push(...fallbackItems);
  }

  console.log();
  return items;
}

// ─── Standalone entry point ─────────────────────────────────────────────────

if (require.main === module) {
  fetchTwitter()
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
