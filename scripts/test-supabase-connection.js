#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

console.log('== Testing Supabase Connection ==');

// Check environment variables
console.log('\nEnvironment Variables:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

// Create clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey1 = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseServiceKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Directly use the API key values from env file
const manualAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZmZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc4OTc4MDQsImV4cCI6MjAzMzQ3MzgwNH0.Vko-rLT7MXywQ_LLYzwYLGXD2Hf3lVKdkuLSPDDMEuM';
const manualServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZmZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzg5NzgwNCwiZXhwIjoyMDMzNDczODA0fQ.N4qL_KtL7Qd_xt9PcDImQCLsVF58JUJUPgHzNaJv1uY';

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is required');
  process.exit(1);
}

// Test with environment anon key
if (supabaseAnonKey) {
  console.log('\nTesting connection with environment anon key...');
  const client1 = createClient(supabaseUrl, supabaseAnonKey);
  testConnection(client1, 'Environment anon key');
}

// Test with environment service key 1
if (supabaseServiceKey1) {
  console.log('\nTesting connection with NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY...');
  const client2 = createClient(supabaseUrl, supabaseServiceKey1);
  testConnection(client2, 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
}

// Test with environment service key 2
if (supabaseServiceKey2) {
  console.log('\nTesting connection with SUPABASE_SERVICE_ROLE_KEY...');
  const client3 = createClient(supabaseUrl, supabaseServiceKey2);
  testConnection(client3, 'SUPABASE_SERVICE_ROLE_KEY');
}

// Test with manual anon key
console.log('\nTesting connection with manual anon key...');
const client4 = createClient(supabaseUrl, manualAnonKey);
testConnection(client4, 'Manual anon key');

// Test with manual service key
console.log('\nTesting connection with manual service key...');
const client5 = createClient(supabaseUrl, manualServiceKey);
testConnection(client5, 'Manual service key');

async function testConnection(client, keyType) {
  try {
    const { data, error } = await client
      .from('pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public')
      .limit(1);
    
    if (error) {
      console.error(`- Failed with ${keyType}:`, error.message);
    } else {
      console.log(`- Success with ${keyType}! Found tables:`, data.length);
    }
  } catch (err) {
    console.error(`- Error with ${keyType}:`, err.message);
  }
} 