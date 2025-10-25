-- Add email column to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS email text;

-- Add created_at and updated_at columns for consistency with other tables
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS created_at timestamptz default now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Add same columns to vehicles table for consistency
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS year int,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS created_at timestamptz default now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Update transport_requests to add missing columns for consistency
ALTER TABLE public.transport_requests 
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Update transport_routes to match the schema in types
ALTER TABLE public.transport_routes 
DROP COLUMN IF EXISTS stops,
DROP COLUMN IF EXISTS polyline,
ADD COLUMN IF NOT EXISTS waypoints jsonb,
ADD COLUMN IF NOT EXISTS url text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now(); 