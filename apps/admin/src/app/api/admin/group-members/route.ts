import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'

// GET - Get active members of a specific group
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('group_id')
    const includeUserProfiles = searchParams.get('include_user_profiles') === 'true'
    
    if (!groupId) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 })
    }

    console.log('📝 Getting active group members for group:', groupId)
    
    // Get regular group members
    const { data: groupMembers, error: groupError } = await supabase
      .from('group_memberships')
      .select(`
        group_id,
        contact_id,
        role,
        status,
        joined_at,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (groupError) {
      console.error('❌ Error fetching group members:', groupError)
      return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 })
    }

    // Get discipleship group members
    const { data: discipleshipMembers, error: discipleshipError } = await supabase
      .from('discipleship_memberships')
      .select(`
        discipleship_group_id,
        contact_id,
        role,
        status,
        joined_at,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('discipleship_group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })

    if (discipleshipError) {
      console.error('❌ Error fetching discipleship members:', discipleshipError)
      return NextResponse.json({ error: 'Failed to fetch discipleship members' }, { status: 500 })
    }

    // Transform the data to a consistent format
    const allMembers = [
      ...(groupMembers || []).map(member => ({
        id: member.contact_id,
        contact_id: member.contact_id,
        group_id: member.group_id,
        role: member.role,
        status: member.status,
        joined_at: member.joined_at,
        first_name: (member.contacts as any)?.first_name || '',
        last_name: (member.contacts as any)?.last_name || '',
        email: (member.contacts as any)?.email || '',
        phone: (member.contacts as any)?.phone || '',
        full_name: `${(member.contacts as any)?.first_name || ''} ${(member.contacts as any)?.last_name || ''}`.trim(),
        table_source: 'group_memberships',
        user_id: undefined as string | undefined,
        has_user_account: false
      })),
      ...(discipleshipMembers || []).map(member => ({
        id: member.contact_id,
        contact_id: member.contact_id,
        group_id: member.discipleship_group_id,
        role: member.role,
        status: member.status,
        joined_at: member.joined_at,
        first_name: (member.contacts as any)?.first_name || '',
        last_name: (member.contacts as any)?.last_name || '',
        email: (member.contacts as any)?.email || '',
        phone: (member.contacts as any)?.phone || '',
        full_name: `${(member.contacts as any)?.first_name || ''} ${(member.contacts as any)?.last_name || ''}`.trim(),
        table_source: 'discipleship_memberships',
        user_id: undefined as string | undefined,
        has_user_account: false
      }))
    ]

    // If user profiles are requested, get the user profile info for members with user accounts
    if (includeUserProfiles && allMembers.length > 0) {
      const contactIds = allMembers.map(m => m.contact_id)
      
      // Get user_profiles for these contacts
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, user_id, first_name, last_name, email, phone')
        .in('id', contactIds)

      if (!profileError && userProfiles) {
        // Create a map of contact_id -> user_profile
        const profileMap = new Map(userProfiles.map(p => [p.id, p]))
        
        // Add user profile info to members
        allMembers.forEach(member => {
          const profile = profileMap.get(member.contact_id)
          if (profile) {
            member.user_id = profile.user_id
            member.has_user_account = true
          } else {
            member.has_user_account = false
          }
        })
      }
    }

    // Remove duplicates (in case someone is in both regular and discipleship groups)
    const uniqueMembers = allMembers.filter((member, index, self) => 
      index === self.findIndex(m => m.contact_id === member.contact_id)
    )

    console.log('✅ Successfully fetched', uniqueMembers.length, 'group members')
    
    return NextResponse.json({ 
      members: uniqueMembers,
      total: uniqueMembers.length
    })
    
  } catch (error) {
    console.error('💥 Error in GET /api/admin/group-members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 