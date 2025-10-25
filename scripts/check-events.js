#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkEvents() {
  console.log('Checking for events...');

  // Check for events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name, event_date')
    .limit(10);

  if (eventsError) {
    console.error('Error fetching events:', eventsError.message);
    
    if (eventsError.message.includes('does not exist')) {
      console.log('The events table does not exist. You need to create it first.');
      return;
    }
    
    return;
  }

  if (!events || events.length === 0) {
    console.log('No events found. You need to create some events first.');
    
    // Create a sample event
    console.log('Creating a sample event...');
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert({
        name: 'Sunday Service',
        event_date: new Date().toISOString(),
        description: 'Weekly church service'
      })
      .select();
    
    if (createError) {
      console.error('Error creating sample event:', createError.message);
    } else {
      console.log('Created sample event:', newEvent);
    }
    
    return;
  }

  console.log('Found events:');
  events.forEach(event => {
    console.log(`- ${event.id}: ${event.name} (${event.event_date})`);
  });
  
  console.log('\nUse one of these event IDs when creating transport requests');
}

// Run the function
checkEvents(); 