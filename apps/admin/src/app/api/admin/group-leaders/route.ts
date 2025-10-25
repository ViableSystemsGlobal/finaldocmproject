import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendGroupLeaderAssignmentNotification } from '@/services/notificationService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { groupId, userId, role } = await request.json()

    console.log('Assigning leader:', { groupId, userId, role })

    if (!groupId || !userId || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: groupId, userId, role' 
      }, { status: 400 })
    }

    // Get group information for notification
    const { data: groupInfo, error: groupError } = await supabase
      .from('groups')
      .select('name, description, type')
      .eq('id', groupId)
      .single()

    if (groupError) {
      console.error('Error fetching group info:', groupError)
      return NextResponse.json({ error: 'Failed to fetch group information' }, { status: 500 })
    }

    // Check if user has admin access, if not, grant it
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type, app_access')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Grant admin access if user doesn't have it
    if (!userProfile.app_access?.includes('admin')) {
      console.log('Granting admin access to new group leader')
      
      const newAppAccess = Array.from(new Set([...(userProfile.app_access || []), 'admin']))
      const newUserType = userProfile.user_type === 'mobile_user' ? 'hybrid' : 'admin_staff'

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          user_type: newUserType,
          app_access: newAppAccess,
          is_verified: true
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error granting admin access:', updateError)
        // Don't fail the assignment if this fails, just log it
      } else {
        console.log('Admin access granted successfully')
      }
    }

    // Insert the group leader assignment
    const { data, error } = await supabase
      .from('group_leaders')
      .insert({
        group_id: groupId,
        user_id: userId,
        is_primary_leader: role === 'leader',
        assigned_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error assigning leader:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Leader assigned successfully:', data)

    // Send notification to the newly assigned leader
    try {
      await sendGroupLeaderAssignmentNotification(
        userId,
        {
          id: groupId,
          name: groupInfo.name,
          description: groupInfo.description,
          category: groupInfo.type,
          leaderRole: role
        }
      )
      console.log('Notification sent successfully to leader')
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the assignment if notification fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in group-leaders API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { groupId, userId } = await request.json()

    console.log('Removing leader:', { groupId, userId })

    if (!groupId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: groupId, userId' 
      }, { status: 400 })
    }

    // Check if the leader assignment exists
    const { data: existingLeader, error: checkError } = await supabase
      .from('group_leaders')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    if (checkError || !existingLeader) {
      console.error('Leader assignment not found:', checkError)
      return NextResponse.json({ error: 'Leader assignment not found' }, { status: 404 })
    }

    // Remove the group leader assignment
    const { error } = await supabase
      .from('group_leaders')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing leader:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Leader removed successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Leader removed successfully'
    })
  } catch (error) {
    console.error('Error in group-leaders DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 