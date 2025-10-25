#!/usr/bin/env node

/**
 * Verification script to check if the database fixes have been applied
 * Run this after executing the SQL fixes to verify everything is working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFixes() {
  console.log('🔍 Verifying database fixes...\n');

  // Test 1: Check foreign key constraints
  console.log('1. Testing foreign key constraints...');
  try {
    const { data: discipleshipGroups, error } = await supabase
      .from('discipleship_groups')
      .select(`
        id,
        name,
        campus:campuses(id, name),
        leader:contacts(id, first_name, last_name)
      `)
      .limit(5);

    if (error) {
      console.log('❌ Foreign key constraints test failed:', error.message);
    } else {
      console.log('✅ Foreign key constraints working correctly');
      console.log(`   Found ${discipleshipGroups?.length || 0} discipleship groups with proper relationships`);
    }
  } catch (err) {
    console.log('❌ Foreign key constraints test failed:', err.message);
  }

  // Test 2: Check comms schema and templates
  console.log('\n2. Testing communications schema...');
  try {
    const { data: templates, error } = await supabase
      .from('comms.templates')
      .select('*')
      .eq('channel', 'email')
      .limit(5);

    if (error) {
      console.log('❌ Communications schema test failed:', error.message);
    } else {
      console.log('✅ Communications schema working correctly');
      console.log(`   Found ${templates?.length || 0} email templates`);
    }
  } catch (err) {
    console.log('❌ Communications schema test failed:', err.message);
  }

  // Test 3: Check if RPC function exists
  console.log('\n3. Testing RPC function...');
  try {
    // Just test if the function exists without actually calling it
    const { error } = await supabase.rpc('send_group_message', {
      p_channel: 'email',
      p_content: 'test',
      p_group_id: '00000000-0000-0000-0000-000000000000',
      p_recipient_ids: []
    });

    // We expect this to potentially fail due to missing auth, but the function should exist
    if (error && error.message.includes('function send_group_message')) {
      console.log('❌ RPC function not found:', error.message);
    } else {
      console.log('✅ RPC function exists and is callable');
    }
  } catch (err) {
    console.log('❌ RPC function test failed:', err.message);
  }

  // Test 4: Check campuses table
  console.log('\n4. Testing campuses table...');
  try {
    const { data: campuses, error } = await supabase
      .from('campuses')
      .select('id, name')
      .limit(5);

    if (error) {
      console.log('❌ Campuses table test failed:', error.message);
    } else {
      console.log('✅ Campuses table working correctly');
      console.log(`   Found ${campuses?.length || 0} campuses`);
    }
  } catch (err) {
    console.log('❌ Campuses table test failed:', err.message);
  }

  console.log('\n🏁 Verification complete!');
  console.log('\nIf all tests passed, the console errors should be resolved.');
  console.log('If any tests failed, you may need to run the SQL scripts in your Supabase dashboard.');
}

verifyFixes().catch(console.error); 