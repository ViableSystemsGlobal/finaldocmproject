require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

async function checkTenant() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data } = await supabase
    .from('contacts')
    .select('id, email, tenant_id')
    .limit(3);
    
  console.log('Existing contacts with tenant_id:');
  console.log(JSON.stringify(data, null, 2));
}

checkTenant(); 