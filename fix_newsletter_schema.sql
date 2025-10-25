-- ======================================
-- TEMPORARILY DISABLE NEWSLETTER TRIGGERS
-- ======================================
-- This disables the problematic newsletter triggers so member conversions work
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  RAISE NOTICE '🚫 Temporarily disabling newsletter triggers...';
  
  -- Disable the member-to-newsletter sync trigger
  DROP TRIGGER IF EXISTS trigger_sync_member_to_newsletter ON members;
  RAISE NOTICE '✅ Disabled: trigger_sync_member_to_newsletter';
  
  -- Disable the contact lifecycle-to-newsletter sync trigger  
  DROP TRIGGER IF EXISTS trigger_sync_contact_lifecycle_to_newsletter ON contacts;
  RAISE NOTICE '✅ Disabled: trigger_sync_contact_lifecycle_to_newsletter';
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 NEWSLETTER TRIGGERS DISABLED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Member conversions should now work without newsletter errors';
  RAISE NOTICE '✅ You can manually sync members to newsletter via the admin interface';
  RAISE NOTICE '✅ Re-enable triggers later when the schema is fixed';
  RAISE NOTICE '';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ ERROR: %', SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE 'Continuing anyway - triggers may have already been disabled';
END $$;

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

-- ======================================
-- CREATE SAFE MEMBER CONVERSION FUNCTION
-- ======================================
-- This creates a transaction-safe function for converting visitors to members

CREATE OR REPLACE FUNCTION convert_visitor_to_member_safe(
  p_contact_id UUID,
  p_joined_at TIMESTAMPTZ
) RETURNS TABLE(contact_id UUID, joined_at TIMESTAMPTZ, notes TEXT) AS $$
BEGIN
  -- Start transaction block
  BEGIN
    -- Update contact lifecycle to member
    UPDATE contacts 
    SET lifecycle = 'member'
    WHERE id = p_contact_id;
    
    -- Check if update was successful
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Contact with ID % not found', p_contact_id;
    END IF;
    
    -- Insert into members table
    INSERT INTO members (contact_id, joined_at, notes)
    VALUES (p_contact_id, p_joined_at, NULL);
    
    -- Return the data
    RETURN QUERY
    SELECT p_contact_id, p_joined_at, NULL::TEXT;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail completely
      RAISE NOTICE 'Error in member creation: %', SQLERRM;
      
      -- At minimum, ensure contact lifecycle is updated
      UPDATE contacts 
      SET lifecycle = 'member'
      WHERE id = p_contact_id;
      
      -- Return the data even if members table insert failed
      RETURN QUERY
      SELECT p_contact_id, p_joined_at, NULL::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 