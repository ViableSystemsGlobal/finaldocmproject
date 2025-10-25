-- Handle email queue table creation/modification conditionally
DO $$
BEGIN
    -- Check if email_queue table already exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_queue') THEN
        -- Table exists, check if we need to add missing columns
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'message_id'
        ) THEN
            -- Add message_id column if it doesn't exist
            ALTER TABLE public.email_queue ADD COLUMN message_id UUID;
        END IF;

        -- Check if we need to add variables column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_queue' AND column_name = 'variables'
        ) THEN
            -- Add variables column if it doesn't exist
            ALTER TABLE public.email_queue ADD COLUMN variables JSONB;
        END IF;
    ELSE
        -- Create new table
        CREATE TABLE public.email_queue (
          id              uuid        primary key default gen_random_uuid(),
          message_id      uuid        not null,
          to_address      text        not null,
          variables       jsonb,
          status          text        not null default 'pending',
          attempts        int         not null default 0,
          last_error      text,
          created_at      timestamptz not null default now()
        );

        -- Enable RLS
        ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Add indexes conditionally
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_queue' AND indexname = 'email_queue_status_idx'
    ) THEN
        CREATE INDEX email_queue_status_idx ON public.email_queue(status);
    END IF;

    -- Only create message_id index if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_queue' AND column_name = 'message_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'email_queue' AND indexname = 'email_queue_message_id_idx'
        ) THEN
            CREATE INDEX email_queue_message_id_idx ON public.email_queue(message_id);
        END IF;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_queue' AND indexname = 'email_queue_created_at_idx'
    ) THEN
        CREATE INDEX email_queue_created_at_idx ON public.email_queue(created_at);
    END IF;

    -- Add comments
    COMMENT ON TABLE public.email_queue IS 'Queue for emails to be sent via SMTP or other providers';
    
    -- Add column comments conditionally
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_queue' AND column_name = 'message_id'
    ) THEN
        COMMENT ON COLUMN public.email_queue.message_id IS 'Reference to campaign or other message identifier';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_queue' AND column_name = 'variables'
    ) THEN
        COMMENT ON COLUMN public.email_queue.variables IS 'Template variables for email content';
    END IF;

    COMMENT ON COLUMN public.email_queue.status IS 'Current status: pending, sent, failed';
END
$$;

-- Create RLS policy conditionally
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'email_queue' AND policyname = 'Communications staff can manage email queue'
    ) THEN
        CREATE POLICY "Communications staff can manage email queue"
          ON public.email_queue
          USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'communications');
    END IF;
END
$$;

-- Create function to get email queue stats conditionally
CREATE OR REPLACE FUNCTION public.get_email_queue_stats(message_uuid uuid)
RETURNS TABLE (
  status text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Only use message_id if the column exists
  SELECT status, count(id)
  FROM public.email_queue
  WHERE (
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'email_queue' AND column_name = 'message_id'
      ) 
      THEN message_id = message_uuid
      ELSE true -- Return all records if message_id column doesn't exist
    END
  )
  GROUP BY status;
$$; 