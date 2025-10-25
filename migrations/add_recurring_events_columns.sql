-- Add recurring events support columns to events table
-- Run this in your Supabase Dashboard > SQL Editor

DO $$
BEGIN
    -- Add status column to events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'status' AND table_schema = 'public') THEN
        ALTER TABLE public.events ADD COLUMN status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled'));
        RAISE NOTICE 'Added status column to events table';
    ELSE
        RAISE NOTICE 'Status column already exists in events table';
    END IF;

    -- Add parent_event_id column to events if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'parent_event_id' AND table_schema = 'public') THEN
        ALTER TABLE public.events ADD COLUMN parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added parent_event_id column to events table';
    ELSE
        RAISE NOTICE 'Parent_event_id column already exists in events table';
    END IF;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON public.events(parent_event_id);
    CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
    CREATE INDEX IF NOT EXISTS idx_events_recurring ON public.events(is_recurring) WHERE is_recurring = true;

    RAISE NOTICE 'Recurring events support added successfully!';
END
$$;

-- Verify the changes
SELECT 'Recurring events columns added successfully!' as status,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('status', 'parent_event_id') AND table_schema = 'public') as new_columns_count;
