-- Create events schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS events;

-- Create events table
CREATE TABLE IF NOT EXISTS events.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  capacity INT,
  event_date TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  recurrence_end DATE,
  recurrence_count INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policies
ALTER TABLE events.events ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY events_all_operations_policy
ON events.events
FOR ALL
USING (true)
WITH CHECK (true);

-- Set up permissions
GRANT USAGE ON SCHEMA events TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA events TO authenticated, anon, service_role;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_events_updated_at
BEFORE UPDATE ON events.events
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();

-- Create related tables
CREATE TABLE IF NOT EXISTS events.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events.events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events.events(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events.events(id) ON DELETE CASCADE,
  recipient_contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel TEXT,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events.event_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events.events(id) ON DELETE CASCADE,
  occurrence_date TIMESTAMPTZ NOT NULL,
  override_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on additional tables
ALTER TABLE events.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events.event_exceptions ENABLE ROW LEVEL SECURITY;

-- Create policies for additional tables
CREATE POLICY event_images_all_operations_policy
ON events.event_images
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY registrations_all_operations_policy
ON events.registrations
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY invitations_all_operations_policy
ON events.invitations
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY event_exceptions_all_operations_policy
ON events.event_exceptions
FOR ALL
USING (true)
WITH CHECK (true);

-- Set up triggers for updated_at on registrations
CREATE TRIGGER set_registrations_updated_at
BEFORE UPDATE ON events.registrations
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp(); 