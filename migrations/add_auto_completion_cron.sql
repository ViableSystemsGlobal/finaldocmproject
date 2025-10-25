-- Enable the pg_cron extension if not already enabled
-- This needs to be run by a superuser or in Supabase dashboard
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to auto-complete overdue events
CREATE OR REPLACE FUNCTION auto_complete_overdue_events()
RETURNS TABLE(
  processed_count INTEGER,
  completed_events JSONB,
  errors JSONB
) LANGUAGE plpgsql AS $$
DECLARE
  overdue_event RECORD;
  completed_list JSONB := '[]'::JSONB;
  error_list JSONB := '[]'::JSONB;
  count_processed INTEGER := 0;
  next_event_data JSONB;
BEGIN
  -- Find all events that are scheduled but past their date (more than 1 hour ago to account for time zones)
  FOR overdue_event IN 
    SELECT * FROM events 
    WHERE status = 'scheduled' 
    AND event_date < NOW() - INTERVAL '1 hour'
    ORDER BY event_date ASC
  LOOP
    BEGIN
      -- Mark the event as completed
      UPDATE events 
      SET status = 'completed', updated_at = NOW()
      WHERE id = overdue_event.id;
      
      -- If it's a recurring event, create the next occurrence
      IF overdue_event.is_recurring THEN
        next_event_data := auto_create_next_occurrence(overdue_event);
        
        completed_list := completed_list || jsonb_build_object(
          'id', overdue_event.id,
          'name', overdue_event.name,
          'original_date', overdue_event.event_date,
          'next_created', CASE WHEN next_event_data IS NOT NULL THEN true ELSE false END,
          'next_event_id', CASE WHEN next_event_data IS NOT NULL THEN next_event_data->>'id' ELSE NULL END
        );
      ELSE
        completed_list := completed_list || jsonb_build_object(
          'id', overdue_event.id,
          'name', overdue_event.name,
          'original_date', overdue_event.event_date,
          'next_created', false
        );
      END IF;
      
      count_processed := count_processed + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_list := error_list || jsonb_build_object(
        'id', overdue_event.id,
        'name', overdue_event.name,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Log the auto-completion activity
  INSERT INTO event_logs (action, details, created_at)
  VALUES (
    'auto_complete_overdue',
    jsonb_build_object(
      'processed_count', count_processed,
      'completed_events', completed_list,
      'errors', error_list,
      'timestamp', NOW()
    ),
    NOW()
  );
  
  RETURN QUERY SELECT count_processed, completed_list, error_list;
END;
$$;

-- Function to create next occurrence of a recurring event
CREATE OR REPLACE FUNCTION auto_create_next_occurrence(source_event events)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  next_date TIMESTAMP;
  new_event_id UUID;
  event_count INTEGER;
  image_record RECORD;
BEGIN
  -- Calculate next occurrence date
  CASE source_event.recurrence_rule
    WHEN 'daily' THEN
      next_date := source_event.event_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      next_date := source_event.event_date + INTERVAL '1 week';
    WHEN 'monthly' THEN
      next_date := source_event.event_date + INTERVAL '1 month';
    WHEN 'yearly' THEN
      next_date := source_event.event_date + INTERVAL '1 year';
    ELSE
      next_date := source_event.event_date + INTERVAL '1 week'; -- Default to weekly
  END CASE;
  
  -- Check if we should stop creating occurrences
  IF source_event.recurrence_end IS NOT NULL AND next_date > source_event.recurrence_end::TIMESTAMP THEN
    RETURN NULL;
  END IF;
  
  -- Check occurrence count limit
  IF source_event.recurrence_count IS NOT NULL THEN
    SELECT COUNT(*) INTO event_count 
    FROM events 
    WHERE parent_event_id = source_event.id;
    
    IF event_count >= source_event.recurrence_count THEN
      RETURN NULL;
    END IF;
  END IF;
  
  -- Create the next occurrence
  INSERT INTO events (
    id, name, description, location, location_data, capacity,
    event_date, is_recurring, recurrence_rule, recurrence_end, recurrence_count,
    parent_event_id, status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    source_event.name,
    source_event.description,
    source_event.location,
    source_event.location_data,
    source_event.capacity,
    next_date,
    true, -- Keep it recurring
    source_event.recurrence_rule,
    source_event.recurrence_end,
    source_event.recurrence_count,
    source_event.id,
    'scheduled',
    NOW(),
    NOW()
  ) RETURNING id INTO new_event_id;
  
  -- Copy images from the source event to the new occurrence
  FOR image_record IN 
    SELECT url, alt_text, sort_order 
    FROM event_images 
    WHERE event_id = source_event.id 
    ORDER BY sort_order
  LOOP
    INSERT INTO event_images (
      id, event_id, url, alt_text, sort_order, created_at
    ) VALUES (
      gen_random_uuid(),
      new_event_id,
      image_record.url,
      image_record.alt_text,
      image_record.sort_order,
      NOW()
    );
  END LOOP;
  
  RETURN jsonb_build_object('id', new_event_id, 'event_date', next_date);
END;
$$;

-- Create event_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule the auto-completion to run every hour
-- Note: This requires pg_cron extension and superuser privileges
-- You'll need to run this in Supabase SQL editor or ask Supabase support to enable pg_cron

-- SELECT cron.schedule(
--   'auto-complete-overdue-events', -- Job name
--   '0 * * * *',                    -- Every hour at minute 0
--   'SELECT auto_complete_overdue_events();'
-- );

-- Alternative: Run daily at 2 AM
-- SELECT cron.schedule(
--   'auto-complete-overdue-events-daily',
--   '0 2 * * *',                    -- Daily at 2 AM
--   'SELECT auto_complete_overdue_events();'
-- );

-- To manually test the function:
-- SELECT * FROM auto_complete_overdue_events(); 