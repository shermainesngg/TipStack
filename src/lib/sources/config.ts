import type { YouTubeChannel, SubredditConfig, TwitterAccountConfig } from "@/types";

export const YOUTUBE_CHANNELS: YouTubeChannel[] = [
  {
    name: "Cole Medin",
    channelId: "UCMwVTLZIRRUyyVrkjDpn4pA",
    handle: "@ColeMedin",
  },
  {
    name: "Nate Herk",
    channelId: "UC2ojq-nuP8ceeHqiroeKhBA",
    handle: "@NateHerk",
  },
  {
    name: "Chase Hannegan",
    channelId: "UCoy6cTJ7Tg0dqS-DI-_REsA",
    handle: "@Chase-H-AI",
  },
  {
    name: "Simon Scrapes",
    channelId: "UCdCR4-uYOg5ju-IUuDnfnQA",
    handle: "@simonscrapes",
  },
  {
    name: "Mansel Scheffel",
    channelId: "UCT5C-u2lpdcQrfT-sZ9GZug",
    handle: "@mansel.scheffel",
  },
  {
    name: "Matt Pocock",
    channelId: "UCswG6FSbgZjbWtdf_hMLaow",
    handle: "@mattpocockuk",
  },
  {
    name: "IndyDevDan",
    channelId: "UC_x36zCEGilGpB1m-V4gmjg",
    handle: "@indydevdan",
  },
  {
    name: "AICodeKing",
    channelId: "UC0m81bQuthaQZmFbXEY9QSw",
    handle: "@AICodeKing",
  },
  {
    name: "Sam Witteveen",
    channelId: "UC55ODQSvARtgSyc8ThfiepQ",
    handle: "@samwitteveenai",
  },
  {
    name: "AI Jason",
    channelId: "UCrXSVX9a1mj8l0CMLwKgMVw",
    handle: "@AIJasonZ",
  },
  {
    name: "Prompt Engineering",
    channelId: "UCDq7SjbgRKty5TgGafW8Clg",
    handle: "@engineerprompt",
  },
  {
    name: "Ras Mic",
    channelId: "UCBX__dPYqDFqAN4QcWbnUbw",
    handle: "@rasmic",
  },
  {
    name: "Conner Ardman",
    channelId: "UCWu_xJfwUuP_JV6RFq2EcXw",
    handle: "@ConnerArdman",
  },
  {
    name: "Riley Brown",
    channelId: "UCMcoud_ZW7cfxeIugBflSBw",
    handle: "@rileybrownai",
  },
  {
    name: "David Ondrej",
    channelId: "UCPGrgwfbkjTIgPoOh2q1BAg",
    handle: "@DavidOndrej",
  },
  {
    name: "Zen van Riel",
    channelId: "UC7TUInmEJ4NmYb-krFz-SuA",
    handle: "@ZenvanRiel",
  },
];

export const SUBREDDITS: SubredditConfig[] = [
  // Tier 1 — MVP
  { name: "ClaudeAI", tier: 1 },
  { name: "ClaudeCode", tier: 1 },
  { name: "ChatGPTPro", tier: 1 },
  { name: "ChatGPTCoding", tier: 1 },
  { name: "cursor", tier: 1 },
  { name: "LocalLLaMA", tier: 1 },
  { name: "AI_Agents", tier: 1 },
  { name: "AgentsOfAI", tier: 1 },
  { name: "vibecoding", tier: 1 },
  { name: "mcp", tier: 1 },
  { name: "Anthropic", tier: 1 },
  { name: "RooCode", tier: 1 },
  { name: "OpenAIDev", tier: 1 },
  { name: "kilocode", tier: 1 },
  { name: "GeminiCLI", tier: 1 },
  // Tier 2 — Post-MVP
  { name: "LLMDevs", tier: 2 },
  { name: "Rag", tier: 2 },
  { name: "lovable", tier: 2 },
  { name: "CrewAI", tier: 2 },
  { name: "LangChain", tier: 2 },
  { name: "PromptEngineering", tier: 2 },
  { name: "OpenAI", tier: 2 },
  { name: "aipromptprogramming", tier: 2 },
  { name: "n8n", tier: 2 },
  { name: "ollama", tier: 2 },
  { name: "githubcopilot", tier: 2 },
  { name: "Codeium", tier: 2 },
  { name: "perplexity_ai", tier: 2 },
  { name: "MLOps", tier: 2 },
];

/** Only tier-1 subreddits for MVP */
export const MVP_SUBREDDITS = SUBREDDITS.filter((s) => s.tier === 1);

/** Minimum score for Reddit posts to be worth processing */
export const REDDIT_MIN_SCORE = 10;

/** Number of recent posts to fetch per subreddit */
export const REDDIT_POSTS_PER_SUB = 10;

