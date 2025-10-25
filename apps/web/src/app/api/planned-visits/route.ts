import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

interface PlannedVisitFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Visit Details
  eventType: string
  preferredDate: string
  preferredTime: string
  groupSize: number
  
  // Additional Information
  firstTimeVisitor: boolean
  specialNeeds: string
  howHeardAboutUs: string
  additionalNotes: string
}

export async function POST(request: NextRequest) {
  try {
    const formData: PlannedVisitFormData = await request.json()

    console.log('📋 Received planned visit form data:', formData)

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.eventType || !formData.preferredDate) {
      console.error('❌ Missing required fields:', {
        firstName: !!formData.firstName,
        lastName: !!formData.lastName,
        email: !!formData.email,
        eventType: !!formData.eventType,
        preferredDate: !!formData.preferredDate
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Step 1: Create or find contact
    let contactId: string | null = null
    
    console.log('🔍 Checking for existing contact with email:', formData.email)
    
    // First, check if contact already exists by email
    const { data: existingContact, error: searchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', formData.email)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('❌ Error searching for existing contact:', searchError)
      throw searchError
    }

    if (existingContact) {
      console.log('✅ Found existing contact:', existingContact.id)
      contactId = existingContact.id
    } else {
      console.log('➕ Creating new contact...')
      // Create new contact - using minimal required fields
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Default tenant from migrations
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (contactError) {
        console.error('❌ Error creating contact:', contactError)
        throw contactError
      }
      
      console.log('✅ Created new contact:', newContact.id)
      contactId = newContact.id
    }

    // Step 2: Get event details - check if it's a real event ID or generic type
    let eventName = formData.eventType
    let eventDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime || '10:00'}`)
    
    // Check if the eventType is a UUID (real event ID)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.eventType)
    
    if (isUUID) {
      // It's a real event - fetch event details from database
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('name, event_date')
        .eq('id', formData.eventType)
        .single()
      
      if (eventError) {
        console.error('❌ Error fetching event:', eventError)
        // Fall back to using the form data
        eventName = `Event ${formData.eventType}`
      } else if (event) {
        eventName = event.name
        // Use the actual event date/time from the database
        eventDateTime = new Date(event.event_date)
      }
    } else {
      // It's a generic event type - map to event name
      const eventTypeMap: Record<string, string> = {
        'sunday-service': 'Sunday Worship Service',
        'youth-night': 'Youth Night',
        'bible-study': 'Bible Study',
        'prayer-service': 'Prayer & Worship Service',
        'general-visit': 'General Visit',
        'community-outreach': 'Community Outreach',
        'special-event': 'Special Event'
      }
      
      eventName = eventTypeMap[formData.eventType] || formData.eventType
      // Use the date/time from form data for generic events
      eventDateTime = new Date(`${formData.preferredDate}T${formData.preferredTime || '10:00'}`)
    }
    
    console.log('📅 Creating planned visit:', {
      contactId,
      eventName,
      eventDateTime: eventDateTime.toISOString(),
      groupSize: formData.groupSize
    })

    // Step 4: Create planned visit
    const { data: plannedVisit, error: visitError } = await supabase
      .from('planned_visits')
      .insert({
        contact_id: contactId,
        event_name: eventName,
        event_date: eventDateTime.toISOString(),
        event_time: formData.preferredTime || '10:00',
        interest_level: 'interested',
        how_heard_about_us: formData.howHeardAboutUs || null,
        coming_with_others: formData.groupSize > 1,
        companions_count: Math.max(0, formData.groupSize - 1),
        companions_details: formData.groupSize > 1 ? `Group of ${formData.groupSize} people` : null,
        special_needs: formData.specialNeeds || null,
        contact_preference: 'email',
        notes: formData.additionalNotes || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (visitError) {
      console.error('❌ Error creating planned visit:', visitError)
      throw visitError
    }

    console.log('✅ Planned visit created successfully:', {
      contactId,
      plannedVisitId: plannedVisit.id,
      eventName,
      eventDate: eventDateTime.toISOString()
    })

    // Step 5: Send confirmation email to the visitor using admin email API
    try {
      // Use the admin email API endpoint (works in both dev and production)
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
      console.log(`📧 Sending email via admin API: ${adminUrl}/api/email/send`)
      
      const emailResponse = await fetch(`${adminUrl}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: formData.email,
          subject: `Visit Confirmation - ${eventName}`,
          emailType: 'events', // Use events@docmchurch.org account
          priority: 'high',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .event-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea; }
                  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
                  h1 { margin: 0; font-size: 28px; }
                  h2 { color: #667eea; margin-top: 0; }
                  .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Visit Confirmed!</h1>
                    <p>Thank you for planning to visit us, ${formData.firstName}!</p>
                  </div>
                  <div class="content">
                    <p>We're excited to welcome you to our church family! Your visit has been successfully planned.</p>
                    
                    <div class="event-details">
                      <h2>📅 Visit Details</h2>
                      <p><strong>Event:</strong> ${eventName}</p>
                      <p><strong>Date:</strong> ${eventDateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p><strong>Time:</strong> ${eventDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                      ${formData.groupSize > 1 ? `<p><strong>Group Size:</strong> ${formData.groupSize} people</p>` : ''}
                    </div>

                    <p>Our team will be in touch soon to confirm all the details and answer any questions you may have.</p>
                    
                    <p><strong>We can't wait to welcome you!</strong></p>

                    <p style="margin-top: 30px;">If you have any questions or need to make changes, please don't hesitate to contact us.</p>
                  </div>
                  <div class="footer">
                    <p>This email was sent because you planned a visit through our website.</p>
                    <p>&copy; ${new Date().getFullYear()} DOCM Church. All rights reserved.</p>
                  </div>
                </div>
              </body>
            </html>
          `
        })
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('❌ Failed to send confirmation email:', errorText)
        // Don't fail the whole request if email fails
      } else {
        const emailResult = await emailResponse.json()
        console.log('✅ Confirmation email sent successfully!')
        console.log(`   To: ${formData.email}`)
        console.log(`   From: ${emailResult.sender || 'events@docmchurch.org'}`)
        console.log(`   Message ID: ${emailResult.messageId || 'N/A'}`)
      }
    } catch (emailError) {
      console.error('❌ Error sending confirmation email:', emailError)
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Your visit has been planned successfully! We\'ll be in touch soon.',
      plannedVisitId: plannedVisit.id
    })

  } catch (error) {
    console.error('❌ Error creating planned visit:', error)
    
    // More detailed error logging
    if (error && typeof error === 'object') {
      console.error('Error details:', {
        message: (error as any).message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
        stack: (error as any).stack
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to submit planned visit. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code || null
      },
      { status: 500 }
    )
  }
} 