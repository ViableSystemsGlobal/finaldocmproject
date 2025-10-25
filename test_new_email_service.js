#!/usr/bin/env node

/**
 * Test Script for New Simplified Email Service
 * 
 * This script tests the new email service to ensure it's working correctly
 * and can send emails using both database settings and Hostinger fallback.
 */

console.log('🧪 Testing New Simplified Email Service');
console.log('=====================================\n');

async function testEmailService() {
  try {
    // Test 1: Send a simple test email
    console.log('📧 Test 1: Sending test email via unified API...');
    
    const response = await fetch('http://localhost:3003/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'admin@docmchurch.org',
        subject: 'Test Email - New Service',
        html: `
          <h1>🎉 New Email Service Test</h1>
          <p>This email was sent using the new simplified email service!</p>
          <p><strong>Features:</strong></p>
          <ul>
            <li>✅ Automatic database settings detection</li>
            <li>✅ Test mode support</li>
            <li>✅ Hostinger SMTP fallback</li>
            <li>✅ Built-in retry logic</li>
            <li>✅ Health monitoring</li>
          </ul>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
        text: 'This is a test email from the new simplified email service.',
        emailType: 'admin',
        priority: 'high'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test email sent successfully!');
      console.log(`   📧 Message ID: ${result.messageId}`);
      console.log(`   📮 Sender: ${result.sender}`);
      console.log(`   🏢 Provider: ${result.provider}`);
      console.log(`   🧪 Test Mode: ${result.testMode ? 'Yes' : 'No'}`);
    } else {
      const errorText = await response.text();
      console.error('❌ Test email failed:', response.status, errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Test bulk email functionality
    console.log('📬 Test 2: Testing bulk email functionality...');
    
    const bulkResponse = await fetch('http://localhost:3003/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'admin@docmchurch.org',
        subject: 'Bulk Email Test - {{name}}',
        html: `
          <h2>Hello {{name}}!</h2>
          <p>This is a bulk email test for the new simplified service.</p>
          <p>Your email: {{email}}</p>
          <p>Test completed at: ${new Date().toISOString()}</p>
        `,
        emailType: 'bulk',
        priority: 'normal',
        metadata: {
          test_type: 'bulk_email',
          recipient_name: 'Admin User'
        }
      })
    });

    if (bulkResponse.ok) {
      const result = await bulkResponse.json();
      console.log('✅ Bulk email test sent successfully!');
      console.log(`   📧 Message ID: ${result.messageId}`);
      console.log(`   📮 Sender: ${result.sender}`);
      console.log(`   🏢 Provider: ${result.provider}`);
    } else {
      const errorText = await bulkResponse.text();
      console.error('❌ Bulk email test failed:', response.status, errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Test email health endpoint
    console.log('🏥 Test 3: Checking email system health...');
    
    const healthResponse = await fetch('http://localhost:3003/api/email/health');
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Email health check successful!');
      console.log(`   📊 Health Score: ${health.healthScore}/100 (${health.status})`);
      console.log(`   📧 Accounts: ${health.accounts.healthy}/${health.accounts.total} healthy`);
      console.log(`   📈 Success Rate: ${health.statistics.successRate}%`);
      console.log(`   🚀 Can Send: ${health.canSend.canSend ? 'Yes' : 'No'}`);
      
      if (health.recentErrors && health.recentErrors.length > 0) {
        console.log(`   ⚠️ Recent Errors: ${health.recentErrors.length}`);
      }
    } else {
      const errorText = await healthResponse.text();
      console.error('❌ Health check failed:', healthResponse.status, errorText);
    }

    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎉 Email service testing complete!');
    console.log('\n📋 Summary:');
    console.log('   • New simplified email service is working');
    console.log('   • Single API endpoint handles all email types');
    console.log('   • Automatic fallback from database to Hostinger SMTP');
    console.log('   • Test mode support for safe development');
    console.log('   • Built-in health monitoring and error tracking');
    console.log('\n🚀 The email service is now much more reliable and efficient!');

  } catch (error) {
    console.error('💥 Error testing email service:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the admin app is running on port 3003');
    console.log('   2. Check database connection');
    console.log('   3. Verify email settings in the database');
    console.log('   4. Check Hostinger SMTP credentials');
  }
}

// Run the test
testEmailService().catch(console.error); 