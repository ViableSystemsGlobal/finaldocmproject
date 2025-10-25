require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugJoins() {
  const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
  
  console.log('🔍 Debugging Supabase Joins\n');
  
  // First check a single transport request with full details
  const { data: singleRequest, error } = await supabase
    .from('transport_requests')
    .select('*')
    .eq('event_id', eventId)
    .limit(1)
    .single();
  
  console.log('📋 Single Request Raw Data:');
  console.log(singleRequest);
  console.log('Error:', error);
  
  // Check if contact_id exists and what it points to
  if (singleRequest?.contact_id) {
    console.log('\n👤 Checking Contact:');
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', singleRequest.contact_id)
      .single();
    console.log('Contact data:', contact);
  }
  
  // Try the join query like the API does
  console.log('\n🔗 Testing Join Query:');
  const { data: joinResult, error: joinError } = await supabase
    .from('transport_requests')
    .select(`
      id,
      contact_name,
      pickup_address,
      status,
      contact_id,
      assigned_driver,
      assigned_vehicle,
      contact:contacts(*),
      assigned_vehicle_details:vehicles!assigned_vehicle(*),
      assigned_driver_details:drivers!assigned_driver(*)
    `)
    .eq('event_id', eventId)
    .limit(3);
    
  console.log('Join result:', joinResult);
  console.log('Join error:', joinError);
}

debugJoins().catch(console.error); 