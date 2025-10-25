import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get total subscriber count
    const { count: totalSubscribers } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get total newsletters sent
    const { count: totalCampaigns } = await supabaseAdmin
      .from('newsletters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')

    // Get template count
    const { count: totalTemplates } = await supabaseAdmin
      .from('newsletter_templates')
      .select('*', { count: 'exact', head: true })

    // Calculate average open rate
    const { data: sentNewsletters } = await supabaseAdmin
      .from('newsletters')
      .select('total_recipients, total_opened')
      .eq('status', 'sent')
      .gt('total_recipients', 0)

    let averageOpenRate = 0
    if (sentNewsletters && sentNewsletters.length > 0) {
      const totalSent = sentNewsletters.reduce((sum, n) => sum + (n.total_recipients || 0), 0)
      const totalOpened = sentNewsletters.reduce((sum, n) => sum + (n.total_opened || 0), 0)
      averageOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
    }

    // Get recent campaigns
    const { data: recentCampaigns } = await supabaseAdmin
      .from('newsletters')
      .select('id, subject, status, total_recipients, total_opened, total_clicked, sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get subscriber growth data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: subscriberGrowth } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('subscribed_at')
      .gte('subscribed_at', sixMonthsAgo.toISOString())
      .order('subscribed_at')

    // Group subscriber growth by month
    const growthByMonth = subscriberGrowth?.reduce((acc: any, subscriber) => {
      const month = new Date(subscriber.subscribed_at).toISOString().slice(0, 7) // YYYY-MM format
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      stats: {
        totalSubscribers: totalSubscribers || 0,
        totalCampaigns: totalCampaigns || 0,
        averageOpenRate,
        totalTemplates: totalTemplates || 0
      },
      recentCampaigns: recentCampaigns || [],
      subscriberGrowth: growthByMonth
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 