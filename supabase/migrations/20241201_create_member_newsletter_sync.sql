-- Create function to automatically sync new members to newsletter
CREATE OR REPLACE FUNCTION sync_member_to_newsletter()
RETURNS TRIGGER AS $$
DECLARE
    contact_record RECORD;
    existing_subscriber_id UUID;
BEGIN
    -- Only process if this is a new member record
    IF TG_OP = 'INSERT' THEN
        -- Get the contact details
        SELECT id, first_name, last_name, email, lifecycle
        INTO contact_record
        FROM contacts 
        WHERE id = NEW.contact_id 
        AND email IS NOT NULL 
        AND email != '';
        
        -- If contact found and has email
        IF FOUND AND contact_record.email IS NOT NULL THEN
            -- Check if already a newsletter subscriber
            SELECT id INTO existing_subscriber_id
            FROM newsletter_subscribers
            WHERE email = contact_record.email
            AND status = 'active';
            
            -- If not already a subscriber, create one
            IF NOT FOUND THEN
                INSERT INTO newsletter_subscribers (
                    email,
                    first_name,
                    last_name,
                    status,
                    segments,
                    subscription_source,
                    contact_id,
                    subscribed_at,
                    created_at
                ) VALUES (
                    contact_record.email,
                    contact_record.first_name,
                    contact_record.last_name,
                    'active',
                    ARRAY['Members'],
                    'auto_sync',
                    contact_record.id,
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Auto-synced new member % to newsletter subscribers', contact_record.email;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on members table
DROP TRIGGER IF EXISTS trigger_sync_member_to_newsletter ON members;
CREATE TRIGGER trigger_sync_member_to_newsletter
    AFTER INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION sync_member_to_newsletter();

-- Also create a function to handle contact lifecycle changes
CREATE OR REPLACE FUNCTION sync_contact_lifecycle_to_newsletter()
RETURNS TRIGGER AS $$
DECLARE
    existing_subscriber_id UUID;
    member_record RECORD;
BEGIN
    -- Only process if lifecycle changed to 'member' or member_status changed to 'member'
    IF TG_OP = 'UPDATE' AND (
        (OLD.lifecycle != 'member' AND NEW.lifecycle = 'member') OR
        (COALESCE(OLD.member_status, '') != 'member' AND NEW.member_status = 'member')
    ) THEN
        -- Check if contact has email
        IF NEW.email IS NOT NULL AND NEW.email != '' THEN
            -- Check if already a newsletter subscriber
            SELECT id INTO existing_subscriber_id
            FROM newsletter_subscribers
            WHERE email = NEW.email
            AND status = 'active';
            
            -- If not already a subscriber, create one
            IF NOT FOUND THEN
                INSERT INTO newsletter_subscribers (
                    email,
                    first_name,
                    last_name,
                    status,
                    segments,
                    subscription_source,
                    contact_id,
                    subscribed_at,
                    created_at
                ) VALUES (
                    NEW.email,
                    NEW.first_name,
                    NEW.last_name,
                    'active',
                    ARRAY['Members'],
                    'auto_sync',
                    NEW.id,
                    NOW(),
                    NOW()
                );
                
                RAISE NOTICE 'Auto-synced contact % (lifecycle/status change) to newsletter subscribers', NEW.email;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contacts table for lifecycle changes
DROP TRIGGER IF EXISTS trigger_sync_contact_lifecycle_to_newsletter ON contacts;
CREATE TRIGGER trigger_sync_contact_lifecycle_to_newsletter
    AFTER UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION sync_contact_lifecycle_to_newsletter();

-- Create settings table for auto-sync configuration
CREATE TABLE IF NOT EXISTS newsletter_auto_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enabled BOOLEAN DEFAULT true,
    default_segments TEXT[] DEFAULT ARRAY['Members'],
    sync_new_members BOOLEAN DEFAULT true,
    sync_lifecycle_changes BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO newsletter_auto_sync_settings (enabled, default_segments, sync_new_members, sync_lifecycle_changes)
VALUES (true, ARRAY['Members'], true, true)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for settings table
ALTER TABLE newsletter_auto_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on newsletter_auto_sync_settings" ON newsletter_auto_sync_settings
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON newsletter_auto_sync_settings TO anon, authenticated, service_role; 