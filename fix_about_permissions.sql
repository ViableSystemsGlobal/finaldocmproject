-- Fix RLS permissions for about page API access
-- This allows the public website to read published pages and their sections

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to published pages" ON public.pages;
DROP POLICY IF EXISTS "Allow public read access to page sections of published pages" ON public.page_sections;

-- Allow public access to read published pages
CREATE POLICY "Allow public read access to published pages"
  ON public.pages
  FOR SELECT
  USING (published_at IS NOT NULL);

-- Allow public access to read sections of published pages
CREATE POLICY "Allow public read access to page sections of published pages"
  ON public.page_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages 
      WHERE pages.id = page_sections.page_id 
      AND pages.published_at IS NOT NULL
    )
  );

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_published_at ON public.pages(published_at);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON public.page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_order ON public.page_sections("order"); 