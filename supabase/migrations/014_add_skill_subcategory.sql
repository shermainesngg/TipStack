-- Add freeform subcategory to skills for granular grouping within each type
ALTER TABLE skills ADD COLUMN IF NOT EXISTS skill_subcategory TEXT;

CREATE INDEX idx_skills_type_subcategory ON skills (skill_type, skill_subcategory);
