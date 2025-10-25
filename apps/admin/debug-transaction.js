const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugTransaction() {
  console.log('🔍 Debug: Recent Transaction & Campaign Status\n');
  
  try {
    // Get the most recent transaction
    const { data: recentTransaction } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (recentTransaction && recentTransaction[0]) {
      const tx = recentTransaction[0];
      console.log('📋 Most Recent Transaction:');
      console.log('   Amount: $' + tx.amount);
      console.log('   Category: "' + tx.category + '"');
      console.log('   Fund Designation: "' + (tx.fund_designation || 'N/A') + '"');
      console.log('   Created: ' + new Date(tx.created_at).toLocaleString());
      
      // Check if it has campaign format
      if (tx.category && tx.category.startsWith('campaign_')) {
        const campaignId = tx.category.replace('campaign_', '');
        console.log('   🎯 Campaign ID: ' + campaignId);
        
        // Check the campaign
        const { data: campaign } = await supabase
          .from('donation_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single();
        
        if (campaign) {
          console.log('\n📊 Campaign Status:');
          console.log('   Name: ' + campaign.name);
          console.log('   Current Amount: $' + campaign.current_amount);
          console.log('   Goal: $' + (campaign.goal_amount || 'No goal'));
          console.log('   Updated: ' + new Date(campaign.updated_at).toLocaleString());
          
          // Check all transactions for this campaign
          const { data: campaignTransactions } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('category', `campaign_${campaignId}`)
            .order('created_at', { ascending: false });
          
          console.log('\n💰 All Donations for this Campaign:');
          let total = 0;
          campaignTransactions?.forEach((tx, index) => {
            console.log(`   ${index + 1}. $${tx.amount} (${new Date(tx.created_at).toLocaleDateString()})`);
            total += tx.amount;
          });
          console.log(`   Total: $${total}`);
          
          if (Math.abs(total - campaign.current_amount) > 0.01) {
            console.log('⚠️  MISMATCH: Campaign current_amount does not match sum of transactions!');
            console.log('   Expected: $' + total);
            console.log('   Actual: $' + campaign.current_amount);
          } else {
            console.log('✅ Campaign total matches transaction sum');
          }
        } else {
          console.log('❌ Campaign not found with ID: ' + campaignId);
        }
      } else {
        console.log('❌ Transaction does not have campaign format');
        console.log('   Expected: "campaign_[UUID]"');
        console.log('   Actual: "' + tx.category + '"');
        
        // Show available campaigns
        const { data: campaigns } = await supabase
          .from('donation_campaigns')
          .select('id, name, current_amount, goal_amount')
          .eq('is_active', true);
        
        console.log('\n📋 Available Active Campaigns:');
        campaigns?.forEach((camp, index) => {
          console.log(`   ${index + 1}. ${camp.name} - $${camp.current_amount}/$${camp.goal_amount || '∞'}`);
          console.log(`      Category should be: "campaign_${camp.id}"`);
        });
      }
    } else {
      console.log('❌ No recent transactions found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugTransaction(); 