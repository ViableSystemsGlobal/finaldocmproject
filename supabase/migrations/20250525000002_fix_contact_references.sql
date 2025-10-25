-- Check if the contacts table exists in public schema
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on contacts table
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies for contacts to avoid conflicts
DROP POLICY IF EXISTS "Allow read access to contacts for authenticated users" ON public.contacts;
DROP POLICY IF EXISTS "Allow insert access to contacts for authenticated users" ON public.contacts;
DROP POLICY IF EXISTS "Allow update access to contacts for authenticated users" ON public.contacts;
DROP POLICY IF EXISTS "Allow delete access to contacts for authenticated users" ON public.contacts;

-- Create permissive policies for contacts
CREATE POLICY "Allow read access to contacts for authenticated users"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to contacts for authenticated users"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to contacts for authenticated users"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete access to contacts for authenticated users"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (true);

-- Make sure the campaign_recipients.contact_id actually references the contacts table
-- First drop any existing foreign key if it exists
ALTER TABLE IF EXISTS public.campaign_recipients 
  DROP CONSTRAINT IF EXISTS campaign_recipients_contact_id_fkey;

-- Add the correct foreign key reference
ALTER TABLE IF EXISTS public.campaign_recipients
  ADD CONSTRAINT campaign_recipients_contact_id_fkey
  FOREIGN KEY (contact_id) 
  REFERENCES public.contacts(id)
  ON DELETE CASCADE; 