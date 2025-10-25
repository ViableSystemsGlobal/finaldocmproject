-- Add approval workflow support to group memberships
-- This migration adds approval-related columns and functions

-- Add approval columns to group_memberships table
ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.group_memberships ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now();

-- Add approval columns to discipleship_memberships table
ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.discipleship_memberships ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now();

-- Update status column constraints to support approval workflow
-- For group_memberships
ALTER TABLE public.group_memberships 
DROP CONSTRAINT IF EXISTS group_memberships_status_check;

ALTER TABLE public.group_memberships 
ADD CONSTRAINT group_memberships_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'approved', 'rejected'));

-- For discipleship_memberships  
ALTER TABLE public.discipleship_memberships 
DROP CONSTRAINT IF EXISTS discipleship_memberships_status_check;

ALTER TABLE public.discipleship_memberships 
ADD CONSTRAINT discipleship_memberships_status_check 
CHECK (status IN ('pending', 'active', 'inactive', 'approved', 'rejected'));

-- Add foreign key constraint for approved_by columns (references user_profiles)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Add foreign key for group_memberships.approved_by
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'group_memberships_approved_by_fkey'
        ) THEN
            ALTER TABLE public.group_memberships 
            ADD CONSTRAINT group_memberships_approved_by_fkey 
            FOREIGN KEY (approved_by) REFERENCES public.user_profiles(id);
        END IF;
        
        -- Add foreign key for discipleship_memberships.approved_by
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'discipleship_memberships_approved_by_fkey'
        ) THEN
            ALTER TABLE public.discipleship_memberships 
            ADD CONSTRAINT discipleship_memberships_approved_by_fkey 
            FOREIGN KEY (approved_by) REFERENCES public.user_profiles(id);
        END IF;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_memberships_approved_by ON public.group_memberships(approved_by);
CREATE INDEX IF NOT EXISTS idx_group_memberships_approved_at ON public.group_memberships(approved_at);
CREATE INDEX IF NOT EXISTS idx_group_memberships_requested_at ON public.group_memberships(requested_at);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status_pending ON public.group_memberships(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_discipleship_memberships_approved_by ON public.discipleship_memberships(approved_by);
CREATE INDEX IF NOT EXISTS idx_discipleship_memberships_approved_at ON public.discipleship_memberships(approved_at);
CREATE INDEX IF NOT EXISTS idx_discipleship_memberships_requested_at ON public.discipleship_memberships(requested_at);
CREATE INDEX IF NOT EXISTS idx_discipleship_memberships_status_pending ON public.discipleship_memberships(status) WHERE status = 'pending';

-- Function to get pending group membership requests
CREATE OR REPLACE FUNCTION get_pending_group_membership_requests()
RETURNS TABLE (
    membership_id UUID,
    group_id UUID,
    group_name TEXT,
    group_type TEXT,
    contact_id UUID,
    contact_name TEXT,
    contact_email TEXT,
    role TEXT,
    requested_at TIMESTAMPTZ,
    table_source TEXT
) AS $$
BEGIN
    -- Get pending regular group memberships
    RETURN QUERY
    SELECT 
        gm.id as membership_id,
        g.id as group_id,
        g.name as group_name,
        g.type as group_type,
        gm.contact_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as contact_name,
        c.email as contact_email,
        gm.role,
        gm.requested_at,
        'group_memberships' as table_source
    FROM public.group_memberships gm
    LEFT JOIN public.groups g ON gm.group_id = g.id
    LEFT JOIN public.contacts c ON gm.contact_id = c.id
    WHERE gm.status = 'pending'
    ORDER BY gm.requested_at DESC;
    
    -- Get pending discipleship memberships
    RETURN QUERY
    SELECT 
        dm.id as membership_id,
        dg.id as group_id,
        dg.name as group_name,
        'discipleship' as group_type,
        dm.contact_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) as contact_name,
        c.email as contact_email,
        dm.role,
        dm.requested_at,
        'discipleship_memberships' as table_source
    FROM public.discipleship_memberships dm
    LEFT JOIN public.discipleship_groups dg ON dm.discipleship_group_id = dg.id
    LEFT JOIN public.contacts c ON dm.contact_id = c.id
    WHERE dm.status = 'pending'
    ORDER BY dm.requested_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to approve group membership request
