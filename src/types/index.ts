// ─── Database Row Types ─────────────────────────────────────────────────────

export type ContentStatus = "pending_review" | "published" | "rejected";

export type RawContentStatus = "ingested" | "filtered" | "merged" | "discarded";

export type Platform = "youtube" | "reddit" | "twitter" | "news" | "docs";

export type ContentType = "quick_tip" | "deep_dive" | "roundup" | "update";

export type ContentCategory =
  | "claude_code_features"
  | "security_and_guardrails"
  | "github_skills"
  | "prompting_and_rules"
  | "workflow_patterns"
  | "mcp_and_integrations"
  | "debugging_and_testing";

export interface Content {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: ContentStatus;
  content_type: ContentType;
  tags_tool: string[];
  tags_focus: string[];
  tags_workflow: string[];
  tags_domain: string[];
  tags_category: ContentCategory;
  source_urls: SourceUrl[];
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
  needs_review?: boolean;
  review_reason?: string;
  based_on_version?: string;
  last_rewritten_at?: string;
  sub_topic?: string;
}

export type ContentSummary = Omit<Content, "body">;

export interface RawContent {
  id: string;
  source_url: string;
  platform: Platform;
  raw_extract: ExtractionResult;
  status: RawContentStatus;
  batch_date: string;
  created_at: string;
}

export interface SourceLog {
  id: string;
  url: string;
  platform: Platform;
  processed_at: string;
}

// ─── Pipeline Types ─────────────────────────────────────────────────────────

export interface SourceUrl {
  url: string;
  platform: Platform;
  creator: string;
}

export interface ExtractionResult {
  title: string;
  summary: string;
  tips: string[];
  tags_tool: string[];
  tags_focus: string[];
  tags_workflow: string[];
  tags_domain: string[];
  quality_signal: "high" | "medium" | "low";
  source_creator: string;
}

export interface FetchedItem {
  url: string;
  platform: Platform;
  content: string;
  creator: string;
  title?: string;
}

// ─── Dedup + Filter Types ──────────────────────────────────────────────────

export interface DedupItem {
  id: string;
  action: "keep" | "discard";
  reason: string;
  duplicate_of: string | null;
  quality_score: number;
}

export interface DedupResult {
  items: DedupItem[];
}

// ─── Synthesis Types ───────────────────────────────────────────────────────

export interface SynthesizedPiece {
  title: string;
  slug: string;
  summary: string;
  body: string;
  content_type: ContentType;
  tags_tool: string[];
  tags_focus: string[];
  tags_workflow: string[];
  tags_domain: string[];
  tags_category: ContentCategory;
  source_items: string[];
  source_urls: SourceUrl[];
}

export interface SynthesisResult {
  content_pieces: SynthesizedPiece[];
}

// ─── Feed Types ────────────────────────────────────────────────────────────

export interface FeedPost {
  id: string;
  headline: string;
  summary: string;
  source_urls: SourceUrl[];
  topic_content_id: string;
  source_platforms: Platform[];
  pipeline_run_id: string | null;
  published_at: string;
  created_at: string;
  topic_slug?: string;
}

// ─── Source Config Types ────────────────────────────────────────────────────

export interface YouTubeChannel {
  name: string;
  channelId: string;
  handle: string;
}

export interface SubredditConfig {
  name: string;
  tier: 1 | 2;
}

export interface TwitterAccountConfig {
  handle: string;
  name: string;
  tier: 1 | 2;
}
