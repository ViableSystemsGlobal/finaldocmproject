import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET - Check if user has specific permission for a group
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')
    const userId = searchParams.get('user_id')
    const permissionType = searchParams.get('permission_type')

    if (!groupId || !userId || !permissionType) {
      return NextResponse.json({ 
        error: 'group_id, user_id, and permission_type are required' 
      }, { status: 400 })
    }

    // Check if user is a leader of the group
    const { data: leaderData, error: leaderError } = await supabase
      .from('group_leaders')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (leaderError && leaderError.code !== 'PGRST116') {
      console.error('❌ Error checking leader status:', leaderError)
      return NextResponse.json({ error: 'Failed to check leader status' }, { status: 500 })
    }

    if (!leaderData) {
      // User is not a leader, check if they're a super admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (profileError || profile?.role !== 'super_admin') {
        return NextResponse.json({ 
          hasPermission: false, 
          reason: 'Not a group leader or super admin' 
        })
      }

      // Super admin has all permissions
      return NextResponse.json({ 
        hasPermission: true, 
        reason: 'Super admin access' 
      })
    }

    // User is a leader, check the specific permission
    const { data: permission, error: permissionError } = await supabase
      .from('group_permissions')
      .select('is_enabled')
      .eq('group_id', groupId)
      .eq('permission_type', permissionType)
      .single()

    if (permissionError) {
      console.error('❌ Error checking permission:', permissionError)
      if (permissionError.code === 'PGRST116') {
        // Permission doesn't exist, default to false
        return NextResponse.json({ 
          hasPermission: false, 
          reason: 'Permission not configured' 
        })
      }
      return NextResponse.json({ error: 'Failed to check permission' }, { status: 500 })
    }

    return NextResponse.json({ 
      hasPermission: permission.is_enabled,
      reason: permission.is_enabled ? 'Permission enabled' : 'Permission disabled'
    })
  } catch (error) {
    console.error('❌ Error in GET /api/admin/check-group-permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Check multiple permissions at once
export async function POST(request: NextRequest) {
  try {
    const { group_id, user_id, permissions } = await request.json()

    if (!group_id || !user_id || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ 
        error: 'group_id, user_id, and permissions array are required' 
      }, { status: 400 })
    }

    // Check if user is a leader of the group
    const { data: leaderData, error: leaderError } = await supabase
      .from('group_leaders')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .single()

    if (leaderError && leaderError.code !== 'PGRST116') {
      console.error('❌ Error checking leader status:', leaderError)
      return NextResponse.json({ error: 'Failed to check leader status' }, { status: 500 })
    }

    if (!leaderData) {
      // User is not a leader, check if they're a super admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user_id)
        .single()

      if (profileError || profile?.role !== 'super_admin') {
        const result: Record<string, { hasPermission: boolean; reason: string }> = {}
        permissions.forEach(perm => {
          result[perm] = { hasPermission: false, reason: 'Not a group leader or super admin' }
        })
        return NextResponse.json({ permissions: result })
      }

      // Super admin has all permissions
      const result: Record<string, { hasPermission: boolean; reason: string }> = {}
      permissions.forEach(perm => {
        result[perm] = { hasPermission: true, reason: 'Super admin access' }
      })
      return NextResponse.json({ permissions: result })
    }

    // User is a leader, check all permissions
    const { data: groupPermissions, error: permissionsError } = await supabase
      .from('group_permissions')
      .select('permission_type, is_enabled')
      .eq('group_id', group_id)
      .in('permission_type', permissions)

    if (permissionsError) {
      console.error('❌ Error checking permissions:', permissionsError)
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 })
    }

    const result: Record<string, { hasPermission: boolean; reason: string }> = {}
    permissions.forEach(perm => {
      const permission = groupPermissions.find(p => p.permission_type === perm)
      if (permission) {
        result[perm] = {
          hasPermission: permission.is_enabled,
          reason: permission.is_enabled ? 'Permission enabled' : 'Permission disabled'
        }
      } else {
        result[perm] = {
          hasPermission: false,
          reason: 'Permission not configured'
        }
      }
    })

    return NextResponse.json({ permissions: result })
  } catch (error) {
    console.error('❌ Error in POST /api/admin/check-group-permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 