import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Initialize Supabase client with service role key for webhook operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔔 Received Stripe webhook: ${event.type}`);

    // Check if we've already processed this event
    const { data: existingWebhook } = await supabase
      .from('stripe_webhooks')
      .select('id, processed')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingWebhook?.processed) {
      console.log(`✅ Event ${event.id} already processed`);
      return NextResponse.json({ received: true });
    }

    // Store webhook event
    const { error: webhookError } = await supabase
      .from('stripe_webhooks')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data,
        processed: false,
        created_at: new Date().toISOString()
      });

    if (webhookError) {
      console.error('Error storing webhook:', webhookError);
    }

    // Process the event
    try {
      await processStripeEvent(event);
      
      // Mark as processed
      await supabase
        .from('stripe_webhooks')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('stripe_event_id', event.id);

      console.log(`✅ Successfully processed event: ${event.type}`);
      
    } catch (error) {
      console.error(`❌ Error processing event ${event.type}:`, error);
      
      // Update webhook with error
      await supabase
        .from('stripe_webhooks')
        .update({ 
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: (existingWebhook?.retry_count || 0) + 1
        })
        .eq('stripe_event_id', event.id);

      // Don't return error to Stripe to avoid retries for unrecoverable errors
      // Stripe will retry automatically for 500 errors
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
      
    case 'charge.succeeded':
      await handleChargeSucceeded(event.data.object as Stripe.Charge);
      break;
      
    case 'charge.failed':
      await handleChargeFailed(event.data.object as Stripe.Charge);
      break;
      
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
      
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
      
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
      
    case 'charge.dispute.created':
      await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
      break;
      
    default:
      console.log(`🔄 Unhandled event type: ${event.type}`);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
  
  const metadata = paymentIntent.metadata;
  const contactId = metadata.contact_id;
  const fundDesignation = metadata.fund_designation || 'General';
  const isAnonymous = metadata.is_anonymous === 'true';
  
  // Create or update transaction record
  const transactionData = {
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: paymentIntent.customer as string,
    contact_id: contactId,
    amount: paymentIntent.amount / 100, // Convert from cents
    currency: paymentIntent.currency.toUpperCase(),
    payment_method: 'Stripe',
    payment_status: 'succeeded',
    fund_designation: fundDesignation,
    is_anonymous: isAnonymous,
    category: metadata.category || fundDesignation,
    notes: metadata.notes || null,
    transacted_at: new Date().toISOString(),
    metadata: metadata
  };

  const { error } = await supabase
    .from('transactions')
    .upsert(transactionData, { 
      onConflict: 'stripe_payment_intent_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }

  // Send acknowledgment email if not anonymous
  if (!isAnonymous && contactId) {
    await sendDonationAcknowledgment(contactId, transactionData);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  
  const { error } = await supabase
    .from('transactions')
    .upsert({
      stripe_payment_intent_id: paymentIntent.id,
      payment_status: 'failed',
      failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
      transacted_at: new Date().toISOString()
    }, { 
      onConflict: 'stripe_payment_intent_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error updating failed transaction:', error);
    throw error;
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log(`💳 Charge succeeded: ${charge.id}`);
  
  // Update transaction with charge details
  const { error } = await supabase
    .from('transactions')
    .update({
      stripe_charge_id: charge.id,
      receipt_url: charge.receipt_url,
      fee_amount: charge.application_fee_amount ? charge.application_fee_amount / 100 : 0,
      payment_status: 'succeeded'
    })
    .eq('stripe_payment_intent_id', charge.payment_intent);

  if (error) {
    console.error('Error updating transaction with charge details:', error);
    throw error;
  }
}

async function handleChargeFailed(charge: Stripe.Charge) {
  console.log(`❌ Charge failed: ${charge.id}`);
  
  const { error } = await supabase
    .from('transactions')
    .update({
      stripe_charge_id: charge.id,
      payment_status: 'failed',
      failure_reason: charge.failure_message || 'Charge failed'
    })
    .eq('stripe_payment_intent_id', charge.payment_intent);

  if (error) {
    console.error('Error updating failed charge:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`📄 Invoice payment succeeded: ${invoice.id}`);
  
  if (invoice.subscription) {
    // This is a recurring donation
    const { error } = await supabase
      .from('transactions')
      .insert({
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: invoice.subscription as string,
        stripe_customer_id: invoice.customer as string,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency.toUpperCase(),
        payment_method: 'Stripe',
        payment_status: 'succeeded',
        is_recurring: true,
        category: 'Recurring Donation',
        transacted_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString()
      });

    if (error) {
      console.error('Error creating recurring transaction:', error);
      throw error;
    }

    // Update recurring donation next payment date
    await updateRecurringDonationNextPayment(invoice.subscription as string);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Invoice payment failed: ${invoice.id}`);
  
  if (invoice.subscription) {
    // Update recurring donation status
    const { error } = await supabase
      .from('recurring_donations')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Error updating recurring donation status:', error);
      throw error;
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription created: ${subscription.id}`);
  
  const metadata = subscription.metadata;
  const contactId = metadata.contact_id;
  
  if (!contactId) {
    console.error('No contact_id in subscription metadata');
    return;
  }

  const priceData = subscription.items.data[0]?.price;
  if (!priceData) {
    console.error('No price data in subscription');
    return;
  }

  const { error } = await supabase
    .from('recurring_donations')
    .insert({
      contact_id: contactId,
      stripe_subscription_id: subscription.id,
      amount: priceData.unit_amount! / 100,
      currency: priceData.currency.toUpperCase(),
      interval_type: priceData.recurring!.interval,
      interval_count: priceData.recurring!.interval_count,
      fund_designation: metadata.fund_designation || 'General',
      status: subscription.status,
      started_at: new Date(subscription.created * 1000).toISOString()
    });

  if (error) {
    console.error('Error creating recurring donation:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  
  const { error } = await supabase
    .from('recurring_donations')
    .update({
      status: subscription.status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating recurring donation:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);
  
  const { error } = await supabase
    .from('recurring_donations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error cancelling recurring donation:', error);
    throw error;
  }
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  console.log(`⚠️ Dispute created: ${dispute.id}`);
  
  // Update transaction to reflect dispute
  const { error } = await supabase
    .from('transactions')
    .update({
      payment_status: 'disputed',
      notes: `Dispute created: ${dispute.reason}. Amount: $${dispute.amount / 100}`
    })
    .eq('stripe_charge_id', dispute.charge);

  if (error) {
    console.error('Error updating transaction for dispute:', error);
    throw error;
  }
}

async function updateRecurringDonationNextPayment(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const nextPaymentDate = new Date(subscription.current_period_end * 1000);
    
    const { error } = await supabase
      .from('recurring_donations')
      .update({
        next_payment_date: nextPaymentDate.toISOString().split('T')[0], // Date only
        status: subscription.status
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating next payment date:', error);
    }
  } catch (error) {
    console.error('Error fetching subscription for next payment update:', error);
  }
}

async function sendDonationAcknowledgment(contactId: string, transactionData: any) {
  try {
    // Get contact information
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email')
      .eq('id', contactId)
      .single();

    if (!contact?.email) {
      console.log('No email found for contact, skipping acknowledgment');
      return;
    }

    // TODO: Implement email sending logic
    // This could integrate with your existing email system
    console.log(`📧 Would send acknowledgment to ${contact.email} for $${transactionData.amount} donation`);
    
    // Update transaction to mark acknowledgment as sent
    await supabase
      .from('transactions')
      .update({
        acknowledgment_sent: true,
        acknowledgment_sent_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', transactionData.stripe_payment_intent_id);
      
  } catch (error) {
    console.error('Error sending donation acknowledgment:', error);
  }
} 