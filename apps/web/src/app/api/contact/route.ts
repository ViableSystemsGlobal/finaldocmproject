import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Enhanced logging for debugging
    console.log('📧 Contact form submission started at:', new Date().toISOString())
    
    const body = await request.json()
    
    const {
      name,
      email,
      phone,
      subject,
      category,
      message,
      newsletter,
      prayer
    } = body

    console.log('📧 Contact form submission received:', { 
      name, 
      email, 
      subject, 
      category, 
      prayer, 
      newsletter,
      hasMessage: !!message,
      messageLength: message?.length || 0
    })

    // Validate required fields
    if (!name || !email || !subject || !message) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!email) missingFields.push('email')
      if (!subject) missingFields.push('subject')
      if (!message) missingFields.push('message')
      
      console.error('❌ Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Environment check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      supabaseUrlPrefix: supabaseUrl?.substring(0, 20) + '...',
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

    let supabase
    try {
      supabase = createServerSupabaseClient()
      console.log('✅ Supabase client created successfully')
    } catch (error) {
      console.error('❌ Supabase client creation failed:', error)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const submissionId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    // Handle newsletter subscription first if opted in
    let newsletterResult = null
    console.log('🔍 Newsletter check:', { newsletter, type: typeof newsletter, truthyCheck: newsletter === true || newsletter === 'true' || newsletter === 1 })
    
    if (newsletter === true || newsletter === 'true' || newsletter === 1) {
      try {
        console.log('📧 Adding newsletter subscription...')
        
        const newsletterPayload = {
          email,
          first_name: name.split(' ')[0] || name,
          last_name: name.split(' ').slice(1).join(' ') || '',
          subscribed_at: timestamp,
          status: 'active',
          subscription_source: 'contact_form'
        }
        
        console.log('📧 Newsletter payload:', newsletterPayload)
        
        const { data: newsletterData, error: newsletterError } = await supabase
          .from('newsletter_subscribers')
          .insert([newsletterPayload])
          .select()

        if (newsletterError) {
          console.error('❌ Newsletter subscription error:', newsletterError)
          console.error('❌ Newsletter error details:', JSON.stringify(newsletterError, null, 2))
          // Don't fail the main submission if newsletter fails
        } else {
          newsletterResult = newsletterData?.[0]
          console.log('✅ Newsletter subscription added:', newsletterResult?.id)
        }
      } catch (newsletterErr) {
        console.error('❌ Newsletter subscription failed:', newsletterErr)
        // Continue with main submission
      }
    } else {
      console.log('📧 Newsletter subscription skipped - condition not met')
    }

    // Determine if this is a prayer request
    const isPrayerRequest = prayer === true || prayer === 'true' || prayer === 1 || category === 'Prayer Request'
    console.log('🔍 Prayer request check:', { prayer, category, type: typeof prayer, isPrayerRequest })
    
    // Always submit to website_messages under outreach for admin visibility
    console.log('📝 Attempting to insert into website_messages table...')
    
    const websiteMessagePayload = {
      id: submissionId,
      name,
      email,
      phone: phone || null,
      subject,
      category: category || (isPrayerRequest ? 'Prayer Request' : 'General Inquiry'),
      message,
      source: 'website', // Match your admin table structure
      newsletter_opt_in: newsletter || false,
      submitted_at: timestamp,
      status: 'unread', // Match your admin status values
      is_prayer_request: isPrayerRequest
    }

    console.log('📝 Website message payload:', websiteMessagePayload)

    const { data: websiteMessageData, error: websiteMessageError } = await supabase
      .from('website_messages')
      .insert([websiteMessagePayload])
      .select()

    if (websiteMessageError) {
      console.error('❌ Error inserting website message:', websiteMessageError)
      console.error('❌ Error details:', JSON.stringify(websiteMessageError, null, 2))
      
      // Fallback to contact_submissions if website_messages table doesn't exist
      console.log('📝 Attempting fallback to contact_submissions...')
      
      const fallbackPayload = {
        id: submissionId,
        name,
        email,
        phone: phone || null,
        subject,
        category: category || (isPrayerRequest ? 'Prayer Request' : 'General Inquiry'),
        message,
        newsletter_opt_in: newsletter || false,
        is_prayer_request: isPrayerRequest,
        submitted_at: timestamp,
        status: 'new'
      }

      console.log('📝 Fallback payload:', fallbackPayload)

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('contact_submissions')
        .insert([fallbackPayload])
        .select()

      if (fallbackError) {
        console.error('❌ Error inserting to contact_submissions:', fallbackError)
        console.error('❌ Fallback error details:', JSON.stringify(fallbackError, null, 2))
        return NextResponse.json(
          { error: 'Failed to submit contact form. Please try again or contact us directly.' },
          { status: 500 }
        )
      }

      console.log('✅ Message submitted to contact_submissions (fallback):', submissionId)
    } else {
      console.log('✅ Website message submitted successfully:', submissionId)
    }

    // If it's a prayer request, ALSO add it to prayer_requests table for pastoral team
    if (isPrayerRequest) {
      try {
        console.log('🙏 Adding prayer request to pastoral team...')
        
        const prayerPayload = {
          id: crypto.randomUUID(),
          contact_id: null, // Allow prayer requests from non-contacts
          title: subject,
          description: message,
          status: 'new',
          submitted_at: timestamp,
          urgency: 'normal',
          is_confidential: true,
          source: 'website',
          source_submission_id: submissionId
        }
        
        console.log('🙏 Prayer request payload:', prayerPayload)
        
        const { data: prayerData, error: prayerError } = await supabase
          .from('prayer_requests')
          .insert([prayerPayload])
          .select()

        if (prayerError) {
          console.error('❌ Prayer request submission error:', prayerError)
          console.error('❌ Prayer error details:', JSON.stringify(prayerError, null, 2))
          // Don't fail main submission if prayer table fails
        } else {
          console.log('✅ Prayer request also submitted to pastoral team:', prayerData?.[0]?.id)
        }
      } catch (prayerErr) {
        console.error('❌ Prayer request submission failed:', prayerErr)
        // Continue - main submission was successful
      }
    }

    // Return appropriate success message
    const baseMessage = isPrayerRequest 
      ? 'Your prayer request has been submitted. Our pastoral team will keep you in prayer.'
      : 'Your message has been sent successfully! We\'ll get back to you soon.'
    
    const newsletterMessage = newsletterResult 
      ? ' You\'ve also been subscribed to our newsletter.'
      : ''

    console.log('✅ Contact form submission completed successfully')

    return NextResponse.json(
      { 
        success: true, 
        message: baseMessage + newsletterMessage,
        submission_id: submissionId,
        type: isPrayerRequest ? 'prayer_request' : 'website_message',
        newsletter_subscribed: !!newsletterResult,
        debug: {
          newsletterResult: !!newsletterResult,
          newsletterResultId: newsletterResult?.id,
          isPrayerRequest,
          originalValues: { newsletter, prayer },
          timestamp,
          nodeEnv: process.env.NODE_ENV
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('❌ Error processing contact form:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : undefined)
    
    // Return more specific error messages
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format. Please check your form data.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again or contact us directly.' },
      { status: 500 }
    )
  }
} 