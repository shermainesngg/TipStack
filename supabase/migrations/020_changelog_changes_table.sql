-- Break individual changes out of changelog_entries into their own table
-- so each change can have its own category.

CREATE TABLE changelog_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changelog_entry_id UUID NOT NULL REFERENCES changelog_entries(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'new_feature', 'improvement', 'breaking_change', 'bug_fix', 'deprecation', 'performance'
  )),
  affected_tools TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_changelog_changes_entry ON changelog_changes(changelog_entry_id);

-- Migrate existing change bullets into the new table
INSERT INTO changelog_changes (changelog_entry_id, description, category, affected_tools)
SELECT
  ce.id,
  change_text::text,
  CASE ce.urgency
    WHEN 'breaking' THEN 'breaking_change'
    WHEN 'important' THEN 'new_feature'
    ELSE 'improvement'
  END,
  ce.affected_tools
FROM changelog_entries ce,
LATERAL jsonb_array_elements_text(ce.changes) AS change_text;

-- Drop columns that are now represented in the child table
ALTER TABLE changelog_entries DROP COLUMN IF EXISTS summary;
ALTER TABLE changelog_entries DROP COLUMN IF EXISTS urgency;
ALTER TABLE changelog_entries DROP COLUMN IF EXISTS changes;
ALTER TABLE changelog_entries DROP COLUMN IF EXISTS affected_tools;

-- RLS
ALTER TABLE changelog_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read changelog changes" ON changelog_changes FOR SELECT TO anon USING (true);
CREATE POLICY "Service write changelog changes" ON changelog_changes FOR ALL TO service_role USING (true);
