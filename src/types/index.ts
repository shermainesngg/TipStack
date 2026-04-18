// ─── Database Row Types ─────────────────────────────────────────────────────

export type ContentStatus = "pending_review" | "published" | "rejected";

export type RawContentStatus = "ingested" | "filtered" | "merged" | "discarded";

export type Platform = "youtube" | "reddit" | "twitter";

export type ContentType = "quick_tip" | "deep_dive" | "roundup" | "update";

export type ContentCategory =
  | "code_and_editing"
  | "workflow_and_automation"
  | "debugging_and_testing"
  | "prompting_and_context"
  | "tools_and_updates"
  | "architecture_and_data"
  | "learning_and_practices";

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
  published_at: string | null;
}

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
