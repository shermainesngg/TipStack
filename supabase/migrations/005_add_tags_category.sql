-- Add intent-based category column for primary navigation
-- Replaces domain-based navigation with "what AI helps you do" categories

ALTER TABLE content ADD COLUMN tags_category TEXT NOT NULL DEFAULT 'learning_and_practices'
  CHECK (tags_category IN (
    'code_and_editing',
    'workflow_and_automation',
    'debugging_and_testing',
    'prompting_and_context',
    'tools_and_updates',
    'architecture_and_data',
    'learning_and_practices'
  ));

CREATE INDEX idx_content_category ON content (tags_category);
