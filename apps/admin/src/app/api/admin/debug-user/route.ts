import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get current user from frontend client
    const { data: { user: frontendUser }, error: frontendError } = await supabase.auth.getUser()
    
    // Get all users from admin API
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: allUsers, error: adminError } = await adminSupabase.auth.admin.listUsers()
    
    // Get user roles for the current user
    let userRoles = null
    let userProfile = null
    
    if (frontendUser) {
      const { data: roles, error: rolesError } = await adminSupabase
        .from('user_roles')
        .select('*, role:roles(*)')
        .eq('user_id', frontendUser.id)
      
      userRoles = { data: roles, error: rolesError }
      
      const { data: profile, error: profileError } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', frontendUser.id)
        .single()
      
      userProfile = { data: profile, error: profileError }
    }
    
    return NextResponse.json({ 
      success: true,
      frontendUser: frontendUser ? {
        id: frontendUser.id,
        email: frontendUser.email,
        created_at: frontendUser.created_at
      } : null,
      frontendError,
      allUsersCount: allUsers?.users.length || 0,
      allUsers: allUsers?.users.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at
      })) || [],
      adminError,
      userRoles,
      userProfile
    })

  } catch (error) {
    console.error('Error in debug-user:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
} 