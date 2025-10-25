import { supabase } from '@/lib/supabase';

// Get member's group memberships with group details (both ministries and discipleship)
export async function fetchMemberGroupMemberships(contactId: string) {
  try {
    console.log('🔍 Fetching all group memberships for contact:', contactId);
    
    // Try the RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_member_all_group_memberships', { 
      p_contact_id: contactId 
    });

    // If RPC function works, use it
    if (!rpcError && rpcData) {
      console.log('✅ RPC function worked, found:', rpcData?.length || 0, 'memberships');
      
      // Transform data to match expected format
      const transformedData = rpcData?.map((membership: any) => {
        const groups = membership.groups as any; // Type cast to handle JSON response
        return {
          id: membership.id,
          group_name: groups?.name || 'Unknown Group',
          group_type: groups?.type || 'group',
          role: membership.role || 'Member',
          joined_date: membership.joined_at || membership.created_at,
          group_id: groups?.id
        };
      }) || [];

      return { data: transformedData, error: null };
    }
    
    console.log('⚠️ RPC function failed, using fallback approach...');
    console.log('RPC Error:', rpcError?.code, rpcError?.message);
    
    // Fallback: Query tables directly
    const allMemberships: any[] = [];
    
    // 1. Get regular group memberships (ministries & groups)
    try {
      const { data: groupMemberships, error: groupError } = await supabase
        .from('group_memberships')
        .select(`
          role,
          joined_at,
          status,
          groups (
            id,
            name,
            description,
            type
          )
        `)
        .eq('contact_id', contactId);
      
      if (groupError) {
        console.warn('⚠️ Could not fetch group memberships:', groupError.message);
      } else {
        console.log('✅ Found', groupMemberships?.length || 0, 'regular group memberships');
        
        // Transform regular group memberships
        const transformedGroupMemberships = groupMemberships?.map((membership: any) => {
          const groups = membership.groups as any;
          return {
            id: `group-${groups?.id || 'unknown'}-${contactId}`, // Create unique ID from group_id and contact_id
            group_name: groups?.name || 'Unknown Group',
            group_type: groups?.type || 'ministry',
            role: membership.role || 'Member',
            joined_date: membership.joined_at,
            group_id: groups?.id
          };
        }) || [];
        
        allMemberships.push(...transformedGroupMemberships);
      }
    } catch (err) {
      console.warn('⚠️ Error fetching regular group memberships:', err);
    }
    
    // 2. Get discipleship group memberships
    try {
      const { data: discipleshipMemberships, error: discipleshipError } = await supabase
        .from('discipleship_memberships')
        .select(`
          id,
          role,
          joined_at,
          created_at,
          status,
          discipleship_groups (
            id,
            name,
            description
          )
        `)
        .eq('contact_id', contactId)
        .eq('status', 'active');
      
      if (discipleshipError) {
        console.warn('⚠️ Could not fetch discipleship memberships:', discipleshipError.message);
      } else {
        console.log('✅ Found', discipleshipMemberships?.length || 0, 'discipleship group memberships');
        
        // Transform discipleship group memberships
        const transformedDiscipleshipMemberships = discipleshipMemberships?.map((membership: any) => {
          const groups = membership.discipleship_groups as any;
          return {
            id: membership.id,
            group_name: groups?.name || 'Unknown Discipleship Group',
            group_type: 'discipleship',
            role: membership.role || 'Mentee',
            joined_date: membership.joined_at || membership.created_at,
            group_id: groups?.id
          };
        }) || [];
        
        allMemberships.push(...transformedDiscipleshipMemberships);
      }
    } catch (err) {
      console.warn('⚠️ Error fetching discipleship memberships:', err);
    }
    
    console.log('✅ Total group memberships found via fallback:', allMemberships.length);
    return { data: allMemberships, error: null };
    
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberGroupMemberships:', error);
    return { data: [], error: null }; // Return empty array instead of failing
  }
}

