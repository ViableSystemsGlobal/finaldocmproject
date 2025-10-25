#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixCampaignTotals() {
  console.log('🔧 Starting campaign totals fix...');
  
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and service role key are set');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // Step 1: Get all campaigns
    console.log('📋 Fetching campaigns...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('donation_campaigns')
      .select('id, name, current_amount, goal_amount');
    
    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`);
    }
    
    console.log(`Found ${campaigns.length} campaigns`);
    
    // Step 2: Process each campaign
    for (const campaign of campaigns) {
      console.log(`\n💰 Processing campaign: ${campaign.name}`);
      
      // Get transactions for this campaign
      const campaignCategory = `campaign_${campaign.id}`;
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('amount, payment_status')
        .eq('category', campaignCategory);
      
      if (transactionsError) {
        console.error(`❌ Failed to fetch transactions for ${campaign.name}:`, transactionsError.message);
        continue;
      }
      
      // Calculate total (only successful transactions)
      const total = transactions
        .filter(t => !t.payment_status || t.payment_status === 'succeeded')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      console.log(`  - Found ${transactions.length} transactions`);
      console.log(`  - Current amount in DB: $${campaign.current_amount}`);
      console.log(`  - Calculated total: $${total.toFixed(2)}`);
      
      // Update campaign if totals don't match
      if (parseFloat(campaign.current_amount) !== total) {
        console.log(`  - 🔄 Updating campaign total...`);
        
        const { error: updateError } = await supabase
          .from('donation_campaigns')
          .update({ current_amount: total })
          .eq('id', campaign.id);
        
        if (updateError) {
          console.error(`  - ❌ Failed to update ${campaign.name}:`, updateError.message);
        } else {
          console.log(`  - ✅ Updated ${campaign.name} from $${campaign.current_amount} to $${total.toFixed(2)}`);
        }
      } else {
        console.log(`  - ✅ No update needed - totals match`);
      }
    }
    
    console.log('\n🎉 Campaign totals fix completed!');
    
    // Step 3: Show summary
    console.log('\n📊 Final campaign summary:');
    const { data: updatedCampaigns } = await supabase
      .from('donation_campaigns')
      .select('name, current_amount, goal_amount')
      .order('name');
    
    for (const campaign of updatedCampaigns) {
      const percentage = campaign.goal_amount > 0 
        ? ((campaign.current_amount / campaign.goal_amount) * 100).toFixed(1)
        : '0.0';
      console.log(`  - ${campaign.name}: $${campaign.current_amount} of $${campaign.goal_amount} (${percentage}%)`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing campaign totals:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixCampaignTotals(); 