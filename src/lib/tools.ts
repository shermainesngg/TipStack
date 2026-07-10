const TOOL_ALIASES: Record<string, string> = {
  "claude-code": "claude_code",
  claude: "claude_code",
  anthropic: "claude_code",
  openai: "chatgpt",
  gpt: "chatgpt",
};

const IGNORED_TAGS = new Set(["ai-editor", "rss"]);

const DISPLAY_NAMES: Record<string, string> = {
  claude_code: "Claude Code",
  cursor: "Cursor",
  copilot: "Copilot",
  chatgpt: "ChatGPT",
  windsurf: "Windsurf",
  v0: "v0",
  bolt: "Bolt",
  n8n: "n8n",
  archon: "Archon",
  antigravity: "Antigravity",
};

export function normalizeToolTag(tag: string): string | null {
  const lower = tag.toLowerCase().trim();
  if (IGNORED_TAGS.has(lower)) return null;
  return TOOL_ALIASES[lower] ?? lower;
}

export function normalizeToolTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeToolTag(tag);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function expandToolAliases(canonical: string): string[] {
  const all = [canonical];
  for (const [alias, target] of Object.entries(TOOL_ALIASES)) {
    if (target === canonical) all.push(alias);
  }
  return all;
}

export function toolDisplayName(tag: string): string {
  return (
    DISPLAY_NAMES[tag] ??
    tag
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ─── Model tags ──────────────────────────────────────────────────────────────
// A SEPARATE vocabulary from tools. Tools collapse a model into its product
// (claude -> claude_code); models must NOT — "opus" and "sonnet" are distinct.
// Canonical values match the slugs in src/lib/models.ts so a content row's
// tags_model[] joins directly to a model page.

const MODEL_ALIASES: Record<string, string> = {
  // Anthropic
  opus: "claude-opus-4-8",
  "opus-4.8": "claude-opus-4-8",
  "claude-opus": "claude-opus-4-8",
  "claude-opus-4.8": "claude-opus-4-8",
  sonnet: "claude-sonnet-5",
  "sonnet-5": "claude-sonnet-5",
  "claude-sonnet": "claude-sonnet-5",
  haiku: "claude-haiku-4-5",
  "haiku-4.5": "claude-haiku-4-5",
  "claude-haiku": "claude-haiku-4-5",
  fable: "claude-fable-5",
  "fable-5": "claude-fable-5",
  "claude-fable": "claude-fable-5",
  mythos: "claude-mythos-5",
  "mythos-5": "claude-mythos-5",
  "claude-mythos": "claude-mythos-5",
  // OpenAI
  "gpt-5.5": "gpt-5-5",
  "gpt5.5": "gpt-5-5",
  // Google
  "gemini-3.5-pro": "gemini-3-5-pro",
  "gemini-3.5": "gemini-3-5-pro",
  // DeepSeek
  deepseek: "deepseek-v4",
};

/** Canonical model slugs the /models page knows about. */
export const KNOWN_MODELS = new Set<string>([
  "claude-fable-5",
  "claude-opus-4-8",
  "claude-sonnet-5",
  "claude-haiku-4-5",
  "claude-mythos-5",
  "gpt-5-5",
  "gemini-3-5-pro",
  "deepseek-v4",
]);

/**
 * Normalize a raw model mention to a canonical slug. Unknown-but-plausible
 * models (e.g. "grok-4") pass through cleaned, so they can be surfaced for
 * review rather than silently dropped. Returns null for empty input.
 */
export function normalizeModelTag(tag: string): string | null {
  const cleaned = tag.toLowerCase().trim().replace(/[\s_]+/g, "-");
  if (!cleaned) return null;
  return MODEL_ALIASES[cleaned] ?? cleaned;
}

export function normalizeModelTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of tags) {
    const normalized = normalizeModelTag(tag);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function isKnownModel(slug: string): boolean {
  return KNOWN_MODELS.has(slug);
}
