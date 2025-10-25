-- Fix email_queue table structure for workflow automation
DO $$
BEGIN
    -- Check if email_queue table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue') THEN
        RAISE NOTICE 'email_queue table exists, adding missing columns...';
        
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
        
        -- metadata column (this is the key one causing the error!)
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

        -- Update existing column defaults and constraints
        BEGIN
            -- Only set defaults if columns exist and don't already have the right defaults
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_queue' AND column_name = 'attempts') THEN
                ALTER TABLE public.email_queue ALTER COLUMN attempts SET DEFAULT 0;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_queue' AND column_name = 'max_attempts') THEN
                ALTER TABLE public.email_queue ALTER COLUMN max_attempts SET DEFAULT 3;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_queue' AND column_name = 'status') THEN
                ALTER TABLE public.email_queue ALTER COLUMN status SET DEFAULT 'pending';
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_queue' AND column_name = 'created_at') THEN
                ALTER TABLE public.email_queue ALTER COLUMN created_at SET DEFAULT NOW();
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_queue' AND column_name = 'updated_at') THEN
                ALTER TABLE public.email_queue ALTER COLUMN updated_at SET DEFAULT NOW();
            END IF;
            
            RAISE NOTICE 'Updated column defaults';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Some column default updates failed: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE 'email_queue table does not exist, creating it with full schema...';
        
        -- Create the complete table with all required columns
        CREATE TABLE public.email_queue (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            to_address TEXT NOT NULL,
            from_address TEXT,
            subject TEXT,
            html_body TEXT,
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

-- Ensure RLS is enabled
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'email_queue' AND policyname = 'Allow authenticated users to manage email queue'
    ) THEN
        CREATE POLICY "Allow authenticated users to manage email queue"
        ON public.email_queue FOR ALL
        TO authenticated
        USING (true);
    END IF;
END
$$;

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

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_update_email_queue_updated_at ON public.email_queue;
CREATE TRIGGER trigger_update_email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_queue_updated_at();

-- Create additional helpful indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_metadata_gin ON public.email_queue USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_email_queue_to_address ON public.email_queue(to_address);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);

COMMENT ON TABLE public.email_queue IS 'Queue for emails to be sent with workflow automation support';
COMMENT ON COLUMN public.email_queue.metadata IS 'JSON metadata for tracking email context, templates, and automation'; 