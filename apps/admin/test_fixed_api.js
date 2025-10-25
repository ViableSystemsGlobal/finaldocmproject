require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedAPI() {
  const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
  
  console.log('🔍 Testing Fixed API Query\n');
  
  // Test the corrected join query
  const { data: transportRequests, error } = await supabase
    .from('transport_requests')
    .select(`
      *,
      contact:contacts(*),
      assigned_vehicle_data:vehicles!assigned_vehicle(*),
      assigned_driver_data:drivers!assigned_driver(*)
    `)
    .eq('event_id', eventId)
    .limit(3);
    
  console.log('Query error:', error);
  console.log('📋 Transport Requests with Joins:');
  
  transportRequests?.forEach((request, i) => {
    console.log(`\n${i+1}. Request ID: ${request.id}`);
    console.log(`   Contact: ${request.contact?.first_name} ${request.contact?.last_name}`);
    console.log(`   Pickup: ${request.pickup_address}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Driver: ${request.assigned_driver_data?.name || 'Not assigned'}`);
    console.log(`   Vehicle: ${request.assigned_vehicle_data?.make} ${request.assigned_vehicle_data?.model} (${request.assigned_vehicle_data?.license_plate})`);
  });
  
  // Test the summary calculation
  const assignedRequests = transportRequests?.filter(req => req.status === 'assigned').length || 0;
  console.log(`\n📊 Summary: ${transportRequests?.length || 0} total, ${assignedRequests} assigned`);
}

testFixedAPI().catch(console.error); 