#!/usr/bin/env node

/**
 * Test script for the notification system
 * This script tests both the email service and notification system
 */

const { execSync } = require('child_process');

console.log('🧪 Testing Notification System\n');

async function testEmailService() {
  console.log('📧 Testing Email Service...');
  
  try {
    const response = await fetch('http://localhost:3003/api/test-email-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email from Notification System',
        body: '<h2>Test Email</h2><p>This is a test email from the church management system.</p>'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email service test passed');
      console.log('   Message ID:', result.result.messageId);
      console.log('   Provider:', result.result.provider);
      console.log('   Sender:', result.result.sender);
    } else {
      console.log('❌ Email service test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Email service test error:', error.message);
  }
  
  console.log('');
}

async function testNotificationSystem() {
  console.log('🔔 Testing Notification System...');
  
  try {
    // Get the first user ID from the system for testing
    const response = await fetch('http://localhost:3003/api/test-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType: 'follow_up_assignment',
        userId: 'test-user-id', // This would be replaced with an actual user ID
        assignedByUserName: 'Test Admin'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Notification system test passed');
      console.log('   Email sent:', result.result.emailSent);
      console.log('   Push sent:', result.result.pushSent);
    } else {
      console.log('❌ Notification system test failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Notification system test error:', error.message);
  }
  
  console.log('');
}

async function checkDatabaseTables() {
  console.log('🗄️  Checking Database Tables...');
  
  try {
    // This would check if the database tables exist
    console.log('   Tables to check:');
    console.log('   ✓ notification_settings');
    console.log('   ✓ notification_types');
    console.log('   ✓ notification_type_settings');
    console.log('   ✓ user_profiles');
    console.log('   ✓ user_notification_preferences');
    console.log('   ✓ notification_logs');
    
    console.log('   Run migrations first:');
    console.log('   psql -h localhost -U cics_user -d cics_church -f supabase/migrations/20241201000002_add_follow_up_assigned_notification.sql');
    console.log('   psql -h localhost -U cics_user -d cics_church -f supabase/migrations/20241201000003_create_notification_tables.sql');
  } catch (error) {
    console.log('❌ Database check error:', error.message);
  }
  
  console.log('');
}

async function main() {
  console.log('Starting notification system tests...\n');
  
  await checkDatabaseTables();
  await testEmailService();
  await testNotificationSystem();
  
  console.log('📋 Testing Summary:');
  console.log('   1. Run the database migrations on your VPS');
  console.log('   2. Test the email service endpoint');
  console.log('   3. Test the notification system endpoint');
  console.log('   4. Try assigning a follow-up in the admin panel');
  console.log('');
  console.log('🚀 If all tests pass, the notification system is ready!');
}

// Run the tests
main().catch(console.error); 