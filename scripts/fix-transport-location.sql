-- Fix the pickup_location column in transport_requests table
-- First drop the column if it exists
ALTER TABLE IF EXISTS transport_requests 
DROP COLUMN IF EXISTS pickup_location;

-- Re-add it as a JSONB column to store location data
ALTER TABLE IF EXISTS transport_requests
ADD COLUMN pickup_location JSONB;

-- Add a comment explaining the expected format
COMMENT ON COLUMN transport_requests.pickup_location IS 
'JSON object with lat, lng, and address fields. Example: {"lat": 40.7128, "lng": -74.006, "address": "New York, NY, USA"}';

-- Create an index for efficient querying
CREATE INDEX IF NOT EXISTS idx_transport_requests_pickup_location 
ON transport_requests USING GIN (pickup_location);

-- Notify of success
DO $$
BEGIN
    RAISE NOTICE 'Transport location column updated successfully';
END $$; 