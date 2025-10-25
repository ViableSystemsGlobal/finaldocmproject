import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting mobile app user records fix...')

    // Get all authenticated users who don't have mobile app user records
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch auth users' },
        { status: 500 }
      )
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`)

    // Get existing mobile app user records
    const { data: existingMobileUsers, error: mobileUsersError } = await supabaseAdmin
      .from('mobile_app_users')
      .select('auth_user_id')

    if (mobileUsersError) {
      console.error('❌ Error fetching mobile app users:', mobileUsersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch mobile app users' },
        { status: 500 }
      )
    }

    const existingAuthUserIds = new Set(existingMobileUsers?.map(u => u.auth_user_id) || [])
    console.log(`📊 Found ${existingAuthUserIds.size} existing mobile app user records`)

    // Find users missing mobile app user records
    const missingUsers = authUsers.users.filter(user => 
      !existingAuthUserIds.has(user.id) && 
      user.email && 
      !user.email.includes('@admin') // Skip admin users
    )

    console.log(`🔍 Found ${missingUsers.length} users missing mobile app user records`)

    let createdCount = 0
    let errorCount = 0
    const errors: any[] = []

    for (const user of missingUsers) {
      try {
        console.log(`📝 Processing user: ${user.email}`)

        // Try to find existing contact by email
        let contactId = null
        const { data: existingContact, error: contactError } = await supabaseAdmin
          .from('contacts')
          .select('id')
          .eq('email', user.email)
          .single()

        if (existingContact && !contactError) {
          contactId = existingContact.id
          console.log(`🔗 Found existing contact for ${user.email}:`, contactId)
        } else {
          // Create new contact record
          const { data: newContact, error: createContactError } = await supabaseAdmin
            .from('contacts')
            .insert({
              email: user.email,
              first_name: user.user_metadata?.first_name || 'Mobile',
              last_name: user.user_metadata?.last_name || 'User',
              source: 'mobile_app_fix'
            })
            .select('id')
            .single()

          if (newContact && !createContactError) {
            contactId = newContact.id
            console.log(`✅ Created new contact for ${user.email}:`, contactId)
          } else {
            console.warn(`⚠️ Could not create contact for ${user.email}:`, createContactError)
          }
        }

        // Create mobile app user record
        const { data: newMobileUser, error: createError } = await supabaseAdmin
          .from('mobile_app_users')
          .insert({
            auth_user_id: user.id,
            contact_id: contactId,
            status: 'active',
            devices: [],
            registered_at: user.created_at,
            last_active: user.last_sign_in_at || user.created_at
          })
          .select('id')
          .single()

        if (createError) {
          console.error(`❌ Failed to create mobile app user for ${user.email}:`, createError)
          errors.push({ email: user.email, error: createError })
          errorCount++
        } else {
          console.log(`✅ Created mobile app user record for ${user.email}:`, newMobileUser.id)
          createdCount++
        }

      } catch (error) {
        console.error(`💥 Exception processing user ${user.email}:`, error)
        errors.push({ email: user.email, error })
        errorCount++
      }
    }

    console.log(`🎯 Fix complete: ${createdCount} created, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Mobile app user records fix completed`,
      stats: {
        totalAuthUsers: authUsers.users.length,
        existingMobileUsers: existingAuthUserIds.size,
        missingUsers: missingUsers.length,
        created: createdCount,
        errors: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Error in fix-missing-records:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 