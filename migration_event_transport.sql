-- Event Transport Integration Migration
-- This adds event-based transportation features

-- 1. Add event integration to transport_requests (if not already exists)
ALTER TABLE transport_requests 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS route_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS route_id UUID;

-- 2. Create event_drivers table for assigning drivers to events
CREATE TABLE IF NOT EXISTS event_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, driver_id)
);

-- 3. Create transport_routes table for optimized routes
CREATE TABLE IF NOT EXISTS transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  route_url TEXT, -- Google Maps route URL
  total_distance TEXT,
  estimated_duration TEXT,
  route_data JSONB, -- Stores waypoints and optimization data
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'sent', 'completed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update transport_requests to reference routes
ALTER TABLE transport_requests 
ADD CONSTRAINT fk_transport_requests_route_id 
FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE SET NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transport_requests_event_id ON transport_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_transport_requests_route_id ON transport_requests(route_id);
CREATE INDEX IF NOT EXISTS idx_event_drivers_event_id ON event_drivers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_drivers_driver_id ON event_drivers(driver_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_event_id ON transport_routes(event_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_driver_id ON transport_routes(driver_id);

-- 6. Add RLS policies
ALTER TABLE event_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_drivers
CREATE POLICY "Users can view event drivers" ON event_drivers FOR SELECT USING (true);
CREATE POLICY "Admin users can manage event drivers" ON event_drivers FOR ALL USING (true);

-- RLS policies for transport_routes
CREATE POLICY "Users can view transport routes" ON transport_routes FOR SELECT USING (true);
CREATE POLICY "Admin users can manage transport routes" ON transport_routes FOR ALL USING (true);

-- 7. Create functions for route optimization triggers
CREATE OR REPLACE FUNCTION update_transport_route_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transport_routes_updated_at
  BEFORE UPDATE ON transport_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_transport_route_updated_at();

CREATE TRIGGER event_drivers_updated_at
  BEFORE UPDATE ON event_drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_transport_route_updated_at();

-- 8. Add helpful views
CREATE OR REPLACE VIEW event_transport_summary AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.event_date,
  e.location,
  COUNT(DISTINCT tr.id) as total_requests,
  COUNT(DISTINCT CASE WHEN tr.status = 'pending' THEN tr.id END) as pending_requests,
  COUNT(DISTINCT CASE WHEN tr.status = 'assigned' THEN tr.id END) as assigned_requests,
  COUNT(DISTINCT ed.driver_id) as assigned_drivers,
  COUNT(DISTINCT rt.id) as created_routes
FROM events e
LEFT JOIN transport_requests tr ON e.id = tr.event_id
LEFT JOIN event_drivers ed ON e.id = ed.event_id
LEFT JOIN transport_routes rt ON e.id = rt.event_id
WHERE e.event_date >= CURRENT_DATE
GROUP BY e.id, e.name, e.event_date, e.location
ORDER BY e.event_date;

COMMENT ON TABLE event_drivers IS 'Assigns drivers to specific events for transportation';
COMMENT ON TABLE transport_routes IS 'Optimized routes for drivers for each event';
COMMENT ON VIEW event_transport_summary IS 'Summary view of transportation needs per event'; 