// ─── Twitter / X ──────────────────────────────────────────────────────────────

export const TWITTER_ACCOUNTS: TwitterAccountConfig[] = [
  // Tier 1 — official tool accounts (release announcements, feature tips)
  { handle: "AnthropicAI", name: "Anthropic", tier: 1 },
  { handle: "OpenAI", name: "OpenAI", tier: 1 },
  { handle: "cursor_ai", name: "Cursor", tier: 1 },
  { handle: "LangChainAI", name: "LangChain", tier: 1 },
  { handle: "naboringn8n", name: "n8n", tier: 1 },
  // Tier 1 — practitioners who share actionable workflows
  { handle: "mckaywrigley", name: "McKay Wrigley", tier: 1 },
  { handle: "swyx", name: "swyx", tier: 1 },
  { handle: "simonw", name: "Simon Willison", tier: 1 },
  // Tier 1 — practitioners who share actionable AI-coding workflows
  { handle: "cole_medin", name: "Cole Medin", tier: 1 },
  { handle: "RayFernando1337", name: "Ray Fernando", tier: 1 },
  { handle: "paulgauthier", name: "Paul Gauthier (Aider)", tier: 1 },
  { handle: "skirano", name: "Pietro Schirano", tier: 1 },
  // Tier 1 — official AI coding tools
  { handle: "cline", name: "Cline", tier: 1 },
  { handle: "windsurf_ai", name: "Windsurf", tier: 1 },
  { handle: "GitHubCopilot", name: "GitHub Copilot", tier: 1 },
  { handle: "v0", name: "v0 (Vercel)", tier: 1 },
  { handle: "warpdotdev", name: "Warp", tier: 1 },
  // Tier 1 — AI leaders & hands-on builders
  { handle: "karpathy", name: "Andrej Karpathy", tier: 1 },
  { handle: "addyosmani", name: "Addy Osmani", tier: 1 },
  { handle: "alexalbert__", name: "Alex Albert", tier: 1 },
  { handle: "rauchg", name: "Guillermo Rauch", tier: 1 },
  { handle: "steipete", name: "Peter Steinberger", tier: 1 },
  { handle: "levelsio", name: "Pieter Levels", tier: 1 },
  { handle: "t3dotgg", name: "Theo Browne", tier: 1 },
  { handle: "hwchase17", name: "Harrison Chase", tier: 1 },
  // Tier 2 — broader AI ecosystem, researchers, company accounts
  { handle: "GoogleDeepMind", name: "Google DeepMind", tier: 2 },
  { handle: "huggingface", name: "Hugging Face", tier: 2 },
  { handle: "Replit", name: "Replit", tier: 2 },
  { handle: "AndrewYNg", name: "Andrew Ng", tier: 2 },
  { handle: "DrJimFan", name: "Jim Fan", tier: 2 },
  { handle: "fchollet", name: "Francois Chollet", tier: 2 },
  { handle: "OfficialLoganK", name: "Logan Kilpatrick", tier: 2 },
  { handle: "DarioAmodei", name: "Dario Amodei", tier: 2 },
  { handle: "vercel", name: "Vercel", tier: 2 },
  { handle: "MistralAI", name: "Mistral AI", tier: 2 },
  { handle: "GroqInc", name: "Groq", tier: 2 },
  { handle: "crewAIInc", name: "CrewAI", tier: 2 },
  { handle: "omarsar0", name: "Elvis Saravia", tier: 2 },
  { handle: "zeddotdev", name: "Zed", tier: 2 },
  { handle: "boltdotnew", name: "bolt.new", tier: 2 },
  { handle: "cognition", name: "Cognition (Devin)", tier: 2 },
  { handle: "lovable_dev", name: "Lovable", tier: 2 },
  { handle: "perplexity_ai", name: "Perplexity", tier: 2 },
];

export const MVP_TWITTER_ACCOUNTS = TWITTER_ACCOUNTS.filter((a) => a.tier === 1);

/** Max tweets to fetch per account */
export const TWITTER_TWEETS_PER_ACCOUNT = 20;

/** Minimum likes for a tweet to be worth processing */
export const TWITTER_MIN_LIKES = 10;

/** Search queries for discovering tweets beyond followed accounts */
export const TWITTER_SEARCH_QUERIES = [
  "AI coding workflow tip",
  "Claude Code tip",
  "cursor AI tip",
  "AI agent workflow",
  "vibe coding",
  "MCP server",
  "context engineering",
  "Claude Code subagents",
  "spec-driven development",
  "agentic coding",
];

/** Max search results per query */
export const TWITTER_SEARCH_RESULTS_PER_QUERY = 20;

