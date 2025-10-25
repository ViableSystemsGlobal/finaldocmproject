# 🎯 **How to Link Transactions to Campaigns**

## **✅ The System is Already Set Up!**

From **Phase 1**, we built an automatic system to link transactions to campaigns. Here's how it works:

## **🔗 How Campaign Linking Works**

### **1. Database Trigger System**
- When a transaction is created with `category = 'campaign_[CAMPAIGN_ID]'`
- The database automatically updates the campaign's `current_amount`
- Real-time progress tracking happens automatically

### **2. Current Implementation**

In the **transactions** table, the `category` field links to campaigns:
```sql
-- Transaction linking to General Fund campaign
INSERT INTO transactions (
  contact_id, 
  amount, 
  category,           -- 🎯 This is the key field!
  payment_method,
  fund_designation
) VALUES (
  'contact_uuid',
  100.00,
  'campaign_12345',   -- Links to campaign with ID 12345
  'Stripe',
  'General Fund'
);
```

### **3. To Make Transactions Link to Campaigns:**

**Option A: Update Transaction Creation Form**
Add a campaign selector to `/finance/giving/new`:

```tsx
// In the new transaction form
const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
const [selectedCampaign, setSelectedCampaign] = useState('')

// Load campaigns in useEffect
useEffect(() => {
  fetchActiveCampaigns().then(({ data }) => {
    setCampaigns(data || [])
  })
}, [])

// In the form
<Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
  <SelectTrigger>
    <SelectValue placeholder="Select a campaign (optional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">No specific campaign</SelectItem>
    {campaigns.map(campaign => (
      <SelectItem key={campaign.id} value={`campaign_${campaign.id}`}>
        {campaign.name} - {formatCurrency(campaign.current_amount)}/{formatCurrency(campaign.goal_amount)}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// When submitting, use selectedCampaign as the category
const transactionData = {
  ...formState,
  category: selectedCampaign || formState.category,
  fund_designation: campaigns.find(c => `campaign_${c.id}` === selectedCampaign)?.name || 'General'
}
```

**Option B: Use Stripe Metadata**
When creating Stripe payment intents, include campaign info:

```tsx
// In stripe.ts createPaymentIntent function
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: 'usd',
  metadata: {
    contact_id: contactId || 'anonymous',
    campaign_id: campaignId,           // 🎯 Campaign linking
    fund_designation: fundDesignation,
    is_recurring: isRecurring.toString()
  }
})
```

## **🚀 Quick Test - Manual Campaign Link**

To test the system right now:

1. **Get a Campaign ID** from the campaigns page
2. **Create a transaction** with category = `campaign_[ID]`
3. **Watch the campaign total update automatically**

### **Example SQL Test:**
```sql
-- Find a campaign ID
SELECT id, name, current_amount, goal_amount FROM donation_campaigns LIMIT 1;

-- Add a test donation (replace CAMPAIGN_ID with actual ID)
INSERT INTO transactions (
  amount, 
  currency, 
  category, 
  payment_method, 
  payment_status,
  fund_designation,
  transacted_at
) VALUES (
  250.00,
  'USD',
  'campaign_CAMPAIGN_ID',  -- 🎯 Replace with real ID
  'Test',
  'succeeded',
  'Test Donation',
  NOW()
);

-- Check that campaign total updated
SELECT name, current_amount, goal_amount FROM donation_campaigns WHERE id = 'CAMPAIGN_ID';
```

## **📊 What Happens Next**

1. **Transaction created** → Campaign total updates automatically
2. **Progress bars update** in real-time  
3. **Campaign status changes** when goal is reached
4. **Reports show** campaign-specific analytics

## **🎉 The Result**

- **Automatic tracking**: No manual work needed
- **Real-time updates**: Campaign totals update instantly  
- **Beautiful UI**: Progress bars and status badges
- **Full audit trail**: Every transaction linked to its campaign

**The system is already built and working!** Just need to add the campaign selector to the transaction form to make it user-friendly. 