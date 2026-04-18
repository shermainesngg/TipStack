import type { ContentCategory } from "@/types";
import { CodeEditingLayout } from "./code-editing-layout";
import { WorkflowAutomationLayout } from "./workflow-automation-layout";
import { DebuggingTestingLayout } from "./debugging-testing-layout";
import { PromptingContextLayout } from "./prompting-context-layout";
import { ToolsUpdatesLayout } from "./tools-updates-layout";
import { ArchitectureDataLayout } from "./architecture-data-layout";
import { LearningPracticesLayout } from "./learning-practices-layout";
import type { Content } from "@/types";

type LayoutComponent = React.ComponentType<{ content: Content[] }>;

const LAYOUT_MAP: Record<ContentCategory, LayoutComponent> = {
  code_and_editing: CodeEditingLayout,
  workflow_and_automation: WorkflowAutomationLayout,
  debugging_and_testing: DebuggingTestingLayout,
  prompting_and_context: PromptingContextLayout,
  tools_and_updates: ToolsUpdatesLayout,
  architecture_and_data: ArchitectureDataLayout,
  learning_and_practices: LearningPracticesLayout,
};

export function getCategoryLayout(
  category: ContentCategory
): LayoutComponent {
  return LAYOUT_MAP[category] ?? LearningPracticesLayout;
}