/** Minimum likes for search-discovered tweets */
export const TWITTER_SEARCH_MIN_LIKES = 25;

// ─── GitHub Skills Discovery ─────────────────────────────────────────────────

export const GITHUB_SKILL_SEARCH_TOPICS = [
  "claude-code-skill",
  "claude-skill",
  "claude-code",
  "design-md",
];

export const GITHUB_SKILL_SEARCH_QUERIES = [
  "claude code skill",
  "claude-code skill in:name,description",
  "CLAUDE.md skill template",
];

export const GITHUB_AWESOME_LISTS = [
  "anthropics/awesome-claude-code",
];

export const GITHUB_MIN_STARS = 5;

export const GITHUB_MAX_RESULTS_PER_QUERY = 30;

// ─── Documentation / Official Sources ────────────────────────────────────────

export const DOCS_GITHUB_REPO = "anthropics/claude-code";
export const DOCS_RELEASES_FEED = "https://github.com/anthropics/claude-code/releases.atom";
export const DOCS_WHATS_NEW_BASE = "https://code.claude.com/docs/en/whats-new";
export const DOCS_MAX_RELEASES = 5;
export const DOCS_MIN_BULLET_POINTS = 3;

// ─── Changelog Radar ────────────────────────────────────────────────────────

export const CHANGELOG_RELEASES_FEED = "https://github.com/anthropics/claude-code/releases.atom";
export const CHANGELOG_WHATS_NEW_BASE = "https://code.claude.com/docs/en/whats-new";
export const CHANGELOG_MAX_RELEASES = 20;
export const CHANGELOG_WHATS_NEW_WEEKS = 4;
export const CHANGELOG_AFFECTED_TOOLS = ["claude_code", "claude_api", "claude_desktop", "anthropic_sdk"] as const;

// ─── Blog Feeds ──────────────────────────────────────────────────────────────

export interface BlogFeedConfig {
  /** Display name of the publication */
  name: string;
  /** Author credited as the item creator */
  author: string;
  /** Public Atom/RSS feed URL (no auth) */
  url: string;
}

/**
 * High-signal AI blog feeds parsed as Atom/RSS. Each must be a free, public,
 * full-content feed (same bar as the Hacker News source). Add more here to expand.
 */
export const BLOG_FEEDS: BlogFeedConfig[] = [
  {
    name: "Simon Willison's Weblog",
    author: "Simon Willison",
    url: "https://simonwillison.net/atom/everything/",
  },
  {
    name: "Latent.Space",
    author: "swyx & Latent Space",
    url: "https://www.latent.space/feed",
  },
  {
    name: "The Pragmatic Engineer",
    author: "Gergely Orosz",
    url: "https://newsletter.pragmaticengineer.com/feed",
  },
  {
    name: "Elevate",
    author: "Addy Osmani",
    url: "https://addyo.substack.com/feed",
  },
  {
    name: "OpenAI News",
    author: "OpenAI",
    url: "https://openai.com/blog/rss.xml",
  },
  {
    name: "Hugging Face Blog",
    author: "Hugging Face",
    url: "https://huggingface.co/blog/feed.xml",
  },
  {
    name: "Interconnects",
    author: "Nathan Lambert",
    url: "https://www.interconnects.ai/feed",
  },
  {
    name: "Vercel News",
    author: "Vercel",
    url: "https://vercel.com/atom",
  },
  {
    name: "One Useful Thing",
    author: "Ethan Mollick",
    url: "https://www.oneusefulthing.org/feed",
  },
  {
    name: "Google AI Blog",
    author: "Google",
    url: "https://blog.google/technology/ai/rss/",
  },
  {
    name: "Hamel's Blog",
    author: "Hamel Husain",
    url: "https://hamel.dev/index.xml",
  },
  {
    name: "Import AI",
    author: "Jack Clark",
    url: "https://importai.substack.com/feed",
  },
  {
    name: "philschmid.de",
    author: "Philipp Schmid",
    url: "https://www.philschmid.de/rss",
  },
  {
    name: "Ahead of AI",
    author: "Sebastian Raschka",
    url: "https://magazine.sebastianraschka.com/feed",
  },
  {
    name: "Eugene Yan",
    author: "Eugene Yan",
    url: "https://eugeneyan.com/rss/",
  },
  {
    name: "Lil'Log",
    author: "Lilian Weng",
    url: "https://lilianweng.github.io/index.xml",
  },
];

/** Max entries to consider per feed (newest first) */
export const BLOG_MAX_ENTRIES = 20;

/** Minimum cleaned-text length for an entry to be worth ingesting */
export const BLOG_MIN_CONTENT_CHARS = 200;

/** Cap on stored content length per item */
export const BLOG_MAX_CONTENT_CHARS = 12000;
