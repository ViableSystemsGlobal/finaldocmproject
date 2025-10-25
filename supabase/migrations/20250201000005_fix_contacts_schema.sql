-- Fix contacts table schema only (sample data handled separately)

-- Add missing columns to contacts table if they don't exist
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contacts ADD COLUMN status text DEFAULT 'active';
    END IF;
    
    -- Add member_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'member_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contacts ADD COLUMN member_status text DEFAULT 'visitor';
    END IF;
    
    -- Add other missing columns if needed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'custom_fields'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.contacts ADD COLUMN custom_fields jsonb DEFAULT '{}';
    END IF;
END $$;

-- Enable RLS for contacts if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'contacts' 
        AND schemaname = 'public'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create permissive RLS policy for contacts
DROP POLICY IF EXISTS "Allow all operations on contacts" ON public.contacts;
CREATE POLICY "Allow all operations on contacts" ON public.contacts
  FOR ALL USING (true); 