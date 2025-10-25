require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testGivingSummary() {
  console.log('🔍 Testing Giving Summary functionality...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Step 1: Check if donations table exists and has data
  console.log('\n1. Checking donations table...');
  const { data: allDonations, error: donationsError } = await supabase
    .from('donations')
    .select('*')
    .limit(10);
    
  if (donationsError) {
    console.log('❌ Error getting donations:', donationsError.message);
    
    // Check if table exists
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'donations');
    
    if (tableError) {
      console.log('❌ Error checking if donations table exists:', tableError.message);
    } else if (!tableInfo || tableInfo.length === 0) {
      console.log('❌ Donations table does not exist!');
    } else {
      console.log('✅ Donations table exists but query failed');
    }
    return;
  }
  
  console.log(`Found ${allDonations?.length || 0} donations total:`);
  allDonations?.forEach((donation, index) => {
    console.log(`  ${index + 1}. Contact: ${donation.contact_id}, Amount: $${donation.amount}, Date: ${donation.donation_date}`);
  });
  
  // Step 2: Test giving summary function for specific contacts
  const testContactIds = [
    '1e1f63ae-02e5-4e54-a13e-30b5a7858008', // Kwame Mensah
    '12f2dcac-0b99-4c07-8164-0a3d4b469a16'  // Nana Yaw
  ];
  
  for (const contactId of testContactIds) {
    console.log(`\n2. Testing giving summary for contact: ${contactId}...`);
    
    // Get contact name
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();
    
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    console.log(`   Contact: ${contactName}`);
    
    // Test the exact query from memberDetails.ts
    const { data: contactDonations, error: contactDonationsError } = await supabase
      .from('donations')
      .select('amount, donation_date, payment_method, fund_designation, created_at')
      .eq('contact_id', contactId)
      .order('donation_date', { ascending: false });

    if (contactDonationsError) {
      console.log('❌ Error fetching donations for contact:', contactDonationsError.message);
      continue;
    }

    console.log(`   Found ${contactDonations?.length || 0} donations for this contact`);
    
    if (!contactDonations || contactDonations.length === 0) {
      console.log('   ❌ No donations found - Giving Summary will show zeros');
      continue;
    }

    // Calculate exactly like in memberDetails.ts
    const currentYear = new Date().getFullYear();
    const yearToDateDonations = contactDonations.filter(donation => {
      const donationYear = new Date(donation.donation_date).getFullYear();
      return donationYear === currentYear;
    });

    const yearToDateTotal = yearToDateDonations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const lastContribution = contactDonations[0]?.donation_date;
    const totalContributions = contactDonations.length;
    const averageContribution = totalContributions > 0 ? (contactDonations.reduce((sum, d) => sum + (d.amount || 0), 0) / totalContributions) : 0;

    console.log('   📊 Calculated Giving Summary:');
    console.log(`      Year-to-Date Total: $${yearToDateTotal.toFixed(2)}`);
    console.log(`      Last Contribution: ${lastContribution}`);
    console.log(`      Total Contributions: ${totalContributions}`);
    console.log(`      Average Contribution: $${averageContribution.toFixed(2)}`);
    
    // Show individual donations
    console.log('   💰 Individual donations:');
    contactDonations.forEach((donation, index) => {
      console.log(`      ${index + 1}. $${donation.amount} on ${donation.donation_date} (${donation.payment_method || 'Unknown method'})`);
    });
  }
  
  console.log('\n✨ Giving Summary test complete!');
}

testGivingSummary().catch(console.error); 