import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { getAdminApiUrl, getSupabaseConfig } from '../config/environment'

// Get actual Supabase configuration
const supabaseConfig = getSupabaseConfig()
const supabaseUrl = supabaseConfig.url
const supabaseAnonKey = supabaseConfig.anonKey

// Log environment variables for debugging
console.log('🔗 Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Auth helper functions
export const signUp = async (email: string, password: string, userData?: { first_name?: string; last_name?: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData || {},
      emailRedirectTo: undefined, // Disable email confirmation redirect
    }
  })
  
  return { user: data.user, error }
}

// Create a verified user account using admin API (bypasses signup restrictions)
export const createAdminVerifiedUser = async (email: string, password: string, userData?: { first_name?: string; last_name?: string; contactId?: string }) => {
  console.log('👤 Creating admin-verified user account for:', email)
  
  try {
    const adminUrl = getAdminApiUrl()
    
    // Create user via admin API (bypasses email signup restrictions)
    console.log('🔧 Creating user via admin API...')
    const response = await fetch(`${adminUrl}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        first_name: userData?.first_name,
        last_name: userData?.last_name,
        contactId: userData?.contactId
      }),
    })

    const createResult = await response.json()
    console.log('📡 Admin create user result:', createResult)

    if (!response.ok || !createResult.success) {
      console.error('❌ Admin user creation failed:', createResult.error)
      return { user: null, error: { message: createResult.error || 'Failed to create user' } }
    }

    console.log('✅ User created via admin API:', createResult.user.id)
    
    // Now try to sign in with the created user
    console.log('🔐 Attempting to sign in...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('❌ Sign-in after creation failed:', signInError)
      return { user: null, error: signInError }
    }

    console.log('✅ User created and signed in successfully')
    return { user: signInData.user, error: null }
    
  } catch (error) {
    console.error('❌ Error in createAdminVerifiedUser:', error)
    return { user: null, error: { message: error instanceof Error ? error.message : 'Unknown error' } }
  }
}

export const signIn = async (email: string, password: string) => {
  console.log('🔐 Attempting sign-in for:', email)
  
  // First try direct Supabase sign-in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  // If direct sign-in works, return it
  if (!error && data.user) {
    console.log('✅ Direct sign-in successful')
    return { user: data.user, session: data.session, error: null }
  }
  
  // If direct sign-in fails due to login restrictions, try admin API
  if (error && error.message.includes('logins are disabled')) {
    console.log('🔧 Direct login disabled, trying admin sign-in...')
    
    try {
      const adminUrl = getAdminApiUrl()
      const response = await fetch(`${adminUrl}/api/auth/sign-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password
        }),
      })

      const signInResult = await response.json()
      console.log('📡 Admin sign-in result:', signInResult)

      if (!response.ok || !signInResult.success) {
        console.error('❌ Admin sign-in failed:', signInResult.error)
        return { user: null, session: null, error: { message: signInResult.error || 'Sign-in failed' } }
      }

      console.log('✅ Admin sign-in successful')
      return { user: signInResult.user, session: signInResult.session, error: null }
      
    } catch (adminError) {
      console.error('❌ Admin sign-in error:', adminError)
      return { user: null, session: null, error: { message: 'Sign-in failed' } }
    }
  }
  
  // Return original error if not a login restriction issue
  console.error('❌ Sign-in failed:', error)
  return { user: null, session: null, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Data fetching functions
export const getSermons = async (limit?: number) => {
  console.log('🎯 Fetching sermons from database...')
  
  try {
    // Use the same query pattern as the web app API
    let query = supabase
      .from('sermons')
      .select('*')
      .eq('status', 'published')
      .order('sermon_date', { ascending: false })
    
    if (limit) {
      query = query.limit(limit)
      console.log(`📊 Limiting to ${limit} sermons`)
    }
    
    const { data: sermons, error } = await query
    
    if (error) {
      console.error('❌ Sermons query error:', error)
      return { data: null, error }
    }
    
    if (!sermons || sermons.length === 0) {
      console.log('📋 No published sermons found')
      return { data: [], error: null }
    }
    
    console.log('✅ Sermons query successful:', {
      count: sermons.length,
      sermons: sermons.map(s => ({ 
        title: s.title, 
        speaker: s.speaker,
        date: s.sermon_date,
        youtube_id: s.youtube_id 
      }))
    })
    
    // Transform sermons to mobile app format (same as web app API response)
    const transformedSermons = sermons.map(sermon => ({
      id: sermon.id,
      title: sermon.title,
      slug: sermon.slug,
      description: sermon.description || 'Join us for this powerful message.',
      speaker: sermon.speaker || 'Pastor',
      series: sermon.series,
      scripture_reference: sermon.scripture_reference,
      sermon_date: sermon.sermon_date,
      duration: sermon.duration,
      video_type: sermon.video_type || 'youtube',
      video_url: sermon.video_url,
      youtube_url: sermon.youtube_url,
      youtube_id: sermon.youtube_id,
      audio_url: sermon.audio_url,
      thumbnail_image: sermon.thumbnail_image || (sermon.youtube_id ? `https://img.youtube.com/vi/${sermon.youtube_id}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'),
      transcript: sermon.transcript,
      notes: sermon.notes,
      tags: sermon.tags || [],
      status: sermon.status,
      published_at: sermon.published_at,
      view_count: sermon.view_count || 0,
      seo_meta: sermon.seo_meta,
      created_at: sermon.created_at,
      updated_at: sermon.updated_at
    }))
    
    console.log('🔄 Transformed sermons for mobile app:', transformedSermons.map(s => ({
      title: s.title,
      speaker: s.speaker,
      sermon_date: s.sermon_date,
      has_thumbnail: !!s.thumbnail_image
    })))
    
    return { data: transformedSermons, error: null }
    
  } catch (error) {
    console.error('❌ Sermons fetch error:', error)
    return { data: null, error }
  }
}

export const getAllEventsDebug = async () => {
  console.log('🔍 Debug: Fetching ALL events from database...')
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Debug events query error:', error)
  } else {
    console.log('📋 Debug: All events in database:', {
      total: data?.length || 0,
      events: data?.map(e => ({ 
        title: e.title, 
        date: e.event_date, 
        status: e.status,
        created: e.created_at 
      })) || []
    })
  }
  
  return { data, error }
}

export const getEvents = async (limit?: number) => {
  console.log('🎯 Fetching events from database...')
  const today = new Date().toISOString()
  console.log('📅 Current time:', today)
  
  try {
    // Use the same query pattern as the web app API
    let query = supabase
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
    
    if (limit) {
      query = query.limit(limit)
      console.log(`📊 Limiting to ${limit} events`)
    }
    
    const { data: events, error: eventsError } = await query
    
    if (eventsError) {
      console.error('❌ Events query error:', eventsError)
      return { data: null, error: eventsError }
    }
    
    if (!events || events.length === 0) {
      console.log('📋 No upcoming events found')
      return { data: [], error: null }
    }
    
    console.log('✅ Events query successful:', {
      count: events.length,
      events: events.map(e => ({ name: e.name, date: e.event_date }))
    })
    
    // Fetch images for these events (same as web app)
    const eventIds = events.map(event => event.id)
    const { data: images } = await supabase
      .from('event_images')
      .select('*')
      .in('event_id', eventIds)
      .order('sort_order', { ascending: true })
    
    // Create image map
    const imageMap = new Map()
    if (images && images.length > 0) {
      const imagesByEvent = images.reduce((acc: any, img) => {
        if (!acc[img.event_id]) {
          acc[img.event_id] = []
        }
        acc[img.event_id].push(img)
        return acc
      }, {})
      
      Object.keys(imagesByEvent).forEach(eventId => {
        imageMap.set(eventId, imagesByEvent[eventId][0]) // First image as primary
      })
    }
    
    // Transform events to mobile app format (same as web app API)
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.name, // Map 'name' to 'title' for mobile app
      name: event.name,
      event_date: event.event_date,
      location: event.location || 'Location TBD',
      description: event.description || 'Join us for this special event.',
      capacity: event.capacity,
      image_url: imageMap.get(event.id)?.url || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=200&fit=crop',
      primary_image: imageMap.get(event.id) || null,
      type: getEventType(event.name, event.description)
    }))
    
    console.log('🔄 Transformed events for mobile app:', transformedEvents.map(e => ({
      title: e.title,
      event_date: e.event_date,
      location: e.location
    })))
    
    return { data: transformedEvents, error: null }
    
  } catch (error) {
    console.error('❌ Events fetch error:', error)
    return { data: null, error }
  }
}

// Helper function to categorize events (same as web app)
function getEventType(name: string, description: string | null): string {
  const content = (name + ' ' + (description || '')).toLowerCase()
  
  if (content.includes('worship') || content.includes('service') || content.includes('sunday')) return 'worship'
  if (content.includes('youth') || content.includes('teen') || content.includes('young')) return 'youth'
  if (content.includes('study') || content.includes('bible') || content.includes('prayer')) return 'study'
  if (content.includes('outreach') || content.includes('community') || content.includes('serve')) return 'outreach'
  if (content.includes('conference') || content.includes('seminar') || content.includes('retreat')) return 'conference'
  
  return 'event' // default
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}

export const getGroups = async () => {
  console.log('🎯 Fetching groups from database...')
  
  try {
    // Fetch groups with leader information
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        description,
        type,
        status,
        created_at,
        leader_id,
        contacts!leader_id (
          first_name,
          last_name
        )
      `)
      .eq('status', 'active')
      .order('name', { ascending: true })
    
    if (groupsError) {
      console.error('❌ Groups query error:', groupsError)
      return { data: null, error: groupsError }
    }
    
    if (!groups || groups.length === 0) {
      console.log('📋 No active groups found')
      return { data: [], error: null }
    }
    
    // Get member counts for each group
    const groupIds = groups.map(group => group.id)
    const { data: memberships } = await supabase
      .from('group_memberships')
      .select('group_id')
      .in('group_id', groupIds)
      .eq('status', 'active')
    
    // Create member count map
    const memberCountMap = new Map()
    if (memberships) {
      const countsByGroup = memberships.reduce((acc: any, membership) => {
        acc[membership.group_id] = (acc[membership.group_id] || 0) + 1
        return acc
      }, {})
      
      Object.keys(countsByGroup).forEach(groupId => {
        memberCountMap.set(groupId, countsByGroup[groupId])
      })
    }
    
    // Transform groups with member counts and leader names
    const transformedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      category: group.type, // Map type to category for UI
      type: group.type,
      status: group.status,
      created_at: group.created_at,
      leader_id: group.leader_id,
      leader_name: group.contacts && group.contacts.length > 0 
        ? `${group.contacts[0].first_name || ''} ${group.contacts[0].last_name || ''}`.trim()
        : null,
      member_count: memberCountMap.get(group.id) || 0,
      // Set defaults for missing fields
      meeting_day: null,
      meeting_time: null,
      location: null,
      capacity: null,
      image_url: null
    }))
    
    console.log('✅ Groups query successful:', {
      count: transformedGroups.length,
      groups: transformedGroups.map(g => ({ 
        name: g.name, 
        category: g.category,
        leader_name: g.leader_name,
        member_count: g.member_count
      }))
    })
    
    return { data: transformedGroups, error: null }
    
  } catch (error) {
    console.error('❌ Groups fetch error:', error)
    return { data: null, error }
  }
}

export const getDiscipleshipGroups = async () => {
  console.log('🎯 Fetching discipleship groups from database...')
  
  try {
    // Fetch discipleship groups with leader information
    const { data: groups, error: groupsError } = await supabase
      .from('discipleship_groups')
      .select(`
        id,
        name,
        description,
        age_group,
        curriculum,
        meeting_location,
        meeting_schedule,
        max_capacity,
        status,
        created_at,
        leader_id,
        contacts!leader_id (
          first_name,
          last_name
        )
      `)
      .eq('status', 'active')
      .order('name', { ascending: true })
    
    if (groupsError) {
      console.error('❌ Discipleship groups query error:', groupsError)
      return { data: null, error: groupsError }
    }
    
    if (!groups || groups.length === 0) {
      console.log('📋 No active discipleship groups found')
      return { data: [], error: null }
    }
    
    // Get member counts for each group
    const groupIds = groups.map(group => group.id)
    const { data: memberships } = await supabase
      .from('discipleship_memberships')
      .select('discipleship_group_id')
      .in('discipleship_group_id', groupIds)
      .eq('status', 'active')
    
    // Create member count map
    const memberCountMap = new Map()
    if (memberships) {
      const countsByGroup = memberships.reduce((acc: any, membership) => {
        acc[membership.discipleship_group_id] = (acc[membership.discipleship_group_id] || 0) + 1
        return acc
      }, {})
      
      Object.keys(countsByGroup).forEach(groupId => {
        memberCountMap.set(groupId, countsByGroup[groupId])
      })
    }
    
    // Transform discipleship groups with member counts and leader names
    const transformedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      category: 'discipleship', // Set category for UI consistency
      type: 'discipleship',
      status: group.status,
      created_at: group.created_at,
      leader_id: group.leader_id,
      leader_name: group.contacts && group.contacts.length > 0 
        ? `${group.contacts[0].first_name || ''} ${group.contacts[0].last_name || ''}`.trim()
        : null,
      member_count: memberCountMap.get(group.id) || 0,
      // Map discipleship-specific fields
      age_group: group.age_group,
      curriculum: group.curriculum,
      meeting_day: null, // Parse from meeting_schedule if needed
      meeting_time: null, // Parse from meeting_schedule if needed
      location: group.meeting_location,
      capacity: group.max_capacity,
      image_url: null,
      meeting_schedule: group.meeting_schedule
    }))
    
    console.log('✅ Discipleship groups query successful:', {
      count: transformedGroups.length,
      groups: transformedGroups.map(g => ({ 
        name: g.name, 
        age_group: g.age_group,
        leader_name: g.leader_name,
        member_count: g.member_count
      }))
    })
    
    return { data: transformedGroups, error: null }
    
  } catch (error) {
    console.error('❌ Discipleship groups fetch error:', error)
    return { data: null, error }
  }
}

