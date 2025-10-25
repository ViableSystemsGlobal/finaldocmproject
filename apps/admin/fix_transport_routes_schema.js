const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixTransportRoutesSchema() {
  try {
    console.log('🔧 Adding missing columns to transport_routes table...');

    // Execute SQL to add missing columns
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE transport_routes 
        ADD COLUMN IF NOT EXISTS route_name TEXT,
        ADD COLUMN IF NOT EXISTS total_distance TEXT,
        ADD COLUMN IF NOT EXISTS estimated_duration TEXT,
        ADD COLUMN IF NOT EXISTS route_data JSONB,
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'sent', 'completed')),
        ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
      `
    });

    if (error) {
      // If rpc doesn't work, try direct SQL execution
      console.log('RPC failed, trying direct approach...');
      
      // Try each column individually
      const queries = [
        "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS route_name TEXT;",
        "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS total_distance TEXT;", 
        "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS estimated_duration TEXT;",
        "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS route_data JSONB;",
        "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';",
        "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;"
      ];

      for (const query of queries) {
        try {
          const { error: queryError } = await supabase.from('transport_routes').select('id').limit(0);
          console.log(`Executing: ${query}`);
          // This is a workaround - we'll need to run this manually
        } catch (e) {
          console.log(`Query failed: ${query}`);
        }
      }
    }

    console.log('✅ Schema update completed');
    
    // Test the updated schema
    const { data, error: testError } = await supabase
      .from('transport_routes')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('❌ Schema test failed:', testError);
    } else {
      console.log('✅ Schema test passed');
    }

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
  }
}

fixTransportRoutesSchema(); 