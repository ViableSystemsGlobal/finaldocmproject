// Manual test to add a transaction to a campaign
// You'll need to run this in the browser console where environment variables are available

console.log('🧪 Testing Campaign Transaction Link...');

// Step 1: Get a campaign ID from the campaigns page
// Go to /finance/giving/campaigns and copy a campaign ID from the URL or inspect element

// Step 2: Use this test function
async function testCampaignTransaction() {
  // Replace this with an actual campaign ID from your campaigns page
  const CAMPAIGN_ID = 'YOUR_CAMPAIGN_ID_HERE';
  const TEST_AMOUNT = 50.00;
  
  try {
    // Create a test transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        amount: TEST_AMOUNT,
        currency: 'USD',
        category: `campaign_${CAMPAIGN_ID}`,  // This is the key!
        payment_method: 'Test',
        payment_status: 'succeeded',
        fund_designation: 'Test Campaign Donation',
        transacted_at: new Date().toISOString(),
        is_recurring: false,
        tax_deductible: true
      })
      .select();
    
    if (error) {
      console.error('❌ Error creating transaction:', error);
      return;
    }
    
    console.log('✅ Transaction created:', data);
    
    // Wait a moment for trigger to run
    setTimeout(async () => {
      // Check if campaign total updated
      const { data: campaign } = await supabase
        .from('donation_campaigns')
        .select('name, current_amount, goal_amount')
        .eq('id', CAMPAIGN_ID)
        .single();
      
      if (campaign) {
        console.log('📊 Campaign after transaction:');
        console.log('Name:', campaign.name);
        console.log('Current Amount:', campaign.current_amount);
        console.log('Goal:', campaign.goal_amount);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// To use this:
// 1. Go to your browser console on the admin site
// 2. Replace YOUR_CAMPAIGN_ID_HERE with a real campaign ID
// 3. Run testCampaignTransaction()

console.log('📋 Instructions:');
console.log('1. Go to /finance/giving/campaigns');
console.log('2. Copy a campaign ID');
console.log('3. Replace YOUR_CAMPAIGN_ID_HERE with the real ID');
console.log('4. Run testCampaignTransaction() in browser console'); 