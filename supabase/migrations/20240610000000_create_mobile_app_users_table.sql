-- First create the function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create mobile app users table
CREATE TABLE IF NOT EXISTS public.mobile_app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID, -- No foreign key reference, just store the contact ID
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  devices JSONB NOT NULL DEFAULT '[]',
  tenant_id UUID DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Default tenant ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Set up RLS (Row Level Security)
ALTER TABLE public.mobile_app_users ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy that allows all operations for authenticated users
CREATE POLICY mobile_app_users_all_operations_policy
ON public.mobile_app_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Create an index on contact_id for faster joins
CREATE INDEX mobile_app_users_contact_id_idx ON public.mobile_app_users(contact_id);

-- Create an index on tenant_id for faster queries
CREATE INDEX mobile_app_users_tenant_id_idx ON public.mobile_app_users(tenant_id);

-- Set up a trigger to update the updated_at column
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.mobile_app_users
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at(); 