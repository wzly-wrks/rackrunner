-- Create migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing migrations
INSERT INTO schema_migrations (version, applied_at)
VALUES 
  ('001_init.sql', NOW()),
  ('002_add_indexes.sql', NOW()),
  ('003_add_migration_tracking.sql', NOW())
ON CONFLICT (version) DO NOTHING;