// Utility function to ensure mobile app user record exists
export const ensureMobileAppUserRecord = async (userId: string, userEmail?: string) => {
  console.log('🔧 Ensuring mobile app user record exists for:', userId)
  
  try {
    // First check if record already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('mobile_app_users')
      .select('id, contact_id')
      .eq('auth_user_id', userId)
      .single()
    
    if (existingUser && !checkError) {
      console.log('✅ Mobile app user record already exists:', existingUser.id)
      return { data: existingUser, error: null }
    }
    
    console.log('📝 Creating missing mobile app user record...')
    
    // Try to find or create a contact record
    let contactId = null
    
    if (userEmail) {
      // Try to find existing contact by email
      const { data: existingContact, error: contactError } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', userEmail)
        .single()
      
      if (existingContact && !contactError) {
        contactId = existingContact.id
        console.log('🔗 Found existing contact by email:', contactId)
      } else {
        // Create new contact record
        const { data: newContact, error: createContactError } = await supabase
          .from('contacts')
          .insert({
            email: userEmail,
            source: 'mobile_app',
            first_name: 'Mobile',
            last_name: 'User'
          })
          .select('id')
          .single()
        
        if (newContact && !createContactError) {
          contactId = newContact.id
          console.log('✅ Created new contact record:', contactId)
        } else {
          console.warn('⚠️ Could not create contact record:', createContactError)
        }
      }
    }
    
    // Create mobile app user record
    const { data: newMobileUser, error: createError } = await supabase
      .from('mobile_app_users')
      .insert({
        auth_user_id: userId,
        contact_id: contactId,
        status: 'active',
        devices: [],
        registered_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      })
      .select('id, contact_id')
      .single()
    
    if (createError) {
      console.error('❌ Failed to create mobile app user record:', createError)
      return { data: null, error: createError }
    }
    
    console.log('✅ Created mobile app user record:', newMobileUser.id)
    return { data: newMobileUser, error: null }
    
  } catch (error) {
    console.error('❌ Exception in ensureMobileAppUserRecord:', error)
    return { data: null, error }
  }
}

