#!/usr/bin/env node

/**
 * Test script for email service functionality
 * This will test if the email system is properly configured
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailService() {
  console.log('🧪 Testing Email Service Integration...\n');

  try {
    // 1. Test if email_queue table exists
    console.log('1. Testing email_queue table...');
    const { data: queueData, error: queueError } = await supabase
      .from('email_queue')
      .select('count')
      .limit(1);
    
    if (queueError) {
      console.log('❌ Email queue table not found or accessible');
      console.log('   You may need to create the email_queue table');
    } else {
      console.log('✅ Email queue table exists and accessible');
    }

    // 2. Test if messaging tables exist
    console.log('\n2. Testing messaging tables...');
    const { data: messageData, error: messageError } = await supabase
      .from('comms.messages')
      .select('count')
      .limit(1);
    
    if (messageError) {
      console.log('❌ Messages table not found');
      console.log('   Please run create-message-tables.sql in Supabase Dashboard');
    } else {
      console.log('✅ Messages table exists and accessible');
    }

    // 3. Test RPC function
    console.log('\n3. Testing send_group_message RPC function...');
    try {
      // Test with empty arrays (should not actually send anything)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('send_group_message', {
          p_channel: 'email',
          p_content: 'Test message (not sent)',
          p_group_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          p_recipient_ids: [], // Empty array
          p_subject: 'Test Subject'
        });

      if (rpcError) {
        console.log('❌ RPC function error:', rpcError.message);
      } else {
        console.log('✅ RPC function is callable');
        console.log('   Response:', rpcData);
      }
    } catch (rpcErr) {
      console.log('❌ RPC function test failed:', rpcErr.message);
    }

    // 4. Test getting some groups and contacts
    console.log('\n4. Testing groups and contacts...');
    
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')
      .limit(5);
    
    if (groupsError) {
      console.log('❌ Could not fetch groups:', groupsError.message);
    } else {
      console.log(`✅ Found ${groups?.length || 0} groups`);
      if (groups && groups.length > 0) {
        console.log('   Sample group:', groups[0].name);
      }
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email')
      .not('email', 'is', null)
      .limit(5);
    
    if (contactsError) {
      console.log('❌ Could not fetch contacts:', contactsError.message);
    } else {
      console.log(`✅ Found ${contacts?.length || 0} contacts with email addresses`);
      if (contacts && contacts.length > 0) {
        console.log('   Sample contact:', contacts[0].first_name, contacts[0].last_name);
      }
    }

    console.log('\n=================================================');
    console.log('🎯 EMAIL SERVICE TEST SUMMARY:');
    console.log('=================================================');
    
    if (!queueError && !messageError && !rpcError) {
      console.log('🎉 All tests passed! Email service should be working.');
      console.log('');
      console.log('✅ Next steps:');
      console.log('   1. Make sure your email credentials are set up');
      console.log('   2. Test sending a real message from the UI');
      console.log('   3. Check the email_queue table for queued messages');
    } else {
      console.log('⚠️  Some tests failed. Please run the setup scripts:');
      console.log('   1. Run create-message-tables.sql in Supabase Dashboard');
      console.log('   2. Check your database permissions');
      console.log('   3. Verify your email configuration');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testEmailService(); 