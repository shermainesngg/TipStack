// ─── Database Row Types ─────────────────────────────────────────────────────

export type ContentStatus = "pending_review" | "published" | "rejected";

export type RawContentStatus = "ingested" | "filtered" | "merged" | "discarded";

export type Platform = "youtube" | "reddit";

export interface Content {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: ContentStatus;
  tags_tool: string[];
  tags_focus: string[];
  tags_workflow: string[];
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
  tags_tool: string[];
  tags_focus: string[];
  tags_workflow: string[];
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
