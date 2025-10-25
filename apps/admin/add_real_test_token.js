#!/usr/bin/env node

/**
 * Add a more realistic test push token for testing
 * This creates a token that looks more like a real Expo push token
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ufjfafcfkalaasdhgcbi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzcxNDcxMywiZXhwIjoyMDYzMjkwNzEzfQ.WakMPKwx47UPsmBPIE0uEMT31EMluTw6z1PpJKswMnA'
);

async function addRealisticTestToken() {
  try {
    console.log('🔧 Adding realistic test push token...\n');

    // Your user ID (you are signed in as ysasu38@gmail.com)
    const yourUserId = '3f66df8b-68a0-4de9-a4e5-068c01a5f3ce';

    // Create a more realistic looking Expo push token
    const realisticToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
    
    console.log('📱 Adding realistic test token for your account...');
    console.log('User ID:', yourUserId);
    console.log('Token:', realisticToken);

    const testDevice = {
      device_id: `real-test-device-${Date.now()}`,
      device_name: 'iPhone Test Device',
      platform: 'ios',
      os_version: '17.0',
      app_version: '1.0.0',
      push_token: realisticToken,
      last_used: new Date().toISOString(),
      registered_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('mobile_app_users')
      .update({ 
        devices: [testDevice],
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', yourUserId);

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    console.log('✅ Realistic test token added successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Visit: http://localhost:3003/comms/push-notifications');
    console.log('2. Find "Nana Yaw Appiah-Miracle" (your account)');
    console.log('3. Click "Send Test" to test with the new token');
    console.log('4. Check the server logs for the response');
    console.log('\n💡 NOTE: This is still a test token, so it might not deliver');
    console.log('   to a real device. For real notifications, use Expo Go app.');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

addRealisticTestToken().then(() => {
  console.log('\n✅ Script completed successfully!');
  process.exit(0);
}); 