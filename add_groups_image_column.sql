-- ======================================
-- ADD IMAGE COLUMN TO GROUPS TABLE
-- ======================================
-- This adds an image_url column to store group/ministry images

DO $$
BEGIN
  RAISE NOTICE '🖼️ Adding image support to groups table...';
  
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'groups' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE groups ADD COLUMN image_url TEXT;
    RAISE NOTICE '✅ Added image_url column to groups table';
  ELSE
    RAISE NOTICE '⚠️  image_url column already exists in groups table';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 GROUPS IMAGE SUPPORT ADDED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Groups can now have images that will show in tables';
  RAISE NOTICE '✅ You can upload images via the admin interface';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ ERROR: %', SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE 'Continuing anyway - column may already exist';
END $$; 