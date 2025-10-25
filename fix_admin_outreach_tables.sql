-- =====================================================
-- FIX ADMIN OUTREACH TABLES
-- Adds missing columns and fixes existing table structure
-- =====================================================

-- First, let's check what columns exist and add missing ones

-- Fix website_messages table
DO $$
BEGIN
    -- Add submitted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'website_messages' AND column_name = 'submitted_at') THEN
        ALTER TABLE website_messages ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added submitted_at column to website_messages';
    END IF;

    -- Add newsletter_opt_in column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'website_messages' AND column_name = 'newsletter_opt_in') THEN
        ALTER TABLE website_messages ADD COLUMN newsletter_opt_in BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added newsletter_opt_in column to website_messages';
    END IF;

    -- Add is_prayer_request column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'website_messages' AND column_name = 'is_prayer_request') THEN
        ALTER TABLE website_messages ADD COLUMN is_prayer_request BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added is_prayer_request column to website_messages';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'website_messages' AND column_name = 'status') THEN
        ALTER TABLE website_messages ADD COLUMN status VARCHAR(50) DEFAULT 'new';
        RAISE NOTICE '✅ Added status column to website_messages';
    END IF;

    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'website_messages' AND column_name = 'assigned_to') THEN
        ALTER TABLE website_messages ADD COLUMN assigned_to VARCHAR(255);
        RAISE NOTICE '✅ Added assigned_to column to website_messages';
    END IF;

    -- Add response_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'website_messages' AND column_name = 'response_notes') THEN
        ALTER TABLE website_messages ADD COLUMN response_notes TEXT;
        RAISE NOTICE '✅ Added response_notes column to website_messages';
    END IF;

    -- Add responded_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'website_messages' AND column_name = 'responded_at') THEN
        ALTER TABLE website_messages ADD COLUMN responded_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added responded_at column to website_messages';
    END IF;
END $$;

-- Fix prayer_requests table
DO $$
BEGIN
    -- Check if prayer_requests table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
        CREATE TABLE prayer_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          subject VARCHAR(500) NOT NULL,
          message TEXT NOT NULL,
          category VARCHAR(100) DEFAULT 'Prayer Request',
          newsletter_opt_in BOOLEAN DEFAULT false,
          urgency VARCHAR(50) DEFAULT 'normal',
          is_confidential BOOLEAN DEFAULT true,
          source_submission_id UUID,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(50) DEFAULT 'new',
          assigned_pastor VARCHAR(255),
          pastoral_notes TEXT,
          prayer_updates TEXT[],
          followed_up_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created prayer_requests table';
    ELSE
        -- Add missing columns to existing prayer_requests table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'submitted_at') THEN
            ALTER TABLE prayer_requests ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE '✅ Added submitted_at column to prayer_requests';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'source_submission_id') THEN
            ALTER TABLE prayer_requests ADD COLUMN source_submission_id UUID;
            RAISE NOTICE '✅ Added source_submission_id column to prayer_requests';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'urgency') THEN
            ALTER TABLE prayer_requests ADD COLUMN urgency VARCHAR(50) DEFAULT 'normal';
            RAISE NOTICE '✅ Added urgency column to prayer_requests';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'is_confidential') THEN
            ALTER TABLE prayer_requests ADD COLUMN is_confidential BOOLEAN DEFAULT true;
            RAISE NOTICE '✅ Added is_confidential column to prayer_requests';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'assigned_pastor') THEN
            ALTER TABLE prayer_requests ADD COLUMN assigned_pastor VARCHAR(255);
            RAISE NOTICE '✅ Added assigned_pastor column to prayer_requests';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'pastoral_notes') THEN
            ALTER TABLE prayer_requests ADD COLUMN pastoral_notes TEXT;
            RAISE NOTICE '✅ Added pastoral_notes column to prayer_requests';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'prayer_updates') THEN
            ALTER TABLE prayer_requests ADD COLUMN prayer_updates TEXT[];
            RAISE NOTICE '✅ Added prayer_updates column to prayer_requests';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'prayer_requests' AND column_name = 'followed_up_at') THEN
            ALTER TABLE prayer_requests ADD COLUMN followed_up_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE '✅ Added followed_up_at column to prayer_requests';
        END IF;
    END IF;
END $$;

