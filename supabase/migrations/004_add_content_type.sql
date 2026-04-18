ALTER TABLE content ADD COLUMN content_type TEXT NOT NULL DEFAULT 'deep_dive'
  CHECK (content_type IN ('quick_tip', 'deep_dive', 'roundup', 'update'));
