-- Full-text search on content table with weighted fields
-- Title and tags rank highest (A/B), body and supplementary fields rank lower (C)

ALTER TABLE content ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_content_search ON content USING GIN (search_vector);

-- Function to build the search vector from content fields
CREATE OR REPLACE FUNCTION content_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.sub_topic, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.body, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.practical_use_case, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.try_this, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags_tool, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags_focus, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags_workflow, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_search_vector_trigger
  BEFORE INSERT OR UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION content_search_vector_update();

-- Backfill existing rows
UPDATE content SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(sub_topic, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(body, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(practical_use_case, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(try_this, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags_tool, ' '), '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags_focus, ' '), '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags_workflow, ' '), '')), 'C');

-- RPC function for ranked search with highlighted snippets
CREATE OR REPLACE FUNCTION search_content(
  search_query text,
  result_limit int DEFAULT 5,
  result_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  summary text,
  tags_category text,
  sub_topic text,
  tags_tool text[],
  tags_focus text[],
  tags_workflow text[],
  published_at timestamptz,
  source_urls jsonb,
  rank real,
  headline_title text,
  headline_summary text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id, c.title, c.slug, c.summary,
    c.tags_category, c.sub_topic,
    c.tags_tool, c.tags_focus, c.tags_workflow,
    c.published_at, c.source_urls,
    ts_rank_cd(c.search_vector, websearch_to_tsquery('english', search_query)) AS rank,
    ts_headline('english', c.title, websearch_to_tsquery('english', search_query),
      'StartSel=<mark>, StopSel=</mark>, MaxFragments=0') AS headline_title,
    ts_headline('english', c.summary, websearch_to_tsquery('english', search_query),
      'StartSel=<mark>, StopSel=</mark>, MaxFragments=1, MaxWords=30, MinWords=15') AS headline_summary
  FROM content c
  WHERE c.status = 'published'
    AND c.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
$$;

GRANT EXECUTE ON FUNCTION search_content TO anon;
