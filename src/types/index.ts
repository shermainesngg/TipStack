// ─── Database Row Types ─────────────────────────────────────────────────────

export type ContentStatus = "pending_review" | "published" | "rejected";

export type RawContentStatus = "ingested" | "filtered" | "merged" | "discarded";

export type Platform = "youtube" | "reddit" | "twitter" | "news" | "docs" | "github";

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
  skill_id?: string;
  practical_use_case?: string | null;
  try_this?: string | null;
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
  quality_score: number;
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
  practical_use_case?: string;
  try_this?: string;
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
  priority: number;
  published_at: string;
  created_at: string;
  topic_slug?: string;
  topic_category?: ContentCategory;
  topic_sub_topic?: string;
  topic_tags_focus?: string[];
}

// ─── Changelog Types ──────────────────────────────────────────────────────

export type ChangelogUrgency = "breaking" | "important" | "informational";

export interface ChangelogEntry {
  id: string;
  title: string;
  summary: string;
  headline: string | null;
  changes: string[];
  urgency: ChangelogUrgency;
  source_url: string;
  affected_tools: string[];
  version: string | null;
  published_at: string;
  created_at: string;
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

// ─── Skill Types ──────────────────────────────────────────────────────────

export type SkillType =
  | "design_systems"
  | "claude_md_rules"
  | "mcp_tools"
  | "cli_tools"
  | "workflow_automation"
  | "testing_qa"
  | "code_generation"
  | "documentation";

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  summary: string | null;
  use_case: string | null;
  repo_url: string;
  author: string;
  skill_type: SkillType;
  skill_subcategory: string | null;
  stars: number;
  last_updated: string | null;
  install_command: string | null;
  topics: string[];
  readme_excerpt: string | null;
  status: "active" | "archived" | "pending";
  created_at: string;
  updated_at: string;
}

export type SkillSummary = Pick<
  Skill,
  "id" | "name" | "description" | "repo_url" | "author" | "skill_type" | "skill_subcategory" | "stars" | "install_command"
>;

export interface FetchedSkillMeta {
  repoUrl: string;
  name: string;
  author: string;
  description: string;
  stars: number;
  lastUpdated: string | null;
  topics: string[];
  readmeExcerpt: string;
  installCommand: string | null;
  subcategory?: string;
}