// Enhanced contact lookup function with auto-creation
export const getContactIdForUser = async (userId: string, userEmail?: string) => {
  console.log('🔍 Getting contact ID for user:', userId)
  
  try {
    // First, try to get contact_id from mobile_app_users table
    const { data: mobileUser, error: mobileUserError } = await supabase
      .from('mobile_app_users')
      .select('contact_id')
      .eq('auth_user_id', userId)
      .single()
    
    if (mobileUser && mobileUser.contact_id && !mobileUserError) {
      console.log('✅ Found contact ID from mobile_app_users:', mobileUser.contact_id)
      return { contactId: mobileUser.contact_id, error: null }
    }
    
    console.log('⚠️ No mobile app user record found, attempting to create...')
    
    // Try to create missing mobile app user record
    const createResult = await ensureMobileAppUserRecord(userId, userEmail)
    
    if (createResult.data && createResult.data.contact_id) {
      console.log('✅ Created mobile app user record with contact ID:', createResult.data.contact_id)
      return { contactId: createResult.data.contact_id, error: null }
    }
    
    // If still no contact_id, try direct contact lookup as final fallback
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (contact && !contactError) {
      console.log('✅ Found contact via direct lookup:', contact.id)
      return { contactId: contact.id, error: null }
    }
    
    console.log('❌ No contact found for user after all attempts')
    return { contactId: null, error: { message: 'No contact record found. Please contact support to complete your profile setup.' } }
    
  } catch (error) {
    console.error('❌ Exception in getContactIdForUser:', error)
    return { contactId: null, error }
  }
}

