import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found in auth' }, { status: 404 })
    }

    // Create or update user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Admin User',
        user_type: 'admin_staff',
        app_access: ['admin'],
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating/updating profile:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Admin profile created successfully' 
    })

  } catch (error) {
    console.error('Error in create-admin-profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 