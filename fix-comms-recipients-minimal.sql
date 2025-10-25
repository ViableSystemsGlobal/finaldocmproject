-- Minimal fix for comms_recipients table
-- Run this in Supabase Dashboard > SQL Editor

-- Just ensure the table exists with the right structure
CREATE TABLE IF NOT EXISTS public.comms_recipients (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid,
  contact_id      uuid,
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

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add campaign_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'comms_recipients_campaign_id_fkey'
        AND table_name = 'comms_recipients'
    ) THEN
        ALTER TABLE public.comms_recipients 
        ADD CONSTRAINT comms_recipients_campaign_id_fkey 
        FOREIGN KEY (campaign_id) REFERENCES public.comms_campaigns(id) ON DELETE CASCADE;
    END IF;

    -- Add contact_id foreign key if contacts table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contacts' AND schemaname = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'comms_recipients_contact_id_fkey'
            AND table_name = 'comms_recipients'
        ) THEN
            ALTER TABLE public.comms_recipients 
            ADD CONSTRAINT comms_recipients_contact_id_fkey 
            FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
        END IF;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS comms_recipients_campaign_id_idx ON public.comms_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS comms_recipients_status_idx ON public.comms_recipients(status);
CREATE INDEX IF NOT EXISTS comms_recipients_contact_id_idx ON public.comms_recipients(contact_id);

-- Enable RLS if not already enabled
ALTER TABLE public.comms_recipients ENABLE ROW LEVEL SECURITY;

-- Check what we have so far
SELECT 
    tablename as table_name,
    CASE WHEN rowsecurity THEN 'YES' ELSE 'NO' END as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('comms_campaigns', 'comms_templates', 'comms_recipients')
ORDER BY tablename;

-- Now add sample recipients to the most recent campaign
DO $$
DECLARE
    campaign_uuid UUID;
    recipient_count INTEGER;
BEGIN
    -- Get the most recent campaign ID
    SELECT id INTO campaign_uuid 
    FROM public.comms_campaigns 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Check if we already have recipients for this campaign
    IF campaign_uuid IS NOT NULL THEN
        SELECT COUNT(*) INTO recipient_count
        FROM public.comms_recipients 
        WHERE campaign_id = campaign_uuid;
        
        -- Only add recipients if none exist
        IF recipient_count = 0 THEN
            INSERT INTO public.comms_recipients (campaign_id, to_address, status, contact_id, created_at, updated_at)
            VALUES 
                (campaign_uuid, 'test1@example.com', 'pending', null, now(), now()),
                (campaign_uuid, 'test2@example.com', 'sent', null, now(), now()),
                (campaign_uuid, 'test3@example.com', 'failed', null, now(), now()),
                (campaign_uuid, 'admin@example.com', 'pending', null, now(), now()),
                (campaign_uuid, 'user@example.com', 'sent', null, now(), now());
            
            RAISE NOTICE 'Added 5 sample recipients to campaign: %', campaign_uuid;
        ELSE
            RAISE NOTICE 'Campaign % already has % recipients', campaign_uuid, recipient_count;
        END IF;
    ELSE
        RAISE NOTICE 'No campaigns found. Please create a campaign first.';
    END IF;
END $$;

-- Show the final results
SELECT 'Setup completed! Here are your recipients:' as message;

SELECT 
    cr.to_address,
    cr.status,
    cc.name as campaign_name,
    cr.created_at
FROM public.comms_recipients cr
JOIN public.comms_campaigns cc ON cr.campaign_id = cc.id
ORDER BY cr.created_at DESC
LIMIT 10;

-- Show count by status for verification
SELECT 
    'Recipients by status:' as summary,
    status,
    COUNT(*) as count
FROM public.comms_recipients
GROUP BY status
ORDER BY status; 