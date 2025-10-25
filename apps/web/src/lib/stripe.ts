import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>
let stripeConfigPromise: Promise<string | null>

// Fallback key if API fails
const FALLBACK_STRIPE_KEY = 'pk_test_51M3A4oL5sFi7cbV9s5n3hemWG43sjUMzZTdfB8D6qwGCooBKUi4BXv3D6tOpfuNv0GNA1s1bZtaezrymznltEQBx000dN4XLHR'

// Fetch Stripe configuration from admin settings
async function fetchStripeConfig(): Promise<string | null> {
  try {
    const response = await fetch('/api/stripe-config')
    const result = await response.json()
    
    if (result.success && result.data?.publishable_key) {
      console.log('✅ Stripe configuration loaded from admin settings')
      return result.data.publishable_key
    } else {
      console.warn('⚠️ Stripe configuration not found in admin settings, using fallback')
      return result.fallback?.publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || FALLBACK_STRIPE_KEY
    }
  } catch (error) {
    console.error('❌ Error fetching Stripe configuration:', error)
    return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || FALLBACK_STRIPE_KEY
  }
}

export const getStripe = async () => {
  if (!stripePromise) {
    // Initialize config promise if not already done
    if (!stripeConfigPromise) {
      stripeConfigPromise = fetchStripeConfig()
    }
    
    // Get the publishable key from admin settings
    const publishableKey = await stripeConfigPromise
    
    if (publishableKey) {
      stripePromise = loadStripe(publishableKey)
    } else {
      throw new Error('Stripe configuration not available')
    }
  }
  
  return stripePromise
} 