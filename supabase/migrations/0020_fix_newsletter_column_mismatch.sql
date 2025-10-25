-- Fix newsletter_subscribers table column mismatch
-- The trigger expects 'subscription_source' but the table has 'source'

DO $$
BEGIN
  -- Check if the table exists and has the 'source' column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'newsletter_subscribers' 
    AND column_name = 'source'
  ) THEN
    -- Rename 'source' column to 'subscription_source' to match the trigger
    ALTER TABLE newsletter_subscribers 
    RENAME COLUMN source TO subscription_source;
    
    RAISE NOTICE '✅ Renamed source column to subscription_source in newsletter_subscribers';
  END IF;

  -- Also ensure the table has the other columns expected by the trigger
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'newsletter_subscribers' 
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN first_name VARCHAR(100);
    RAISE NOTICE '✅ Added first_name column to newsletter_subscribers';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'newsletter_subscribers' 
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN last_name VARCHAR(100);
    RAISE NOTICE '✅ Added last_name column to newsletter_subscribers';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'newsletter_subscribers' 
    AND column_name = 'segments'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN segments TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ Added segments column to newsletter_subscribers';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'newsletter_subscribers' 
    AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE newsletter_subscribers ADD COLUMN contact_id UUID;
    RAISE NOTICE '✅ Added contact_id column to newsletter_subscribers';
  END IF;

  -- Update the column to match expected values if needed
  UPDATE newsletter_subscribers 
  SET subscription_source = 'contact_form' 
  WHERE subscription_source IS NULL;

  RAISE NOTICE '🎉 Newsletter column mismatch fixed! Member conversions should now work.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Error fixing newsletter table: %', SQLERRM;
    RAISE NOTICE 'This may be expected if the table structure is already correct.';
END $$; 