export const joinDiscipleshipGroup = async (groupId: string, userId: string) => {
  console.log('🎯 Joining discipleship group:', { groupId, userId })
  
  try {
    // Get current user to access email
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email
    
    // Get contact ID with auto-creation if needed
    const { contactId, error: contactError } = await getContactIdForUser(userId, userEmail)
    
    if (contactError || !contactId) {
      console.error('❌ No contact found for user:', { userId, contactError })
      return { data: null, error: contactError || { message: 'User contact not found. Please contact support.' } }
    }
    
    console.log('📱 Using contact ID:', contactId)
    
    // Check if user already has a membership request (pending, active, or rejected)
    const { data: existingMembership } = await supabase
      .from('discipleship_memberships')
      .select('*')
      .eq('discipleship_group_id', groupId)
      .eq('contact_id', contactId)
      .single()
    
    if (existingMembership) {
      if (existingMembership.status === 'active') {
        console.log('⚠️ User already member of discipleship group')
        return { data: null, error: { message: 'Already a member of this discipleship group' } }
      } else if (existingMembership.status === 'pending') {
        console.log('⚠️ User already has pending request for discipleship group')
        return { data: null, error: { message: 'Your request to join this discipleship group is pending approval' } }
      } else if (existingMembership.status === 'rejected') {
        console.log('⚠️ User has rejected membership, updating to pending')
        // Allow user to reapply after rejection
        const { data: updatedMembership, error: updateError } = await supabase
          .from('discipleship_memberships')
          .update({
            status: 'pending',
            requested_at: new Date().toISOString(),
            rejection_reason: null
          })
          .eq('id', existingMembership.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('❌ Error updating discipleship membership request:', updateError)
          return { data: null, error: updateError }
        }
        
        console.log('✅ Successfully updated discipleship membership request to pending:', updatedMembership)
        return { data: updatedMembership, error: null }
      }
    }
    
    // Create new membership request with pending status
    const { data, error } = await supabase
      .from('discipleship_memberships')
      .insert([{
        discipleship_group_id: groupId,
        contact_id: contactId,
        joined_at: new Date().toISOString(),
        requested_at: new Date().toISOString(),
        status: 'pending',
        role: 'mentee'
      }])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error joining discipleship group:', error)
      return { data: null, error }
    }
    
    console.log('✅ Successfully submitted discipleship group membership request:', data)
    return { data, error: null }
    
  } catch (error) {
    console.error('❌ Exception joining discipleship group:', error)
    return { data: null, error }
  }
}

