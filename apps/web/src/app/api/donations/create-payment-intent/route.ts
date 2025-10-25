import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getStripeInstance } from '@/lib/stripe-server'
import Stripe from 'stripe'

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
  frequency = 'one-time'
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
}) {
  try {
    const supabase = createServerSupabaseClient()
    
    const transactionData = {
      contact_id: contactId || null,
      amount,
      currency: currency.toUpperCase(),
      category: fundDesignation,
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
        source: 'church_website',
        type: isRecurring ? 'recurring_donation' : 'one_time_donation'
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

    console.log('✅ Transaction record created:', data.id)
    return data
  } catch (error) {
    console.error('❌ Transaction record creation failed:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💰 Donation payment request started at:', new Date().toISOString())
    
    const body = await request.json()
    const {
      amount,
      currency = 'usd',
      fundDesignation = 'General',
      isAnonymous = false,
      notes,
      donorEmail,
      donorName,
      frequency = 'one-time'
    } = body

    console.log('💰 Processing donation request:', { 
      amount, 
      frequency, 
      fundDesignation, 
      donorEmail: donorEmail ? `${donorEmail.substring(0, 3)}***` : 'anonymous',
      donorName: donorName ? `${donorName.substring(0, 3)}***` : 'anonymous',
      isAnonymous,
      hasNotes: !!notes
    })

    // Validate required fields
    if (!amount || amount <= 0) {
      console.error('❌ Invalid amount:', amount)
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!donorEmail && !isAnonymous) {
      console.error('❌ Email required for non-anonymous donation')
      return NextResponse.json(
        { error: 'Email is required for non-anonymous donations' },
        { status: 400 }
      )
    }

    // Environment check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      nodeEnv: process.env.NODE_ENV
    })

    // Get Stripe instance from admin integration settings
    let stripe: Stripe
    try {
      stripe = await getStripeInstance()
      console.log('✅ Stripe instance loaded from admin integration settings')
    } catch (error) {
      console.error('❌ Stripe configuration failed:', error)
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 500 }
      )
    }

    // Create or get contact record if not anonymous
    let contactId: string | undefined
    let customerId: string | undefined
    
    if (!isAnonymous && donorEmail) {
      try {
        const supabase = createServerSupabaseClient()
        
        // Try to find existing contact
        console.log('📧 Searching for existing contact...')
        const { data: existingContact, error: contactSearchError } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', donorEmail)
          .single()

        if (contactSearchError && contactSearchError.code !== 'PGRST116') {
          console.error('❌ Error searching for contact:', contactSearchError)
          // Continue without contact - this shouldn't block donation
        } else if (existingContact) {
          contactId = existingContact.id
          console.log('📧 Found existing contact:', contactId)
        } else if (donorName) {
          // Create new contact
          console.log('👤 Creating new contact...')
          const [firstName, ...lastNameParts] = donorName.split(' ')
          const lastName = lastNameParts.join(' ')
          
          const contactPayload = {
            first_name: firstName,
            last_name: lastName || '',
            email: donorEmail,
            phone: '',
            source: 'online_donation',
            tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Default tenant
          }

          console.log('👤 Contact payload:', contactPayload)

          const { data: newContact, error: contactCreateError } = await supabase
            .from('contacts')
            .insert([contactPayload])
            .select()
            .single()

          if (contactCreateError) {
            console.error('❌ Error creating contact:', contactCreateError)
            // Continue without contact - this shouldn't block donation
          } else {
            contactId = newContact.id
            console.log('👤 Created new contact:', contactId)
          }
        }

        // Create or retrieve Stripe customer
        console.log('💳 Setting up Stripe customer...')
        try {
          const existingCustomers = await stripe.customers.list({
            email: donorEmail,
            limit: 1,
          })

          if (existingCustomers.data.length > 0) {
            customerId = existingCustomers.data[0].id
            console.log('💳 Found existing Stripe customer:', customerId)
          } else {
            console.log('🆕 Creating new Stripe customer...')
            const customerPayload = {
              email: donorEmail,
              name: donorName,
              metadata: {
                contact_id: contactId || '',
                source: 'church_website',
              },
            }

            console.log('🆕 Customer payload:', customerPayload)

            const customer = await stripe.customers.create(customerPayload)
            customerId = customer.id
            console.log('🆕 Created new Stripe customer:', customerId)
          }
        } catch (stripeError) {
          console.error('❌ Stripe customer creation/retrieval failed:', stripeError)
          console.error('❌ Stripe error details:', {
            type: stripeError instanceof Error ? (stripeError as any).type : 'unknown',
            code: stripeError instanceof Error ? (stripeError as any).code : 'unknown',
            message: stripeError instanceof Error ? stripeError.message : 'Unknown error',
            statusCode: stripeError instanceof Error ? (stripeError as any).statusCode : 'unknown'
          })
          
          return NextResponse.json(
            { error: 'Failed to set up customer account. Please try again.' },
            { status: 500 }
          )
        }
      } catch (error) {
        console.error('❌ Contact/customer setup failed:', error)
        return NextResponse.json(
          { error: 'Failed to set up customer account' },
          { status: 500 }
        )
      }
    }

    // Handle recurring donations
    if (frequency !== 'one-time') {
      console.log('🔄 Processing recurring donation...')
      
      if (!customerId) {
        console.error('❌ Customer required for recurring donations')
        return NextResponse.json(
          { error: 'Customer account required for recurring donations' },
          { status: 400 }
        )
      }

      try {
        console.log('📝 Creating price for recurring donation...', {
          amount: Math.round(amount * 100),
          currency,
          interval: frequency === 'weekly' ? 'week' : 'month'
        })

        // Create a price for the recurring donation
        const pricePayload = {
          unit_amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          recurring: {
            interval: frequency === 'weekly' ? 'week' : 'month' as 'week' | 'month',
            interval_count: 1,
          },
          product_data: {
            name: `Recurring Donation - ${fundDesignation}`,
          },
          metadata: {
            fund_designation: fundDesignation,
            type: 'recurring_donation',
          },
        }

        console.log('📝 Price payload:', pricePayload)

        const price = await stripe.prices.create(pricePayload)
        console.log('✅ Created price:', price.id)

        console.log('🔔 Creating setup intent for recurring donation...')
        const setupIntentPayload = {
          customer: customerId,
          metadata: {
            contact_id: contactId || '',
            fund_designation: fundDesignation,
            type: 'recurring_donation_setup',
            frequency,
            amount: amount.toString(),
            price_id: price.id,
          },
          usage: 'off_session' as 'off_session',
        }

        console.log('🔔 Setup intent payload:', setupIntentPayload)

        const setupIntent = await stripe.setupIntents.create(setupIntentPayload)
        console.log('✅ Created setup intent for recurring donation:', setupIntent.id)

        // Create transaction record for recurring donation setup
        await createTransactionRecord({
          contactId,
          amount,
          currency,
          fundDesignation,
          paymentMethod: 'Stripe (Recurring)',
          isAnonymous,
          notes,
          stripeCustomerId: customerId,
          isRecurring: true,
          frequency
        })

        return NextResponse.json({
          setupIntentId: setupIntent.id,
          clientSecret: setupIntent.client_secret,
          priceId: price.id,
          type: 'recurring',
        })
      } catch (error) {
        console.error('❌ Error creating recurring donation:', error)
        console.error('❌ Recurring donation error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof Error ? (error as any).type : 'unknown',
          code: error instanceof Error ? (error as any).code : 'unknown',
          statusCode: error instanceof Error ? (error as any).statusCode : 'unknown',
          customerId,
          amount,
          frequency
        })
        
        return NextResponse.json(
          { error: 'Failed to create recurring donation. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Handle one-time donations
    console.log('💳 Processing one-time donation...')
    try {
      const paymentIntentPayload = {
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
          frequency: 'one-time',
        },
        description: `Donation to ${fundDesignation}`,
        statement_descriptor: 'CHURCH DONATION',
        receipt_email: isAnonymous ? undefined : donorEmail,
      }

      console.log('💳 Payment intent payload:', paymentIntentPayload)

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload)
      console.log('✅ Created one-time payment intent:', paymentIntent.id)

      // Create transaction record for one-time donation
      await createTransactionRecord({
        contactId,
        amount,
        currency,
        fundDesignation,
        paymentMethod: 'Stripe',
        isAnonymous,
        notes,
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customerId,
        isRecurring: false,
        frequency
      })

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        type: 'one-time',
      })
    } catch (error) {
      console.error('❌ Error creating payment intent:', error)
      console.error('❌ Payment intent error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? (error as any).type : 'unknown',
        code: error instanceof Error ? (error as any).code : 'unknown',
        statusCode: error instanceof Error ? (error as any).statusCode : 'unknown'
      })
      
      return NextResponse.json(
        { error: 'Failed to create payment intent. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error processing donation:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : undefined)
    
    return NextResponse.json(
      { error: 'Payment processing failed. Please try again.' },
      { status: 500 }
    )
  }
} 