-- Add missing columns to existing prayer_requests table
DO $$ 
BEGIN
    -- Add source column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prayer_requests' AND column_name = 'source') THEN
        ALTER TABLE public.prayer_requests 
        ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'app', 'website'));
    END IF;
    
    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prayer_requests' AND column_name = 'assigned_to') THEN
        ALTER TABLE public.prayer_requests 
        ADD COLUMN assigned_to UUID;
    END IF;
    
    -- Add response_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prayer_requests' AND column_name = 'response_notes') THEN
        ALTER TABLE public.prayer_requests 
        ADD COLUMN response_notes TEXT;
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prayer_requests' AND column_name = 'created_at') THEN
        ALTER TABLE public.prayer_requests 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prayer_requests' AND column_name = 'updated_at') THEN
        ALTER TABLE public.prayer_requests 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_prayer_requests_contact_id ON public.prayer_requests(contact_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON public.prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_submitted_at ON public.prayer_requests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_assigned_to ON public.prayer_requests(assigned_to);

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'prayer_requests' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prayer_requests' 
        AND policyname = 'Enable read access for all authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for all authenticated users" ON public.prayer_requests
          FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prayer_requests' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON public.prayer_requests
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prayer_requests' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON public.prayer_requests
          FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prayer_requests' 
        AND policyname = 'Enable delete for authenticated users'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" ON public.prayer_requests
          FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Add some sample data for testing (only if no data exists)
INSERT INTO public.prayer_requests (contact_id, title, description, status, source) 
SELECT 
  c.id,
  'Health & Healing',
  'Please pray for complete healing and strength during this challenging time.',
  'new',
  'manual'
FROM public.contacts c 
WHERE c.first_name IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public.prayer_requests)
LIMIT 1;

INSERT INTO public.prayer_requests (contact_id, title, description, status, source) 
SELECT 
  c.id,
  'Family & Relationships',
  'Requesting prayer for family unity and wisdom in difficult decisions.',
  'in-prayer',
  'app'
FROM public.contacts c 
WHERE c.first_name IS NOT NULL 
AND (SELECT COUNT(*) FROM public.prayer_requests) < 2
ORDER BY c.created_at DESC
LIMIT 1;

INSERT INTO public.prayer_requests (contact_id, title, description, status, source, response_notes) 
SELECT 
  c.id,
  'Work & Career',
  'Praying for new job opportunities and career direction.',
  'answered',
  'website',
  'Praise God! Found a new position that aligns perfectly with calling and provides for family needs.'
FROM public.contacts c 
WHERE c.first_name IS NOT NULL 
AND (SELECT COUNT(*) FROM public.prayer_requests) < 3
ORDER BY c.created_at ASC
LIMIT 1; 