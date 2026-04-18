import { Scraper, SearchMode } from "@the-convocation/twitter-scraper";
import {
  MVP_TWITTER_ACCOUNTS,
  TWITTER_TWEETS_PER_ACCOUNT,
  TWITTER_MIN_LIKES,
  TWITTER_SEARCH_QUERIES,
  TWITTER_SEARCH_RESULTS_PER_QUERY,
  TWITTER_SEARCH_MIN_LIKES,
} from "./config";
import { isUrlProcessed } from "@/lib/supabase/queries";
import type { FetchedItem } from "@/types";

let scraperInstance: Scraper | null = null;

// Accepts raw "Cookie:" header string (key=val; key=val) or JSON array from getCookies()
function parseCookiesEnv(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return trimmed.split("; ").map((pair) => pair.trim() + "; Domain=.x.com; Path=/");
}

async function getScraper(): Promise<Scraper> {
  if (scraperInstance && (await scraperInstance.isLoggedIn())) {
    return scraperInstance;
  }

  scraperInstance = new Scraper();

  // Prefer cookie-based auth — no credentials needed at runtime.
  // Accepts either a raw "Cookie:" header string or JSON array from getCookies().
  const cookiesEnv = process.env.TWITTER_COOKIES;
  if (cookiesEnv) {
    const cookies = parseCookiesEnv(cookiesEnv);
    await scraperInstance.setCookies(cookies);
    if (await scraperInstance.isLoggedIn()) {
      return scraperInstance;
    }
  }

  // Fall back to username/password login if cookies are missing or stale
  const username = process.env.TWITTER_USERNAME;
  const password = process.env.TWITTER_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Twitter auth failed: set TWITTER_COOKIES (preferred) or TWITTER_USERNAME + TWITTER_PASSWORD"
    );
  }

  await scraperInstance.login(username, password, process.env.TWITTER_EMAIL);
  return scraperInstance;
}

function tweetUrl(username: string, tweetId: string): string {
  return `https://x.com/${username}/status/${tweetId}`;
}

function isActionableAIContent(text: string): boolean {
  const lower = text.toLowerCase();
  const aiKeywords = [
    "ai", "llm", "gpt", "claude", "cursor", "copilot", "agent",
    "prompt", "workflow", "automation", "coding", "windsurf",
    "langchain", "n8n", "ollama", "model", "fine-tune", "rag",
    "embedding", "vector", "chatgpt", "anthropic", "openai",
    "vibe cod", "aider", "bolt", "v0", "replit",
  ];
  return aiKeywords.some((kw) => lower.includes(kw));
}

async function stitchThread(scraper: Scraper, tweet: {
  id?: string;
  text?: string;
  username?: string;
  isSelfThread?: boolean;
  conversationId?: string;
}): Promise<string> {
  if (!tweet.isSelfThread || !tweet.conversationId || !tweet.id) {
    return tweet.text ?? "";
  }

  try {
    const threadTweets: string[] = [];
    const seen = new Set<string>();

    for await (const t of scraper.searchTweets(
      `from:${tweet.username} conversation_id:${tweet.conversationId}`,
      20,
      SearchMode.Latest
    )) {
      if (t.id && t.text && t.username === tweet.username && !seen.has(t.id)) {
        seen.add(t.id);
        threadTweets.push(t.text);
      }
    }

    if (threadTweets.length > 1) {
      return threadTweets.reverse().join("\n\n");
    }
  } catch {
    // thread fetch failed — use single tweet text
  }

  return tweet.text ?? "";
}

