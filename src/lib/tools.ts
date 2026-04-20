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