-- Create newsletter_subscribers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers') THEN
        CREATE TABLE newsletter_subscribers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          phone VARCHAR(50),
          subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(50) DEFAULT 'active',
          source VARCHAR(100) DEFAULT 'contact_form',
          preferences JSONB DEFAULT '{}',
          last_email_sent TIMESTAMP WITH TIME ZONE,
          unsubscribed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✅ Created newsletter_subscribers table';
    END IF;
END $$;

-- Update existing records to have submitted_at = created_at if submitted_at is null
UPDATE website_messages 
SET submitted_at = created_at 
WHERE submitted_at IS NULL;

UPDATE prayer_requests 
SET submitted_at = created_at 
WHERE submitted_at IS NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prayer_requests' AND column_name = 'created_at');

-- Create indexes if they don't exist
DO $$
BEGIN
    -- Website Messages indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_website_messages_status') THEN
        CREATE INDEX idx_website_messages_status ON website_messages(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_website_messages_submitted_at') THEN
        CREATE INDEX idx_website_messages_submitted_at ON website_messages(submitted_at DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_website_messages_email') THEN
        CREATE INDEX idx_website_messages_email ON website_messages(email);
    END IF;

    -- Prayer Requests indexes (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prayer_requests_status') THEN
            CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_prayer_requests_submitted_at') THEN
            CREATE INDEX idx_prayer_requests_submitted_at ON prayer_requests(submitted_at DESC);
        END IF;
    END IF;

    -- Newsletter indexes (only if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_newsletter_email') THEN
            CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_newsletter_status') THEN
            CREATE INDEX idx_newsletter_status ON newsletter_subscribers(status);
        END IF;
    END IF;

    RAISE NOTICE '✅ All indexes created successfully';
END $$;

-- Enable RLS and create policies
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE website_messages ENABLE ROW LEVEL SECURITY;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
        ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers') THEN
        ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Drop existing policies if they exist and recreate them
    DROP POLICY IF EXISTS "Service role insert website_messages" ON website_messages;
    DROP POLICY IF EXISTS "Admin full access to website_messages" ON website_messages;
    
    CREATE POLICY "Service role insert website_messages" ON website_messages
      FOR INSERT WITH CHECK (true);
    
    CREATE POLICY "Admin full access to website_messages" ON website_messages
      FOR ALL USING (auth.role() = 'authenticated');

    -- Prayer requests policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
        DROP POLICY IF EXISTS "Service role insert prayer_requests" ON prayer_requests;
        DROP POLICY IF EXISTS "Admin full access to prayer_requests" ON prayer_requests;
        
        CREATE POLICY "Service role insert prayer_requests" ON prayer_requests
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Admin full access to prayer_requests" ON prayer_requests
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Newsletter policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers') THEN
        DROP POLICY IF EXISTS "Service role insert newsletter_subscribers" ON newsletter_subscribers;
        DROP POLICY IF EXISTS "Admin full access to newsletter_subscribers" ON newsletter_subscribers;
        
        CREATE POLICY "Service role insert newsletter_subscribers" ON newsletter_subscribers
          FOR INSERT WITH CHECK (true);
        
        CREATE POLICY "Admin full access to newsletter_subscribers" ON newsletter_subscribers
          FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    RAISE NOTICE '✅ RLS policies configured successfully';
END $$;

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
DROP TRIGGER IF EXISTS update_website_messages_updated_at ON website_messages;
CREATE TRIGGER update_website_messages_updated_at 
  BEFORE UPDATE ON website_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prayer_requests') THEN
        DROP TRIGGER IF EXISTS update_prayer_requests_updated_at ON prayer_requests;
        CREATE TRIGGER update_prayer_requests_updated_at 
          BEFORE UPDATE ON prayer_requests 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscribers') THEN
        DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
        CREATE TRIGGER update_newsletter_subscribers_updated_at 
          BEFORE UPDATE ON newsletter_subscribers 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ADMIN OUTREACH TABLES FIXED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed website_messages table structure';
  RAISE NOTICE '✅ Fixed prayer_requests table structure';
  RAISE NOTICE '✅ Created newsletter_subscribers table';
  RAISE NOTICE '✅ Added all missing columns';
  RAISE NOTICE '✅ Created indexes for performance';
  RAISE NOTICE '✅ Configured RLS policies';
  RAISE NOTICE '✅ Added auto-timestamp triggers';
  RAISE NOTICE '';
  RAISE NOTICE 'Contact form API should now work without errors!';
  RAISE NOTICE 'Test the contact form to verify everything is working.';
END $$; 