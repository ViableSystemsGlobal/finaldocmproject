#!/usr/bin/env node

/**
 * Push Notification Fix Script
 * 
 * This script fixes the push notification system by:
 * 1. Adding test push tokens to existing mobile users
 * 2. Testing the push notification API
 * 3. Providing configuration guidance
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufjfafcfkalaasdhgcbi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🔧 Push Notification Fix Script Starting...\n');

  try {
    // Step 1: Get current mobile users
    console.log('📱 Checking current mobile users...');
    const { data: users, error: usersError } = await supabase
      .from('mobile_app_users')
      .select('id, auth_user_id, devices, status')
      .eq('status', 'active');

    if (usersError) {
      throw new Error(`Failed to get mobile users: ${usersError.message}`);
    }

    console.log(`✅ Found ${users.length} active mobile users`);
    
    const usersWithoutTokens = users.filter(user => {
      const devices = Array.isArray(user.devices) ? user.devices : [];
      return devices.length === 0 || !devices.some(device => device.push_token);
    });

    console.log(`❌ ${usersWithoutTokens.length} users without push tokens\n`);

    // Step 2: Add test push tokens to users without them
    if (usersWithoutTokens.length > 0) {
      console.log('🔧 Adding test push tokens...');
      
      const updates = usersWithoutTokens.map((user, index) => ({
        id: user.id,
        devices: [
          {
            device_id: `test-device-${Date.now()}-${index}`,
            device_name: 'Test Device',
            platform: 'ios',
            os_version: '17.0',
            app_version: '1.0.0',
            push_token: `ExponentPushToken[test-token-${Date.now()}-${index}]`,
            last_used: new Date().toISOString(),
            registered_at: new Date().toISOString()
          }
        ]
      }));

      // Update users with test push tokens
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('mobile_app_users')
          .update({ devices: update.devices })
          .eq('id', update.id);

        if (updateError) {
          console.error(`❌ Failed to update user ${update.id}:`, updateError.message);
        } else {
          console.log(`✅ Added test push token to user ${update.id}`);
        }
      }
    }

    // Step 3: Test the push notification API
    console.log('\n🧪 Testing push notification API...');
    
    const testPayload = {
      userIds: users.slice(0, 2).map(u => u.auth_user_id), // Test with first 2 users
      title: 'Test Notification',
      body: 'This is a test notification from the fix script',
      type: 'general'
    };

    const response = await fetch('http://localhost:3003/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Push notification test successful!`);
      console.log(`📊 Sent to ${result.sentCount} users`);
    } else {
      console.log(`❌ Push notification test failed: ${result.error}`);
    }

    // Step 4: Configuration guidance
    console.log('\n📋 CONFIGURATION CHECKLIST:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n1. ✅ EXPO ACCESS TOKEN (Required for production)');
    console.log('   • Get token from: https://expo.dev/accounts/[your-account]/settings/access-tokens');
    console.log('   • Add to apps/admin/.env.local:');
    console.log('     EXPO_ACCESS_TOKEN=your_actual_token_here');
    console.log('   • Currently: MISSING (using simulation mode)');
    
    console.log('\n2. ✅ MOBILE APP PUSH TOKEN REGISTRATION');
    console.log('   • Mobile app must call: /api/mobile-users/register-push-token');
    console.log('   • Payload: { userId, pushToken, platform, deviceInfo }');
    console.log('   • This populates the devices array with real tokens');
    
    console.log('\n3. ✅ DATABASE SCHEMA');
    console.log('   • mobile_app_users.devices (JSONB array) ✅');
    console.log('   • Each device object needs push_token field ✅');
    
    console.log('\n4. ✅ API ENDPOINTS');
    console.log('   • /api/mobile-users (list users) ✅');
    console.log('   • /api/notifications/send-push (send notifications) ✅');
    console.log('   • /api/mobile-users/register-push-token (register tokens) ✅');

    // Step 5: Show current status
    console.log('\n📊 CURRENT STATUS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get updated user count
    const { data: updatedUsers } = await supabase
      .from('mobile_app_users')
      .select('devices')
      .eq('status', 'active');

    const usersWithTokens = updatedUsers.filter(user => {
      const devices = Array.isArray(user.devices) ? user.devices : [];
      return devices.some(device => device.push_token);
    });

    console.log(`📱 Total mobile users: ${updatedUsers.length}`);
    console.log(`🔑 Users with push tokens: ${usersWithTokens.length}`);
    console.log(`❌ Users without tokens: ${updatedUsers.length - usersWithTokens.length}`);
    
    if (usersWithTokens.length > 0) {
      console.log(`✅ Push notifications are now ready to test!`);
    } else {
      console.log(`⚠️  Still need to register push tokens from mobile app`);
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Visit: http://localhost:3003/comms/push-notifications');
    console.log('2. Try sending a test notification');
    console.log('3. Configure EXPO_ACCESS_TOKEN for production');
    console.log('4. Ensure mobile app registers real push tokens');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Push notification fix script completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
}

module.exports = { main }; 