// Function to get user's membership status for a group
export const getGroupMembershipStatus = async (groupId: string, userId: string) => {
  console.log('🔍 Getting group membership status:', { groupId, userId })
  
  try {
    // Get current user to access email
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email
    
    // Get contact ID with auto-creation if needed
    const { contactId, error: contactError } = await getContactIdForUser(userId, userEmail)
    
    if (contactError || !contactId) {
      console.log('❌ No contact found for user:', { userId, contactError })
      return { status: 'none', error: null }
    }
    
    // Check membership status
    const { data: membership, error } = await supabase
      .from('group_memberships')
      .select('status, requested_at, approved_at, rejection_reason')
      .eq('group_id', groupId)
      .eq('contact_id', contactId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Error checking group membership status:', error)
      return { status: 'none', error }
    }
    
    const status = membership ? membership.status : 'none'
    console.log('✅ Group membership status:', { status, contactId, membership })
    return { status, membership, error: null }
    
  } catch (error) {
    console.error('❌ Exception checking group membership status:', error)
    return { status: 'none', error }
  }
}

// Function to get user's membership status for a discipleship group
export const getDiscipleshipGroupMembershipStatus = async (groupId: string, userId: string) => {
  console.log('🔍 Getting discipleship group membership status:', { groupId, userId })
  
  try {
    // Get current user to access email
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email
    
    // Get contact ID with auto-creation if needed
    const { contactId, error: contactError } = await getContactIdForUser(userId, userEmail)
    
    if (contactError || !contactId) {
      console.log('❌ No contact found for user:', { userId, contactError })
      return { status: 'none', error: null }
    }
    
    // Check membership status
    const { data: membership, error } = await supabase
      .from('discipleship_memberships')
      .select('status, requested_at, approved_at, rejection_reason')
      .eq('discipleship_group_id', groupId)
      .eq('contact_id', contactId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Error checking discipleship group membership status:', error)
      return { status: 'none', error }
    }
    
    const status = membership ? membership.status : 'none'
    console.log('✅ Discipleship group membership status:', { status, contactId, membership })
    return { status, membership, error: null }
    
  } catch (error) {
    console.error('❌ Exception checking discipleship group membership status:', error)
    return { status: 'none', error }
  }
}