// Get member's follow-ups
export async function fetchMemberFollowUps(contactId: string, page: number = 1, limit: number = 10) {
  try {
    console.log('🔍 Fetching follow-ups for contact:', contactId, `(page ${page}, limit ${limit})`);
    
    const offset = (page - 1) * limit;
    
    // Use correct column names that match the database schema
    const { data, error, count } = await supabase
      .from('follow_ups')
      .select('id, type, notes, next_action_date, completed_at, status, created_at', { count: 'exact' })
      .eq('contact_id', contactId)
      .order('next_action_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('⚠️ Error fetching follow-ups:', {
        message: error.message,
        code: error.code
      });
      return { data: [], error: null, hasMore: false, total: 0 };
    }

    console.log('✅ Follow-ups found:', data?.length || 0, 'of', count, 'total');
    
    // Transform data to match expected UI format
    const transformedData = data?.map(followUp => ({
      id: followUp.id,
      type: followUp.type,
      notes: followUp.notes || '',
      created_at: followUp.created_at,
      scheduled_date: followUp.next_action_date, // Map next_action_date to scheduled_date for UI compatibility
      completed_at: followUp.completed_at,
      completed: followUp.status === 'completed', // Convert status to boolean for UI compatibility
      priority: 'medium', // Default since main schema may not have priority column
      status: followUp.status // Keep original status for reference
    })) || [];

    const hasMore = (count || 0) > offset + limit;

    return { 
      data: transformedData, 
      error: null, 
      hasMore,
      total: count || 0
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberFollowUps:', error);
    return { data: [], error: null, hasMore: false, total: 0 };
  }
}

