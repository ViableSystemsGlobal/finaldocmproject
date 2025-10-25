-- Create campuses table and fix foreign key relationships

-- Create campuses table
CREATE TABLE IF NOT EXISTS public.campuses (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null unique,
  address         text,
  city            text,
  state           text,
  zip_code        text,
  phone           text,
  email           text,
  website         text,
  campus_pastor   text,
  status          text        default 'active',
  custom_fields   jsonb       default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Insert sample campuses
INSERT INTO public.campuses (name, address, city, state, status) VALUES
('Main Campus', '123 Church Street', 'Anytown', 'CA', 'active'),
('West Campus', '456 West Ave', 'Westside', 'CA', 'active'),
('North Campus', '789 North Blvd', 'Northville', 'CA', 'active')
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraints if they don't exist

-- For groups table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_campus_id_fkey'
        AND table_name = 'groups'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.groups 
        ADD CONSTRAINT groups_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES public.campuses(id);
    END IF;
END $$;

-- For discipleship_groups table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'discipleship_groups_campus_id_fkey'
        AND table_name = 'discipleship_groups'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.discipleship_groups 
        ADD CONSTRAINT discipleship_groups_campus_id_fkey 
        FOREIGN KEY (campus_id) REFERENCES public.campuses(id);
    END IF;
END $$;

-- Update existing groups and discipleship groups to have valid campus IDs
DO $$
DECLARE
    main_campus_id uuid;
BEGIN
    -- Get the main campus ID
    SELECT id INTO main_campus_id FROM public.campuses WHERE name = 'Main Campus' LIMIT 1;
    
    -- Update groups with null campus_id
    IF main_campus_id IS NOT NULL THEN
        UPDATE public.groups 
        SET campus_id = main_campus_id 
        WHERE campus_id IS NULL;
        
        UPDATE public.discipleship_groups 
        SET campus_id = main_campus_id 
        WHERE campus_id IS NULL;
    END IF;
END $$;

-- Create RLS policies for campuses
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on campuses" ON public.campuses
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_campus_id ON public.groups(campus_id);
CREATE INDEX IF NOT EXISTS idx_discipleship_groups_campus_id ON public.discipleship_groups(campus_id);
CREATE INDEX IF NOT EXISTS idx_campuses_status ON public.campuses(status); 