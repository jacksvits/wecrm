-- Add parent_id columns to projects and tasks (hierarchy support)
ALTER TABLE projects ADD COLUMN parent_id TEXT;
ALTER TABLE tasks ADD COLUMN parent_id TEXT;

-- Create indexes for performance
CREATE INDEX projects_parent_id_idx ON projects(parent_id);
CREATE INDEX tasks_parent_id_idx ON tasks(parent_id);
