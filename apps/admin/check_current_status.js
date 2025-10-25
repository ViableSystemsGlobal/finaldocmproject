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

async function checkCurrentStatus() {
  try {
    console.log('🔍 Checking available drivers...');
    const { data: drivers, error: driversError } = await supabase.from('drivers').select('*');
    if (driversError) throw driversError;
    
    console.log(`Available drivers: ${drivers?.length || 0}`);
    drivers?.forEach((d, i) => console.log(`  ${i+1}. ${d.name} - ${d.email} - Status: ${d.status}`));
    
    console.log('\n🚗 Checking available vehicles...');
    const { data: vehicles, error: vehiclesError } = await supabase.from('vehicles').select('*');
    if (vehiclesError) throw vehiclesError;
    
    console.log(`Available vehicles: ${vehicles?.length || 0}`);
    vehicles?.forEach((v, i) => console.log(`  ${i+1}. ${v.make} ${v.model} (${v.capacity} seats) - ${v.license_plate} - Status: ${v.status}`));
    
    console.log('\n📅 Checking event drivers for this event...');
    const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
    const { data: eventDrivers, error: eventDriversError } = await supabase
      .from('event_drivers')
      .select(`
        *,
        driver:drivers(*),
        vehicle:vehicles(*)
      `)
      .eq('event_id', eventId);
    
    if (eventDriversError) throw eventDriversError;
    
    console.log(`Event drivers for this event: ${eventDrivers?.length || 0}`);
    eventDrivers?.forEach((ed, i) => {
      const driverName = ed.driver?.name || 'Unknown';
      const vehicleInfo = ed.vehicle ? `${ed.vehicle.make} ${ed.vehicle.model} (${ed.vehicle.capacity} seats)` : 'No vehicle assigned';
      console.log(`  ${i+1}. ${driverName} - ${vehicleInfo} - Status: ${ed.status}`);
    });
    
    console.log('\n📊 Summary:');
    console.log(`- Total drivers available: ${drivers?.length || 0}`);
    console.log(`- Total vehicles available: ${vehicles?.length || 0}`);
    console.log(`- Drivers assigned to this event: ${eventDrivers?.length || 0}`);
    console.log(`- Drivers with vehicles assigned: ${eventDrivers?.filter(ed => ed.vehicle).length || 0}`);
    
    // Check transport requests for context
    console.log('\n🚌 Transport requests for this event...');
    const { data: requests, error: requestsError } = await supabase
      .from('transport_requests')
      .select('*')
      .eq('event_id', eventId);
    
    if (requestsError) throw requestsError;
    console.log(`Transport requests: ${requests?.length || 0}`);
    
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

checkCurrentStatus(); 