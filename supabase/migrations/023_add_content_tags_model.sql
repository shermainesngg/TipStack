-- Add a first-class `tags_model` dimension to content.
-- Models (opus, sonnet, fable, gpt-5.5, gemini-3.5-pro, ...) are distinct from
-- products/tools (claude_code, chatgpt) and were previously not tracked.
-- Populated by the extraction stage; used to feed the /models page's per-model
-- "Latest updates" and to surface newly-seen models for review.

ALTER TABLE content ADD COLUMN IF NOT EXISTS tags_model text[] NOT NULL DEFAULT '{}';

-- GIN index for `tags_model @> ARRAY[...]` / contains lookups per model.
CREATE INDEX IF NOT EXISTS idx_content_tags_model ON content USING GIN (tags_model);
