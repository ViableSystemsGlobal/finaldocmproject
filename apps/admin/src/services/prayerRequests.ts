import { supabase } from '@/lib/supabase'
import { sendPrayerAssignmentNotification } from '@/services/notificationService';

export type PrayerRequest = {
  id: string;
  contact_id?: string;
  title: string;
  description: string;
  status: string;
  assigned_to?: string;
  submitted_at: string;
  response_notes?: string;
  source?: string; // 'manual', 'app', 'website'
  source_submission_id?: string; // Link to website_messages
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    lifecycle?: string; // Added lifecycle status
  };
  // For website submissions, we'll get the name from website_messages via source_submission_id
  website_message?: {
    name: string;
    email: string;
    phone?: string;
  };
};

export function fetchPrayerRequests(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  return supabase
    .from('prayer_requests')
    .select(`
      id, 
      title, 
      description,
      status, 
      submitted_at, 
      assigned_to,
      source,
      source_submission_id,
      contacts (
        id, 
        first_name, 
        last_name, 
        email,
        lifecycle
      )
    `, { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(offset, offset + limit - 1);
}

export function fetchPrayerRequest(id: string) {
  return supabase
    .from('prayer_requests')
    .select(`
      *, 
      contacts(id, first_name, last_name, email)
    `)
    .eq('id', id)
    .single();
}

export function createPrayerRequest(data: {
  contact_id?: string;
  title: string;
  description: string;
  status: string;
  assigned_to?: string;
  response_notes?: string;
  source?: string;
}) {
  return supabase.from('prayer_requests').insert({
    ...data,
    source: data.source || 'manual',
    submitted_at: new Date().toISOString()
  });
}

export function updatePrayerRequest(id: string, data: Partial<PrayerRequest>) {
  return supabase.from('prayer_requests').update(data).eq('id', id);
}

export function deletePrayerRequest(id: string) {
  return supabase.from('prayer_requests').delete().eq('id', id);
}

export function assignPrayerRequest(id: string, assignedTo: string | null) {
  const updateData: any = {
    assigned_to: assignedTo
  }
  
  // Only set status to in-prayer if actually assigning to someone
  if (assignedTo) {
    updateData.status = 'in-prayer'
  }
  
  return supabase
    .from('prayer_requests')
    .update(updateData)
    .eq('id', id);
}

/**
 * Assign prayer request with notification
 */
export async function assignPrayerRequestWithNotification(
  id: string, 
  assignedTo: string | null,
  options?: {
    sendNotification?: boolean;
    assignedByUserName?: string;
  }
) {
  try {
    console.log(`🙏 Assigning prayer request ${id} to user ${assignedTo}`)
    
    // First, update the prayer request
    const { error: updateError } = await assignPrayerRequest(id, assignedTo)
    
    if (updateError) {
      return { error: updateError }
    }

    // If notification is enabled and we have an assignee, send the notification
    if (options?.sendNotification && assignedTo) {
      try {
        // Get the prayer request details with submitter information
        const { data: prayerRequest, error: fetchError } = await supabase
          .from('prayer_requests')
          .select(`
            *,
            contacts(id, first_name, last_name, email, phone)
          `)
          .eq('id', id)
          .single()

        if (fetchError || !prayerRequest) {
          console.error('Failed to fetch prayer request for notification:', fetchError)
          return { error: updateError } // Return original success, just log notification failure
        }

        // Get submitter name
        const submitterName = prayerRequest.contacts?.first_name && prayerRequest.contacts?.last_name
          ? `${prayerRequest.contacts.first_name} ${prayerRequest.contacts.last_name}`
          : prayerRequest.contacts?.first_name || prayerRequest.name || 'Anonymous'

        // Send the notification
        const notificationResult = await sendPrayerAssignmentNotification(
          assignedTo,
          {
            id: prayerRequest.id,
            title: prayerRequest.title || prayerRequest.subject || 'Prayer Request',
            submitterName: submitterName,
            category: prayerRequest.category,
            message: prayerRequest.description || prayerRequest.message || '',
            isConfidential: prayerRequest.is_confidential || false,
            urgency: prayerRequest.urgency || 'normal'
          },
          options.assignedByUserName
        )

        if (!notificationResult.success) {
          console.error('Failed to send prayer assignment notification:', notificationResult.error)
          // Don't fail the assignment if notification fails, just log it
        } else {
          console.log('✅ Prayer assignment notification sent successfully')
        }
      } catch (notificationError) {
        console.error('Error sending prayer assignment notification:', notificationError)
        // Don't fail the assignment if notification fails, just log it
      }
    }

    return { error: updateError }
  } catch (error) {
    console.error('Error in assignPrayerRequestWithNotification:', error)
    return { error }
  }
}

/**
 * Get all users for assignment (with search support)
 */
export async function getAllUsers(searchQuery?: string) {
  try {
    console.log('🔍 Fetching all users for assignment...')
    
    // First try to get from users view (auth.users)
    let query = supabase
      .from('users')
      .select('id, email, raw_user_meta_data')

    const { data: authUsers, error: authError } = await query

    if (authError) {
      console.error('❌ Error fetching from users view:', authError)
      return { users: [], error: authError }
    }

    if (!authUsers || authUsers.length === 0) {
      console.warn('⚠️ No users found in auth.users table')
      return { users: [], error: null }
    }

    console.log(`✅ Found ${authUsers.length} users in auth.users`)

    // Try to get additional profile data from user_profiles
    let profileUsers: any[] = []
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, role')

      if (profileError) {
        console.warn('⚠️ Could not fetch user profiles:', profileError)
      } else {
        profileUsers = profiles || []
        console.log(`📋 Found ${profileUsers.length} user profiles`)
      }
    } catch (profileEx) {
      console.warn('⚠️ Exception getting user profiles:', profileEx)
    }

    // Merge the data
    const mergedUsers = authUsers.map(authUser => {
      const profile = profileUsers.find(p => p.user_id === authUser.id)
      const firstName = profile?.first_name || authUser.raw_user_meta_data?.first_name || authUser.raw_user_meta_data?.name
      const lastName = profile?.last_name || authUser.raw_user_meta_data?.last_name
      
      return {
        user_id: authUser.id,
        email: authUser.email || '',
        first_name: firstName || '',
        last_name: lastName || '',
        role: profile?.role || 'member',
        name: firstName && lastName 
          ? `${firstName} ${lastName}`
          : firstName || authUser.email || 'Unknown User'
      }
    })

    // Apply search filter if provided
    let filteredUsers = mergedUsers
    if (searchQuery && searchQuery.trim()) {
      const search = searchQuery.trim().toLowerCase()
      filteredUsers = mergedUsers.filter(user => 
        user.first_name?.toLowerCase().includes(search) ||
        user.last_name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.name?.toLowerCase().includes(search)
      )
    }

    // Sort by name
    filteredUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    console.log(`✅ Returning ${filteredUsers.length} users${searchQuery ? ` matching "${searchQuery}"` : ''}`)
    return { users: filteredUsers, error: null }
  } catch (error) {
    console.error('💥 Exception in getAllUsers:', error)
    return { users: [], error }
  }
}

/**
 * Get users by role for bulk assignment
 */
export async function getUsersByRole(roles: string[]) {
  try {
    console.log(`🔍 Fetching users with roles: ${roles.join(', ')}`)
    
    // First get all users from auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('id, email, raw_user_meta_data')

    if (authError) {
      console.error('❌ Error fetching from users view:', authError)
      return { users: [], error: authError }
    }

    if (!authUsers || authUsers.length === 0) {
      console.warn('⚠️ No users found in auth.users table')
      return { users: [], error: null }
    }

    // Try to get profile data from user_profiles
    let profileUsers: any[] = []
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, role')
        .in('role', roles)

      if (profileError) {
        console.warn('⚠️ Could not fetch user profiles:', profileError)
      } else {
        profileUsers = profiles || []
        console.log(`📋 Found ${profileUsers.length} user profiles with matching roles`)
      }
    } catch (profileEx) {
      console.warn('⚠️ Exception getting user profiles:', profileEx)
    }

    // If no profiles found with matching roles, return empty
    if (profileUsers.length === 0) {
      console.warn(`⚠️ No users found with roles: ${roles.join(', ')}`)
      return { users: [], error: null }
    }

    // Merge the data - only include users that have the matching roles
    const mergedUsers = profileUsers.map(profile => {
      const authUser = authUsers.find(au => au.id === profile.user_id)
      const firstName = profile.first_name || authUser?.raw_user_meta_data?.first_name || authUser?.raw_user_meta_data?.name
      const lastName = profile.last_name || authUser?.raw_user_meta_data?.last_name
      
      return {
        user_id: profile.user_id,
        email: authUser?.email || '',
        first_name: firstName || '',
        last_name: lastName || '',
        role: profile.role || 'member',
        name: firstName && lastName 
          ? `${firstName} ${lastName}`
          : firstName || authUser?.email || 'Unknown User'
      }
    })

    // Sort by name
    mergedUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    console.log(`✅ Found ${mergedUsers.length} users with roles: ${roles.join(', ')}`)
    return { users: mergedUsers, error: null }
  } catch (error) {
    console.error('💥 Exception in getUsersByRole:', error)
    return { users: [], error }
  }
}

