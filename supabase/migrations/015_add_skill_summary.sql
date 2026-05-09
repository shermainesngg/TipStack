-- Add short summary and use_case fields for card display
ALTER TABLE skills ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS use_case TEXT;
