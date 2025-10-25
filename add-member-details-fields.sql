-- Add missing member detail fields to contacts table
-- Run this in your Supabase Dashboard > SQL Editor

-- Add date_of_birth, location, and occupation fields to contacts table
DO $$
BEGIN
    -- Add date_of_birth column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'date_of_birth'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contacts ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to public.contacts';
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'location'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contacts ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to public.contacts';
    END IF;
    
    -- Add occupation column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'occupation'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contacts ADD COLUMN occupation TEXT;
        RAISE NOTICE 'Added occupation column to public.contacts';
    END IF;

    -- Also add to people.contacts table if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'contacts' 
        AND table_schema = 'people'
    ) THEN
        -- Add date_of_birth column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contacts' 
            AND column_name = 'date_of_birth'
            AND table_schema = 'people'
        ) THEN
            ALTER TABLE people.contacts ADD COLUMN date_of_birth DATE;
            RAISE NOTICE 'Added date_of_birth column to people.contacts';
        END IF;
        
        -- Add location column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contacts' 
            AND column_name = 'location'
            AND table_schema = 'people'
        ) THEN
            ALTER TABLE people.contacts ADD COLUMN location TEXT;
            RAISE NOTICE 'Added location column to people.contacts';
        END IF;
        
        -- Add occupation column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contacts' 
            AND column_name = 'occupation'
            AND table_schema = 'people'
        ) THEN
            ALTER TABLE people.contacts ADD COLUMN occupation TEXT;
            RAISE NOTICE 'Added occupation column to people.contacts';
        END IF;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_date_of_birth ON public.contacts(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_contacts_location ON public.contacts(location);
CREATE INDEX IF NOT EXISTS idx_contacts_occupation ON public.contacts(occupation);

-- If people.contacts exists, add indexes there too
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'contacts' 
        AND table_schema = 'people'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_people_contacts_date_of_birth ON people.contacts(date_of_birth);
        CREATE INDEX IF NOT EXISTS idx_people_contacts_location ON people.contacts(location);
        CREATE INDEX IF NOT EXISTS idx_people_contacts_occupation ON people.contacts(occupation);
    END IF;
END $$;

SELECT 'Member detail fields added successfully to contacts table!' AS status; 