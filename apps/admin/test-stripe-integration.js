const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  // Check environment variables
  console.log('1. Checking Environment Variables...');
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars);
    console.log('Please add these to your .env.local file\n');
    return;
  }
  console.log('✅ All required environment variables are set\n');

  // Test Supabase connection
  console.log('2. Testing Supabase Connection...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Test basic connection
    const { data, error } = await supabase.from('transactions').select('count').limit(1);
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Supabase connection successful\n');
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
    return;
  }

  // Test new tables exist
  console.log('3. Checking Database Schema...');
  const tablesToCheck = [
    'stripe_webhooks',
    'donation_campaigns', 
    'recurring_donations',
    'donation_receipts',
    'giving_statements'
  ];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table '${table}' not found or accessible:`, error.message);
        console.log('Please run the database migration first\n');
        return;
      }
      console.log(`✅ Table '${table}' exists and accessible`);
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error.message);
      return;
    }
  }
  console.log('✅ All required tables exist\n');

  // Test Stripe configuration
  console.log('4. Testing Stripe Configuration...');
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Test API connection by retrieving account info
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Stripe connection successful`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}\n`);
  } catch (error) {
    console.log('❌ Stripe configuration error:', error.message);
    console.log('Please check your STRIPE_SECRET_KEY\n');
    return;
  }

  // Test donation campaigns
  console.log('5. Testing Donation Campaigns...');
  try {
    const { data: campaigns, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Error fetching donation campaigns:', error.message);
      return;
    }

    console.log(`✅ Found ${campaigns.length} donation campaigns:`);
    campaigns.forEach(campaign => {
      console.log(`   - ${campaign.name}: $${campaign.current_amount}/$${campaign.goal_amount}`);
    });
    console.log('');
  } catch (error) {
    console.log('❌ Error testing donation campaigns:', error.message);
    return;
  }

  // Test API endpoints (if server is running)
  console.log('6. Testing API Endpoints...');
  try {
    const response = await fetch('http://localhost:3001/api/donations/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 10,
        fundDesignation: 'Test',
        donorEmail: 'test@example.com',
        donorName: 'Test User'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Payment intent API endpoint working');
      console.log(`   Client secret received: ${data.clientSecret ? 'Yes' : 'No'}\n`);
    } else {
      console.log('⚠️  Payment intent API endpoint not accessible (server may not be running)');
      console.log('   This is normal if the development server is not started\n');
    }
  } catch (error) {
    console.log('⚠️  Could not test API endpoints (server not running)');
    console.log('   Start the dev server with: npm run dev\n');
  }

  console.log('🎉 Stripe Integration Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Set up Stripe webhooks in your Stripe dashboard');
  console.log('3. Test donations using Stripe test cards');
  console.log('4. Monitor webhook events in the stripe_webhooks table');
}

// Run the test
testStripeIntegration().catch(console.error); 