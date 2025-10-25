#!/usr/bin/env node

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Denver church location
const denverLocation = {
  lat: 39.72341827331013,
  lng: -104.80330062208942,
  address: 'Denver Church, 8400 E Yale Ave, Denver, CO 80231'
};

async function updateAllEvents() {
  try {
    console.log('Fetching all events...');
    const { data: events, error } = await supabase
      .from('events')
      .select('id, name, location, location_data');

    if (error) {
      console.error('Error fetching events:', error);
      process.exit(1);
    }

    console.log(`Found ${events.length} events.`);
    let updated = 0;

    for (const event of events) {
      console.log(`Processing event: ${event.name} (${event.id})`);
      
      // Check if event already has location data
      if (event.location_data && 
          typeof event.location_data === 'object' && 
          event.location_data.lat && 
          event.location_data.lng) {
        console.log(`Event ${event.id} already has location data: ${JSON.stringify(event.location_data)}`);
        continue;
      }

      // If no location data, update with Denver location
      console.log(`Updating event ${event.id} with Denver location data`);
      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          location_data: denverLocation,
          // Only update location if it's not already set
          location: event.location || denverLocation.address
        })
        .eq('id', event.id);

      if (updateError) {
        console.error(`Error updating event ${event.id}:`, updateError);
        continue;
      }

      console.log(`Successfully updated event ${event.id}`);
      updated++;
    }

    console.log(`Update complete. ${updated} events were updated.`);
  } catch (error) {
    console.error('Error updating events:', error);
    process.exit(1);
  }
}

async function updateSingleEvent(eventId) {
  try {
    console.log(`Updating event ${eventId} with Denver location data`);
    const { data, error } = await supabase
      .from('events')
      .update({ 
        location_data: denverLocation,
        location: denverLocation.address
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating event ${eventId}:`, error);
      process.exit(1);
    }

    console.log(`Successfully updated event ${eventId}:`, data);
  } catch (error) {
    console.error('Error updating event:', error);
    process.exit(1);
  }
}

// Get event ID from command line arguments
const eventId = process.argv[2];

if (eventId) {
  // Update a specific event
  console.log(`Updating event with ID: ${eventId}`);
  updateSingleEvent(eventId);
} else {
  // Update all events
  console.log('Updating all events with missing location data');
  updateAllEvents();
} 