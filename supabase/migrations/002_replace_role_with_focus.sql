-- Replace tags_role with tags_focus on the content table.
-- tags_focus captures cross-cutting concerns like security, prompt_engineering,
-- governance, cost_optimization — replacing the old role-based taxonomy.

ALTER TABLE content RENAME COLUMN tags_role TO tags_focus;
