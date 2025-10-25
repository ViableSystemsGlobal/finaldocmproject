import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { authUserId, email, firstName, lastName } = await request.json()

    if (!authUserId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🔗 Linking existing user:', { authUserId, email, firstName, lastName })

    // 1. First check if contact already exists
    const { data: existingContact, error: contactCheckError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('email', email)
      .single()

    let contactId: string

    if (existingContact) {
      contactId = existingContact.id
      console.log('✅ Found existing contact:', contactId)
    } else {
      // 2. Create new contact
      const { data: newContact, error: contactError } = await supabaseAdmin
        .from('contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          source: 'mobile_app'
        })
        .select('id')
        .single()

      if (contactError) {
        console.error('❌ Error creating contact:', contactError)
        
        // Handle specific constraint violations with user-friendly messages
        if (contactError.code === '23505' && contactError.message.includes('contacts_email_key')) {
          return NextResponse.json(
            { success: false, error: 'This email address is already registered. Please use a different email.' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { success: false, error: 'Failed to create contact' },
          { status: 500 }
        )
      }

      contactId = newContact.id
      console.log('✅ Created new contact:', contactId)
    }

    // 3. Check if mobile app user record already exists
    const { data: existingMobileUser, error: mobileUserCheckError } = await supabaseAdmin
      .from('mobile_app_users')
      .select('contact_id')
      .eq('auth_user_id', authUserId)
      .single()

    if (existingMobileUser) {
      console.log('✅ Mobile app user already linked:', existingMobileUser.contact_id)
      return NextResponse.json({
        success: true,
        message: 'User already linked',
        contactId: existingMobileUser.contact_id
      })
    }

    // 4. Create mobile app user record linking auth user to contact
    const { data: mobileAppUser, error: mobileAppUserError } = await supabaseAdmin
      .from('mobile_app_users')
      .insert({
        auth_user_id: authUserId,
        contact_id: contactId,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (mobileAppUserError) {
      console.error('❌ Error creating mobile app user:', mobileAppUserError)
      return NextResponse.json(
        { success: false, error: 'Failed to create mobile app user record' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully linked user:', {
      authUserId,
      contactId,
      mobileAppUserId: mobileAppUser.id
    })

    return NextResponse.json({
      success: true,
      message: 'User successfully linked',
      contactId,
      mobileAppUserId: mobileAppUser.id
    })

  } catch (error) {
    console.error('❌ Link existing user error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 