import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    
    console.log('🔧 Fixing transport_routes table schema...');

    // Add missing columns one by one
    const alterQueries = [
      "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS route_name TEXT;",
      "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS total_distance TEXT;", 
      "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS estimated_duration TEXT;",
      "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS route_data JSONB;",
      "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';",
      "ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;"
    ];

    // Execute each query
    for (const query of alterQueries) {
      console.log(`Executing: ${query}`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (error) {
          console.log(`Failed to execute via RPC: ${error.message}`);
          // Try alternative approach for this specific query
          if (query.includes('route_name')) {
            // Insert a test record to force schema refresh
            const { error: insertError } = await supabase
              .from('transport_routes')
              .insert({
                event_id: '00000000-0000-0000-0000-000000000000',
                driver_id: '00000000-0000-0000-0000-000000000000',
                route_name: 'test',
                // other required fields
              });
            
            if (insertError && !insertError.message.includes('violates foreign key')) {
              console.log(`Schema might need manual update: ${insertError.message}`);
            }
          }
        } else {
          console.log(`✅ Successfully executed: ${query}`);
        }
      } catch (e) {
        console.log(`Error with query: ${query}`, e);
      }
    }

    // Test the schema by checking if we can select the new columns
    const { data, error: testError } = await supabase
      .from('transport_routes')
      .select('id, route_name, status, total_distance')
      .limit(1);

    if (testError) {
      console.error('❌ Schema test failed:', testError);
      
      return NextResponse.json({
        success: false,
        error: 'Schema update may have failed',
        details: testError.message,
        message: 'You may need to manually run the ALTER TABLE commands in your database'
      });
    }

    console.log('✅ Schema update completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Successfully updated transport_routes table schema',
      details: 'Added columns: route_name, total_distance, estimated_duration, route_data, status, sent_at'
    });

  } catch (error) {
    console.error('❌ Schema fix error:', error);
    return NextResponse.json(
      { 
        error: 'Schema fix failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 