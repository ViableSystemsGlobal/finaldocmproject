require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testNotificationIntegration() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔍 Testing Notification Settings Integration...\n');

    // 1. Check notification settings in database
    console.log('1. Checking notification settings...');
    const { data: notificationSettings } = await supabase
      .from('notification_type_settings')
      .select('*')
      .eq('notification_type_id', 'member_joined');
    
    if (notificationSettings && notificationSettings.length > 0) {
      console.log('✅ Member Joined notification settings found:');
      notificationSettings.forEach(setting => {
        console.log(`   ${setting.method}: ${setting.enabled ? 'ON' : 'OFF'} for roles: ${JSON.stringify(setting.roles)}`);
      });
    } else {
      console.log('❌ No member_joined notification settings found');
    }

    // 2. Check admin user profile exists
    console.log('\n2. Checking admin user profiles...');
    const { data: adminUsers } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, user_type')
      .eq('user_type', 'admin_staff')
      .eq('is_active', true);

    if (adminUsers && adminUsers.length > 0) {
      console.log('✅ Admin users found:');
      adminUsers.forEach(user => {
        console.log(`   ${user.email} (${user.first_name} ${user.last_name})`);
      });
    } else {
      console.log('❌ No active admin users found');
      console.log('💡 This might be why you\'re not receiving notifications');
    }

    // 3. Check global email settings
    console.log('\n3. Checking global email settings...');
    const { data: globalSettings } = await supabase
      .from('notification_settings')
      .select('email_enabled')
      .single();

    if (globalSettings) {
      console.log(`✅ Global email notifications: ${globalSettings.email_enabled ? 'ENABLED' : 'DISABLED'}`);
    } else {
      console.log('❌ No global notification settings found');
    }

    // 4. Test the notification check function logic
    console.log('\n4. Testing notification check logic...');
    
    // Simulate the check for admin email notifications for member_joined
    const emailSetting = notificationSettings?.find(s => s.method === 'email');
    const globalEmailEnabled = globalSettings?.email_enabled;
    const adminInRoles = emailSetting?.roles?.includes('admin');
    
    const shouldNotify = globalEmailEnabled && emailSetting?.enabled && adminInRoles;
    
    console.log('Notification Check Results:');
    console.log(`   Global email enabled: ${globalEmailEnabled}`);
    console.log(`   Member joined email enabled: ${emailSetting?.enabled}`);
    console.log(`   Admin in allowed roles: ${adminInRoles}`);
    console.log(`   📋 RESULT: Admin should receive notification: ${shouldNotify ? 'YES ✅' : 'NO ❌'}`);

    // 5. Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    
    if (!shouldNotify) {
      console.log('❌ Admin notifications are NOT configured properly');
      
      if (!globalEmailEnabled) {
        console.log('   → Enable global email notifications in Settings > Notifications > General');
      }
      if (!emailSetting?.enabled) {
        console.log('   → Enable email for "Member Joined" in Settings > Notifications > Notification Types');
      }
      if (!adminInRoles) {
        console.log('   → Check "Administrator" for email notifications in "Member Joined" settings');
      }
      if (!adminUsers || adminUsers.length === 0) {
        console.log('   → Ensure your user profile has user_type = "admin_staff" and is_active = true');
      }
    } else if (!adminUsers || adminUsers.length === 0) {
      console.log('❌ Settings are correct but no admin users found to notify');
      console.log('   → Check that your user account exists in user_profiles table');
      console.log('   → Ensure user_type = "admin_staff" and is_active = true');
    } else {
      console.log('✅ Notification settings are configured correctly!');
      console.log('   → New member notifications should be sent to admin users');
      console.log('   → If you\'re still not receiving notifications, check the updated Edge Function deployment');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNotificationIntegration(); 