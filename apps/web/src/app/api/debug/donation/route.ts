import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getStripeInstance } from '@/lib/stripe-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug donation endpoint called')
    
    // Check environment variables
    const debug: any = {
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      stripe: {
        configured: false,
        testCustomerCreation: null,
        error: null
      }
    }

    // Test Stripe configuration
    try {
      const stripe = await getStripeInstance()
      debug.stripe.configured = true
      
      // Test customer creation
      console.log('🧪 Testing Stripe customer creation...')
      const testCustomer = await stripe.customers.create({
        email: 'test@example.com',
        name: 'Test User',
        metadata: {
          source: 'debug_test',
          contact_id: 'test'
        }
      })
      
      debug.stripe.testCustomerCreation = {
        success: true,
        customerId: testCustomer.id,
        email: testCustomer.email
      }
      
      // Clean up test customer
      await stripe.customers.del(testCustomer.id)
      
      console.log('✅ Stripe customer test successful')
      
    } catch (stripeError) {
      console.error('❌ Stripe test failed:', stripeError)
      debug.stripe.testCustomerCreation = {
        success: false,
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        type: stripeError instanceof Error ? (stripeError as any).type : 'unknown',
        code: stripeError instanceof Error ? (stripeError as any).code : 'unknown'
      }
    }

    // Test database connection
    try {
      const supabase = createServerSupabaseClient()
      
      // Test transaction insert
      const testTransaction = {
        contact_id: null,
        amount: 10.00,
        currency: 'USD',
        category: 'Test',
        payment_method: 'Stripe',
        payment_status: 'test',
        transacted_at: new Date().toISOString(),
        is_anonymous: true,
        fund_designation: 'General',
        metadata: {
          source: 'debug_test',
          type: 'test_transaction'
        }
      }
      
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert([testTransaction])
        .select()
        .single()
        
      if (transactionError) {
        console.error('❌ Database transaction test failed:', transactionError)
        debug.database = {
          success: false,
          error: transactionError.message,
          code: transactionError.code
        }
      } else {
        console.log('✅ Database transaction test successful')
        debug.database = {
          success: true,
          transactionId: transactionData.id
        }
        
        // Clean up test transaction
        await supabase
          .from('transactions')
          .delete()
          .eq('id', transactionData.id)
      }
      
    } catch (dbError) {
      console.error('❌ Database connection test failed:', dbError)
      debug.database = {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Debug completed',
      debug
    })

  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 