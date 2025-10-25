require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTransportData() {
  const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
  
  console.log('🔍 Checking Transport Data Mismatch\n');
  
  // Check transport_requests table
  const { data: requests } = await supabase
    .from('transport_requests')
    .select('id, contact_name, pickup_address, assigned_driver, assigned_vehicle, status')
    .eq('event_id', eventId)
    .order('contact_name');
  
  console.log('📋 TRANSPORT_REQUESTS:', requests?.length || 0);
  requests?.forEach((req, i) => {
    console.log(`  ${i+1}. ${req.contact_name}`);
    console.log(`     Status: ${req.status}`);
    console.log(`     Driver: ${req.assigned_driver}`);
    console.log(`     Vehicle: ${req.assigned_vehicle}`);
  });
  
  // Check transport_routes table  
  console.log('\n🗺️  TRANSPORT_ROUTES:');
  const { data: routes } = await supabase
    .from('transport_routes')
    .select(`
      id, 
      driver_id,
      vehicle_id,
      waypoints,
      url,
      driver:drivers(name, email),
      vehicle:vehicles(make, model, license_plate)
    `)
    .eq('event_id', eventId);
    
  console.log('Routes found:', routes?.length || 0);
  routes?.forEach((route, i) => {
    console.log(`  ${i+1}. Driver: ${route.driver?.name} (${route.driver?.email})`);
    console.log(`     Vehicle: ${route.vehicle?.make} ${route.vehicle?.model} (${route.vehicle?.license_plate})`);
    console.log(`     Waypoints: ${route.waypoints?.length || 0} locations`);
    console.log(`     Has URL: ${route.url ? 'Yes' : 'No'}`);
  });
  
  // Check event_drivers table
  console.log('\n🚗 EVENT_DRIVERS:');
  const { data: eventDrivers } = await supabase
    .from('event_drivers')
    .select(`
      status,
      driver:drivers(name, email),
      vehicle:vehicles(make, model, license_plate, capacity)
    `)
    .eq('event_id', eventId);
    
  console.log('Event drivers found:', eventDrivers?.length || 0);
  eventDrivers?.forEach((ed, i) => {
    console.log(`  ${i+1}. ${ed.driver?.name} - ${ed.vehicle?.make} ${ed.vehicle?.model} (${ed.vehicle?.capacity} seats) - Status: ${ed.status}`);
  });
}

checkTransportData().catch(console.error); 