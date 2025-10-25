-- Create Event Meeting Planning Tables
-- This migration adds support for event task management and assignments

-- Create event_tasks table for individual tasks within an event
CREATE TABLE IF NOT EXISTS public.event_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT DEFAULT 'general' CHECK (task_type IN ('prayer', 'worship', 'announcement', 'sermon', 'offering', 'special', 'technical', 'general')),
    start_time TIME,
    duration_minutes INTEGER,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_task_assignments table for assigning people to tasks
CREATE TABLE IF NOT EXISTS public.event_task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_task_id UUID NOT NULL REFERENCES public.event_tasks(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'assigned' CHECK (role IN ('assigned', 'lead', 'backup', 'support')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'completed')),
    notes TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_task_id, contact_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_tasks_event_id ON public.event_tasks(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tasks_sort_order ON public.event_tasks(sort_order);
CREATE INDEX IF NOT EXISTS idx_event_tasks_start_time ON public.event_tasks(start_time);
CREATE INDEX IF NOT EXISTS idx_event_tasks_status ON public.event_tasks(status);
CREATE INDEX IF NOT EXISTS idx_event_tasks_task_type ON public.event_tasks(task_type);

CREATE INDEX IF NOT EXISTS idx_event_task_assignments_event_task_id ON public.event_task_assignments(event_task_id);
CREATE INDEX IF NOT EXISTS idx_event_task_assignments_contact_id ON public.event_task_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_event_task_assignments_status ON public.event_task_assignments(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_task_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all authenticated users" ON public.event_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.event_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.event_tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.event_tasks
    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users" ON public.event_task_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.event_task_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.event_task_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.event_task_assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_event_tasks_updated_at_trigger
    BEFORE UPDATE ON public.event_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_event_tasks_updated_at();

CREATE TRIGGER update_event_task_assignments_updated_at_trigger
    BEFORE UPDATE ON public.event_task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_event_tasks_updated_at();

-- Grant permissions
GRANT ALL ON public.event_tasks TO authenticated, anon, service_role;
GRANT ALL ON public.event_task_assignments TO authenticated, anon, service_role;

-- Add some sample data for testing
INSERT INTO public.event_tasks (event_id, title, description, task_type, start_time, duration_minutes, sort_order) 
SELECT 
    id,
    'Opening Prayer',
    'Lead the congregation in opening prayer',
    'prayer',
    '10:00:00',
    5,
    1
FROM public.events 
WHERE name LIKE '%Service%' OR name LIKE '%Sunday%'
LIMIT 1;

INSERT INTO public.event_tasks (event_id, title, description, task_type, start_time, duration_minutes, sort_order) 
SELECT 
    id,
    'Worship Music',
    'Lead worship songs and music',
    'worship',
    '10:05:00',
    25,
    2
FROM public.events 
WHERE name LIKE '%Service%' OR name LIKE '%Sunday%'
LIMIT 1;

INSERT INTO public.event_tasks (event_id, title, description, task_type, start_time, duration_minutes, sort_order) 
SELECT 
    id,
    'Sermon',
    'Main message and teaching',
    'sermon',
    '10:30:00',
    30,
    3
FROM public.events 
WHERE name LIKE '%Service%' OR name LIKE '%Sunday%'
LIMIT 1;

-- Log completion
SELECT 'Event meeting planning tables created successfully!' as status; 