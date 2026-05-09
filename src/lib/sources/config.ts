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
];

export const SUBREDDITS: SubredditConfig[] = [
  // Tier 1 — MVP
  { name: "ClaudeAI", tier: 1 },
  { name: "ChatGPTPro", tier: 1 },
  { name: "ChatGPTCoding", tier: 1 },
  { name: "cursor", tier: 1 },
  { name: "LocalLLaMA", tier: 1 },
  { name: "AI_Agents", tier: 1 },
  { name: "vibecoding", tier: 1 },
  // Tier 2 — Post-MVP
  { name: "LLMDevs", tier: 2 },
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