async function fetchFromScraper(): Promise<FetchedItem[]> {
  const scraper = await getScraper();
  const items: FetchedItem[] = [];
  const seenUrls = new Set<string>();

  // ── Fetch from followed accounts ────────────────────────────────────────
  for (const account of MVP_TWITTER_ACCOUNTS) {
    try {
      let count = 0;
      for await (const tweet of scraper.getTweets(account.handle, TWITTER_TWEETS_PER_ACCOUNT)) {
        if (count >= TWITTER_TWEETS_PER_ACCOUNT) break;
        count++;

        if (!tweet.id || !tweet.text || !tweet.username) continue;
        if (tweet.isRetweet) continue;
        if ((tweet.likes ?? 0) < TWITTER_MIN_LIKES) continue;

        const url = tweetUrl(tweet.username, tweet.id);
        if (seenUrls.has(url)) continue;
        if (await isUrlProcessed(url)) continue;

        const content = await stitchThread(scraper, tweet);
        if (!isActionableAIContent(content)) continue;

        seenUrls.add(url);
        items.push({
          url,
          platform: "twitter",
          content,
          creator: `@${tweet.username}`,
          title: content.slice(0, 120),
        });
      }
    } catch (err) {
      console.error(`Twitter: error fetching @${account.handle}: ${err}`);
    }
  }

  // ── Search-based discovery ──────────────────────────────────────────────
  for (const query of TWITTER_SEARCH_QUERIES) {
    try {
      let count = 0;
      for await (const tweet of scraper.searchTweets(query, TWITTER_SEARCH_RESULTS_PER_QUERY, SearchMode.Top)) {
        if (count >= TWITTER_SEARCH_RESULTS_PER_QUERY) break;
        count++;

        if (!tweet.id || !tweet.text || !tweet.username) continue;
        if (tweet.isRetweet) continue;
        if ((tweet.likes ?? 0) < TWITTER_SEARCH_MIN_LIKES) continue;

        const url = tweetUrl(tweet.username, tweet.id);
        if (seenUrls.has(url)) continue;
        if (await isUrlProcessed(url)) continue;

        const content = await stitchThread(scraper, tweet);

        seenUrls.add(url);
        items.push({
          url,
          platform: "twitter",
          content,
          creator: `@${tweet.username}`,
          title: content.slice(0, 120),
        });
      }
    } catch (err) {
      console.error(`Twitter: error searching "${query}": ${err}`);
    }
  }

  return items;
}

// ─── Xpoz.ai Fallback ──────────────────────────────────────────────────────

interface XpozTweet {
  id: string;
  text: string;
  author_username: string;
  author_name: string;
  like_count: number;
  retweet_count: number;
  created_at: string;
}

interface XpozSearchResponse {
  data: XpozTweet[];
}

async function fetchFromXpoz(): Promise<FetchedItem[]> {
  const apiKey = process.env.XPOZ_API_KEY;
  if (!apiKey) {
    console.warn("Twitter: no XPOZ_API_KEY set, skipping Xpoz fallback");
    return [];
  }

  const items: FetchedItem[] = [];
  const seenUrls = new Set<string>();

  const queries = [
    ...TWITTER_SEARCH_QUERIES,
    ...MVP_TWITTER_ACCOUNTS.map((a) => `from:${a.handle}`),
  ];

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.xpoz.ai/v1/search?query=${encodeURIComponent(query)}&max_results=20`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        console.error(`Xpoz: search failed for "${query}": ${res.status}`);
        continue;
      }

      const json: XpozSearchResponse = await res.json();

      for (const tweet of json.data ?? []) {
        if (tweet.like_count < TWITTER_SEARCH_MIN_LIKES) continue;

        const url = tweetUrl(tweet.author_username, tweet.id);
        if (seenUrls.has(url)) continue;
        if (await isUrlProcessed(url)) continue;
        if (!isActionableAIContent(tweet.text)) continue;

        seenUrls.add(url);
        items.push({
          url,
          platform: "twitter",
          content: tweet.text,
          creator: `@${tweet.author_username}`,
          title: tweet.text.slice(0, 120),
        });
      }
    } catch (err) {
      console.error(`Xpoz: error for "${query}": ${err}`);
    }
  }

  return items;
}

/**
 * Fetch new AI workflow tweets from X.
 * Primary: @the-convocation/twitter-scraper with a burner account.
 * Fallback: Xpoz.ai free tier when the scraper fails.
 */
export async function fetchTwitterItems(): Promise<FetchedItem[]> {
  try {
    const items = await fetchFromScraper();
    if (items.length > 0) return items;
    console.warn("Twitter: scraper returned 0 items, trying Xpoz fallback");
  } catch (err) {
    console.error(`Twitter: scraper failed, falling back to Xpoz: ${err}`);
  }

  return fetchFromXpoz();
}
