import { supabase } from '@/lib/supabase'

// Types for our enhanced giving system
export interface DonationCampaign {
  id: string
  name: string
  description: string | null
  goal_amount: number | null
  current_amount: number
  start_date: string | null
  end_date: string | null
  is_active: boolean
  campaign_type: string
  created_at: string
  updated_at: string
}

export interface RecurringDonation {
  id: string
  contact_id: string
  stripe_subscription_id: string | null
  amount: number
  currency: string
  interval_type: string
  interval_count: number
  fund_designation: string
  status: string
  next_payment_date: string | null
  started_at: string
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface EnhancedTransaction {
  id: string
  contact_id: string | null
  amount: number
  currency: string
  category: string
  payment_method: string
  transacted_at: string
  notes: string | null
  // Stripe-specific fields
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_customer_id: string | null
  payment_status: string | null
  failure_reason: string | null
  receipt_url: string | null
  refunded_amount: number | null
  fee_amount: number | null
  net_amount: number | null
  is_recurring: boolean
  fund_designation: string | null
  is_anonymous: boolean
  tax_deductible: boolean
}

export interface GivingMetrics {
  totalGivingYTD: number
  monthlyAverage: number
  transactionCount: number
  stripeTransactionCount: number
  recurringDonationCount: number
  averageDonationAmount: number
  totalFees: number
  netAmount: number
  topDonationMethod: string
  activeCampaigns: number
  loading: boolean
}

// Fetch donation campaigns
export async function fetchDonationCampaigns() {
  try {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    return { data: data as DonationCampaign[], error }
  } catch (error) {
    return { data: null, error }
  }
}

// Fetch active campaigns
export async function fetchActiveCampaigns() {
  try {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return { data: data as DonationCampaign[], error }
  } catch (error) {
    return { data: null, error }
  }
}

// Fetch recurring donations
export async function fetchRecurringDonations() {
  try {
    const { data, error } = await supabase
      .from('recurring_donations')
      .select(`
        *,
        contacts (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    return { data: data as RecurringDonation[], error }
  } catch (error) {
    return { data: null, error }
  }
}

// Fetch enhanced transactions with Stripe data
export async function fetchEnhancedTransactions() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        contacts (
          first_name,
          last_name,
          email
        )
      `)
      .order('transacted_at', { ascending: false })

    return { data: data as EnhancedTransaction[], error }
  } catch (error) {
    return { data: null, error }
  }
}

// Get enhanced giving metrics
export async function getEnhancedGivingMetrics(): Promise<GivingMetrics> {
  try {
    const currentYear = new Date().getFullYear()
    const startOfYear = `${currentYear}-01-01`
    
    // Get basic metrics
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .gte('transacted_at', startOfYear)

    if (transError) throw transError

    // Get campaign count
    const { count: campaignCount, error: campaignError } = await supabase
      .from('donation_campaigns')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    if (campaignError) throw campaignError

    // Get recurring donations count
    const { count: recurringCount, error: recurringError } = await supabase
      .from('recurring_donations')
      .select('id', { count: 'exact' })
      .eq('status', 'active')

    if (recurringError) throw recurringError

    const transactionData = transactions || []
    
    // Calculate metrics
    const totalGivingYTD = transactionData.reduce((sum, t) => sum + (t.amount || 0), 0)
    const transactionCount = transactionData.length
    const stripeTransactionCount = transactionData.filter(t => t.stripe_payment_intent_id).length
    const monthlyAverage = transactionCount > 0 ? totalGivingYTD / Math.max(new Date().getMonth() + 1, 1) : 0
    const averageDonationAmount = transactionCount > 0 ? totalGivingYTD / transactionCount : 0
    const totalFees = transactionData.reduce((sum, t) => sum + (t.fee_amount || 0), 0)
    const netAmount = totalGivingYTD - totalFees
    
    // Find top payment method
    const methodCounts = transactionData.reduce((acc, t) => {
      acc[t.payment_method] = (acc[t.payment_method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topDonationMethod = Object.keys(methodCounts).reduce((a, b) => 
      methodCounts[a] > methodCounts[b] ? a : b, 'None'
    )

    return {
      totalGivingYTD,
      monthlyAverage,
      transactionCount,
      stripeTransactionCount,
      recurringDonationCount: recurringCount || 0,
      averageDonationAmount,
      totalFees,
      netAmount,
      topDonationMethod,
      activeCampaigns: campaignCount || 0,
      loading: false
    }
  } catch (error) {
    console.error('Error fetching enhanced metrics:', error)
    return {
      totalGivingYTD: 0,
      monthlyAverage: 0,
      transactionCount: 0,
      stripeTransactionCount: 0,
      recurringDonationCount: 0,
      averageDonationAmount: 0,
      totalFees: 0,
      netAmount: 0,
      topDonationMethod: 'None',
      activeCampaigns: 0,
      loading: false
    }
  }
}

// Create or update donation campaign
export async function createDonationCampaign(campaign: Omit<DonationCampaign, 'id' | 'created_at' | 'updated_at' | 'current_amount'>) {
  try {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .insert([campaign])
      .select()
      .single()

    return { data: data as DonationCampaign, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Update donation campaign
export async function updateDonationCampaign(id: string, updates: Partial<DonationCampaign>) {
  try {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data: data as DonationCampaign, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Cancel recurring donation
export async function cancelRecurringDonation(id: string) {
  try {
    const { data, error } = await supabase
      .from('recurring_donations')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    return { data: data as RecurringDonation, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Get donation analytics for charts
export async function getDonationAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  try {
    let dateFilter = ''
    const now = new Date()
    
    switch (period) {
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case 'month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        break
      case 'year':
        dateFilter = new Date(now.getFullYear(), 0, 1).toISOString()
        break
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, transacted_at, payment_method, fund_designation')
      .gte('transacted_at', dateFilter)
      .order('transacted_at', { ascending: true })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
} 