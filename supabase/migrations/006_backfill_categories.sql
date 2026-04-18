-- Backfill tags_category for existing content based on existing tags
-- Priority order: most specific matches first, catch-all last

-- 1. Updates/announcements → tools_and_updates
UPDATE content SET tags_category = 'tools_and_updates'
WHERE content_type = 'update';

-- 2. Coding-related workflows → code_and_editing
UPDATE content SET tags_category = 'code_and_editing'
WHERE tags_workflow && ARRAY['coding', 'code-generation', 'refactoring', 'code-review']
  AND tags_category = 'learning_and_practices';

-- 3. Debugging/testing workflows → debugging_and_testing
UPDATE content SET tags_category = 'debugging_and_testing'
WHERE tags_workflow && ARRAY['debugging', 'testing']
  AND tags_category = 'learning_and_practices';

-- 4. Automation/pipeline workflows → workflow_and_automation
UPDATE content SET tags_category = 'workflow_and_automation'
WHERE tags_workflow && ARRAY['automation', 'pipeline', 'content-curation']
  AND tags_category = 'learning_and_practices';

-- 5. Prompt engineering focus → prompting_and_context
UPDATE content SET tags_category = 'prompting_and_context'
WHERE tags_focus && ARRAY['prompt_engineering']
  AND tags_category = 'learning_and_practices';

-- 6. Architecture/data domains → architecture_and_data
UPDATE content SET tags_category = 'architecture_and_data'
WHERE tags_domain && ARRAY['databases', 'api_design', 'data_engineering']
  AND tags_category = 'learning_and_practices';

-- Remaining rows keep the default 'learning_and_practices'