/**
 * Bulk assign prayer requests to users by role
 */
export async function bulkAssignPrayerRequestsByRole(
  prayerRequestIds: string[],
  targetRoles: string[],
  options?: {
    sendNotifications?: boolean;
    assignedByUserName?: string;
    distributionMethod?: 'all' | 'round_robin'; // all = assign to all users, round_robin = distribute evenly
  }
) {
  try {
    console.log(`🙏 Bulk assigning ${prayerRequestIds.length} prayer requests to roles: ${targetRoles.join(', ')}`)
    
    const distributionMethod = options?.distributionMethod || 'all'
    
    // Get users with the specified roles
    const { users, error: usersError } = await getUsersByRole(targetRoles)
    
    if (usersError || users.length === 0) {
      return {
        success: false,
        error: `No users found with roles: ${targetRoles.join(', ')}`,
        assigned: 0,
        failed: prayerRequestIds.length
      }
    }

    console.log(`Found ${users.length} users to assign prayers to`)

    let assignedCount = 0
    let failedCount = 0
    const results = []

    // Get prayer request details for notifications
    const { data: prayerRequests, error: prayerError } = await supabase
      .from('prayer_requests')
      .select(`
        *,
        contacts(id, first_name, last_name, email, phone)
      `)
      .in('id', prayerRequestIds)

    if (prayerError) {
      console.error('Failed to fetch prayer requests:', prayerError)
      return {
        success: false,
        error: 'Failed to fetch prayer requests',
        assigned: 0,
        failed: prayerRequestIds.length
      }
    }

    // Process assignments based on distribution method
    if (distributionMethod === 'all') {
      // Assign each prayer to ALL users with the target roles
      for (const prayerRequest of prayerRequests || []) {
        for (const user of users) {
          try {
            console.log(`Assigning prayer ${prayerRequest.id} to user ${user.user_id}`)
            
            // Update assignment
            const { error: assignError } = await assignPrayerRequest(prayerRequest.id, user.user_id)
            
            if (assignError) {
              console.error(`Failed to assign prayer ${prayerRequest.id} to user ${user.user_id}:`, assignError)
              failedCount++
              continue
            }

            // Send notification if enabled
            if (options?.sendNotifications) {
              const submitterName = prayerRequest.contacts?.first_name && prayerRequest.contacts?.last_name
                ? `${prayerRequest.contacts.first_name} ${prayerRequest.contacts.last_name}`
                : prayerRequest.contacts?.first_name || prayerRequest.name || 'Anonymous'

              const notificationResult = await sendPrayerAssignmentNotification(
                user.user_id,
                {
                  id: prayerRequest.id,
                  title: prayerRequest.title || prayerRequest.subject || 'Prayer Request',
                  submitterName: submitterName,
                  category: prayerRequest.category,
                  message: prayerRequest.description || prayerRequest.message || '',
                  isConfidential: prayerRequest.is_confidential || false,
                  urgency: prayerRequest.urgency || 'normal'
                },
                options.assignedByUserName
              )

              if (!notificationResult.success) {
                console.warn(`Failed to send notification to ${user.email}:`, notificationResult.error)
              }
            }

            assignedCount++
            results.push({
              prayerId: prayerRequest.id,
              userId: user.user_id,
              userEmail: user.email,
              success: true
            })
          } catch (error) {
            console.error(`Exception assigning prayer ${prayerRequest.id} to user ${user.user_id}:`, error)
            failedCount++
            results.push({
              prayerId: prayerRequest.id,
              userId: user.user_id,
              userEmail: user.email,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
      }
    } else if (distributionMethod === 'round_robin') {
      // Distribute prayers evenly among users
      let userIndex = 0
      
      for (const prayerRequest of prayerRequests || []) {
        const user = users[userIndex % users.length]
        userIndex++
        
        try {
          console.log(`Assigning prayer ${prayerRequest.id} to user ${user.user_id} (round robin)`)
          
          // Update assignment
          const { error: assignError } = await assignPrayerRequest(prayerRequest.id, user.user_id)
          
          if (assignError) {
            console.error(`Failed to assign prayer ${prayerRequest.id} to user ${user.user_id}:`, assignError)
            failedCount++
            continue
          }

          // Send notification if enabled
          if (options?.sendNotifications) {
            const submitterName = prayerRequest.contacts?.first_name && prayerRequest.contacts?.last_name
              ? `${prayerRequest.contacts.first_name} ${prayerRequest.contacts.last_name}`
              : prayerRequest.contacts?.first_name || prayerRequest.name || 'Anonymous'

            const notificationResult = await sendPrayerAssignmentNotification(
              user.user_id,
              {
                id: prayerRequest.id,
                title: prayerRequest.title || prayerRequest.subject || 'Prayer Request',
                submitterName: submitterName,
                category: prayerRequest.category,
                message: prayerRequest.description || prayerRequest.message || '',
                isConfidential: prayerRequest.is_confidential || false,
                urgency: prayerRequest.urgency || 'normal'
              },
              options.assignedByUserName
            )

            if (!notificationResult.success) {
              console.warn(`Failed to send notification to ${user.email}:`, notificationResult.error)
            }
          }

          assignedCount++
          results.push({
            prayerId: prayerRequest.id,
            userId: user.user_id,
            userEmail: user.email,
            success: true
          })
        } catch (error) {
          console.error(`Exception assigning prayer ${prayerRequest.id} to user ${user.user_id}:`, error)
          failedCount++
          results.push({
            prayerId: prayerRequest.id,
            userId: user.user_id,
            userEmail: user.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    console.log(`✅ Bulk prayer assignment completed: ${assignedCount} assigned, ${failedCount} failed`)

    return {
      success: assignedCount > 0,
      assigned: assignedCount,
      failed: failedCount,
      totalRequests: prayerRequestIds.length,
      totalUsers: users.length,
      distributionMethod,
      results
    }
  } catch (error) {
    console.error('Exception in bulkAssignPrayerRequestsByRole:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      assigned: 0,
      failed: prayerRequestIds.length
    }
  }
}

/**
 * Assign prayer requests to multiple specific users
 */
export async function assignPrayerRequestsToUsers(
  prayerRequestIds: string[],
  userIds: string[],
  options?: {
    sendNotifications?: boolean;
    assignedByUserName?: string;
  }
) {
  try {
    console.log(`🙏 Assigning ${prayerRequestIds.length} prayer requests to ${userIds.length} specific users`)
    
    if (userIds.length === 0) {
      return {
        success: false,
        error: 'No users selected for assignment',
        assigned: 0,
        failed: prayerRequestIds.length
      }
    }

    let assignedCount = 0
    let failedCount = 0
    const results = []

    // Get prayer request details for notifications
    const { data: prayerRequests, error: prayerError } = await supabase
      .from('prayer_requests')
      .select(`
        *,
        contacts(id, first_name, last_name, email, phone)
      `)
      .in('id', prayerRequestIds)

    if (prayerError) {
      console.error('Failed to fetch prayer requests:', prayerError)
      return {
        success: false,
        error: 'Failed to fetch prayer requests',
        assigned: 0,
        failed: prayerRequestIds.length
      }
    }

    // Get user details for result reporting
    const { users: assignedUsers } = await getAllUsers()
    const userLookup = assignedUsers.reduce((acc, user) => {
      acc[user.user_id] = user
      return acc
    }, {} as Record<string, any>)

    // Assign each prayer to each selected user
    for (const prayerRequest of prayerRequests || []) {
      for (const userId of userIds) {
        try {
          console.log(`Assigning prayer ${prayerRequest.id} to user ${userId}`)
          
          // Update assignment
          const { error: assignError } = await assignPrayerRequest(prayerRequest.id, userId)
          
          if (assignError) {
            console.error(`Failed to assign prayer ${prayerRequest.id} to user ${userId}:`, assignError)
            failedCount++
            results.push({
              prayerId: prayerRequest.id,
              userId: userId,
              userEmail: userLookup[userId]?.email || 'Unknown',
              success: false,
              error: assignError.message || 'Assignment failed'
            })
            continue
          }

          // Send notification if enabled
          if (options?.sendNotifications) {
            const submitterName = prayerRequest.contacts?.first_name && prayerRequest.contacts?.last_name
              ? `${prayerRequest.contacts.first_name} ${prayerRequest.contacts.last_name}`
              : prayerRequest.contacts?.first_name || prayerRequest.name || 'Anonymous'

            const notificationResult = await sendPrayerAssignmentNotification(
              userId,
              {
                id: prayerRequest.id,
                title: prayerRequest.title || prayerRequest.subject || 'Prayer Request',
                submitterName: submitterName,
                category: prayerRequest.category,
                message: prayerRequest.description || prayerRequest.message || '',
                isConfidential: prayerRequest.is_confidential || false,
                urgency: prayerRequest.urgency || 'normal'
              },
              options.assignedByUserName
            )

            if (!notificationResult.success) {
              console.warn(`Failed to send notification to ${userLookup[userId]?.email}:`, notificationResult.error)
            }
          }

          assignedCount++
          results.push({
            prayerId: prayerRequest.id,
            userId: userId,
            userEmail: userLookup[userId]?.email || 'Unknown',
            userName: userLookup[userId]?.name || 'Unknown',
            success: true
          })
        } catch (error) {
          console.error(`Exception assigning prayer ${prayerRequest.id} to user ${userId}:`, error)
          failedCount++
          results.push({
            prayerId: prayerRequest.id,
            userId: userId,
            userEmail: userLookup[userId]?.email || 'Unknown',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    console.log(`✅ Multi-user prayer assignment completed: ${assignedCount} assigned, ${failedCount} failed`)

    return {
      success: assignedCount > 0,
      assigned: assignedCount,
      failed: failedCount,
      totalRequests: prayerRequestIds.length,
      totalUsers: userIds.length,
      results
    }
  } catch (error) {
    console.error('Exception in assignPrayerRequestsToUsers:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      assigned: 0,
      failed: prayerRequestIds.length
    }
  }
}

export function markPrayerRequestAnswered(id: string, responseNotes: string) {
  return supabase
    .from('prayer_requests')
    .update({
      status: 'answered',
      response_notes: responseNotes
    })
    .eq('id', id);
}

export async function getPrayerRequestMetrics() {
  try {
    // Get new requests
    const { count: newRequests, error: newError } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    if (newError) throw newError;

    // Get in-prayer requests
    const { count: inPrayerRequests, error: inPrayerError } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in-prayer');

    if (inPrayerError) throw inPrayerError;

    // Get answered requests
    const { count: answeredRequests, error: answeredError } = await supabase
      .from('prayer_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'answered');

    if (answeredError) throw answeredError;

    return {
      newRequests: newRequests || 0,
      inPrayerRequests: inPrayerRequests || 0,
      answeredRequests: answeredRequests || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching prayer request metrics:', error);
    return {
      newRequests: 0,
      inPrayerRequests: 0,
      answeredRequests: 0,
      error
    };
  }
}

// Helper function to get assigned users for prayer requests
export async function getAssignedUsersForPrayerRequests(prayerRequests: PrayerRequest[]) {
  const assignedUserIds = prayerRequests
    .map(request => request.assigned_to)
    .filter(Boolean) as string[];
  
  if (assignedUserIds.length === 0) {
    return {};
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, raw_user_meta_data')
    .in('id', assignedUserIds);

  if (error) {
    console.error('Error fetching assigned users:', error);
    return {};
  }

  // Create a lookup map
  const userMap: Record<string, any> = {};
  users?.forEach(user => {
    userMap[user.id] = user;
  });

  return userMap;
}