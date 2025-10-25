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

    // Get user from user_profiles
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .ilike('first_name', email.split('@')[0])
      .single()

    // If we can't find by name, get from auth users
    let userId = userProfile?.user_id
    
    if (!userId) {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        return NextResponse.json({ error: 'Failed to fetch users', details: authError }, { status: 500 })
      }

      const user = authUsers.users.find(u => u.email === email)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      userId = user.id
    }

    // Create or get super admin role with all permissions
    const superAdminPermissions = [
      'dashboard:view',
      'reports:view:all', 
      'attendance:reports', 
      'giving:reports', 
      'comms:reports',
      'contacts:view:all', 
      'contacts:edit:all', 
      'contacts:delete:all',
      'members:view:all',
      'members:edit:all',
      'members:delete:all',
      'groups:view:all',
      'groups:edit:all',
      'events:view:all',
      'events:edit:all',
      'followups:view:all',
      'followups:edit:all',
      'prayers:view:all',
      'prayers:edit:all',
      'comms:view:all',
      'comms:edit:all',
      'sermons:view:all',
      'sermons:edit:all',
      'giving:view:all',
      'giving:edit:all',
      'admin:settings',
      'roles:manage',
      'admin:users'
    ]

    // Create/update the super admin role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .upsert({
        name: roleName,
        description: 'Super Administrator with full access',
        permissions: superAdminPermissions,
        department: 'Administration'
      })
      .select()
      .single()

    if (roleError) {
      console.error('Error creating role:', roleError)
      return NextResponse.json({ error: 'Failed to create role', details: roleError }, { status: 500 })
    }

    // Assign role to user
    const { data: userRole, error: assignError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: role.id
      })
      .select()

    if (assignError) {
      console.error('Error assigning role:', assignError)
      return NextResponse.json({ error: 'Failed to assign role', details: assignError }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      role: role,
      userRole: userRole,
      message: `Successfully assigned ${roleName} role to ${email}` 
    })

  } catch (error) {
    console.error('Error in assign-role:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 