// Update the existing isUserInGroup function to only check for active status
export const isUserInGroup = async (groupId: string, userId: string) => {
  console.log('🔍 Checking group membership:', { groupId, userId })
  
  try {
    const { status, error } = await getGroupMembershipStatus(groupId, userId)
    
    if (error) {
      console.error('❌ Error checking group membership:', error)
      return { isMember: false, error }
    }
    
    const isMember = status === 'active'
    console.log('✅ Group membership check result:', { isMember, status })
    return { isMember, error: null }
    
  } catch (error) {
    console.error('❌ Exception checking group membership:', error)
    return { isMember: false, error }
  }
}

// Update the existing isUserInDiscipleshipGroup function to only check for active status
export const isUserInDiscipleshipGroup = async (groupId: string, userId: string) => {
  console.log('🔍 Checking discipleship group membership:', { groupId, userId })
  
  try {
    const { status, error } = await getDiscipleshipGroupMembershipStatus(groupId, userId)
    
    if (error) {
      console.error('❌ Error checking discipleship group membership:', error)
      return { isMember: false, error }
    }
    
    const isMember = status === 'active'
    console.log('✅ Discipleship group membership check result:', { isMember, status })
    return { isMember, error: null }
    
  } catch (error) {
    console.error('❌ Exception checking discipleship group membership:', error)
    return { isMember: false, error }
  }
}

// Function to check if user is registered for an event
export const isUserRegisteredForEvent = async (eventId: string, userId: string) => {
  console.log('🔍 Checking event registration:', { eventId, userId })
  
  try {
    // Get current user to access email
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email
    
    // Get contact ID with auto-creation if needed
    const { contactId, error: contactError } = await getContactIdForUser(userId, userEmail)
    
    if (contactError || !contactId) {
      console.log('⚠️ No mobile app user record or contact_id found for registration check:', { userId, contactError })
      // If user doesn't have a contact_id, they can't be registered (since registrations require valid contact_id)
      return { isRegistered: false, error: null }
    }

    console.log('🔗 Using contact_id for registration check:', contactId)
    
    // Check if user is registered
    const { data: registration, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('contact_id', contactId)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Error checking event registration:', error)
      return { isRegistered: false, error }
    }
    
    const isRegistered = !!registration
    console.log('✅ Event registration check result:', { isRegistered, contactId, eventId })
    return { isRegistered, error: null }
    
  } catch (error) {
    console.error('❌ Exception checking event registration:', error)
    return { isRegistered: false, error }
  }
}

