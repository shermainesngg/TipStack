-- Add 'blog' as a valid platform for high-signal AI blog feeds (e.g. Simon Willison's Weblog).
-- Also brings raw_content's platform check in line with sources_log: migrations 012/013 added
-- 'docs' and 'github' to sources_log only, leaving raw_content stuck at the 008 set. Set both
-- tables to the full canonical platform list here.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sources_log_platform_check'
  ) THEN
    ALTER TABLE sources_log DROP CONSTRAINT sources_log_platform_check;
  END IF;
  ALTER TABLE sources_log ADD CONSTRAINT sources_log_platform_check
    CHECK (platform IN ('youtube', 'reddit', 'twitter', 'news', 'docs', 'github', 'blog'));

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'raw_content_platform_check'
  ) THEN
    ALTER TABLE raw_content DROP CONSTRAINT raw_content_platform_check;
  END IF;
  ALTER TABLE raw_content ADD CONSTRAINT raw_content_platform_check
    CHECK (platform IN ('youtube', 'reddit', 'twitter', 'news', 'docs', 'github', 'blog'));
END $$;
