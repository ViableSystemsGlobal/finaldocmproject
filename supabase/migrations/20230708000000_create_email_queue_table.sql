-- Migration: Create Email Queue Table
-- Handles storing, tracking, and managing emails for reliable delivery

-- Check if email_queue table exists before creating it
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue') THEN
        -- Create Email Queue Table
        CREATE TABLE email_queue (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
        CREATE INDEX idx_email_queue_status_next_attempt ON email_queue(status, next_attempt_at)
        WHERE status IN ('pending', 'failed');
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_tracking') THEN
        -- Create track table for opens and clicks
        CREATE TABLE email_tracking (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email_id UUID NOT NULL REFERENCES email_queue(id),
          event_type TEXT NOT NULL,
          event_data JSONB,
          user_agent TEXT,
          ip_address TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          
          -- Add validation constraint for event_type
          CONSTRAINT valid_event_type CHECK (event_type IN ('open', 'click', 'bounce', 'complaint', 'delivery'))
        );

        -- Create index on email_id for faster lookups
        CREATE INDEX idx_email_tracking_email_id ON email_tracking(email_id);
    END IF;
END
$$;

-- Add RLS policies for email_queue if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue') THEN
        -- Enable RLS on email_queue
        ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
        
        -- First check if the admin_users table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
            -- Add policy using admin_users
            DROP POLICY IF EXISTS "Email queue admin access" ON email_queue;
            CREATE POLICY "Email queue admin access" ON email_queue 
              FOR ALL TO authenticated 
              USING (auth.uid() IN (
                SELECT user_id FROM admin_users
              ));
        ELSE
            -- Create a more permissive policy if admin_users doesn't exist
            DROP POLICY IF EXISTS "Email queue all access" ON email_queue;
            CREATE POLICY "Email queue all access" ON email_queue 
              FOR ALL TO authenticated 
              USING (true);
        END IF;
    END IF;
END
$$;

-- Add RLS policies for email_tracking if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_tracking') THEN
        -- Enable RLS on email_tracking
        ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
        
        -- First check if the admin_users table exists
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
            -- Add policy using admin_users
            DROP POLICY IF EXISTS "Email tracking admin access" ON email_tracking;
            CREATE POLICY "Email tracking admin access" ON email_tracking 
              FOR ALL TO authenticated 
              USING (auth.uid() IN (
                SELECT user_id FROM admin_users
              ));
        ELSE
            -- Create a more permissive policy if admin_users doesn't exist
            DROP POLICY IF EXISTS "Email tracking all access" ON email_tracking;
            CREATE POLICY "Email tracking all access" ON email_tracking 
              FOR ALL TO authenticated 
              USING (true);
        END IF;
    END IF;
END
$$;

-- Create the function outside of DO block to avoid nesting issues
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Create updated_at trigger for email_queue if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_email_queue_updated_at'
    ) AND EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'email_queue'
    ) THEN
        CREATE TRIGGER trigger_update_email_queue_updated_at
        BEFORE UPDATE ON email_queue
        FOR EACH ROW
        EXECUTE PROCEDURE update_email_queue_updated_at();
    END IF;
END
$$; 