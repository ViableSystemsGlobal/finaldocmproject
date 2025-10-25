import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET - Fetch group permissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')
    const userId = searchParams.get('user_id')

    if (!groupId) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
    }

    // If user_id is provided, check if the user has permission to view this group's permissions
    if (userId) {
      const { data: isLeader, error: leaderError } = await supabase
        .from('group_leaders')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      if (leaderError && leaderError.code !== 'PGRST116') {
        console.error('❌ Error checking leader status:', leaderError)
        return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 })
      }

      if (!isLeader) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    const { data, error } = await supabase
      .from('group_permissions')
      .select('*')
      .eq('group_id', groupId)
      .order('permission_type', { ascending: true })

    if (error) {
      console.error('❌ Error fetching group permissions:', error)
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Error in GET /api/admin/group-permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update group permissions
export async function POST(request: NextRequest) {
  try {
    const { group_id, permissions } = await request.json()

    if (!group_id || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'group_id and permissions array are required' }, { status: 400 })
    }

    // Get current user info
    const { data: { user } } = await supabase.auth.getUser()
    const currentUserId = user?.id

    if (!currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is a leader or admin
    const { data: isLeader, error: leaderError } = await supabase
      .from('group_leaders')
      .select('id')
      .eq('group_id', group_id)
      .eq('user_id', currentUserId)
      .single()

    if (leaderError && leaderError.code !== 'PGRST116') {
      console.error('❌ Error checking leader status:', leaderError)
      return NextResponse.json({ error: 'Failed to check permissions' }, { status: 500 })
    }

    if (!isLeader) {
      // Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', currentUserId)
        .single()

      if (profileError || profile?.role !== 'super_admin') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Upsert permissions
    const results = []
    for (const permission of permissions) {
      const { permission_type, is_enabled } = permission

      if (!permission_type || typeof is_enabled !== 'boolean') {
        continue
      }

      const { data, error } = await supabase
        .from('group_permissions')
        .upsert({
          group_id,
          permission_type,
          is_enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'group_id,permission_type'
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ Error upserting permission ${permission_type}:`, error)
        continue
      }

      results.push(data)
    }

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('❌ Error in POST /api/admin/group-permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update a specific permission
export async function PUT(request: NextRequest) {
  try {
    const { id, is_enabled } = await request.json()

    if (!id || typeof is_enabled !== 'boolean') {
      return NextResponse.json({ error: 'Permission ID and is_enabled are required' }, { status: 400 })
    }

    const { data: permission, error } = await supabase
      .from('group_permissions')
      .update({
        is_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating permission:', error)
      return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 })
    }

    return NextResponse.json({ data: permission })
  } catch (error) {
    console.error('❌ Error in PUT /api/admin/group-permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 