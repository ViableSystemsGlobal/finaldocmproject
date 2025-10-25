-- Update all events with Denver location coordinates
UPDATE events
SET 
  location_data = '{"lat": 39.72341827331013, "lng": -104.80330062208942, "address": "Denver Church, 8400 E Yale Ave, Denver, CO 80231"}'::jsonb,
  -- Only update location if it's not already set
  location = COALESCE(location, 'Denver Church, 8400 E Yale Ave, Denver, CO 80231')
WHERE 
  -- Only update events that don't already have location_data
  (location_data IS NULL OR 
   NOT (location_data ? 'lat') OR 
   NOT (location_data ? 'lng'));

-- Count updated rows
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % events with Denver location data', updated_count;
END $$; 