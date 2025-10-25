import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Setting up prayer team users...')

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!authUsers || authUsers.users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    console.log(`👥 Found ${authUsers.users.length} auth users`)

    const results = []
    let createdCount = 0
    let updatedCount = 0

    // Process each user
    for (const user of authUsers.users) {
      try {
        console.log(`👤 Processing user: ${user.email}`)
        
        // Check if user profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        const firstName = user.user_metadata?.first_name || 
                         user.user_metadata?.full_name?.split(' ')[0] || 
                         user.email?.split('@')[0] || 'User'
        
        const lastName = user.user_metadata?.last_name || 
                        user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                        ''

        const profileData = {
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          role: 'prayer_team', // Set everyone to prayer_team for now
          user_type: 'admin_staff',
          app_access: ['admin'],
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        if (existingProfile) {
          // Update existing profile
          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              first_name: firstName,
              last_name: lastName,
              role: 'prayer_team',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single()

          if (updateError) {
            console.error(`❌ Error updating profile for ${user.email}:`, updateError)
            results.push({
              user_email: user.email,
              success: false,
              error: updateError.message,
              action: 'update'
            })
          } else {
            console.log(`✅ Updated profile for ${user.email}`)
            updatedCount++
            results.push({
              user_email: user.email,
              success: true,
              action: 'update',
              profile: updatedProfile
            })
          }
        } else {
          // Create new profile
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([profileData])
            .select()
            .single()

          if (createError) {
            console.error(`❌ Error creating profile for ${user.email}:`, createError)
            results.push({
              user_email: user.email,
              success: false,
              error: createError.message,
              action: 'create'
            })
          } else {
            console.log(`✅ Created profile for ${user.email}`)
            createdCount++
            results.push({
              user_email: user.email,
              success: true,
              action: 'create',
              profile: newProfile
            })
          }
        }
      } catch (error) {
        console.error(`💥 Exception processing user ${user.email}:`, error)
        results.push({
          user_email: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          action: 'process'
        })
      }
    }

    // Now test the getUsersByRole function
    console.log('🧪 Testing getUsersByRole function...')
    const { data: testUsers, error: testError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, role')
      .eq('role', 'prayer_team')

    console.log(`🔍 Found ${testUsers?.length || 0} users with prayer_team role`)

    return NextResponse.json({
      success: true,
      message: 'Prayer team users setup completed',
      summary: {
        total_users: authUsers.users.length,
        created: createdCount,
        updated: updatedCount,
        prayer_team_users: testUsers?.length || 0
      },
      results,
      test_users: testUsers || []
    })

  } catch (error) {
    console.error('💥 Error in setup-prayer-users:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 