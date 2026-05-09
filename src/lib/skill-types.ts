export type SkillType =
  | "design_systems"
  | "claude_md_rules"
  | "mcp_tools"
  | "cli_tools"
  | "workflow_automation"
  | "testing_qa"
  | "code_generation"
  | "documentation";

export interface SkillTypeConfig {
  slug: SkillType;
  label: string;
  description: string;
  icon: string;
}

const SKILL_TYPES: Record<SkillType, SkillTypeConfig> = {
  design_systems: {
    slug: "design_systems",
    label: "Design Systems",
    description: "UI/UX design skills, style guides, and component generators",
    icon: "Palette",
  },
  claude_md_rules: {
    slug: "claude_md_rules",
    label: "CLAUDE.md Rules",
    description: "Project rule templates and CLAUDE.md patterns",
    icon: "FileCode",
  },
  mcp_tools: {
    slug: "mcp_tools",
    label: "MCP Tools",
    description: "MCP server-based skill extensions",
    icon: "Blocks",
  },
  cli_tools: {
    slug: "cli_tools",
    label: "CLI Tools",
    description: "NPX-installable command-line tools and utilities",
    icon: "Terminal",
  },
  workflow_automation: {
    slug: "workflow_automation",
    label: "Workflow Automation",
    description: "CI/CD skills, multi-agent pipelines, and automation",
    icon: "Workflow",
  },
  testing_qa: {
    slug: "testing_qa",
    label: "Testing & QA",
    description: "Test generation, TDD workflows, and quality assurance",
    icon: "TestTube",
  },
  code_generation: {
    slug: "code_generation",
    label: "Code Generation",
    description: "Scaffolding, boilerplate generators, and code templates",
    icon: "Code2",
  },
  documentation: {
    slug: "documentation",
    label: "Documentation",
    description: "Doc generation, README tools, and API documentation",
    icon: "BookOpen",
  },
};

export function getSkillTypeConfig(slug: string): SkillTypeConfig | undefined {
  return SKILL_TYPES[slug as SkillType];
}

export function getAllSkillTypeConfigs(): SkillTypeConfig[] {
  return Object.values(SKILL_TYPES);
}

export function getAllSkillTypeSlugs(): SkillType[] {
  return Object.keys(SKILL_TYPES) as SkillType[];
}
