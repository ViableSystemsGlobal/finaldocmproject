# 🎯 **How to Add Transactions to Campaigns**

## **✅ System Overview**

Your donation system is **fully functional** with automatic campaign tracking! Here's how transactions link to campaigns:

---

## **🚀 Method 1: Through the New Transaction Form**

### **Step 1: Enhance the Transaction Form**
Update `/finance/giving/new` to include a campaign selector:

```tsx
// Add to the new transaction form component
import { fetchActiveCampaigns, DonationCampaign } from '@/services/giving'

const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
const [selectedCampaign, setSelectedCampaign] = useState('')

// Load active campaigns
useEffect(() => {
  fetchActiveCampaigns().then(({ data }) => {
    setCampaigns(data || [])
  })
}, [])

// Add this to your form
<div className="space-y-2">
  <Label htmlFor="campaign">Campaign (Optional)</Label>
  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
    <SelectTrigger>
      <SelectValue placeholder="Select a campaign or leave blank for general fund" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">General Fund (No specific campaign)</SelectItem>
      {campaigns.map(campaign => (
        <SelectItem key={campaign.id} value={`campaign_${campaign.id}`}>
          {campaign.name} - {formatCurrency(campaign.current_amount)} / {formatCurrency(campaign.goal_amount || 0)}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

// When submitting the form
const transactionData = {
  ...formData,
  category: selectedCampaign || 'general',
  fund_designation: campaigns.find(c => `campaign_${c.id}` === selectedCampaign)?.name || 'General Fund'
}
```

---

## **🎯 Method 2: Direct Database Insert**

### **The Category Field is Key**
Transactions link to campaigns through the `category` field:

```sql
-- Add a donation to a specific campaign
INSERT INTO transactions (
  contact_id, 
  amount, 
  currency,
  category,                    -- 🎯 THIS IS THE KEY!
  payment_method,
  payment_status,
  fund_designation,
  transacted_at,
  is_recurring,
  tax_deductible
) VALUES (
  'contact-uuid-here',
  250.00,
  'USD',
  'campaign_[CAMPAIGN_ID]',    -- Format: 'campaign_' + actual campaign ID
  'Credit Card',
  'succeeded',
  'Building Fund',
  NOW(),
  false,
  true
);
```

### **What Happens Automatically:**
1. **Database trigger** detects the `campaign_` prefix
2. **Extracts the campaign ID** from the category
3. **Updates the campaign's `current_amount`** automatically
4. **Progress bars update** in real-time
5. **Campaign status changes** when goal is reached

---

## **💳 Method 3: Through Stripe Integration**

### **When Creating Payment Intents:**

```tsx
// In your Stripe payment intent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: 'usd',
  metadata: {
    contact_id: contactId || 'anonymous',
    campaign_id: campaignId,           // 🎯 Include campaign ID
    fund_designation: fundDesignation,
    category: `campaign_${campaignId}` // 🎯 This gets saved to transactions
  }
});
```

### **Webhook Processing:**
The webhook at `/api/webhooks/stripe/route.ts` already handles this:

```tsx
// The webhook automatically processes the metadata
const transactionData = {
  amount: chargeAmount,
  currency: charge.currency.toUpperCase(),
  category: metadata.category || 'general',  // 🎯 Campaign link preserved
  payment_method: 'Stripe',
  stripe_payment_intent_id: paymentIntent.id,
  // ... other fields
}
```

---

## **🧪 Method 4: Test it Right Now**

### **Quick Test via Database:**

1. **Get a Campaign ID:**
   ```sql
   SELECT id, name, current_amount FROM donation_campaigns LIMIT 1;
   ```

2. **Add a Test Donation:**
   ```sql
   INSERT INTO transactions (
     amount, 
     currency, 
     category, 
     payment_method, 
     payment_status,
     fund_designation,
     transacted_at
   ) VALUES (
     100.00,
     'USD',
     'campaign_[REPLACE_WITH_ACTUAL_ID]',  -- 🎯 Use real campaign ID
     'Test Donation',
     'succeeded',
     'Test Campaign Donation',
     NOW()
   );
   ```

3. **Check Campaign Updated:**
   ```sql
   SELECT name, current_amount, goal_amount FROM donation_campaigns 
   WHERE id = '[CAMPAIGN_ID]';
   ```

---

## **📊 What You'll See**

### **In the Campaign Dashboard:**
- ✅ **Progress bars** update automatically
- ✅ **Current amounts** reflect new donations
- ✅ **Status badges** change (Active → Completed when goal reached)
- ✅ **Total raised** increases in stats

### **In Transaction Lists:**
- ✅ **Fund designation** shows campaign name
- ✅ **Category** shows campaign link
- ✅ **Full audit trail** of all campaign donations

---

## **🎉 It's Already Working!**

Your campaigns page at `/finance/giving/campaigns` is **fully functional**:

1. ✅ **Create new campaigns** (click "New Campaign" button)
2. ✅ **Edit existing campaigns** (click "Edit" on any campaign)
3. ✅ **View progress tracking** (automatic updates)
4. ✅ **Real-time metrics** (totals, counts, status)

### **To Link Transactions to Campaigns:**
- **Option A:** Add campaign selector to transaction form
- **Option B:** Use the category field directly (`campaign_[ID]`)
- **Option C:** Include campaign metadata in Stripe payments

**The database triggers handle everything else automatically!** 🚀

---

## **🔥 Pro Tips**

1. **Campaign Categories:** Use format `campaign_[UUID]` exactly
2. **Automatic Updates:** No manual work needed - triggers handle it
3. **Real-time UI:** Campaign progress updates instantly
4. **Audit Trail:** Every donation is tracked and linked
5. **Goal Tracking:** Status changes automatically when goals are met

**Your system is production-ready and fully functional!** 🎯 