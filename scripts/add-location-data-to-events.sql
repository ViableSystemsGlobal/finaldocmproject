-- Add location_data column to events table
ALTER TABLE IF EXISTS events
ADD COLUMN IF NOT EXISTS location_data JSONB;

-- Add comment explaining the expected format
COMMENT ON COLUMN events.location_data IS 
'JSON object with lat, lng, and address fields. Example: {"lat": 40.7128, "lng": -74.006, "address": "New York, NY, USA"}';

-- Create an index for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_location_data 
ON events USING GIN (location_data);

-- Notify of success
DO $$
BEGIN
    RAISE NOTICE 'Events location_data column added successfully';
END $$; 