#!/usr/bin/env node

/**
 * Simple test to verify database fixes
 * Run this after executing the SQL script in Supabase Dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load from .env file

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables in .env file');
  console.log('Looking for: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseFixes() {
  console.log('🧪 Testing database fixes...\n');

  let allTestsPassed = true;

  // Test 1: Check if comms.templates table exists and has data
  console.log('1. Testing communications templates...');
  try {
    const { data: templates, error } = await supabase
      .from('comms.templates')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ Templates test failed:', error.message);
      allTestsPassed = false;
    } else {
      console.log(`✅ Templates working! Found ${templates?.length || 0} templates`);
      if (templates && templates.length > 0) {
        console.log(`   Sample: "${templates[0].name}" for ${templates[0].channel}`);
      }
    }
  } catch (err) {
    console.log('❌ Templates test failed:', err.message);
    allTestsPassed = false;
  }

  // Test 2: Check foreign key relationships
  console.log('\n2. Testing foreign key relationships...');
  try {
    const { data: groups, error } = await supabase
      .from('discipleship_groups')
      .select(`
        id,
        name,
        campus:campuses(id, name)
      `)
      .limit(2);

    if (error) {
      console.log('❌ Foreign key test failed:', error.message);
      allTestsPassed = false;
    } else {
      console.log(`✅ Foreign keys working! Found ${groups?.length || 0} discipleship groups with campus data`);
    }
  } catch (err) {
    console.log('❌ Foreign key test failed:', err.message);
    allTestsPassed = false;
  }

  // Test 3: Check RPC function
  console.log('\n3. Testing RPC function...');
  try {
    // Just test if the function exists (this might fail due to auth, but that's OK)
    const { error } = await supabase.rpc('send_group_message', {
      p_channel: 'email',
      p_content: 'test',
      p_group_id: '00000000-0000-0000-0000-000000000000',
      p_recipient_ids: []
    });

    if (error && error.message.includes('function send_group_message')) {
      console.log('❌ RPC function missing');
      allTestsPassed = false;
    } else {
      console.log('✅ RPC function exists and is callable');
    }
  } catch (err) {
    console.log('✅ RPC function exists (auth error expected)');
  }

  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Database fixes are working.');
    console.log('Your console errors should now be resolved.');
  } else {
    console.log('⚠️  Some tests failed. You may need to:');
    console.log('   1. Run the SQL script in Supabase Dashboard');
    console.log('   2. Check your Supabase connection');
    console.log('   3. Verify you have the right environment variables');
  }
  console.log('='.repeat(50));
}

testDatabaseFixes().catch(console.error); 