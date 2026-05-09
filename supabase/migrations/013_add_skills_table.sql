-- Skills table for structured GitHub skill metadata
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT UNIQUE NOT NULL,
  author TEXT NOT NULL,
  skill_type TEXT NOT NULL CHECK (skill_type IN (
    'design_systems', 'claude_md_rules', 'mcp_tools', 'cli_tools',
    'workflow_automation', 'testing_qa', 'code_generation', 'documentation'
  )),
  stars INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ,
  install_command TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  readme_excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read active skills"
  ON skills FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Service role full access on skills"
  ON skills FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_skills_skill_type ON skills (skill_type);
CREATE INDEX idx_skills_status ON skills (status) WHERE status = 'active';
CREATE INDEX idx_skills_stars ON skills (stars DESC);

-- FK from content to skills
ALTER TABLE content ADD COLUMN IF NOT EXISTS skill_id UUID REFERENCES skills(id);
CREATE INDEX idx_content_skill_id ON content (skill_id) WHERE skill_id IS NOT NULL;

-- Add 'github' to sources_log platform check constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sources_log_platform_check'
  ) THEN
    ALTER TABLE sources_log DROP CONSTRAINT sources_log_platform_check;
    ALTER TABLE sources_log ADD CONSTRAINT sources_log_platform_check
      CHECK (platform IN ('youtube', 'reddit', 'twitter', 'news', 'docs', 'github'));
  END IF;
END $$;
