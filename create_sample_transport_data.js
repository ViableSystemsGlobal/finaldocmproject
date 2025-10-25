// Create sample transport requests for testing
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ufjfafcfkalaasdhgcbi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSampleData() {
  try {
    console.log('Creating sample transport requests...');
    
    // First, get an existing event
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name')
      .limit(1);
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }
    
    if (!events || events.length === 0) {
      console.log('No events found. Please create an event first.');
      return;
    }
    
    const eventId = events[0].id;
    console.log('Using event:', events[0].name, eventId);
    
    // Get an existing contact
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .limit(1);
    
    const contactId = contacts && contacts.length > 0 ? contacts[0].id : null;
    
    // Create sample transport requests
    const sampleRequests = [
      {
        event_id: eventId,
        contact_id: contactId,
        pickup_address: '123 Main St, Anytown, State 12345',
        dropoff_address: 'Church Location',
        pickup_location: {
          lat: 40.730610,
          lng: -73.935242,
          address: '123 Main St, Anytown, State 12345'
        },
        status: 'pending',
        requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        notes: 'Need pickup for Sunday service'
      },
      {
        event_id: eventId,
        contact_id: contactId,
        pickup_address: '456 Oak Ave, Somewhere, State 54321',
        dropoff_address: 'Church Location',
        pickup_location: {
          lat: 40.740610,
          lng: -73.945242,
          address: '456 Oak Ave, Somewhere, State 54321'
        },
        status: 'pending',
        requested_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        notes: 'Elderly member needs assistance'
      },
      {
        event_id: eventId,
        contact_id: contactId,
        pickup_address: '789 Pine Dr, Another Place, State 67890',
        dropoff_address: 'Church Location',
        pickup_location: {
          lat: 40.720610,
          lng: -73.925242,
          address: '789 Pine Dr, Another Place, State 67890'
        },
        status: 'assigned',
        requested_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        notes: 'Regular pickup for Bible study'
      }
    ];
    
    // Insert the requests
    const { data: insertedRequests, error: insertError } = await supabase
      .from('transport_requests')
      .insert(sampleRequests)
      .select();
    
    if (insertError) {
      console.error('Error inserting transport requests:', insertError);
      return;
    }
    
    console.log('✅ Successfully created', insertedRequests.length, 'sample transport requests');
    console.log('Transport requests:', insertedRequests.map(r => ({ id: r.id, pickup_address: r.pickup_address, status: r.status })));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSampleData(); 