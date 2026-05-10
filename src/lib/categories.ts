import type { ContentCategory, Content } from "@/types";

export interface CategoryConfig {
  slug: ContentCategory;
  label: string;
  description: string;
  icon: string;
  tint: string;
  darkTint: string;
  accent: string;
  subTopics: string[];
}

const CATEGORIES: Record<ContentCategory, CategoryConfig> = {
  claude_code_features: {
    slug: "claude_code_features",
    label: "Claude Code Features",
    description:
      "New releases, design patterns, and correct usage examples for Claude Code",
    icon: "Terminal",
    tint: "bg-[#faf5ee]",
    darkTint: "dark:bg-[#2a2318]",
    accent: "text-[#9B6B2F]",
    subTopics: ["New Releases", "Hooks & Config", "Sub-Agents", "Design Patterns", "CLI Usage"],
  },
  security_and_guardrails: {
    slug: "security_and_guardrails",
    label: "Security & Guardrails",
    description:
      "Real-world company security setups, permission models, and production guardrails",
    icon: "Shield",
    tint: "bg-[#faf0ef]",
    darkTint: "dark:bg-[#2e1e1c]",
    accent: "text-[#8B4A4A]",
    subTopics: ["Permissions & Access", "API Key Security", "Production Guardrails", "Compliance"],
  },
  github_skills: {
    slug: "github_skills",
    label: "GitHub Skills",
    description:
      "Popular community skills, use cases, and how to build and configure them",
    icon: "Sparkles",
    tint: "bg-[#f3eff8]",
    darkTint: "dark:bg-[#221e2e]",
    accent: "text-[#5E3F96]",
    subTopics: ["Popular Skills", "Building Skills", "Skill Configuration", "Use Cases"],
  },
  prompting_and_rules: {
    slug: "prompting_and_rules",
    label: "Prompting & Rules",
    description:
      "CLAUDE.md patterns, system prompts, prompt engineering for agentic coding",
    icon: "MessageSquareCode",
    tint: "bg-[#f9f5ec]",
    darkTint: "dark:bg-[#2a261a]",
    accent: "text-[#7B6230]",
    subTopics: ["CLAUDE.md Patterns", "System Prompts", "Prompt Engineering", "Context Management"],
  },
  workflow_patterns: {
    slug: "workflow_patterns",
    label: "Workflow Patterns",
    description:
      "Agentic workflows, CI/CD with Claude, multi-agent setups, pipeline automation",
    icon: "Workflow",
    tint: "bg-[#eef5fa]",
    darkTint: "dark:bg-[#1a2530]",
    accent: "text-[#3D6080]",
    subTopics: ["CI/CD Integration", "Multi-Agent Setups", "Automation", "Routines"],
  },
  mcp_and_integrations: {
    slug: "mcp_and_integrations",
    label: "MCP & Integrations",
    description:
      "MCP servers, connecting tools, best community servers, and integration patterns",
    icon: "Blocks",
    tint: "bg-[#f0f8f2]",
    darkTint: "dark:bg-[#1a2b1e]",
    accent: "text-[#2D6040]",
    subTopics: ["MCP Servers", "Tool Integrations", "API Connections", "Community Servers"],
  },
  debugging_and_testing: {
    slug: "debugging_and_testing",
    label: "Debugging & Testing",
    description:
      "Test generation strategies, AI-assisted debugging, and TDD workflows",
    icon: "Bug",
    tint: "bg-[#eff2fa]",
    darkTint: "dark:bg-[#1c2030]",
    accent: "text-[#4A5A8B]",
    subTopics: ["Debugging Techniques", "Test Generation", "TDD Workflows", "Error Handling"],
  },
};

export function toUrlSlug(slug: string): string {
  return slug.replace(/_/g, "-");
}

export function fromUrlSlug(urlSlug: string): string {
  return urlSlug.replace(/-/g, "_");
}

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return CATEGORIES[slug as ContentCategory];
}

export function getAllCategoryConfigs(): CategoryConfig[] {
  return Object.values(CATEGORIES);
}

export function getAllCategorySlugs(): ContentCategory[] {
  return Object.keys(CATEGORIES) as ContentCategory[];
}

export function getAllowedSubTopics(slug: string): string[] {
  return CATEGORIES[slug as ContentCategory]?.subTopics ?? [];
}

// ─── Activity filters per category ──────────────────────────────────────────

export interface ActivityFilter {
  key: string;
  label: string;
  tags: string[];
}

