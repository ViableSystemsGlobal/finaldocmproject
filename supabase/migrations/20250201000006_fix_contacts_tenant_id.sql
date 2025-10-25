-- Fix contacts table tenant_id issue

-- First, check if tenant_id column exists and make it nullable or provide default
DO $$
DECLARE
    default_tenant_id uuid;
BEGIN
    -- Check if tenant_id column exists and is not nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'tenant_id'
        AND table_schema = 'public'
        AND is_nullable = 'NO'
    ) THEN
        -- Try to find an existing tenant_id from existing data
        SELECT DISTINCT tenant_id INTO default_tenant_id 
        FROM public.contacts 
        WHERE tenant_id IS NOT NULL 
        LIMIT 1;
        
        -- If no existing tenant_id found, create a default one
        IF default_tenant_id IS NULL THEN
            default_tenant_id := gen_random_uuid();
        END IF;
        
        -- Set a default value for the tenant_id column
        EXECUTE 'ALTER TABLE public.contacts ALTER COLUMN tenant_id SET DEFAULT ''' || default_tenant_id || '''';
        
        -- Update any existing NULL tenant_id values
        UPDATE public.contacts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;

-- Now create sample contact data with proper tenant_id
DO $$
DECLARE
    default_tenant_id uuid;
BEGIN
    -- Get the default tenant_id (either existing or the one we just set)
    SELECT DISTINCT tenant_id INTO default_tenant_id 
    FROM public.contacts 
    WHERE tenant_id IS NOT NULL 
    LIMIT 1;
    
    -- If still no tenant_id, create one
    IF default_tenant_id IS NULL THEN
        default_tenant_id := gen_random_uuid();
    END IF;
    
    -- Insert sample contacts with tenant_id
    INSERT INTO public.contacts (first_name, last_name, email, phone, status, member_status, tenant_id) VALUES
    ('John', 'Doe', 'john.doe@example.com', '555-1234', 'active', 'member', default_tenant_id),
    ('Jane', 'Smith', 'jane.smith@example.com', '555-5678', 'active', 'member', default_tenant_id),
    ('Bob', 'Johnson', 'bob.johnson@example.com', '555-9012', 'active', 'visitor', default_tenant_id)
    ON CONFLICT (email) DO UPDATE SET
      status = EXCLUDED.status,
      member_status = EXCLUDED.member_status,
      tenant_id = EXCLUDED.tenant_id;
END $$;

-- Now create the discipleship groups and related data
DO $$
DECLARE
    main_campus_id uuid;
    west_campus_id uuid;
    sample_contact_id uuid;
BEGIN
    -- Get campus IDs
    SELECT id INTO main_campus_id FROM public.campuses WHERE name = 'Main Campus' LIMIT 1;
    SELECT id INTO west_campus_id FROM public.campuses WHERE name = 'West Campus' LIMIT 1;
    
    -- Get sample contact ID
    SELECT id INTO sample_contact_id FROM public.contacts WHERE email = 'john.doe@example.com' LIMIT 1;
    
    -- Insert sample discipleship groups if campuses exist
    IF main_campus_id IS NOT NULL AND sample_contact_id IS NOT NULL THEN
        INSERT INTO public.discipleship_groups (id, name, description, campus_id, leader_id, status, age_group, curriculum) VALUES
        ('d723f2fe-5eeb-4d4f-b581-aec2e4f49131', 'Men''s Discipleship Group', 'Weekly men''s Bible study and accountability', main_campus_id, sample_contact_id, 'active', 'adult', 'Biblical Manhood'),
        ('e7016b34-63fe-4927-ac9d-af9c44b3ea0e', 'Young Adults Discipleship', 'Discipleship for young adults 18-25', main_campus_id, sample_contact_id, 'active', 'young_adult', 'Life on Life'),
        ('f8127c45-74af-5038-bd6f-bf0d55c4fb42', 'Women''s Discipleship Circle', 'Women''s weekly discipleship and prayer', west_campus_id, sample_contact_id, 'active', 'adult', 'Titus 2 Women')
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          campus_id = EXCLUDED.campus_id,
          leader_id = EXCLUDED.leader_id,
          status = EXCLUDED.status;
    END IF;
    
    -- Create sample member records
    INSERT INTO public.members (contact_id, status, joined_at)
    SELECT id, 'active', now() 
    FROM public.contacts 
    WHERE member_status = 'member'
    ON CONFLICT (contact_id) DO NOTHING;
    
    -- Add sample discipleship memberships
    IF sample_contact_id IS NOT NULL THEN
        INSERT INTO public.discipleship_memberships (discipleship_group_id, contact_id, role, status, joined_at) VALUES
        ('d723f2fe-5eeb-4d4f-b581-aec2e4f49131', sample_contact_id, 'mentor', 'active', now()),
        ('e7016b34-63fe-4927-ac9d-af9c44b3ea0e', sample_contact_id, 'mentee', 'active', now())
        ON CONFLICT (discipleship_group_id, contact_id) DO UPDATE SET
          role = EXCLUDED.role,
          status = EXCLUDED.status;
    END IF;
END $$; 