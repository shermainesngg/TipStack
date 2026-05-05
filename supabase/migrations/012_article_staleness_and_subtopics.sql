-- Add staleness tracking and dynamic sub-topics to content table
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS based_on_version text,
  ADD COLUMN IF NOT EXISTS sub_topic text;

-- Partial index for articles needing review (only indexes true rows)
CREATE INDEX idx_content_needs_review ON content (needs_review) WHERE needs_review = true;

-- Composite index for sub-topic grouping within categories
CREATE INDEX idx_content_sub_topic ON content (tags_category, sub_topic);

-- Add 'docs' to sources_log platform check if constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sources_log_platform_check'
  ) THEN
    ALTER TABLE sources_log DROP CONSTRAINT sources_log_platform_check;
    ALTER TABLE sources_log ADD CONSTRAINT sources_log_platform_check
      CHECK (platform IN ('youtube', 'reddit', 'twitter', 'news', 'docs'));
  END IF;
END $$;

-- Index for docs platform filtering
CREATE INDEX IF NOT EXISTS idx_sources_log_platform_docs ON sources_log (platform) WHERE platform = 'docs';
