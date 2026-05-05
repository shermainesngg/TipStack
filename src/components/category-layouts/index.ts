import type { ContentCategory, Content } from "@/types";
import { DynamicSubTopicLayout } from "./dynamic-subtopic-layout";

type LayoutComponent = React.ComponentType<{ content: Content[] }>;

const LAYOUT_MAP: Record<ContentCategory, LayoutComponent> = {
  claude_code_features: DynamicSubTopicLayout,
  security_and_guardrails: DynamicSubTopicLayout,
  github_skills: DynamicSubTopicLayout,
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
