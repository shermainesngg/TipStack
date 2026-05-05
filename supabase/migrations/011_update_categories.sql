-- Replace intent-based categories with specific, actionable categories
-- New categories: claude_code_features, security_and_guardrails, github_skills,
--   prompting_and_rules, workflow_patterns, mcp_and_integrations, debugging_and_testing

-- Remap existing content to new categories
UPDATE content SET tags_category = 'claude_code_features' WHERE tags_category IN ('code_and_editing', 'tools_and_updates');
UPDATE content SET tags_category = 'workflow_patterns' WHERE tags_category = 'workflow_and_automation';
UPDATE content SET tags_category = 'prompting_and_rules' WHERE tags_category = 'prompting_and_context';
UPDATE content SET tags_category = 'claude_code_features' WHERE tags_category = 'architecture_and_data';
UPDATE content SET tags_category = 'claude_code_features' WHERE tags_category = 'learning_and_practices';
-- debugging_and_testing stays as-is

-- Drop old constraint and add new one
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_tags_category_check;
ALTER TABLE content ADD CONSTRAINT content_tags_category_check
  CHECK (tags_category IN (
    'claude_code_features',
    'security_and_guardrails',
    'github_skills',
    'prompting_and_rules',
    'workflow_patterns',
    'mcp_and_integrations',
    'debugging_and_testing'
  ));

-- Update default
ALTER TABLE content ALTER COLUMN tags_category SET DEFAULT 'claude_code_features';
