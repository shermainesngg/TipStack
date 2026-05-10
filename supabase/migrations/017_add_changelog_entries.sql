-- Changelog Radar: track Anthropic releases and documentation changes
CREATE TABLE changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('breaking', 'important', 'informational')),
  source_url TEXT UNIQUE NOT NULL,
  affected_tools TEXT[] NOT NULL DEFAULT '{}',
  version TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: anon can read all entries, service_role has full access
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_changelog"
  ON changelog_entries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "service_full_changelog"
  ON changelog_entries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for timeline ordering
CREATE INDEX idx_changelog_published_at ON changelog_entries (published_at DESC);
