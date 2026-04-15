import type { YouTubeChannel, SubredditConfig } from "@/types";

export const YOUTUBE_CHANNELS: YouTubeChannel[] = [
  {
    name: "Cole Medin",
    channelId: "UCMHXfTnMpSGrrOBhkDQp1mA",
    handle: "@ColeMedin",
  },
  {
    name: "Nate Herk",
    channelId: "UCQMRkSZMNsO0K3P28x1N5Xg",
    handle: "@NateHerk",
  },
  {
    name: "Chase Hannegan",
    channelId: "UCh1EQFPJ2XeLA2YSiBUfNBA",
    handle: "@Chase-H-AI",
  },
  {
    name: "Simon Scrapes",
    channelId: "UCFF7K7kxCPITgQwk4MnPGYA",
    handle: "@simonscrapes",
  },
];

export const SUBREDDITS: SubredditConfig[] = [
  // Tier 1 — MVP
  { name: "ClaudeAI", tier: 1 },
  { name: "ChatGPTPro", tier: 1 },
  { name: "ChatGPTCoding", tier: 1 },
  { name: "cursor", tier: 1 },
  { name: "LocalLLaMA", tier: 1 },
  // Tier 2 — Post-MVP
  { name: "PromptEngineering", tier: 2 },
  { name: "OpenAI", tier: 2 },
  { name: "aipromptprogramming", tier: 2 },
  { name: "n8n", tier: 2 },
  { name: "AIAssisted", tier: 2 },
];

/** Only tier-1 subreddits for MVP */
export const MVP_SUBREDDITS = SUBREDDITS.filter((s) => s.tier === 1);

/** Minimum score for Reddit posts to be worth processing */
export const REDDIT_MIN_SCORE = 10;

/** Number of recent posts to fetch per subreddit */
export const REDDIT_POSTS_PER_SUB = 10;

/** Number of recent videos to fetch per YouTube channel */
export const YOUTUBE_VIDEOS_PER_CHANNEL = 5;
