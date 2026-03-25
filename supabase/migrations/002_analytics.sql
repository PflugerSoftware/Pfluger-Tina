-- TINA Analytics - Track client image views
-- Run this migration in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tina_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES tina_projects(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES tina_images(id) ON DELETE CASCADE,
  image_filename TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tina_analytics_session ON tina_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_tina_analytics_project ON tina_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_tina_analytics_started ON tina_analytics(started_at);

ALTER TABLE tina_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on tina_analytics" ON tina_analytics
  FOR ALL USING (true) WITH CHECK (true);
