-- Add structured changes (bullet points) and headline to changelog entries
ALTER TABLE changelog_entries ADD COLUMN headline TEXT;
ALTER TABLE changelog_entries ADD COLUMN changes JSONB DEFAULT '[]'::jsonb;

-- Backfill headline from existing summary (first sentence)
UPDATE changelog_entries SET headline = split_part(summary, '. ', 1) || '.';
