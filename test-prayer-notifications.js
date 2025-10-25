#!/usr/bin/env node

/**
 * Prayer Assignment Notification Test Script
 * Tests the prayer assignment notification system by making API calls
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Test user ID - replace with actual user ID from your database
const testUserId = process.env.TEST_USER_ID || 'test-user-id';

// Test user IDs for multi-person assignment - replace with actual user IDs
const testUserIds = process.env.TEST_USER_IDS 
  ? process.env.TEST_USER_IDS.split(',')
  : ['test-user-1', 'test-user-2', 'test-user-3'];

async function testPrayerNotifications() {
  console.log('🙏 Testing Prayer Assignment Notification System');
  console.log('================================================');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Test User ID: ${testUserId}`);
  console.log('');

  try {
    // Test 1: Basic prayer assignment notification
    console.log('📧 Test 1: Basic Prayer Assignment Notification');
    console.log('------------------------------------------------');
    
    const response1 = await fetch(`${baseUrl}/api/test-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType: 'prayer_assignment',
        userId: testUserId,
        assignedByUserName: 'Test Administrator'
      })
    });

    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    if (result1.success) {
      console.log('✅ Basic prayer assignment notification test PASSED');
      if (result1.result?.emailSent) {
        console.log('📧 Email notification sent successfully');
      }
      if (result1.result?.pushSent) {
        console.log('📱 Push notification sent successfully');
      }
    } else {
      console.log('❌ Basic prayer assignment notification test FAILED');
      console.log('Error:', result1.error);
    }
    
    console.log('');

    // Test 2: Custom prayer data
    console.log('📧 Test 2: Custom Prayer Assignment Data');
    console.log('----------------------------------------');
    
    const customPrayerData = {
      id: 'custom-prayer-test-' + Date.now(),
      title: 'Healing and Recovery',
      submitterName: 'Sarah Johnson',
      category: 'health',
      message: 'Please pray for my mother who is recovering from surgery. She needs strength and healing during this difficult time.',
      isConfidential: true,
      urgency: 'high'
    };

    const response2 = await fetch(`${baseUrl}/api/test-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType: 'prayer_assignment',
        userId: testUserId,
        prayerData: customPrayerData,
        assignedByUserName: 'Pastor Smith'
      })
    });

    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    if (result2.success) {
      console.log('✅ Custom prayer assignment notification test PASSED');
      if (result2.result?.emailSent) {
        console.log('📧 Email notification sent successfully');
      }
      if (result2.result?.pushSent) {
        console.log('📱 Push notification sent successfully');
      }
    } else {
      console.log('❌ Custom prayer assignment notification test FAILED');
      console.log('Error:', result2.error);
    }
    
    console.log('');

    // Test 3: Multi-person prayer assignment
    console.log('👥 Test 3: Multi-Person Prayer Assignment');
    console.log('------------------------------------------');
    
    const multiResponse = await fetch(`${baseUrl}/api/test-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType: 'multi_person_prayer_assignment',
        userIds: testUserIds,
        assignedByUserName: 'Test Administrator'
      })
    });

    const multiResult = await multiResponse.json();
    console.log('Response:', JSON.stringify(multiResult, null, 2));
    
    if (multiResult.success) {
      console.log('✅ Multi-person prayer assignment test PASSED');
      console.log(`📧 ${multiResult.totalNotifications} total notifications attempted`);
      if (multiResult.results) {
        const successful = multiResult.results.filter(r => r.success).length;
        const failed = multiResult.results.filter(r => !r.success).length;
        console.log(`📊 ${successful} successful, ${failed} failed`);
      }
    } else {
      console.log('❌ Multi-person prayer assignment test FAILED');
      console.log('Error:', multiResult.error);
    }
    
    console.log('');

    // Test 4: Check notification system status
    console.log('📊 Test 4: Notification System Status');
    console.log('------------------------------------');
    
    const statusResponse = await fetch(`${baseUrl}/api/test-notifications?check=status`);
    const statusResult = await statusResponse.json();
    console.log('Response:', JSON.stringify(statusResult, null, 2));
    
    if (statusResult.success) {
      console.log('✅ Notification system status check PASSED');
    } else {
      console.log('❌ Notification system status check FAILED');
    }
    
    console.log('');

    // Summary
    console.log('📋 Test Summary');
    console.log('===============');
    console.log('Prayer assignment notification system has been tested with:');
    console.log('- Individual prayer assignment notifications');
    console.log('- Custom prayer data with confidential/urgent requests');
    console.log('- Multi-person assignment notifications');
    console.log('- System status verification');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Check your email for test prayer assignment notifications');
    console.log('2. Verify that the email content looks correct');
    console.log('3. Test the UI features:');
    console.log('   - Individual assignment with notifications');
    console.log('   - Bulk "Assign to People" with search functionality');
    console.log('   - Bulk "Assign by Role" feature');
    console.log('4. Run the database migrations if you haven\'t already');
    console.log('');
    console.log('Environment Variables (optional):');
    console.log('- TEST_USER_ID=your-user-uuid');
    console.log('- TEST_USER_IDS=user1-uuid,user2-uuid,user3-uuid');
    console.log('');
    console.log('Database Migrations to Run:');
    console.log('- supabase/migrations/20241201000004_add_prayer_assignment_notification.sql');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error running prayer notification tests:', error);
    process.exit(1);
  }
}

// Run the tests
testPrayerNotifications(); 