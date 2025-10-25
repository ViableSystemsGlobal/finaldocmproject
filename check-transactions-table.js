require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkTransactionsTable() {
  console.log('🔍 Checking transactions table (where giving data is actually stored)...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Step 1: Check if transactions table exists
  console.log('\n1. Checking transactions table...');
  const { data: allTransactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .limit(10);
    
  if (transactionsError) {
    console.log('❌ Error getting transactions:', transactionsError.message);
    return;
  }
  
  console.log(`Found ${allTransactions?.length || 0} transactions total:`);
  allTransactions?.forEach((transaction, index) => {
    console.log(`  ${index + 1}. Contact: ${transaction.contact_id}, Amount: $${transaction.amount}, Date: ${transaction.transacted_at}, Category: ${transaction.category}`);
  });
  
  // Step 2: Test giving summary calculation using transactions table
  const testContactIds = [
    '1e1f63ae-02e5-4e54-a13e-30b5a7858008', // Kwame Mensah
    '12f2dcac-0b99-4c07-8164-0a3d4b469a16'  // Nana Yaw
  ];
  
  for (const contactId of testContactIds) {
    console.log(`\n2. Testing giving calculation for contact: ${contactId}...`);
    
    // Get contact name
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name')
      .eq('id', contactId)
      .single();
    
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    console.log(`   Contact: ${contactName}`);
    
    // Query transactions (same as used in the giving page)
    const { data: contactTransactions, error: contactTransactionsError } = await supabase
      .from('transactions')
      .select('amount, transacted_at, payment_method, category, created_at')
      .eq('contact_id', contactId)
      .order('transacted_at', { ascending: false });

    if (contactTransactionsError) {
      console.log('❌ Error fetching transactions for contact:', contactTransactionsError.message);
      continue;
    }

    console.log(`   Found ${contactTransactions?.length || 0} transactions for this contact`);
    
    if (!contactTransactions || contactTransactions.length === 0) {
      console.log('   ❌ No transactions found - Giving Summary will show zeros');
      continue;
    }

    // Calculate exactly like memberDetails should (but using transactions table)
    const currentYear = new Date().getFullYear();
    const yearToDateTransactions = contactTransactions.filter(transaction => {
      const transactionYear = new Date(transaction.transacted_at).getFullYear();
      return transactionYear === currentYear;
    });

    const yearToDateTotal = yearToDateTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    const lastContribution = contactTransactions[0]?.transacted_at;
    const totalContributions = contactTransactions.length;
    const averageContribution = totalContributions > 0 ? (contactTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / totalContributions) : 0;

    console.log('   📊 Calculated Giving Summary (from transactions table):');
    console.log(`      Year-to-Date Total: $${yearToDateTotal.toFixed(2)}`);
    console.log(`      Last Contribution: ${lastContribution}`);
    console.log(`      Total Contributions: ${totalContributions}`);
    console.log(`      Average Contribution: $${averageContribution.toFixed(2)}`);
    
    // Show individual transactions
    console.log('   💰 Individual transactions:');
    contactTransactions.forEach((transaction, index) => {
      console.log(`      ${index + 1}. $${transaction.amount} on ${transaction.transacted_at} via ${transaction.payment_method || 'Unknown method'} (${transaction.category})`);
    });
  }
  
  console.log('\n✨ Transactions table analysis complete!');
  console.log('\n🔧 THE ISSUE: The memberDetails.ts service is looking for a "donations" table, but giving data is stored in the "transactions" table!');
}

checkTransactionsTable().catch(console.error); 