-- Create planned_visits table for prospective visitors planning to attend events
CREATE TABLE IF NOT EXISTS public.planned_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL, -- Which event they want to attend
  event_date TIMESTAMPTZ NOT NULL, -- When the event is
  event_time TEXT, -- Event start time
  interest_level TEXT NOT NULL DEFAULT 'interested' CHECK (interest_level IN ('interested', 'confirmed', 'tentative', 'cancelled')),
  how_heard_about_us TEXT, -- How they found out about the church/event
  coming_with_others BOOLEAN DEFAULT false,
  companions_count INTEGER DEFAULT 0,
  companions_details TEXT, -- Names/details of who they're bringing
  special_needs TEXT, -- Any accessibility needs or special requirements
  contact_preference TEXT DEFAULT 'email' CHECK (contact_preference IN ('email', 'phone', 'text', 'none')),
  notes TEXT,
  follow_up_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'confirmed', 'attended', 'no_show', 'cancelled')),
  converted_to_visitor BOOLEAN DEFAULT false,
  converted_date TIMESTAMPTZ,
  assigned_to UUID, -- Staff member assigned to follow up
  last_message_sent TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_planned_visits_contact_id ON public.planned_visits(contact_id);
CREATE INDEX IF NOT EXISTS idx_planned_visits_event_date ON public.planned_visits(event_date);
CREATE INDEX IF NOT EXISTS idx_planned_visits_assigned_to ON public.planned_visits(assigned_to);
CREATE INDEX IF NOT EXISTS idx_planned_visits_status ON public.planned_visits(status);
CREATE INDEX IF NOT EXISTS idx_planned_visits_interest_level ON public.planned_visits(interest_level);
CREATE INDEX IF NOT EXISTS idx_planned_visits_follow_up_date ON public.planned_visits(follow_up_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.planned_visits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users" ON public.planned_visits
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.planned_visits
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.planned_visits
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.planned_visits
  FOR DELETE USING (auth.role() = 'authenticated');

-- Drop old sample data if exists
DELETE FROM public.planned_visits;

-- Add some sample data for testing the new schema
INSERT INTO public.planned_visits (contact_id, event_name, event_date, event_time, interest_level, how_heard_about_us, coming_with_others, companions_count, companions_details, status, notes) 
SELECT 
  c.id,
  'Sunday Morning Service',
  NOW() + INTERVAL '3 days',
  '10:00 AM',
  'confirmed',
  'Friend invited me',
  true,
  2,
  'My spouse and teenage daughter',
  'confirmed',
  'Very excited to visit! Looking forward to the worship service.'
FROM public.contacts c 
WHERE c.first_name IS NOT NULL 
LIMIT 1;

INSERT INTO public.planned_visits (contact_id, event_name, event_date, event_time, interest_level, how_heard_about_us, coming_with_others, status, follow_up_date) 
SELECT 
  c.id,
  'Wednesday Evening Bible Study',
  NOW() + INTERVAL '1 week',
  '7:00 PM',
  'interested',
  'Found website online',
  false,
  'pending',
  NOW() + INTERVAL '2 days'
FROM public.contacts c 
WHERE c.first_name IS NOT NULL 
ORDER BY c.created_at DESC
LIMIT 1;

INSERT INTO public.planned_visits (contact_id, event_name, event_date, event_time, interest_level, status, converted_to_visitor, converted_date, notes) 
SELECT 
  c.id,
  'Christmas Service',
  NOW() - INTERVAL '1 month',
  '6:00 PM',
  'confirmed',
  'attended',
  true,
  NOW() - INTERVAL '3 weeks',
  'Attended Christmas service and loved it! Signed up as regular visitor.'
FROM public.contacts c 
WHERE c.first_name IS NOT NULL 
ORDER BY c.created_at ASC
LIMIT 1; 