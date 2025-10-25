import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Cache for Stripe secret key
let stripeSecretKey: string | null = null
let stripeInstance: Stripe | null = null

// Fetch Stripe secret key from admin integration settings
async function fetchStripeSecretKey(): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration missing')
      return process.env.STRIPE_SECRET_KEY || null
    }

    let supabase
    
    // Try service role first for bypassing RLS
    if (supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    } else {
      // Fallback to anon key
      supabase = createClient(supabaseUrl, supabaseAnonKey)
    }
    
    // Fetch Stripe integration settings
    const { data: stripeIntegration, error } = await supabase
      .from('integration_settings')
      .select('config')
      .eq('provider', 'stripe')
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.error('❌ Error fetching Stripe integration settings:', error)
      return process.env.STRIPE_SECRET_KEY || null
    }
    
    if (!stripeIntegration?.config?.secret_key) {
      console.error('❌ Stripe secret key not found in integration settings')
      return process.env.STRIPE_SECRET_KEY || null
    }
    
    console.log('✅ Stripe secret key loaded from admin integration settings')
    return stripeIntegration.config.secret_key
    
  } catch (error) {
    console.error('❌ Error fetching Stripe secret key:', error)
    return process.env.STRIPE_SECRET_KEY || null
  }
}

// Get Stripe instance with secret key from admin settings
export async function getStripeInstance(): Promise<Stripe> {
  if (!stripeInstance) {
    if (!stripeSecretKey) {
      stripeSecretKey = await fetchStripeSecretKey()
    }
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured')
    }
    
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    })
  }
  
  return stripeInstance
}

// Get secret key directly (for compatibility)
export async function getStripeSecretKey(): Promise<string> {
  if (!stripeSecretKey) {
    stripeSecretKey = await fetchStripeSecretKey()
  }
  
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured')
  }
  
  return stripeSecretKey
} 