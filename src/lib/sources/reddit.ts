import {
  MVP_SUBREDDITS,
  REDDIT_POSTS_PER_SUB,
  REDDIT_MIN_SCORE,
} from "./config";
import { isUrlProcessed } from "@/lib/supabase/queries";
import type { FetchedItem } from "@/types";

interface RedditPost {
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  score: number;
  author: string;
  num_comments: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get a Reddit OAuth access token using client credentials.
 * Caches the token until it expires.
 */
async function getRedditToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "TipStack/1.0",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit OAuth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000, // refresh 1min early
  };

  return cachedToken.token;
}

/**
 * Fetch top recent posts from a single subreddit.
 * Uses the "hot" listing sorted by score.
 */
async function fetchSubredditPosts(
  subreddit: string,
  limit: number
): Promise<RedditPost[]> {
  const token = await getRedditToken();

  const res = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/hot?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "TipStack/1.0",
      },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch r/${subreddit}: ${res.status} ${await res.text()}`
    );
  }

  const json = await res.json();
  const posts: RedditPost[] = json.data.children
    .map((child: { data: RedditPost }) => child.data)
    .filter(
      (post: RedditPost) =>
        post.selftext && // must have text content
        post.selftext !== "[removed]" &&
        post.score >= REDDIT_MIN_SCORE
    );

  return posts;
}

/**
 * Fetch all new (unprocessed) Reddit posts across configured subreddits.
 * Returns items ready for Claude extraction.
 */
export async function fetchRedditItems(): Promise<FetchedItem[]> {
  const items: FetchedItem[] = [];

  for (const sub of MVP_SUBREDDITS) {
    const posts = await fetchSubredditPosts(sub.name, REDDIT_POSTS_PER_SUB);

    for (const post of posts) {
      const fullUrl = `https://www.reddit.com${post.permalink}`;

      // Skip already-processed URLs
      if (await isUrlProcessed(fullUrl)) continue;

      items.push({
        url: fullUrl,
        platform: "reddit",
        content: `Title: ${post.title}\n\n${post.selftext}`,
        creator: `r/${sub.name} u/${post.author}`,
        title: post.title,
      });
    }
  }

  return items;
}
