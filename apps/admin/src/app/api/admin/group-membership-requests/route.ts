import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET - Get all pending group membership requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')
    
    console.log('📝 Getting pending group membership requests...', groupId ? `for group: ${groupId}` : 'all groups')
    
    // Build the query for regular group memberships
    let groupQuery = supabase
      .from('group_memberships')
      .select(`
        group_id,
        contact_id,
        role,
        status,
        requested_at,
        rejection_reason,
        groups (
          id,
          name,
          type,
          description
        ),
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
    
    // Filter by group_id if provided
    if (groupId) {
      groupQuery = groupQuery.eq('group_id', groupId)
    }
    
    // Get pending regular group memberships
    const { data: groupMemberships, error: groupError } = await groupQuery
    
    if (groupError) {
      console.error('❌ Error fetching pending group memberships:', groupError)
      return NextResponse.json({ error: 'Failed to fetch pending group memberships' }, { status: 500 })
    }
    
    // Build the query for discipleship memberships  
    let discipleshipQuery = supabase
      .from('discipleship_memberships')
      .select(`
        id,
        discipleship_group_id,
        contact_id,
        role,
        status,
        requested_at,
        rejection_reason,
        discipleship_groups (
          id,
          name,
          description
        ),
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
    
    // Filter by group_id if provided
    if (groupId) {
      discipleshipQuery = discipleshipQuery.eq('discipleship_group_id', groupId)
    }
    
    // Get pending discipleship memberships
    const { data: discipleshipMemberships, error: discipleshipError } = await discipleshipQuery
    
    if (discipleshipError) {
      console.error('❌ Error fetching pending discipleship memberships:', discipleshipError)
      return NextResponse.json({ error: 'Failed to fetch pending discipleship memberships' }, { status: 500 })
    }
    
    // Transform the data to a consistent format
    const transformedGroupMemberships = groupMemberships?.map(membership => ({
      id: `${membership.group_id}-${membership.contact_id}`, // Create composite key since group_memberships has no id column
      group_id: membership.group_id,
      group_name: (membership.groups as any)?.name || 'Unknown Group',
      group_type: (membership.groups as any)?.type || 'ministry',
      group_description: (membership.groups as any)?.description,
      contact_id: membership.contact_id,
      contact_name: `${(membership.contacts as any)?.first_name || ''} ${(membership.contacts as any)?.last_name || ''}`.trim(),
      contact_email: (membership.contacts as any)?.email,
      contact_phone: (membership.contacts as any)?.phone,
      role: membership.role,
      status: membership.status,
      requested_at: membership.requested_at,
      rejection_reason: membership.rejection_reason,
      table_source: 'group_memberships'
    })) || []
    
    const transformedDiscipleshipMemberships = discipleshipMemberships?.map(membership => ({
      id: membership.id,
      group_id: membership.discipleship_group_id,
      group_name: (membership.discipleship_groups as any)?.name || 'Unknown Group',
      group_type: 'discipleship',
      group_description: (membership.discipleship_groups as any)?.description,
      contact_id: membership.contact_id,
      contact_name: `${(membership.contacts as any)?.first_name || ''} ${(membership.contacts as any)?.last_name || ''}`.trim(),
      contact_email: (membership.contacts as any)?.email,
      contact_phone: (membership.contacts as any)?.phone,
      role: membership.role,
      status: membership.status,
      requested_at: membership.requested_at,
      rejection_reason: membership.rejection_reason,
      table_source: 'discipleship_memberships'
    })) || []
    
    // Combine and sort by requested_at
    const allPendingRequests = [...transformedGroupMemberships, ...transformedDiscipleshipMemberships]
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
    
    console.log('✅ Successfully fetched', allPendingRequests.length, 'pending membership requests')
    
    return NextResponse.json({ 
      requests: allPendingRequests,
      total: allPendingRequests.length
    })
    
  } catch (error) {
    console.error('💥 Error in GET /api/admin/group-membership-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Approve or reject a membership request
export async function POST(request: NextRequest) {
  try {
    const { membershipId, action, tableSource, rejectionReason, userId } = await request.json()
    
    console.log('📝 Processing membership request:', { membershipId, action, tableSource, userId })
    
    // Validate input
    if (!membershipId || !action || !tableSource || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 })
    }
    
    if (!['group_memberships', 'discipleship_memberships'].includes(tableSource)) {
      return NextResponse.json({ error: 'Invalid table source' }, { status: 400 })
    }
    
    // Get the user's profile to use as approved_by
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (userProfileError || !userProfile) {
      console.error('❌ Error getting user profile:', userProfileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }
    
    // Update the membership request
    const updateData = {
      status: action === 'approve' ? 'active' : 'rejected',
      approved_by: userProfile.id,
      approved_at: new Date().toISOString(),
      ...(action === 'reject' && rejectionReason && { rejection_reason: rejectionReason })
    }
    
    let updateResult
    if (tableSource === 'group_memberships') {
      // For group_memberships, use composite key (group_id-contact_id)
      // UUIDs are 36 characters long, so we can split based on that
      const groupId = membershipId.substring(0, 36)
      const contactId = membershipId.substring(37) // Skip the hyphen
      updateResult = await supabase
        .from('group_memberships')
        .update(updateData)
        .eq('group_id', groupId)
        .eq('contact_id', contactId)
        .eq('status', 'pending')
        .select()
        .single()
    } else {
      // For discipleship_memberships, use id column
      updateResult = await supabase
        .from('discipleship_memberships')
        .update(updateData)
        .eq('id', membershipId)
        .eq('status', 'pending')
        .select()
        .single()
    }
    
    if (updateResult.error) {
      console.error('❌ Error updating membership request:', updateResult.error)
      return NextResponse.json({ error: 'Failed to update membership request' }, { status: 500 })
    }
    
    if (!updateResult.data) {
      return NextResponse.json({ error: 'Membership request not found or already processed' }, { status: 404 })
    }
    
    console.log('✅ Successfully', action === 'approve' ? 'approved' : 'rejected', 'membership request:', updateResult.data)
    
    return NextResponse.json({ 
      success: true,
      message: `Membership request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      data: updateResult.data
    })
    
  } catch (error) {
    console.error('💥 Error in POST /api/admin/group-membership-requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 