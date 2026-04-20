import type { ContentCategory, Content } from "@/types";

export interface CategoryConfig {
  slug: ContentCategory;
  label: string;
  description: string;
  icon: string;
  tint: string;
  darkTint: string;
  accent: string;
}

const CATEGORIES: Record<ContentCategory, CategoryConfig> = {
  code_and_editing: {
    slug: "code_and_editing",
    label: "Code & Editing",
    description:
      "AI-assisted writing, refactoring, code review, and generation",
    icon: "Code2",
    tint: "bg-[#f0f8f2]",
    darkTint: "dark:bg-[#1a2b1e]",
    accent: "text-[#2D6040]",
  },
  workflow_and_automation: {
    slug: "workflow_and_automation",
    label: "Workflow & Automation",
    description: "Agents, pipelines, CI/CD automation, and task orchestration",
    icon: "Workflow",
    tint: "bg-[#f3eff8]",
    darkTint: "dark:bg-[#221e2e]",
    accent: "text-[#5E3F96]",
  },
  debugging_and_testing: {
    slug: "debugging_and_testing",
    label: "Debugging & Testing",
    description: "AI-assisted debugging, test generation, and error resolution",
    icon: "Bug",
    tint: "bg-[#faf0ef]",
    darkTint: "dark:bg-[#2e1e1c]",
    accent: "text-[#8B4A4A]",
  },
  prompting_and_context: {
    slug: "prompting_and_context",
    label: "Prompting & Context",
    description: "Prompt engineering, context management, and system prompts",
    icon: "MessageSquareCode",
    tint: "bg-[#f9f5ec]",
    darkTint: "dark:bg-[#2a261a]",
    accent: "text-[#7B6230]",
  },
  tools_and_updates: {
    slug: "tools_and_updates",
    label: "Tools & Updates",
    description: "New releases, model comparisons, and tool announcements",
    icon: "Sparkles",
    tint: "bg-[#eef5fa]",
    darkTint: "dark:bg-[#1a2530]",
    accent: "text-[#3D6080]",
  },
  architecture_and_data: {
    slug: "architecture_and_data",
    label: "Architecture & Data",
    description: "System design, data pipelines, schema, and API design",
    icon: "Layers",
    tint: "bg-[#eff2fa]",
    darkTint: "dark:bg-[#1c2030]",
    accent: "text-[#4A5A8B]",
  },
  learning_and_practices: {
    slug: "learning_and_practices",
    label: "Learning & Practices",
    description: "Best practices, tutorials, guides, and how people use AI",
    icon: "BookOpen",
    tint: "bg-[#f9f0f3]",
    darkTint: "dark:bg-[#2e1c22]",
    accent: "text-[#8B4A6E]",
  },
};

export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return CATEGORIES[slug as ContentCategory];
}

export function getAllCategoryConfigs(): CategoryConfig[] {
  return Object.values(CATEGORIES);
}

export function getAllCategorySlugs(): ContentCategory[] {
  return Object.keys(CATEGORIES) as ContentCategory[];
}

// ─── Activity filters per category ──────────────────────────────────────────

export interface ActivityFilter {
  key: string;
  label: string;
  tags: string[];
}

const CATEGORY_FILTERS: Record<ContentCategory, ActivityFilter[]> = {
  code_and_editing: [
    { key: "generation", label: "Code Generation", tags: ["code-generation", "coding"] },
    { key: "refactoring", label: "Refactoring", tags: ["refactoring"] },
    { key: "review", label: "Code Review", tags: ["code-review"] },
  ],
  workflow_and_automation: [
    { key: "agents", label: "Agents", tags: ["agents", "agentic"] },
    { key: "pipelines", label: "Pipelines", tags: ["pipeline", "pipelines", "content-curation"] },
    { key: "automation", label: "Automation", tags: ["automation"] },
  ],
  debugging_and_testing: [
    { key: "debugging", label: "Debugging", tags: ["debugging"] },
    { key: "testing", label: "Testing", tags: ["testing", "test-generation"] },
    { key: "errors", label: "Error Handling", tags: ["error-handling", "error-resolution"] },
  ],
  prompting_and_context: [
    { key: "prompt-eng", label: "Prompt Engineering", tags: ["prompt_engineering", "prompt-engineering"] },
    { key: "context", label: "Context Management", tags: ["context_management", "context-management"] },
    { key: "system-prompts", label: "System Prompts", tags: ["system_prompts", "system-prompts"] },
  ],
  tools_and_updates: [
    { key: "releases", label: "New Releases", tags: ["model_updates", "releases"] },
    { key: "comparisons", label: "Model Comparisons", tags: ["model_comparisons", "model-comparisons"] },
    { key: "benchmarks", label: "Benchmarks", tags: ["benchmarks", "benchmark"] },
  ],
  architecture_and_data: [
    { key: "system-design", label: "System Design", tags: ["system_design", "system-design", "design"] },
    { key: "api-design", label: "API Design", tags: ["api_design", "api-design"] },
    { key: "data-eng", label: "Data Engineering", tags: ["data_engineering", "data-pipelines"] },
    { key: "databases", label: "Databases", tags: ["databases"] },
  ],
  learning_and_practices: [
    { key: "tutorials", label: "Tutorials", tags: ["tutorial", "tutorials"] },
    { key: "best-practices", label: "Best Practices", tags: ["best-practices", "best_practices"] },
    { key: "research", label: "Research", tags: ["research"] },
    { key: "team", label: "Team Workflows", tags: ["team-workflow", "stakeholder-communication"] },
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
  coding: "code_and_editing",
  "code-generation": "code_and_editing",
  refactoring: "code_and_editing",
  "code-review": "code_and_editing",
  automation: "workflow_and_automation",
  pipeline: "workflow_and_automation",
  "content-curation": "workflow_and_automation",
  debugging: "debugging_and_testing",
  testing: "debugging_and_testing",
  writing: "learning_and_practices",
  research: "learning_and_practices",
  design: "learning_and_practices",
  "team-workflow": "learning_and_practices",
  "stakeholder-communication": "learning_and_practices",
};

const FOCUS_TO_CATEGORY: Record<string, ContentCategory> = {
  prompt_engineering: "prompting_and_context",
  model_updates: "tools_and_updates",
};

const DOMAIN_TO_CATEGORY: Record<string, ContentCategory> = {
  databases: "architecture_and_data",
  api_design: "architecture_and_data",
  data_engineering: "architecture_and_data",
};

export function inferCategoryForContent(content: Content): ContentCategory {
  if (content.content_type === "update") return "tools_and_updates";

  for (const w of content.tags_workflow) {
    if (WORKFLOW_TO_CATEGORY[w]) return WORKFLOW_TO_CATEGORY[w];
  }

  for (const f of content.tags_focus) {
    if (FOCUS_TO_CATEGORY[f]) return FOCUS_TO_CATEGORY[f];
  }

  for (const d of content.tags_domain) {
    if (DOMAIN_TO_CATEGORY[d]) return DOMAIN_TO_CATEGORY[d];
  }

  return "learning_and_practices";
}
