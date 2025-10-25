require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRouteStructure() {
  const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
  
  console.log('🔍 Checking Transport Routes Table Structure\n');
  
  // Get the existing route to see its structure
  const { data: existingRoute, error } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('event_id', eventId)
    .limit(1)
    .single();
    
  console.log('📋 Existing Route Structure:');
  console.log(JSON.stringify(existingRoute, null, 2));
  console.log('Error:', error);
}

checkRouteStructure().catch(console.error); 