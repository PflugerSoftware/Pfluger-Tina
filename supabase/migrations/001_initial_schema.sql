-- TINA 360 Image Viewer - Database Schema
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- 1. Create Tables
-- ============================================

-- Projects table
CREATE TABLE IF NOT EXISTS tina_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Images table
CREATE TABLE IF NOT EXISTS tina_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES tina_projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT 'image/jpeg',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tina_projects_user_email ON tina_projects(user_email);
CREATE INDEX IF NOT EXISTS idx_tina_projects_display_order ON tina_projects(display_order);
CREATE INDEX IF NOT EXISTS idx_tina_images_project_id ON tina_images(project_id);
CREATE INDEX IF NOT EXISTS idx_tina_images_display_order ON tina_images(display_order);

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE tina_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tina_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create RLS Policies
-- ============================================

-- Option A: Open access (for single-user or no-auth deployments)
-- These policies allow all operations. Suitable when auth is handled externally.

CREATE POLICY "Allow all operations on tina_projects" ON tina_projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tina_images" ON tina_images
  FOR ALL USING (true) WITH CHECK (true);

-- Option B: If you want to restrict by user_email (uncomment and use instead)
-- You would need to set up Supabase Auth and use auth.jwt()->>'email'
--
-- CREATE POLICY "Users can manage own projects" ON tina_projects
--   FOR ALL USING (user_email = auth.jwt()->>'email')
--   WITH CHECK (user_email = auth.jwt()->>'email');
--
-- CREATE POLICY "Users can manage images in own projects" ON tina_images
--   FOR ALL USING (
--     project_id IN (
--       SELECT id FROM tina_projects WHERE user_email = auth.jwt()->>'email'
--     )
--   )
--   WITH CHECK (
--     project_id IN (
--       SELECT id FROM tina_projects WHERE user_email = auth.jwt()->>'email'
--     )
--   );

-- ============================================
-- 5. Create Storage Bucket
-- ============================================

-- Run this in the Supabase Dashboard > Storage, or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('tina-images', 'tina-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public read access
CREATE POLICY "Public read access for tina-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'tina-images');

-- Storage policy: Allow authenticated uploads (or all uploads for open access)
CREATE POLICY "Allow uploads to tina-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'tina-images');

-- Storage policy: Allow deletions
CREATE POLICY "Allow deletions from tina-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'tina-images');

-- ============================================
-- 6. Updated_at Trigger (optional)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tina_projects_updated_at
  BEFORE UPDATE ON tina_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
