-- Fix missing columns in campuses table
-- Run this in your Supabase SQL editor

-- Ensure campuses table exists with all required columns
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campuses' AND table_schema = 'public') THEN
        CREATE TABLE public.campuses (
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
            is_main         boolean     default false,
            country         text        default 'US',
            created_at      timestamptz default now(),
            updated_at      timestamptz default now()
        );
    ELSE
        -- Table exists, add missing columns if they don't exist
        
        -- Add city column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'city') THEN
            ALTER TABLE public.campuses ADD COLUMN city text;
        END IF;
        
        -- Add state column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'state') THEN
            ALTER TABLE public.campuses ADD COLUMN state text;
        END IF;
        
        -- Add zip_code column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'zip_code') THEN
            ALTER TABLE public.campuses ADD COLUMN zip_code text;
        END IF;
        
        -- Add phone column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'phone') THEN
            ALTER TABLE public.campuses ADD COLUMN phone text;
        END IF;
        
        -- Add email column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'email') THEN
            ALTER TABLE public.campuses ADD COLUMN email text;
        END IF;
        
        -- Add is_main column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'is_main') THEN
            ALTER TABLE public.campuses ADD COLUMN is_main boolean default false;
        END IF;
        
        -- Add country column if missing  
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'country') THEN
            ALTER TABLE public.campuses ADD COLUMN country text default 'US';
        END IF;
        
        -- Add address column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'address') THEN
            ALTER TABLE public.campuses ADD COLUMN address text;
        END IF;
        
        -- Add created_at column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'created_at') THEN
            ALTER TABLE public.campuses ADD COLUMN created_at timestamptz default now();
        END IF;
        
        -- Add updated_at column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campuses' AND column_name = 'updated_at') THEN
            ALTER TABLE public.campuses ADD COLUMN updated_at timestamptz default now();
        END IF;
    END IF;
    
    -- Enable RLS if not already enabled
    ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
    
    -- Create or replace RLS policy
    DROP POLICY IF EXISTS "Allow all operations on campuses" ON public.campuses;
    CREATE POLICY "Allow all operations on campuses" ON public.campuses FOR ALL USING (true);
    
END $$;

-- Insert a default campus if none exist
INSERT INTO public.campuses (name, address, city, state, country, is_main) 
SELECT 'Main Campus', '123 Church Street', 'Anytown', 'CA', 'US', true
WHERE NOT EXISTS (SELECT 1 FROM public.campuses);

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'campuses' AND table_schema = 'public'
ORDER BY ordinal_position; 