const CATEGORY_FILTERS: Record<ContentCategory, ActivityFilter[]> = {
  claude_code_features: [
    { key: "releases", label: "New Releases", tags: ["model_updates", "releases"] },
    { key: "design", label: "Claude Design", tags: ["design", "claude-design"] },
    { key: "hooks", label: "Hooks & Config", tags: ["hooks", "configuration"] },
    { key: "agents", label: "Sub-agents", tags: ["agents", "agentic", "sub-agents"] },
  ],
  security_and_guardrails: [
    { key: "permissions", label: "Permissions & RLS", tags: ["permissions", "rls", "access-control"] },
    { key: "api-keys", label: "API Key Hygiene", tags: ["api-keys", "secrets", "credentials"] },
    { key: "guardrails", label: "Production Guardrails", tags: ["guardrails", "safety", "validation"] },
    { key: "compliance", label: "Compliance", tags: ["compliance", "governance", "audit"] },
  ],
  github_skills: [
    { key: "popular", label: "Popular Skills", tags: ["popular-skills", "community"] },
    { key: "building", label: "Building Skills", tags: ["skill-creation", "skill-building"] },
    { key: "use-cases", label: "Use Cases", tags: ["use-cases", "examples"] },
  ],
  prompting_and_rules: [
    { key: "claude-md", label: "CLAUDE.md", tags: ["claude-md", "project-rules"] },
    { key: "prompt-eng", label: "Prompt Engineering", tags: ["prompt_engineering", "prompt-engineering"] },
    { key: "context", label: "Context Management", tags: ["context_management", "context-management"] },
    { key: "system-prompts", label: "System Prompts", tags: ["system_prompts", "system-prompts"] },
  ],
  workflow_patterns: [
    { key: "cicd", label: "CI/CD", tags: ["ci_cd", "cicd", "continuous-integration"] },
    { key: "multi-agent", label: "Multi-Agent", tags: ["multi-agent", "agent-teams"] },
    { key: "automation", label: "Automation", tags: ["automation", "pipeline"] },
    { key: "routines", label: "Routines", tags: ["routines", "scheduled", "cron"] },
  ],
  mcp_and_integrations: [
    { key: "servers", label: "MCP Servers", tags: ["mcp", "mcp-servers"] },
    { key: "tools", label: "Tool Integrations", tags: ["tool-use", "integrations"] },
    { key: "apis", label: "API Connections", tags: ["api_design", "api-design", "api-connections"] },
  ],
  debugging_and_testing: [
    { key: "debugging", label: "Debugging", tags: ["debugging"] },
    { key: "testing", label: "Test Generation", tags: ["testing", "test-generation"] },
    { key: "tdd", label: "TDD Workflows", tags: ["tdd", "test-driven"] },
    { key: "errors", label: "Error Handling", tags: ["error-handling", "error-resolution"] },
  ],
};

export function getCategoryFilters(slug: string): ActivityFilter[] {
  return CATEGORY_FILTERS[slug as ContentCategory] ?? [];
}

export function getCategoryFilterByKey(
  slug: string,
  key: string
): ActivityFilter | undefined {
  return getCategoryFilters(slug).find((f) => f.key === key);
}

const WORKFLOW_TO_CATEGORY: Record<string, ContentCategory> = {
  coding: "claude_code_features",
  "code-generation": "claude_code_features",
  refactoring: "claude_code_features",
  "code-review": "claude_code_features",
  automation: "workflow_patterns",
  pipeline: "workflow_patterns",
  agents: "workflow_patterns",
  "content-curation": "workflow_patterns",
  debugging: "debugging_and_testing",
  testing: "debugging_and_testing",
  "error-handling": "debugging_and_testing",
  "skill-building": "github_skills",
  "skill-creation": "github_skills",
};

const FOCUS_TO_CATEGORY: Record<string, ContentCategory> = {
  prompt_engineering: "prompting_and_rules",
  context_management: "prompting_and_rules",
  system_prompts: "prompting_and_rules",
  model_updates: "claude_code_features",
  security: "security_and_guardrails",
  governance: "security_and_guardrails",
  privacy: "security_and_guardrails",
};

const DOMAIN_TO_CATEGORY: Record<string, ContentCategory> = {
  mcp: "mcp_and_integrations",
  integrations: "mcp_and_integrations",
  api_design: "mcp_and_integrations",
  security_engineering: "security_and_guardrails",
};

const TOOL_TO_CATEGORY: Record<string, ContentCategory> = {
  mcp: "mcp_and_integrations",
};

export function inferCategoryForContent(content: Content): ContentCategory {
  if (content.content_type === "update") return "claude_code_features";

  for (const t of content.tags_tool) {
    if (TOOL_TO_CATEGORY[t]) return TOOL_TO_CATEGORY[t];
  }

  for (const w of content.tags_workflow) {
    if (WORKFLOW_TO_CATEGORY[w]) return WORKFLOW_TO_CATEGORY[w];
  }

  for (const f of content.tags_focus) {
    if (FOCUS_TO_CATEGORY[f]) return FOCUS_TO_CATEGORY[f];
  }

  for (const d of content.tags_domain) {
    if (DOMAIN_TO_CATEGORY[d]) return DOMAIN_TO_CATEGORY[d];
  }

  return "claude_code_features";
}
