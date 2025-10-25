-- Fix collection category constraint to allow spaces
ALTER TABLE public.media_library 
DROP CONSTRAINT IF EXISTS check_collection_category;

-- Re-add constraint with proper spacing
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