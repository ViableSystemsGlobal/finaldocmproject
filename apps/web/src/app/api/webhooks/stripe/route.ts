import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getStripeInstance } from '@/lib/stripe-server'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    // Get Stripe instance from admin integration settings
    const stripe = await getStripeInstance()

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    console.log('🔔 Received Stripe webhook:', event.type)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, stripe)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💰 Payment succeeded:', paymentIntent.id)
  
  const supabase = createServerSupabaseClient()
  
  // Update the transaction record to mark it as succeeded
  const { error } = await supabase
    .from('transactions')
    .update({
      payment_status: 'succeeded',
      stripe_charge_id: paymentIntent.latest_charge as string,
      transacted_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('❌ Error updating transaction:', error)
  } else {
    console.log('✅ Updated transaction status to succeeded')
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id)
  
  const supabase = createServerSupabaseClient()
  
  // Update the transaction record to mark it as failed
  const { error } = await supabase
    .from('transactions')
    .update({
      payment_status: 'failed',
      notes: paymentIntent.last_payment_error?.message || 'Payment failed'
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('❌ Error updating failed transaction:', error)
  } else {
    console.log('✅ Updated transaction status to failed')
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, stripe: Stripe) {
  console.log('📄 Invoice payment succeeded:', invoice.id)
  
  const subscriptionId = (invoice as any).subscription as string | null
  if (!subscriptionId) return
  
  const supabase = createServerSupabaseClient()
  
  // Create a new transaction record for the recurring payment
  
  // Get the subscription details to extract metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const metadata = subscription.metadata || {}
  
  const transactionData = {
    contact_id: metadata.contact_id || null,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    category: metadata.fund_designation || 'General Fund',
    payment_method: 'Stripe (Recurring)',
    payment_status: 'succeeded',
    transacted_at: new Date().toISOString(),
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: invoice.customer as string,
    is_recurring: true,
    is_anonymous: false,
    fund_designation: metadata.fund_designation || 'General Fund',
    metadata: {
      frequency: metadata.frequency || 'monthly',
      source: 'church_website',
      type: 'recurring_donation_payment',
      invoice_id: invoice.id
    }
  }

  const { error } = await supabase
    .from('transactions')
    .insert([transactionData])

  if (error) {
    console.error('❌ Error creating recurring transaction:', error)
  } else {
    console.log('✅ Created recurring transaction record')
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Invoice payment failed:', invoice.id)
  // You might want to handle failed recurring payments here
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription created:', subscription.id)
  
  const supabase = createServerSupabaseClient()
  
  // Create or update recurring donation record
  const metadata = subscription.metadata || {}
  const recurringDonationData = {
    contact_id: metadata.contact_id || null,
    stripe_subscription_id: subscription.id,
    amount: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
    currency: subscription.currency.toUpperCase(),
    interval_type: subscription.items.data[0]?.price?.recurring?.interval === 'week' ? 'week' : 'month',
    interval_count: subscription.items.data[0]?.price?.recurring?.interval_count || 1,
    fund_designation: metadata.fund_designation || 'General Fund',
    status: subscription.status,
    started_at: new Date(subscription.created * 1000).toISOString(),
    next_payment_date: (subscription as any).current_period_end 
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : null
  }

  const { error } = await supabase
    .from('recurring_donations')
    .upsert(recurringDonationData, {
      onConflict: 'stripe_subscription_id',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('❌ Error creating recurring donation:', error)
  } else {
    console.log('✅ Created recurring donation record')
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)
  
  const supabase = createServerSupabaseClient()
  
  // Update recurring donation record
  const { error } = await supabase
    .from('recurring_donations')
    .update({
      status: subscription.status,
      next_payment_date: subscription.status === 'active' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error updating recurring donation:', error)
  } else {
    console.log('✅ Updated recurring donation status')
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription deleted:', subscription.id)
  
  const supabase = createServerSupabaseClient()
  
  // Update recurring donation record to cancelled
  const { error } = await supabase
    .from('recurring_donations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error updating cancelled recurring donation:', error)
  } else {
    console.log('✅ Updated recurring donation to cancelled')
  }
} 