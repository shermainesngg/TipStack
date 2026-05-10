-- Add actionable fields to content table for Phase 1: Actionable Articles
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS practical_use_case TEXT,
  ADD COLUMN IF NOT EXISTS try_this TEXT;
