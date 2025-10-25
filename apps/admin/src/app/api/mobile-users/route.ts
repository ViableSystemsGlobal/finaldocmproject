import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('📱 Getting mobile app users...')

    // Get all mobile app users with their devices and push tokens
    const { data: mobileUsers, error } = await supabaseAdmin
      .from('mobile_app_users')
      .select(`
        id,
        auth_user_id,
        contact_id,
        devices,
        status,
        last_active,
        registered_at,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error getting mobile users:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Get contact information separately for users that have contact_id
    const userContactIds = mobileUsers?.filter(u => u.contact_id).map(u => u.contact_id) || []
    let contactsMap = new Map()
    
    if (userContactIds.length > 0) {
      const { data: contacts } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .in('id', userContactIds)
      
      if (contacts) {
        contacts.forEach(contact => {
          contactsMap.set(contact.id, contact)
        })
      }
    }

    console.log(`✅ Found ${mobileUsers?.length || 0} mobile users`)

    // Add some computed fields for the UI
    const usersWithExtras = (mobileUsers || []).map(user => {
      // Extract push tokens from devices array
      const devices = Array.isArray(user.devices) ? user.devices : []
      const pushTokens = devices.filter(device => device.push_token).map(device => device.push_token)
      
      // Get contact info if available from the contacts map
      const contact = user.contact_id ? contactsMap.get(user.contact_id) : null
      const fullName = contact ? 
        `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : 
        `User ${user.auth_user_id?.slice(-8) || user.id.slice(-8)}`
      
      const displayEmail = contact?.email || 'No email linked'
      
      return {
        ...user,
        has_push_token: pushTokens.length > 0,
        push_token: pushTokens[0] || null, // For backward compatibility
        push_tokens: pushTokens,
        device_count: devices.length,
        full_name: fullName,
        display_email: displayEmail,
        is_active: user.status === 'active',
        last_seen: user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'
      }
    })

    return NextResponse.json({
      success: true,
      data: usersWithExtras,
      total: usersWithExtras.length,
      withTokens: usersWithExtras.filter(u => u.has_push_token).length,
      withoutTokens: usersWithExtras.filter(u => !u.has_push_token).length
    })

  } catch (error) {
    console.error('❌ Error in mobile users API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, userId, ...data } = await request.json()

    switch (action) {
      case 'create':
        return await createMobileUser(data)
      case 'update':
        return await updateMobileUser(userId, data)
      case 'delete':
        return await deleteMobileUser(userId)
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Error in mobile users POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createMobileUser(data: any) {
  const { error } = await supabaseAdmin
    .from('mobile_app_users')
    .insert(data)

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

async function updateMobileUser(userId: string, data: any) {
  const { error } = await supabaseAdmin
    .from('mobile_app_users')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', userId)

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

async function deleteMobileUser(userId: string) {
  const { error } = await supabaseAdmin
    .from('mobile_app_users')
    .delete()
    .eq('auth_user_id', userId)

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
} 