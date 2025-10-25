-- Add collection fields to media_library table
ALTER TABLE public.media_library
ADD COLUMN IF NOT EXISTS collection_name TEXT,
ADD COLUMN IF NOT EXISTS collection_category TEXT,
ADD COLUMN IF NOT EXISTS collection_date DATE,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_collection_name ON public.media_library(collection_name);
CREATE INDEX IF NOT EXISTS idx_media_collection_category ON public.media_library(collection_category);
CREATE INDEX IF NOT EXISTS idx_media_collection_date ON public.media_library(collection_date);

-- Add constraints for service/program categories
ALTER TABLE public.media_library
ADD CONSTRAINT check_collection_category
CHECK (collection_category IN (
  'Sunday Service', 
  'Youth Ministry', 
  'Prayer Meeting',
  'Bible Study',
  'Community Outreach', 
  'Special Events', 
  'Baptisms', 
  'Fellowship',
  'Worship Night',
  'Missions',
  'Kids Ministry',
  'Mens Ministry',
  'Womens Ministry'
) OR collection_category IS NULL);

-- Update the media_library table to set a trigger for updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.uploaded_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated timestamps (optional, since we're using uploaded_at)
-- This is just for consistency in case we want to track updates separately
CREATE TRIGGER update_media_library_timestamp
    BEFORE UPDATE ON public.media_library
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at(); 