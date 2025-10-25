import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// Helper function to create transaction record for offline payments
async function createOfflineTransactionRecord({
  contactId,
  amount,
  currency,
  fundDesignation,
  paymentMethod,
  isAnonymous,
  notes,
  donorName,
  donorEmail
}: {
  contactId?: string
  amount: number
  currency: string
  fundDesignation: string
  paymentMethod: string
  isAnonymous: boolean
  notes?: string
  donorName?: string
  donorEmail?: string
}) {
  try {
    const supabase = createServerSupabaseClient()
    
    const transactionData = {
      contact_id: contactId || null,
      amount,
      currency: currency.toUpperCase(),
      category: fundDesignation,
      payment_method: paymentMethod,
      payment_status: 'pending', // Will be updated when payment is confirmed
      transacted_at: new Date().toISOString(),
      notes: notes || null,
      is_anonymous: isAnonymous,
      is_recurring: false,
      fund_designation: fundDesignation,
      metadata: {
        frequency: 'one-time',
        source: 'church_website',
        type: 'offline_donation',
        payment_method_type: paymentMethod.toLowerCase(),
        donor_name: isAnonymous ? null : donorName,
        donor_email: isAnonymous ? null : donorEmail
      }
    }

    console.log('💾 Creating offline transaction record:', transactionData)

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating offline transaction record:', error)
      throw new Error(`Failed to create transaction record: ${error.message}`)
    }

    console.log('✅ Offline transaction record created:', data.id)
    return data
  } catch (error) {
    console.error('❌ Offline transaction record creation failed:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💰 Offline donation recording started at:', new Date().toISOString())
    
    const body = await request.json()
    const {
      amount,
      currency = 'usd',
      fundDesignation = 'General',
      isAnonymous = false,
      notes,
      donorEmail,
      donorName,
      paymentMethod // 'venmo', 'cashapp', 'zelle'
    } = body

    console.log('💰 Processing offline donation request:', { 
      amount, 
      fundDesignation, 
      paymentMethod,
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

    if (!paymentMethod || !['venmo', 'cashapp', 'zelle'].includes(paymentMethod)) {
      console.error('❌ Invalid payment method:', paymentMethod)
      return NextResponse.json(
        { error: 'Valid payment method is required (venmo, cashapp, zelle)' },
        { status: 400 }
      )
    }

    // For offline payments (Venmo, Cash App, Zelle), we don't require donor information
    // as these are typically anonymous payments where donors include their info in the payment note
    if (!isAnonymous && (!donorEmail || !donorName)) {
      console.log('ℹ️ Offline payment without donor info - treating as anonymous')
      // Don't return error, just treat as anonymous
    }

    // Environment check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      nodeEnv: process.env.NODE_ENV
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase not configured:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseServiceKey: !!supabaseServiceKey
      })
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // For offline payments, we don't create contact records since these are anonymous
    // Donors can include their information in the payment note if they want to be recognized
    let contactId: string | undefined = undefined

    // Create transaction record for offline payment
    try {
      const paymentMethodMap: Record<string, string> = {
        venmo: 'Venmo',
        cashapp: 'Cash App',
        zelle: 'Zelle'
      }
      const paymentMethodDisplay = paymentMethodMap[paymentMethod] || paymentMethod

      await createOfflineTransactionRecord({
        contactId: undefined, // No contact for offline payments
        amount,
        currency,
        fundDesignation,
        paymentMethod: paymentMethodDisplay,
        isAnonymous: true, // Always anonymous for offline payments
        notes,
        donorName: undefined, // Not stored for offline payments
        donorEmail: undefined // Not stored for offline payments
      })

      console.log('✅ Offline donation recorded successfully')

      return NextResponse.json({
        success: true,
        message: `Your ${paymentMethodDisplay} donation has been recorded. Please complete the payment using the instructions provided.`,
        transactionId: contactId,
        paymentMethod: paymentMethodDisplay
      })

    } catch (error) {
      console.error('❌ Error recording offline donation:', error)
      console.error('❌ Offline donation error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        contactId,
        amount,
        paymentMethod
      })
      
      return NextResponse.json(
        { error: 'Failed to record donation. Please try again.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error processing offline donation:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : undefined)
    
    return NextResponse.json(
      { error: 'Donation recording failed. Please try again.' },
      { status: 500 }
    )
  }
} 