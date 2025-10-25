-- Fix email_queue table schema to match what the email service expects
-- Run this in your Supabase SQL editor

-- First, let's check what columns currently exist
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Check if email_queue table exists
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'email_queue'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE 'email_queue table exists, checking and adding missing columns...';
        
        -- Add missing columns if they don't exist
        
        -- subject column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'subject'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN subject TEXT;
            RAISE NOTICE 'Added subject column';
        END IF;
        
        -- html_body column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'html_body'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN html_body TEXT;
            RAISE NOTICE 'Added html_body column';
        END IF;
        
        -- text_body column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'text_body'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN text_body TEXT;
            RAISE NOTICE 'Added text_body column';
        END IF;
        
        -- from_address column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'from_address'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN from_address TEXT;
            RAISE NOTICE 'Added from_address column';
        END IF;
        
        -- attachments column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'attachments'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN attachments JSONB;
            RAISE NOTICE 'Added attachments column';
        END IF;
        
        -- metadata column (may already exist but ensure it's JSONB)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'metadata'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN metadata JSONB;
            RAISE NOTICE 'Added metadata column';
        END IF;
        
        -- max_attempts column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'max_attempts'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN max_attempts INTEGER DEFAULT 3;
            RAISE NOTICE 'Added max_attempts column';
        END IF;
        
        -- error_message column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'error_message'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN error_message TEXT;
            RAISE NOTICE 'Added error_message column';
        END IF;
        
        -- last_attempt_at column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'last_attempt_at'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN last_attempt_at TIMESTAMPTZ;
            RAISE NOTICE 'Added last_attempt_at column';
        END IF;
        
        -- next_attempt_at column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'next_attempt_at'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN next_attempt_at TIMESTAMPTZ;
            RAISE NOTICE 'Added next_attempt_at column';
        END IF;
        
        -- sent_at column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'sent_at'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN sent_at TIMESTAMPTZ;
            RAISE NOTICE 'Added sent_at column';
        END IF;
        
        -- updated_at column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.email_queue ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column';
        END IF;

        -- Set defaults and constraints for existing columns
        BEGIN
            ALTER TABLE public.email_queue ALTER COLUMN attempts SET DEFAULT 0;
            ALTER TABLE public.email_queue ALTER COLUMN max_attempts SET DEFAULT 3;
            ALTER TABLE public.email_queue ALTER COLUMN status SET DEFAULT 'pending';
            ALTER TABLE public.email_queue ALTER COLUMN created_at SET DEFAULT NOW();
            ALTER TABLE public.email_queue ALTER COLUMN updated_at SET DEFAULT NOW();
            
            -- Add NOT NULL constraints where appropriate
            ALTER TABLE public.email_queue ALTER COLUMN to_address SET NOT NULL;
            ALTER TABLE public.email_queue ALTER COLUMN status SET NOT NULL;
            
            RAISE NOTICE 'Updated column defaults and constraints';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Some column updates failed: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'email_queue table does not exist, creating it...';
        
        -- Create the complete table with all required columns
        CREATE TABLE public.email_queue (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            to_address TEXT NOT NULL,
            from_address TEXT NOT NULL,
            subject TEXT NOT NULL,
            html_body TEXT NOT NULL,
            text_body TEXT,
            attachments JSONB,
            metadata JSONB,
            status TEXT NOT NULL DEFAULT 'pending',
            attempts INTEGER NOT NULL DEFAULT 0,
            max_attempts INTEGER NOT NULL DEFAULT 3,
            error_message TEXT,
            last_attempt_at TIMESTAMPTZ,
            next_attempt_at TIMESTAMPTZ,
            sent_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            -- Add validation constraint for status
            CONSTRAINT valid_status CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled'))
        );
        
        -- Create index on status and next_attempt for efficient queue processing
        CREATE INDEX idx_email_queue_status_next_attempt ON public.email_queue(status, next_attempt_at)
        WHERE status IN ('pending', 'failed');
        
        RAISE NOTICE 'Created email_queue table with full schema';
    END IF;
END
$$;

-- Ensure RLS is enabled and policies are set
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to email_queue for authenticated users" ON public.email_queue;
DROP POLICY IF EXISTS "Allow insert access to email_queue for authenticated users" ON public.email_queue;
DROP POLICY IF EXISTS "Allow update access to email_queue for authenticated users" ON public.email_queue;
DROP POLICY IF EXISTS "Allow delete access to email_queue for authenticated users" ON public.email_queue;

-- Create new policies
CREATE POLICY "Allow read access to email_queue for authenticated users"
  ON public.email_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to email_queue for authenticated users"
  ON public.email_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to email_queue for authenticated users"
  ON public.email_queue FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete access to email_queue for authenticated users"
  ON public.email_queue FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_queue TO anon;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_email_queue_updated_at ON public.email_queue;

-- Create updated_at trigger
CREATE TRIGGER trigger_update_email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();

-- Force PostgREST to reload the schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Show final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'email_queue' 
ORDER BY ordinal_position; 