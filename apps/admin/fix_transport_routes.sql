-- Fix transport_routes table schema
-- Add missing columns that are expected by the route generation code

ALTER TABLE transport_routes 
ADD COLUMN IF NOT EXISTS route_name TEXT;

ALTER TABLE transport_routes 
ADD COLUMN IF NOT EXISTS total_distance TEXT;

ALTER TABLE transport_routes 
ADD COLUMN IF NOT EXISTS estimated_duration TEXT;

ALTER TABLE transport_routes 
ADD COLUMN IF NOT EXISTS route_data JSONB;

ALTER TABLE transport_routes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

ALTER TABLE transport_routes 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'transport_routes_status_check' 
        AND table_name = 'transport_routes'
    ) THEN
        ALTER TABLE transport_routes 
        ADD CONSTRAINT transport_routes_status_check 
        CHECK (status IN ('draft', 'confirmed', 'sent', 'completed'));
    END IF;
END $$;

-- Update any existing records to have default status
UPDATE transport_routes 
SET status = 'draft' 
WHERE status IS NULL;

SELECT 'Schema update completed successfully' as result; 