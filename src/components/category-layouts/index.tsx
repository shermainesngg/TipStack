import type { ContentCategory, Content, Skill } from "@/types";
import { DynamicSubTopicLayout } from "./dynamic-subtopic-layout";
import { GithubSkillsLayout } from "./github-skills-layout";

export type LayoutProps = {
  content: Content[];
  skillsByType?: Record<string, Skill[]>;
};

type LayoutComponent = React.ComponentType<LayoutProps>;

const LAYOUT_MAP: Record<ContentCategory, LayoutComponent> = {
  claude_code_features: DynamicSubTopicLayout,
  security_and_guardrails: DynamicSubTopicLayout,
  github_skills: GithubSkillsLayout,
  prompting_and_rules: DynamicSubTopicLayout,
  workflow_patterns: DynamicSubTopicLayout,
  mcp_and_integrations: DynamicSubTopicLayout,
  debugging_and_testing: DynamicSubTopicLayout,
};

export function getCategoryLayout(
  category: ContentCategory
): LayoutComponent {
  return LAYOUT_MAP[category] ?? DynamicSubTopicLayout;
}

export function CategoryLayoutRenderer({
  category,
  content,
  skillsByType,
}: LayoutProps & { category: ContentCategory }) {
  const Layout = LAYOUT_MAP[category] ?? DynamicSubTopicLayout;
  return <Layout content={content} skillsByType={skillsByType} />;
}
