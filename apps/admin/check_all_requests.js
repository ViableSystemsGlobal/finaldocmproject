require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllRequests() {
  const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
  
  console.log('🔍 Checking ALL Transport Requests\n');
  
  // Check all transport_requests for this event (any status)
  const { data: allRequests, error } = await supabase
    .from('transport_requests')
    .select('*')
    .eq('event_id', eventId);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('📋 ALL TRANSPORT_REQUESTS:', allRequests?.length || 0);
  allRequests?.forEach((req, i) => {
    console.log(`  ${i+1}. ${req.contact_name}`);
    console.log(`     Status: ${req.status}`);
    console.log(`     Driver: ${req.assigned_driver}`);
    console.log(`     Vehicle: ${req.assigned_vehicle}`);
    console.log(`     Created: ${req.created_at}`);
    console.log(`     Updated: ${req.updated_at}`);
    console.log('---');
  });
  
  // Also check the summary API endpoint to see what it returns
  console.log('\n🔍 Checking Summary API response...');
  try {
    const response = await fetch(`http://localhost:3000/api/events/${eventId}/transport/summary`);
    if (response.ok) {
      const summaryData = await response.json();
      console.log('📊 Summary API Response:');
      console.log(`  Total Requests: ${summaryData.summary.totalRequests}`);
      console.log(`  Assigned Requests: ${summaryData.summary.assignedRequests}`);
      console.log(`  Available Vehicles: ${summaryData.summary.availableVehicles}`);
      console.log(`  Total Capacity: ${summaryData.summary.totalCapacity}`);
      console.log(`  Routes Generated: ${summaryData.summary.routesGenerated}`);
    } else {
      console.log('❌ Summary API failed:', response.status);
    }
  } catch (err) {
    console.log('❌ Could not reach summary API:', err.message);
  }
}

checkAllRequests().catch(console.error); 