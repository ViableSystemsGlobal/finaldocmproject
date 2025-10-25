-- Add sample recipients to your campaign for testing
-- Run this AFTER running the safe table creation script

-- First, let's see what campaigns exist
SELECT 
    id, 
    name, 
    status, 
    created_at
FROM public.comms_campaigns 
ORDER BY created_at DESC 
LIMIT 5;

-- Replace 'YOUR_CAMPAIGN_ID_HERE' with the actual campaign ID from above
-- You can find the ID in the results of the query above

-- For example, if your campaign ID is: 123e4567-e89b-12d3-a456-426614174000
-- Then replace the value below:

DO $$
DECLARE
    campaign_uuid UUID;
BEGIN
    -- Get the most recent campaign ID
    SELECT id INTO campaign_uuid 
    FROM public.comms_campaigns 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Only proceed if we found a campaign
    IF campaign_uuid IS NOT NULL THEN
        -- Insert sample recipients
        INSERT INTO public.comms_recipients (campaign_id, to_address, status, contact_id, created_at, updated_at)
        VALUES 
            (campaign_uuid, 'test1@example.com', 'pending', null, now(), now()),
            (campaign_uuid, 'test2@example.com', 'sent', null, now(), now()),
            (campaign_uuid, 'test3@example.com', 'failed', null, now(), now()),
            (campaign_uuid, 'admin@example.com', 'pending', null, now(), now()),
            (campaign_uuid, 'user@example.com', 'sent', null, now(), now())
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Added sample recipients to campaign: %', campaign_uuid;
    ELSE
        RAISE NOTICE 'No campaigns found. Please create a campaign first.';
    END IF;
END $$;

-- Show the results
SELECT 
    cr.id,
    cr.to_address,
    cr.status,
    cc.name as campaign_name,
    cr.created_at
FROM public.comms_recipients cr
JOIN public.comms_campaigns cc ON cr.campaign_id = cc.id
ORDER BY cr.created_at DESC
LIMIT 10;

-- Show count by status
SELECT 
    status,
    COUNT(*) as count
FROM public.comms_recipients
GROUP BY status
ORDER BY status; 