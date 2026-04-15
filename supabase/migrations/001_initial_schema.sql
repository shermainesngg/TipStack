-- TipStack initial schema
-- Tables: content, raw_content, sources_log

-- ─── sources_log ────────────────────────────────────────────────────────────
-- Tracks every URL that has been processed to prevent reprocessing.

CREATE TABLE sources_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'reddit')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sources_log_url ON sources_log (url);

-- ─── raw_content ────────────────────────────────────────────────────────────
-- Stores extracted data from each source item before synthesis.

CREATE TABLE raw_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'reddit')),
  raw_extract JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'ingested'
    CHECK (status IN ('ingested', 'filtered', 'merged', 'discarded')),
  batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_raw_content_status_batch ON raw_content (status, batch_date);

-- ─── content ────────────────────────────────────────────────────────────────
-- Published content pieces shown on the public feed.

CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'published', 'rejected')),
  tags_tool TEXT[] NOT NULL DEFAULT '{}',
  tags_focus TEXT[] NOT NULL DEFAULT '{}',
  tags_workflow TEXT[] NOT NULL DEFAULT '{}',
  source_urls JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_content_status ON content (status);
CREATE INDEX idx_content_published_at ON content (published_at DESC);
CREATE INDEX idx_content_slug ON content (slug);

-- ─── RLS Policies ───────────────────────────────────────────────────────────

ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources_log ENABLE ROW LEVEL SECURITY;

-- Anon role: read-only access to published content
CREATE POLICY "Public can read published content"
  ON content FOR SELECT
  TO anon
  USING (status = 'published');

-- Service role: full access for pipeline operations
CREATE POLICY "Service role has full access to content"
  ON content FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to raw_content"
  ON raw_content FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to sources_log"
  ON sources_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
