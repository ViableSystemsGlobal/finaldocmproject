# Stripe Integration Setup Guide

## Phase 1: Stripe Foundation - COMPLETED ✅

This document outlines the setup and configuration for the Stripe integration in the giving/donations system.

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Organization Details (Optional)
NEXT_PUBLIC_ORGANIZATION_NAME=Your Church Name
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourchurch.org
```

## Database Migration

Run the following migration to enhance your database schema:

```bash
# Apply the Stripe enhancement migration
supabase migration up
```

The migration file is located at: `supabase/migrations/20241206000001_enhance_transactions_for_stripe.sql`

## Stripe Dashboard Setup

### 1. Create Stripe Account
- Sign up at https://stripe.com
- Complete account verification
- Get your API keys from the Dashboard

### 2. Configure Webhooks
- Go to Stripe Dashboard > Developers > Webhooks
- Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Select these events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.succeeded`
  - `charge.failed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `charge.dispute.created`

### 3. Test the Integration
- Use Stripe test cards: https://stripe.com/docs/testing
- Test card: `4242 4242 4242 4242`
- Any future expiry date and CVC

## API Endpoints Created

### One-time Donations
- **POST** `/api/donations/create-payment-intent`
- Creates a payment intent for one-time donations

### Recurring Donations
- **POST** `/api/donations/recurring/create`
- Creates a subscription for recurring donations

### Webhook Handler
- **POST** `/api/webhooks/stripe`
- Handles Stripe webhook events

## Database Schema Enhancements

### New Tables Created:
1. **stripe_webhooks** - Tracks webhook events
2. **donation_campaigns** - Campaign management
3. **recurring_donations** - Subscription tracking
4. **donation_receipts** - Tax receipt management
5. **giving_statements** - Annual statements

### Enhanced transactions table with:
- Stripe-specific fields (payment_intent_id, customer_id, etc.)
- Payment status tracking
- Fee and refund tracking
- Recurring donation flags
- Tax deductible status
- Acknowledgment tracking

## Features Implemented

### ✅ Completed in Phase 1:
- Stripe webhook integration
- Enhanced database schema
- Payment intent creation
- Recurring donation setup
- Customer management
- Transaction tracking
- Error handling and retry logic
- Webhook event deduplication

### 🔄 Next Steps (Phase 2 & 3):
- Admin dashboard UI for giving management
- Donation reports and analytics
- Tax receipt generation
- Annual giving statements
- Frontend donation forms
- Donor portal

## Testing

### Test One-time Donation:
```bash
curl -X POST http://localhost:3001/api/donations/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "contactId": "contact-uuid",
    "fundDesignation": "General",
    "donorEmail": "test@example.com",
    "donorName": "Test Donor"
  }'
```

### Test Recurring Donation:
```bash
curl -X POST http://localhost:3001/api/donations/recurring/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "interval": "month",
    "contactId": "contact-uuid",
    "fundDesignation": "General",
    "donorEmail": "test@example.com",
    "donorName": "Test Donor"
  }'
```

## Security Considerations

1. **Webhook Security**: All webhooks are verified using Stripe signatures
2. **Environment Variables**: Keep all secrets in environment variables
3. **Database Access**: Use service role key only for webhook operations
4. **Error Handling**: Comprehensive error logging without exposing sensitive data

## Monitoring

- Monitor webhook delivery in Stripe Dashboard
- Check `stripe_webhooks` table for processing status
- Review transaction records for payment status
- Monitor failed payments and disputes

## Support

For issues with the Stripe integration:
1. Check Stripe Dashboard logs
2. Review webhook processing in database
3. Check application logs for errors
4. Verify environment variables are set correctly 