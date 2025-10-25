import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, roleName = 'super_admin' } = await request.json()
    
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
      return NextResponse.json({ error: 'Failed to fetch users', details: authError }, { status: 500 })
    }

    const user = authUsers.users.find(u => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the existing role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', roleName)
      .single()

    if (roleError) {
      console.error('Error getting role:', roleError)
      return NextResponse.json({ error: 'Failed to get role', details: roleError }, { status: 500 })
    }

    // Assign role to user (upsert to avoid duplicates)
    const { data: userRole, error: assignError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role_id: role.id
      })
      .select()

    if (assignError) {
      console.error('Error assigning role:', assignError)
      return NextResponse.json({ error: 'Failed to assign role', details: assignError }, { status: 500 })
    }

    // Also create/update user profile if it doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        first_name: user.user_metadata?.full_name?.split(' ')[0] || email.split('@')[0],
        last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'User',
        user_type: 'admin_staff',
        app_access: ['admin'],
        is_active: true
      })
      .select()

    return NextResponse.json({ 
      success: true,
      role: role,
      userRole: userRole,
      profile: profile,
      message: `Successfully assigned ${roleName} role to ${email}` 
    })

  } catch (error) {
    console.error('Error in assign-existing-role:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 