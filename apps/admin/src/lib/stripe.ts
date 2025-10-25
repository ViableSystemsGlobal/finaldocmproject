import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  currency: 'usd',
  country: 'US',
  // Add your organization's details
  organizationName: process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Church Organization',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@church.org',
};

// Payment Intent creation for one-time donations
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  contactId,
  fundDesignation = 'General',
  isAnonymous = false,
  notes,
  customerId,
}: {
  amount: number; // in dollars
  currency?: string;
  contactId?: string;
  fundDesignation?: string;
  isAnonymous?: boolean;
  notes?: string;
  customerId?: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      metadata: {
        contact_id: contactId || '',
        fund_designation: fundDesignation,
        is_anonymous: isAnonymous.toString(),
        notes: notes || '',
        category: fundDesignation,
        type: 'donation',
      },
      description: `Donation to ${fundDesignation}`,
      statement_descriptor: 'CHURCH DONATION',
      receipt_email: undefined, // We'll handle receipts via webhook
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    };
  }
}

// Create or retrieve Stripe customer
export async function createOrRetrieveCustomer({
  email,
  name,
  contactId,
}: {
  email: string;
  name?: string;
  contactId?: string;
}) {
  try {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return {
        success: true,
        customer: existingCustomers.data[0],
      };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        contact_id: contactId || '',
        source: 'church_admin',
      },
    });

    return {
      success: true,
      customer,
    };
  } catch (error) {
    console.error('Error creating/retrieving customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    };
  }
}

// Create recurring donation subscription
export async function createRecurringDonation({
  customerId,
  amount,
  interval = 'month',
  intervalCount = 1,
  contactId,
  fundDesignation = 'General',
}: {
  customerId: string;
  amount: number; // in dollars
  interval?: 'month' | 'year';
  intervalCount?: number;
  contactId?: string;
  fundDesignation?: string;
}) {
  try {
    // Create a price for the recurring donation
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval,
        interval_count: intervalCount,
      },
      product_data: {
        name: `Recurring Donation - ${fundDesignation}`,
        description: `Monthly donation to ${fundDesignation}`,
      },
      metadata: {
        fund_designation: fundDesignation,
        type: 'recurring_donation',
      },
    });

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        contact_id: contactId || '',
        fund_designation: fundDesignation,
        type: 'recurring_donation',
      },
      description: `Recurring donation to ${fundDesignation}`,
    });

    return {
      success: true,
      subscription,
      priceId: price.id,
    };
  } catch (error) {
    console.error('Error creating recurring donation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create recurring donation',
    };
  }
}

// Cancel recurring donation
export async function cancelRecurringDonation(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return {
      success: true,
      subscription,
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}

// Update recurring donation amount
export async function updateRecurringDonation({
  subscriptionId,
  newAmount,
  fundDesignation = 'General',
}: {
  subscriptionId: string;
  newAmount: number; // in dollars
  fundDesignation?: string;
}) {
  try {
    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentItem = subscription.items.data[0];

    // Create new price
    const newPrice = await stripe.prices.create({
      unit_amount: Math.round(newAmount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval: currentItem.price.recurring!.interval,
        interval_count: currentItem.price.recurring!.interval_count,
      },
      product_data: {
        name: `Recurring Donation - ${fundDesignation}`,
        description: `Recurring donation to ${fundDesignation}`,
      },
      metadata: {
        fund_designation: fundDesignation,
        type: 'recurring_donation',
      },
    });

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPrice.id,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    return {
      success: true,
      subscription: updatedSubscription,
      newPriceId: newPrice.id,
    };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    };
  }
}

// Get payment methods for a customer
export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data,
    };
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment methods',
    };
  }
}

// Create setup intent for saving payment method
export async function createSetupIntent(customerId: string) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create setup intent',
    };
  }
}

// Refund a payment
export async function refundPayment({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer',
}: {
  paymentIntentId: string;
  amount?: number; // in dollars, if partial refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}) {
  try {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundData);

    return {
      success: true,
      refund,
    };
  } catch (error) {
    console.error('Error creating refund:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create refund',
    };
  }
}

// Get donation analytics from Stripe
export async function getDonationAnalytics({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  try {
    // Get successful charges in date range
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000),
      },
      limit: 100,
    });

    const successfulCharges = charges.data.filter(charge => charge.status === 'succeeded');
    
    const analytics = {
      totalAmount: successfulCharges.reduce((sum, charge) => sum + charge.amount, 0) / 100,
      totalCount: successfulCharges.length,
      averageAmount: successfulCharges.length > 0 
        ? (successfulCharges.reduce((sum, charge) => sum + charge.amount, 0) / 100) / successfulCharges.length 
        : 0,
      totalFees: successfulCharges.reduce((sum, charge) => sum + (charge.application_fee_amount || 0), 0) / 100,
    };

    return {
      success: true,
      analytics,
      charges: successfulCharges,
    };
  } catch (error) {
    console.error('Error fetching donation analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    };
  }
}

// Utility function to format currency
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// Utility function to validate webhook signature (for testing)
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    stripe.webhooks.constructEvent(payload, signature, secret);
    return true;
  } catch (error) {
    return false;
  }
} 