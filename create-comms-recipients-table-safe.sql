-- Create comms_recipients table for the new comms system (SAFE VERSION)
-- Run this in Supabase Dashboard > SQL Editor

-- Create the comms_recipients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comms_recipients (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references public.comms_campaigns(id) on delete cascade,
  contact_id      uuid references public.contacts(id),
  to_address      text not null,
  variables       jsonb,
  status          text not null default 'pending',
  last_error      text,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Enable RLS (safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_recipients'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.comms_recipients ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for comms_recipients (safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_recipients' 
        AND policyname = 'Allow read access to comms_recipients for authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR SELECT
          TO authenticated
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_recipients' 
        AND policyname = 'Allow insert access to comms_recipients for authenticated users'
    ) THEN
        CREATE POLICY "Allow insert access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR INSERT
          TO authenticated
          WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_recipients' 
        AND policyname = 'Allow update access to comms_recipients for authenticated users'
    ) THEN
        CREATE POLICY "Allow update access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR UPDATE
          TO authenticated
          USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'comms_recipients' 
        AND policyname = 'Allow delete access to comms_recipients for authenticated users'
    ) THEN
        CREATE POLICY "Allow delete access to comms_recipients for authenticated users"
          ON public.comms_recipients FOR DELETE
          TO authenticated
          USING (true);
    END IF;
END $$;

-- Create indexes for better performance (safe)
CREATE INDEX IF NOT EXISTS comms_recipients_campaign_id_idx ON public.comms_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS comms_recipients_status_idx ON public.comms_recipients(status);
CREATE INDEX IF NOT EXISTS comms_recipients_contact_id_idx ON public.comms_recipients(contact_id);

-- Create updated_at trigger (safe)
CREATE OR REPLACE FUNCTION update_comms_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comms_recipients_updated_at ON public.comms_recipients;
CREATE TRIGGER update_comms_recipients_updated_at
BEFORE UPDATE ON public.comms_recipients
FOR EACH ROW
EXECUTE PROCEDURE update_comms_recipients_updated_at();

-- Add missing columns to existing table if needed
DO $$
BEGIN
    -- Check if created_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comms_recipients' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.comms_recipients ADD COLUMN created_at timestamptz default now();
    END IF;

    -- Check if updated_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comms_recipients' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.comms_recipients ADD COLUMN updated_at timestamptz default now();
    END IF;
END $$;

-- Display what tables exist
SELECT 
    tablename as table_name,
    CASE WHEN rowsecurity THEN 'YES' ELSE 'NO' END as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('comms_campaigns', 'comms_templates', 'comms_recipients')
ORDER BY tablename;

-- Display completion message
SELECT 'Comms recipients table setup completed safely!' as message; 