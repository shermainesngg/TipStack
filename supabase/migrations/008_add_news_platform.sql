ALTER TABLE sources_log DROP CONSTRAINT sources_log_platform_check;
ALTER TABLE sources_log ADD CONSTRAINT sources_log_platform_check
  CHECK (platform IN ('youtube', 'reddit', 'twitter', 'news'));

ALTER TABLE raw_content DROP CONSTRAINT raw_content_platform_check;
ALTER TABLE raw_content ADD CONSTRAINT raw_content_platform_check
  CHECK (platform IN ('youtube', 'reddit', 'twitter', 'news'));