export const joinGroup = async (groupId: string, userId: string) => {
  console.log('🎯 Joining group:', { groupId, userId })
  
  try {
    // Get current user to access email
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = user?.email
    
    // Get contact ID with auto-creation if needed
    const { contactId, error: contactError } = await getContactIdForUser(userId, userEmail)
    
    if (contactError || !contactId) {
      console.error('❌ No contact found for user:', { userId, contactError })
      return { data: null, error: contactError || { message: 'User contact not found. Please contact support.' } }
    }
    
    console.log('📱 Using contact ID:', contactId)
    
    // Check if user already has a membership request (pending, active, or rejected)
    const { data: existingMembership } = await supabase
      .from('group_memberships')
      .select('*')
      .eq('group_id', groupId)
      .eq('contact_id', contactId)
      .single()
    
    if (existingMembership) {
      if (existingMembership.status === 'active') {
        console.log('⚠️ User already member of group')
        return { data: null, error: { message: 'Already a member of this group' } }
      } else if (existingMembership.status === 'pending') {
        console.log('⚠️ User already has pending request for group')
        return { data: null, error: { message: 'Your request to join this group is pending approval' } }
      } else if (existingMembership.status === 'rejected') {
        console.log('⚠️ User has rejected membership, updating to pending')
        // Allow user to reapply after rejection
        const { data: updatedMembership, error: updateError } = await supabase
          .from('group_memberships')
          .update({
            status: 'pending',
            requested_at: new Date().toISOString(),
            rejection_reason: null
          })
          .eq('id', existingMembership.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('❌ Error updating membership request:', updateError)
          return { data: null, error: updateError }
        }
        
        console.log('✅ Successfully updated membership request to pending:', updatedMembership)
        return { data: updatedMembership, error: null }
      }
    }
    
    // Create new membership request with pending status
    const { data, error } = await supabase
      .from('group_memberships')
      .insert([{
        group_id: groupId,
        contact_id: contactId,
        joined_at: new Date().toISOString(),
        requested_at: new Date().toISOString(),
        status: 'pending',
        role: 'member'
      }])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error joining group:', error)
      return { data: null, error }
    }
    
    console.log('✅ Successfully submitted group membership request:', data)
    return { data, error: null }
    
  } catch (error) {
    console.error('❌ Exception joining group:', error)
    return { data: null, error }
  }
}

// Function to submit a prayer request
export const submitPrayerRequest = async (prayerData: {
  title: string
  description: string
  category: string
  isPrivate: boolean
}, userId: string) => {
  console.log('🙏 Submitting prayer request:', { prayerData, userId })
  
  try {
    // First, get the contact_id for this user from mobile_app_users table
    const { data: mobileUser, error: mobileUserError } = await supabase
      .from('mobile_app_users')
      .select('contact_id')
      .eq('auth_user_id', userId)
      .single()

    let contactId = null

    if (mobileUser?.contact_id) {
      contactId = mobileUser.contact_id
      console.log('🔗 Using contact_id for prayer request:', contactId)
    } else {
      console.log('⚠️ No contact_id found for user, submitting without contact link:', { userId, mobileUserError })
      // We'll still allow the prayer request but without a contact_id link
    }
    
    // Create prayer request
    const { data, error } = await supabase
      .from('prayer_requests')
      .insert([{
        contact_id: contactId,
        title: prayerData.title,
        description: `${prayerData.description}${prayerData.isPrivate ? '\n\n[PRIVATE REQUEST - Pastoral care only]' : ''}`,
        status: 'new',
        source: 'app',
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error submitting prayer request:', error)
      return { data: null, error }
    }
    
    console.log('✅ Successfully submitted prayer request:', data)
    return { data, error: null }
    
  } catch (error) {
    console.error('❌ Exception submitting prayer request:', error)
    return { data: null, error }
  }
} 