CREATE OR REPLACE FUNCTION approve_group_membership_request(
    membership_id UUID,
    table_source TEXT,
    approved_by_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    IF table_source = 'group_memberships' THEN
        UPDATE public.group_memberships 
        SET 
            status = 'active',
            approved_by = approved_by_user_id,
            approved_at = now()
        WHERE id = membership_id AND status = 'pending';
        
        RETURN FOUND;
    ELSIF table_source = 'discipleship_memberships' THEN
        UPDATE public.discipleship_memberships 
        SET 
            status = 'active',
            approved_by = approved_by_user_id,
            approved_at = now()
        WHERE id = membership_id AND status = 'pending';
        
        RETURN FOUND;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to reject group membership request
CREATE OR REPLACE FUNCTION reject_group_membership_request(
    membership_id UUID,
    table_source TEXT,
    approved_by_user_id UUID,
    rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    IF table_source = 'group_memberships' THEN
        UPDATE public.group_memberships 
        SET 
            status = 'rejected',
            approved_by = approved_by_user_id,
            approved_at = now(),
            rejection_reason = rejection_reason
        WHERE id = membership_id AND status = 'pending';
        
        RETURN FOUND;
    ELSIF table_source = 'discipleship_memberships' THEN
        UPDATE public.discipleship_memberships 
        SET 
            status = 'rejected',
            approved_by = approved_by_user_id,
            approved_at = now(),
            rejection_reason = rejection_reason
        WHERE id = membership_id AND status = 'pending';
        
        RETURN FOUND;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get membership status for a user
CREATE OR REPLACE FUNCTION get_user_group_membership_status(
    user_contact_id UUID,
    group_id UUID,
    is_discipleship BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    membership_id UUID,
    status TEXT,
    role TEXT,
    requested_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT
) AS $$
BEGIN
    IF is_discipleship THEN
        RETURN QUERY
        SELECT 
            dm.id as membership_id,
            dm.status,
            dm.role,
            dm.requested_at,
            dm.approved_at,
            dm.rejection_reason
        FROM public.discipleship_memberships dm
        WHERE dm.contact_id = user_contact_id AND dm.discipleship_group_id = group_id;
    ELSE
        RETURN QUERY
        SELECT 
            gm.id as membership_id,
            gm.status,
            gm.role,
            gm.requested_at,
            gm.approved_at,
            gm.rejection_reason
        FROM public.group_memberships gm
        WHERE gm.contact_id = user_contact_id AND gm.group_id = group_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update existing active memberships to have proper requested_at dates
DO $$
BEGIN
    -- Check if created_at column exists in group_memberships table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'group_memberships' AND column_name = 'created_at'
    ) THEN
        UPDATE public.group_memberships 
        SET requested_at = COALESCE(joined_at, created_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.group_memberships 
        SET approved_at = COALESCE(joined_at, created_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    ELSE
        UPDATE public.group_memberships 
        SET requested_at = COALESCE(joined_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.group_memberships 
        SET approved_at = COALESCE(joined_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    END IF;
    
    -- Check if created_at column exists in discipleship_memberships table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'discipleship_memberships' AND column_name = 'created_at'
    ) THEN
        UPDATE public.discipleship_memberships 
        SET requested_at = COALESCE(joined_at, created_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.discipleship_memberships 
        SET approved_at = COALESCE(joined_at, created_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    ELSE
        UPDATE public.discipleship_memberships 
        SET requested_at = COALESCE(joined_at, now())
        WHERE requested_at IS NULL;
        
        UPDATE public.discipleship_memberships 
        SET approved_at = COALESCE(joined_at, now())
        WHERE status = 'active' AND approved_at IS NULL;
    END IF;
END $$;

-- Create notification trigger for pending membership requests
CREATE OR REPLACE FUNCTION notify_pending_membership_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on INSERT with pending status
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        -- Insert a notification (you can customize this based on your notification system)
        INSERT INTO public.notifications (
            type,
            title,
            message,
            recipient_roles,
            metadata,
            created_at
        ) VALUES (
            'group_membership_request',
            'New Group Membership Request',
            'A new member has requested to join a group and needs approval.',
            '["admin", "pastor", "staff"]',
            jsonb_build_object(
                'membership_id', NEW.id,
                'contact_id', NEW.contact_id,
                'group_id', CASE 
                    WHEN TG_TABLE_NAME = 'group_memberships' THEN NEW.group_id::text
                    ELSE NEW.discipleship_group_id::text
                END,
                'table_source', TG_TABLE_NAME
            ),
            now()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables (only if notifications table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        DROP TRIGGER IF EXISTS trigger_notify_pending_group_membership ON public.group_memberships;
        CREATE TRIGGER trigger_notify_pending_group_membership
            AFTER INSERT ON public.group_memberships
            FOR EACH ROW
            EXECUTE FUNCTION notify_pending_membership_request();

        DROP TRIGGER IF EXISTS trigger_notify_pending_discipleship_membership ON public.discipleship_memberships;
        CREATE TRIGGER trigger_notify_pending_discipleship_membership
            AFTER INSERT ON public.discipleship_memberships
            FOR EACH ROW
            EXECUTE FUNCTION notify_pending_membership_request();
    END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_pending_group_membership_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION approve_group_membership_request(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_group_membership_request(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_group_membership_status(UUID, UUID, BOOLEAN) TO authenticated; 