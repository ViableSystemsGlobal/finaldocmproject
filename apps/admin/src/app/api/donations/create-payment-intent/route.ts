import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, createOrRetrieveCustomer } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to create transaction record
async function createTransactionRecord({
  contactId,
  amount,
  currency,
  fundDesignation,
  paymentMethod,
  isAnonymous,
  notes,
  stripePaymentIntentId,
  stripeCustomerId,
  isRecurring = false,
  frequency = 'one-time',
  category
}: {
  contactId?: string
  amount: number
  currency: string
  fundDesignation: string
  paymentMethod: string
  isAnonymous: boolean
  notes?: string
  stripePaymentIntentId?: string
  stripeCustomerId?: string
  isRecurring?: boolean
  frequency?: string
  category?: string
}) {
  let finalContactId = null
  
  // If not anonymous and we have a contactId, try to find the corresponding contact
  if (!isAnonymous && contactId) {
    console.log('🔍 Looking up contact for user ID:', contactId)
    
    // First try to find a contact with matching user_id in auth.users table
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .single()
    
    if (contactData && !contactError) {
      finalContactId = contactData.id
      console.log('✅ Found contact ID:', finalContactId)
    } else {
      console.log('⚠️ Could not find contact for user ID, donation will be recorded without contact link')
    }
  }

  const transactionData = {
    contact_id: finalContactId,
    amount,
    currency: currency.toUpperCase(),
    category: category || fundDesignation,
    payment_method: paymentMethod,
    payment_status: 'pending',
    transacted_at: new Date().toISOString(),
    notes: notes || null,
    stripe_payment_intent_id: stripePaymentIntentId || null,
    stripe_customer_id: stripeCustomerId || null,
    is_anonymous: isAnonymous,
    is_recurring: isRecurring,
    fund_designation: fundDesignation,
    metadata: {
      frequency,
      source: 'mobile_app',
      type: isRecurring ? 'recurring_donation' : 'one_time_donation',
      original_user_id: contactId // Keep track of the original user ID for debugging
    }
  }

  console.log('💾 Creating transaction record:', transactionData)

  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating transaction record:', error)
    throw new Error(`Failed to create transaction record: ${error.message}`)
  }

  console.log('✅ Created transaction record:', data.id)
  return data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = 'usd',
      contactId,
      fundDesignation = 'General',
      isAnonymous = false,
      notes,
      donorEmail,
      donorName,
      frequency = 'one-time',
      category
    } = body;

    console.log('💰 Processing mobile app donation request:', { 
      amount, 
      frequency, 
      fundDesignation, 
      category,
      donorEmail, 
      isAnonymous 
    })

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    let customerId: string | undefined;

    // Create or retrieve Stripe customer if not anonymous and email provided
    if (!isAnonymous && donorEmail) {
      const customerResult = await createOrRetrieveCustomer({
        email: donorEmail,
        name: donorName,
        contactId,
      });

      if (customerResult.success && customerResult.customer) {
        customerId = customerResult.customer.id;
      } else {
        console.warn('Failed to create/retrieve customer:', customerResult.error);
      }
    }

    // Create payment intent
    const result = await createPaymentIntent({
      amount,
      currency,
      contactId,
      fundDesignation,
      isAnonymous,
      notes,
      customerId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Created payment intent:', result.paymentIntentId)

    // Create transaction record
    await createTransactionRecord({
      contactId,
      amount,
      currency,
      fundDesignation,
      paymentMethod: 'Stripe',
      isAnonymous,
      notes,
      stripePaymentIntentId: result.paymentIntentId,
      stripeCustomerId: customerId,
      isRecurring: frequency !== 'one-time',
      frequency,
      category
    })

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 