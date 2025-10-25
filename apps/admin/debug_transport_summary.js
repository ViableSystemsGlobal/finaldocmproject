const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function debugTransportSummary() {
  try {
    const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
    
    console.log('🔍 Testing the FIXED transport summary API logic...\n');
    
    // Replicate the EXACT query from the API
    console.log('1. Fetching transport requests...');
    const { data: transportRequests, error: requestsError } = await supabase
      .from('transport_requests')
      .select(`
        *,
        contact:contacts(*),
        assigned_vehicle:vehicles(*),
        assigned_driver:drivers(*)
      `)
      .eq('event_id', eventId);
    
    if (requestsError) throw requestsError;
    console.log(`   Transport requests found: ${transportRequests?.length || 0}`);
    
    // Replicate the FIXED query from the API
    console.log('\n2. Fetching event drivers (FIXED QUERY)...');
    const { data: eventDrivers, error: eventDriversError } = await supabase
      .from('event_drivers')
      .select(`
        *,
        driver:drivers(*),
        vehicle:vehicles(*)
      `)
      .eq('event_id', eventId)
      .in('status', ['assigned', 'confirmed']);  // This is the fixed filter!
    
    if (eventDriversError) throw eventDriversError;
    console.log(`   Event drivers with status in ['assigned', 'confirmed']: ${eventDrivers?.length || 0}`);
    
    eventDrivers?.forEach((ed, i) => {
      console.log(`     ${i+1}. ${ed.driver?.name} - Status: ${ed.status} - Vehicle: ${ed.vehicle?.make || 'None'} ${ed.vehicle?.model || ''} (${ed.vehicle?.capacity || 0} seats)`);
    });
    
    // Calculate summary exactly like the API does
    console.log('\n3. Calculating summary...');
    const assignedRequests = transportRequests?.filter((req) => req.status === 'assigned') || [];
    const availableVehicles = eventDrivers?.filter((ed) => ed.vehicle && ed.driver) || [];
    
    console.log(`   Assigned requests: ${assignedRequests.length}`);
    console.log(`   Available vehicles (assigned/confirmed status): ${availableVehicles.length}`);
    
    const totalCapacity = availableVehicles.reduce((total, ed) => {
      const capacity = ed.vehicle?.capacity || 0;
      console.log(`     Vehicle ${ed.vehicle?.make} ${ed.vehicle?.model}: capacity ${capacity}`);
      return total + capacity;
    }, 0);
    
    console.log(`   Total capacity: ${totalCapacity}`);
    
    // Check routes
    console.log('\n4. Checking routes...');
    const { data: routes, error: routesError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('event_id', eventId);
    
    if (routesError) throw routesError;
    console.log(`   Routes generated: ${routes?.length || 0}`);
    
    console.log('\n✅ FIXED SUMMARY:');
    console.log(`   - Total Requests: ${transportRequests?.length || 0}`);
    console.log(`   - Assigned Requests: ${assignedRequests.length}`);
    console.log(`   - Available Vehicles: ${availableVehicles.length}`);
    console.log(`   - Total Capacity: ${totalCapacity}`);
    console.log(`   - Routes Generated: ${routes?.length || 0}`);
    
  } catch (error) {
    console.error('Error debugging transport summary:', error);
  }
}

debugTransportSummary(); 