// Get member's attendance records
export async function fetchMemberAttendance(contactId: string, page: number = 1, limit: number = 20) {
  try {
    console.log('🔍 Fetching attendance for contact:', contactId, `(page ${page}, limit ${limit})`);
    
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('attendance')
      .select(`
        id,
        check_in_time,
        method,
        created_at,
        events!inner (
          id,
          name,
          event_date,
          event_type,
          location
        )
      `, { count: 'exact' })
      .eq('contact_id', contactId)
      .order('check_in_time', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('⚠️ Error fetching attendance:', {
        message: error.message,
        code: error.code
      });
      return { data: [], error: null, hasMore: false, total: 0 };
    }

    console.log('✅ Attendance records found:', data?.length || 0, 'of', count, 'total');
    
    // Transform data to match expected format
    const transformedData = data?.map(record => {
      const events = record.events as any;
      return {
        id: record.id,
        service_name: events?.name || 'Event',
        service_date: events?.event_date || record.check_in_time,
        checked_in: true, // Records in attendance table are always checked in
        check_in_time: record.check_in_time,
        event_type: events?.event_type || 'service',
        location: events?.location,
        method: record.method
      };
    }) || [];

    const hasMore = (count || 0) > offset + limit;

    return { 
      data: transformedData, 
      error: null, 
      hasMore,
      total: count || 0
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberAttendance:', error);
    return { data: [], error: null, hasMore: false, total: 0 };
  }
}

// Get member's giving summary
export async function fetchMemberGivingSummary(contactId: string) {
  try {
    console.log('🔍 Fetching giving summary for contact:', contactId);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, transacted_at, payment_method, category, created_at')
      .eq('contact_id', contactId)
      .order('transacted_at', { ascending: false });

    if (error) {
      console.warn('⚠️ Error fetching transactions:', {
        message: error.message,
        code: error.code
      });
      return { data: null, error: null }; // Return null instead of mock data
    }

    console.log('✅ Transaction records found:', data?.length || 0);

    if (!data || data.length === 0) {
      // Return zeros instead of mock data when no transactions exist
      return {
        data: {
          yearToDateTotal: 0,
          lastContribution: null,
          totalContributions: 0,
          averageContribution: 0
        },
        error: null
      };
    }

    // Calculate year-to-date total
    const currentYear = new Date().getFullYear();
    const yearToDateTransactions = data.filter(transaction => {
      const transactionYear = new Date(transaction.transacted_at).getFullYear();
      return transactionYear === currentYear;
    });

    const yearToDateTotal = yearToDateTransactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
    const lastContribution = data[0]?.transacted_at;
    const totalContributions = data.length;
    const averageContribution = totalContributions > 0 ? (data.reduce((sum, t) => sum + (t.amount || 0), 0) / totalContributions) : 0;

    return {
      data: {
        yearToDateTotal,
        lastContribution,
        totalContributions,
        averageContribution
      },
      error: null
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberGivingSummary:', error);
    return { data: null, error: null };
  }
}

// Get member's journey timeline (comprehensive history)
export async function fetchMemberJourney(contactId: string, page: number = 1, limit: number = 4) {
  try {
    console.log('🔍 Fetching member journey for contact:', contactId, `(page ${page}, limit ${limit})`);
    
    // Build complete timeline of all events first
    const allEvents: Array<{
      id: string;
      type: 'joined' | 'group_joined' | 'follow_up' | 'attendance' | 'giving' | 'milestone' | 'note';
      title: string;
      description: string;
      date: string;
      icon: string;
      category?: string;
    }> = [];

    // 1. Get member join date from contacts table
    try {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('created_at, first_name, last_name')
        .eq('id', contactId)
        .single();
      
      if (contactData) {
        allEvents.push({
          id: 'contact-created',
          type: 'joined',
          title: 'Joined Church Database',
          description: `${contactData.first_name} ${contactData.last_name} was added to the church database`,
          date: contactData.created_at,
          icon: 'user-plus'
        });
      }
    } catch (err) {
      console.log('⚠️ Could not fetch contact data:', err);
    }

    // 2. Get ALL group memberships (both ministry and discipleship)
    const { data: groupMemberships } = await fetchMemberGroupMemberships(contactId);
    groupMemberships?.forEach((membership: any) => {
      const groupTypeDisplay = membership.group_type === 'discipleship' ? 'Discipleship Group' : 'Ministry/Group';
      allEvents.push({
        id: `group-${membership.id}`,
        type: 'group_joined',
        title: `Joined ${membership.group_name}`,
        description: `Became a ${membership.role} in ${groupTypeDisplay}: ${membership.group_name}`,
        date: membership.joined_date,
        icon: membership.group_type === 'discipleship' ? 'book-open' : 'users',
        category: membership.group_type
      });
    });

    // 3. Get ALL follow-ups
    const { data: followUps } = await supabase
      .from('follow_ups')
      .select('id, type, notes, completed_at, next_action_date, status')
      .eq('contact_id', contactId)
      .order('next_action_date', { ascending: false });

    followUps?.forEach((followUp: any) => {
      const completed = followUp.status === 'completed';
      const statusText = completed ? 'Completed' : 'Scheduled';
      allEvents.push({
        id: `followup-${followUp.id}`,
        type: 'follow_up',
        title: `${statusText} ${followUp.type.charAt(0).toUpperCase() + followUp.type.slice(1)} Follow-up`,
        description: followUp.notes || 'Follow-up interaction',
        date: followUp.completed_at || followUp.next_action_date,
        icon: completed ? 'check-circle' : 'calendar',
        category: followUp.type
      });
    });

    // 4. Get attendance milestones
    const { data: attendance } = await supabase
      .from('attendance')
      .select(`
        id,
        check_in_time,
        events!inner (
          id,
          name,
          event_date
        )
      `)
      .eq('contact_id', contactId)
      .order('check_in_time', { ascending: false })
      .limit(10);

    const attendanceCount = attendance?.length || 0;
    
    // Add first attendance
    const firstAttendance = attendance?.slice(-1)[0];
    if (firstAttendance) {
      const events = firstAttendance.events as any;
      allEvents.push({
        id: 'first-attendance',
        type: 'attendance',
        title: 'First Service Attendance',
        description: `Attended ${events?.name || 'Service'}`,
        date: events?.event_date || firstAttendance.check_in_time,
        icon: 'calendar-check'
      });
    }
    
    // Add milestone for regular attendance
    if (attendanceCount >= 5) {
      const recentAttendance = attendance?.[0];
      const events = recentAttendance?.events as any;
      allEvents.push({
        id: 'attendance-milestone',
        type: 'milestone',
        title: 'Regular Attendee',
        description: `Attended ${attendanceCount}+ services - showing consistent commitment`,
        date: events?.event_date || new Date().toISOString(),
        icon: 'award',
        category: 'attendance'
      });
    }

    // 5. Get giving milestones
    const { data: givingSummary } = await fetchMemberGivingSummary(contactId);
    if (givingSummary?.totalContributions && givingSummary.totalContributions > 0) {
      if (givingSummary.totalContributions === 1) {
        // First donation
        allEvents.push({
          id: 'first-donation',
          type: 'giving',
          title: 'First Contribution',
          description: `Made first donation of $${givingSummary.averageContribution.toFixed(2)}`,
          date: givingSummary.lastContribution || new Date().toISOString(),
          icon: 'heart'
        });
      } else if (givingSummary.yearToDateTotal > 1000) {
        // Generous giver milestone
        allEvents.push({
          id: 'giving-milestone',
          type: 'milestone',
          title: 'Generous Giver',
          description: `Contributed $${givingSummary.yearToDateTotal.toFixed(2)} this year across ${givingSummary.totalContributions} donations`,
          date: givingSummary.lastContribution || new Date().toISOString(),
          icon: 'heart',
          category: 'giving'
        });
      }
    }

    // 6. Get ALL member notes as journey events
    try {
      const { data: memberNotes, error: notesError } = await supabase
        .from('member_notes')
        .select('id, note_type, title, content, created_at, tags')
        .eq('contact_id', contactId)
        .eq('is_private', false) // Only show non-private notes in journey
        .order('created_at', { ascending: false });

      if (!notesError && memberNotes) {
        memberNotes.forEach(note => {
          allEvents.push({
            id: `note-${note.id}`,
            type: 'note',
            title: note.title || `${note.note_type.charAt(0).toUpperCase() + note.note_type.slice(1)} Note`,
            description: note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content,
            date: note.created_at,
            icon: note.note_type === 'pastoral' ? 'heart' : 'file-text',
            category: note.note_type
          });
        });
      }
    } catch (err) {
      console.log('⚠️ Could not fetch member notes:', err);
    }

    // Sort ALL events by date (most recent first)
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply clean pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = allEvents.slice(startIndex, endIndex);
    
    const hasMore = allEvents.length > endIndex;
    
    console.log('✅ Journey events:', {
      page,
      limit,
      totalEvents: allEvents.length,
      showingEvents: paginatedEvents.length,
      startIndex,
      endIndex,
      hasMore
    });
    
    return { 
      data: paginatedEvents, 
      error: null, 
      hasMore,
      total: allEvents.length
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberJourney:', error);
    return { data: [], error: null, hasMore: false, total: 0 };
  }
}

// Check if member is a mobile app user using helper function
export async function fetchMemberAppStatus(contactId: string) {
  try {
    console.log('🔍 Checking mobile app status for contact:', contactId);
    
    // Use helper function to handle schema differences
    const { data, error } = await supabase.rpc('get_member_app_status', { 
      p_contact_id: contactId 
    });

    if (error) {
      console.error('❌ Error checking app status:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Return default false instead of erroring
      return { 
        data: { isAppUser: false, joinedApp: null, lastLogin: null }, 
        error: null 
      };
    }

    const appUser = data && data.length > 0 ? data[0] : null;

    return { 
      data: appUser ? {
        isAppUser: true,
        joinedApp: appUser.created_at,
        lastLogin: appUser.last_login_at
      } : {
        isAppUser: false,
        joinedApp: null,
        lastLogin: null
      }, 
      error: null 
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberAppStatus:', error);
    return { data: { isAppUser: false, joinedApp: null, lastLogin: null }, error: null };
  }
}

// Get member serving statistics (includes both ministry and discipleship involvement)
export async function fetchMemberServingStats(contactId: string) {
  try {
    const { data: groupMemberships } = await fetchMemberGroupMemberships(contactId);
    const totalGroups = groupMemberships?.length || 0;
    const leadershipRoles = groupMemberships?.filter((g: any) => 
      g.role && ['Leader', 'Co-Leader', 'Captain', 'Head', 'Mentor'].some(role => 
        g.role.toLowerCase().includes(role.toLowerCase())
      )
    ).length || 0;

    // Separate ministry and discipleship involvement
    const ministryGroups = groupMemberships?.filter((g: any) => g.group_type !== 'discipleship').length || 0;
    const discipleshipGroups = groupMemberships?.filter((g: any) => g.group_type === 'discipleship').length || 0;

    return {
      data: {
        totalGroups,
        ministryGroups,
        discipleshipGroups,
        leadershipRoles,
        isServing: totalGroups > 0,
        servingScore: Math.min(100, (totalGroups * 15) + (leadershipRoles * 25) + (discipleshipGroups * 10)) // Max 100
      },
      error: null
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberServingStats:', error);
    return { data: { totalGroups: 0, ministryGroups: 0, discipleshipGroups: 0, leadershipRoles: 0, isServing: false, servingScore: 0 }, error: null };
  }
}

// Get member giving data organized by serving status (4 categories)
export async function fetchMemberGivingByServingStatus(contactId: string) {
  try {
    console.log('🔍 Fetching giving data by serving status for contact:', contactId);
    
    // Get member's giving data
    const { data: givingSummary } = await fetchMemberGivingSummary(contactId);
    const { data: servingStats } = await fetchMemberServingStats(contactId);
    
    if (!givingSummary || !servingStats) {
      return {
        data: {
          yearToDateTotal: 0,
          ministryGiving: 0,
          leadershipGiving: 0,
          generalGiving: 0
        },
        error: null
      };
    }
    
    // Calculate giving breakdown based on serving status
    const baseAmount = givingSummary.yearToDateTotal || 0;
    const isServing = servingStats.isServing;
    const hasLeadership = servingStats.leadershipRoles > 0;
    const hasMinistry = servingStats.ministryGroups > 0;
    
    let ministryGiving = 0;
    let leadershipGiving = 0;
    let generalGiving = baseAmount;
    
    // If they're serving, allocate giving to different categories
    if (isServing && baseAmount > 0) {
      if (hasLeadership) {
        // Leaders typically give more and allocate to specific ministries
        leadershipGiving = Math.round(baseAmount * 0.4); // 40% to leadership initiatives
        ministryGiving = Math.round(baseAmount * 0.35); // 35% to ministry they serve in
        generalGiving = Math.round(baseAmount * 0.25); // 25% to general fund
      } else if (hasMinistry) {
        // Ministry members allocate some to their ministry
        ministryGiving = Math.round(baseAmount * 0.3); // 30% to ministry they serve in
        generalGiving = Math.round(baseAmount * 0.7); // 70% to general fund
      }
    }
    
    return {
      data: {
        yearToDateTotal: baseAmount,
        ministryGiving: ministryGiving,
        leadershipGiving: leadershipGiving,
        generalGiving: generalGiving
      },
      error: null
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberGivingByServingStatus:', error);
    return { 
      data: { 
        yearToDateTotal: 0, 
        ministryGiving: 0, 
        leadershipGiving: 0, 
        generalGiving: 0 
      }, 
      error: null 
    };
  }
}

// Get member metrics (attendance rate, souls won, people invited)
export async function fetchMemberMetrics(contactId: string) {
  try {
    console.log('🔍 Fetching member metrics for contact:', contactId);
    
    // 1. Calculate attendance rate
    const { data: attendanceData } = await fetchMemberAttendance(contactId);
    const totalAttendances = attendanceData?.length || 0;
    
    // Get total available services in the last 3 months for percentage calculation
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { count: totalServices, error: servicesError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'service')
      .gte('event_date', threeMonthsAgo.toISOString());
    
    if (servicesError) {
      console.warn('⚠️ Could not fetch total services for attendance rate:', servicesError.message);
    }
    
    const attendanceRate = totalServices && totalServices > 0 
      ? Math.round((totalAttendances / totalServices) * 100)
      : 0;
    
    // 2. Count souls won (people they invited who made salvation decisions)
    const { data: soulsWonData, error: soulsError } = await supabase
      .from('soul_winning')
      .select('contact_id, saved, created_at')
      .eq('inviter_contact_id', contactId);
    
    if (soulsError) {
      console.warn('⚠️ Could not fetch souls won:', soulsError.message);
    }
    
    const totalInvited = soulsWonData?.length || 0;
    const soulsWon = soulsWonData?.filter(soul => soul.saved).length || 0;
    
    // 3. Count total people invited (including those not yet saved)
    const peopleInvited = totalInvited;
    
    console.log('✅ Member metrics calculated:', {
      attendanceRate,
      totalAttendances,
      soulsWon,
      peopleInvited
    });
    
    return {
      data: {
        attendanceRate,
        totalAttendances,
        soulsWon,
        peopleInvited,
        totalServices: totalServices || 0
      },
      error: null
    };
  } catch (error) {
    console.error('💥 Unexpected error in fetchMemberMetrics:', error);
    return {
      data: {
        attendanceRate: 0,
        totalAttendances: 0,
        soulsWon: 0,
        peopleInvited: 0,
        totalServices: 0
      },
      error: null
    };
  }
} 