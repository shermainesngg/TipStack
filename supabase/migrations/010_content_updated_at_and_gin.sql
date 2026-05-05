-- Add updated_at tracking for living articles
alter table content add column updated_at timestamptz;

-- Backfill existing rows
update content set updated_at = created_at where updated_at is null;

-- GIN indexes for topic matching via array overlap (&&)
create index idx_content_tags_tool on content using gin (tags_tool);
create index idx_content_tags_focus on content using gin (tags_focus);
