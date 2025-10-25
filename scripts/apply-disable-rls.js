#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

// SQL statements to disable RLS
const disableRlsStatements = [
  'ALTER TABLE public.transport_requests DISABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.transport_routes DISABLE ROW LEVEL SECURITY;'
];

async function disableRls() {
  console.log('Attempting to disable RLS for transport tables...');

  for (const sql of disableRlsStatements) {
    try {
      console.log(`Executing: ${sql}`);
      
      // Execute the SQL using Supabase's rpc call to pg_transport
      const { error } = await supabase.rpc('pg_transport', {
        query: sql
      });
      
      if (error) {
        console.error(`Error executing SQL: ${error.message}`);
      } else {
        console.log('- Success!');
      }
    } catch (err) {
      console.error(`Exception executing SQL: ${err.message}`);
    }
  }
  
  console.log('Completed RLS disable operation.');
}

// Run the function
disableRls(); 