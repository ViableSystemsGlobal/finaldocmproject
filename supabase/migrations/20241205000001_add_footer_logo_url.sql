-- Add logo_url column to footer_settings table
ALTER TABLE public.footer_settings 
ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

-- Update the updated_at timestamp for any existing records
UPDATE public.footer_settings 
SET updated_at = now() 
WHERE logo_url IS NULL; 