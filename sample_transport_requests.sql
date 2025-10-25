-- Sample Transport Requests for Testing
-- This adds transport requests for existing events

-- First, let's check if we have events and contacts
-- Insert sample transport requests for the first available event

DO $$
DECLARE
    sample_event_id UUID;
    sample_contact_id UUID;
BEGIN
    -- Get the first available event
    SELECT id INTO sample_event_id FROM events LIMIT 1;
    
    -- Get the first available contact
    SELECT id INTO sample_contact_id FROM contacts LIMIT 1;
    
    -- Only proceed if we have an event
    IF sample_event_id IS NOT NULL THEN
        -- Insert sample transport requests
        INSERT INTO transport_requests (
            event_id,
            contact_id,
            pickup_address,
            dropoff_address,
            pickup_location,
            status,
            requested_at,
            notes
        ) VALUES 
        (
            sample_event_id,
            sample_contact_id,
            '123 Main St, Anytown, State 12345',
            'Church Location',
            '{"lat": 40.730610, "lng": -73.935242, "address": "123 Main St, Anytown, State 12345"}'::jsonb,
            'pending',
            NOW() - INTERVAL '2 days',
            'Need pickup for Sunday service'
        ),
        (
            sample_event_id,
            sample_contact_id,
            '456 Oak Ave, Somewhere, State 54321',
            'Church Location',
            '{"lat": 40.740610, "lng": -73.945242, "address": "456 Oak Ave, Somewhere, State 54321"}'::jsonb,
            'pending',
            NOW() - INTERVAL '1 day',
            'Elderly member needs assistance'
        ),
        (
            sample_event_id,
            sample_contact_id,
            '789 Pine Dr, Another Place, State 67890',
            'Church Location',  
            '{"lat": 40.720610, "lng": -73.925242, "address": "789 Pine Dr, Another Place, State 67890"}'::jsonb,
            'assigned',
            NOW() - INTERVAL '3 hours',
            'Regular pickup for Bible study'
        );
        
        RAISE NOTICE 'Sample transport requests created for event: %', sample_event_id;
    ELSE
        RAISE NOTICE 'No events found. Please create an event first.';
    END IF;
END $$; 