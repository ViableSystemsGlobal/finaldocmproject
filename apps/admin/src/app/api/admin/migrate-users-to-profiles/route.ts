import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch auth users', details: authError }, { status: 500 })
    }

    // Get existing user profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id')

    if (profilesError) {
      console.error('Error fetching existing profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch existing profiles', details: profilesError }, { status: 500 })
    }

    const existingUserIds = new Set(existingProfiles?.map(p => p.user_id) || [])

    // Create user profiles for users that don't have them
    const usersToMigrate = authData.users.filter(user => !existingUserIds.has(user.id))

    if (usersToMigrate.length === 0) {
      return NextResponse.json({ message: 'All users already have profiles', migrated: 0 })
    }

    const profilesToInsert = usersToMigrate.map(user => ({
      user_id: user.id,
      user_type: 'admin_staff',
      app_access: ['admin'],
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null,
      phone: user.user_metadata?.phone || null,
      is_active: true,
      is_verified: true
    }))

    // Insert user profiles
    const { error: insertError } = await supabase
      .from('user_profiles')
      .insert(profilesToInsert)

    if (insertError) {
      console.error('Error inserting user profiles:', insertError)
      return NextResponse.json({ error: 'Failed to insert user profiles', details: insertError }, { status: 500 })
    }

    console.log(`Successfully migrated ${usersToMigrate.length} users to user_profiles`)

    return NextResponse.json({ 
      message: 'Users migrated successfully', 
      migrated: usersToMigrate.length,
      users: usersToMigrate.map(u => ({ id: u.id, email: u.email }))
    })

  } catch (error) {
    console.error('Error in migrate-users-to-profiles API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 