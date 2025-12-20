-- ============================================
-- SQL Migration: Create Movies Table
-- ============================================
-- Run this script in Supabase SQL Editor
-- Steps:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New query"
-- 3. Copy and paste this entire file
-- 4. Click "Run" or press Ctrl+Enter
-- ============================================

-- Drop table if exists (optional - uncomment if you want to start fresh)
-- DROP TABLE IF EXISTS movies CASCADE;

-- Create movies table (matching DataMovie.csv structure)
CREATE TABLE IF NOT EXISTS movies (
  slug TEXT PRIMARY KEY,
  judul TEXT,
  url TEXT,
  tahun TEXT,
  genre TEXT,
  rating NUMERIC,
  quality TEXT,
  durasi TEXT,
  negara TEXT,
  sutradara TEXT,
  "cast" TEXT,
  jumlah_cast INTEGER DEFAULT 0,
  sinopsis TEXT,
  poster_url TEXT,
  votes NUMERIC,
  release_date TEXT,
  hydrax_servers TEXT,
  turbovip_servers TEXT,
  p2p_servers TEXT,
  cast_servers TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movies_judul ON movies(judul);
CREATE INDEX IF NOT EXISTS idx_movies_tahun ON movies(tahun);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies USING gin(to_tsvector('english', genre));
CREATE INDEX IF NOT EXISTS idx_movies_slug ON movies(slug);

-- Enable Row Level Security (RLS) - optional
-- Uncomment if you want to enable RLS
-- ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (if RLS is enabled)
-- Uncomment if you enabled RLS above
-- DROP POLICY IF EXISTS "Allow public read access" ON movies;
-- CREATE POLICY "Allow public read access" ON movies
--   FOR SELECT USING (true);

-- Verify table creation
SELECT 
  'Table created successfully!' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'movies';

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'movies'
ORDER BY ordinal_position;

