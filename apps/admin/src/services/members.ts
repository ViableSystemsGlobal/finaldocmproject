import { supabase } from '@/lib/supabase';
import { triggerWelcomeWorkflow } from './workflows';
import { logCrudAction } from '@/lib/audit';

export async function fetchMembers() {
  try {
    // Get all members with their contact information
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('contact_id, joined_at, notes, created_at, contacts(id, first_name, last_name, email, phone, profile_image)');

    if (membersError) {
      console.error('Error fetching members with contacts:', membersError);
      // If contacts join fails, try to get members without contacts
      const { data: membersOnly, error: membersOnlyError } = await supabase
        .from('members')
        .select('contact_id, joined_at, notes, created_at');
      
      if (membersOnlyError) throw membersOnlyError;
      
      // Create dummy contact objects for members without contact data
      const membersWithDummyContacts = membersOnly?.map(member => ({
        ...member,
        contacts: {
          id: member.contact_id,
          first_name: 'Member',
          last_name: `(${member.contact_id.slice(0, 8)})`,
          email: '',
          phone: '',
          profile_image: null
        }
      })) || [];
      
      console.log('Using fallback members data (contacts table appears empty)');
      
      // Still get serving and app user data
      const { data: servingMembers, error: servingError } = await supabase
        .from('group_memberships')
        .select('contact_id')
        .not('contact_id', 'is', null);

      if (servingError) {
        console.warn('Could not fetch serving status:', servingError);
      }

      const { data: appUsers, error: appError } = await supabase
        .from('mobile_app_users')
        .select('contact_id')
        .not('contact_id', 'is', null);

      if (appError) {
        console.warn('Could not fetch app user status:', appError);
      }

      const servingContactIds = new Set(servingMembers?.map(m => m.contact_id) || []);
      const appUserContactIds = new Set(appUsers?.map(u => u.contact_id) || []);

      const enhancedMembers = membersWithDummyContacts.map(member => ({
        ...member,
        is_serving: servingContactIds.has(member.contact_id),
        is_app_user: appUserContactIds.has(member.contact_id)
      }));

      return { data: enhancedMembers, error: null };
    }

    // Normal path: contacts join succeeded
    console.log('Successfully fetched members with contacts');

    // Get all members who are serving (have group memberships)
    const { data: servingMembers, error: servingError } = await supabase
      .from('group_memberships')
      .select('contact_id')
      .not('contact_id', 'is', null);

    if (servingError) {
      console.warn('Could not fetch serving status:', servingError);
    }

    // Get all members who are app users
    const { data: appUsers, error: appError } = await supabase
      .from('mobile_app_users')
      .select('contact_id')
      .not('contact_id', 'is', null);

    if (appError) {
      console.warn('Could not fetch app user status:', appError);
    }

    // Create sets for fast lookup
    const servingContactIds = new Set(servingMembers?.map(m => m.contact_id) || []);
    const appUserContactIds = new Set(appUsers?.map(u => u.contact_id) || []);

    // Combine the data
    const enhancedMembers = members?.map(member => ({
      ...member,
      is_serving: servingContactIds.has(member.contact_id),
      is_app_user: appUserContactIds.has(member.contact_id)
    })) || [];

    return { data: enhancedMembers, error: null };
  } catch (error) {
    console.error('Error in fetchMembers:', error);
    return { data: [], error };
  }
}

export function fetchMember(id: string) {
  return supabase
    .from('members')
    .select('contact_id, joined_at, notes, created_at, contacts(id, first_name, last_name, email, phone, profile_image)')
    .eq('contact_id', id)
    .single();
}

export async function createMember(contactData: any) {
  try {
    // Create the contact first
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single()

    if (contactError) {
      // Handle specific constraint violations with user-friendly messages
      if (contactError.code === '23505') { // Unique constraint violation
        if (contactError.message.includes('contacts_email_key')) {
          throw new Error('This email address is already in use. Please use a different email or update the existing contact.');
        } else if (contactError.message.includes('contacts_phone_key')) {
          throw new Error('This phone number is already in use. Please use a different phone number or update the existing contact.');
        } else {
          throw new Error('A contact with this information already exists. Please check the details and try again.');
        }
      }
      
      // Handle other specific errors
      if (contactError.code === '23502') { // Not null constraint violation
        throw new Error('Required information is missing. Please fill in all required fields.');
      }
      
      throw contactError
    }

    // Create the member record
    const memberData = {
      contact_id: contact.id,
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single()

    if (memberError) {
      throw memberError
    }

    // Update contact lifecycle to 'member'
    const { error: lifecycleError } = await supabase
      .from('contacts')
      .update({ lifecycle: 'member' })
      .eq('id', contact.id)

    if (lifecycleError) {
      console.warn('Warning: Failed to update contact lifecycle:', lifecycleError)
    }

    // Log member creation in audit logs
    await logCrudAction(
      'create',
      'member',
      contact.id,
      undefined,
      {
        contact_id: contact.id,
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        email: contactData.email,
        phone: contactData.phone,
        lifecycle: 'member',
        joined_at: memberData.joined_at
      }
    )

    // Trigger welcome workflow
    if (contact.id) {
      await triggerWelcomeWorkflow(contact.id)
    }

    return { data: { contact, member }, error: null }
  } catch (error) {
    console.error('Error creating member:', error)
    return { data: null, error }
  }
}

export async function updateMember(contact_id: string, data: { joined_at: string; notes?: string }) {
  try {
    // Get current member data for audit log
    const { data: currentMember } = await supabase
      .from('members')
      .select('*, contacts(first_name, last_name, email)')
      .eq('contact_id', contact_id)
      .single();

    const result = await supabase
      .from('members')
      .update(data)
      .eq('contact_id', contact_id)
      .select()
      .single();

    if (!result.error && currentMember) {
      // Log member update in audit logs
      await logCrudAction(
        'update',
        'member',
        contact_id,
        {
          joined_at: currentMember.joined_at,
          notes: currentMember.notes
        },
        {
          joined_at: data.joined_at,
          notes: data.notes,
          contact_name: `${currentMember.contacts?.first_name} ${currentMember.contacts?.last_name}`,
          contact_email: currentMember.contacts?.email
        }
      );
    }

    return result;
  } catch (err) {
    console.error('Unexpected error in updateMember:', err);
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
  }
}

export async function deleteMember(contact_id: string) {
  try {
    // Get member data before deletion for audit log
    const { data: memberData } = await supabase
      .from('members')
      .select('*, contacts(first_name, last_name, email, phone)')
      .eq('contact_id', contact_id)
      .single();

    // Delete from members table
    const result = await supabase
      .from('members')
      .delete()
      .eq('contact_id', contact_id);
    
    if (!result.error) {
      // Update the contact's lifecycle - set to null or 'contact' 
      // (assuming 'contact' is the default lifecycle for non-members)
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ lifecycle: 'contact' })
        .eq('id', contact_id);
      
      if (updateError) {
        console.warn('Warning: Failed to update contact lifecycle after member deletion:', updateError);
        // Don't fail the whole operation, just log the warning
      } else {
        console.log('Contact lifecycle updated from "member" to "contact"');
      }

      // Log member deletion in audit logs
      if (memberData) {
        await logCrudAction(
          'delete',
          'member',
          contact_id,
          {
            contact_id: memberData.contact_id,
            joined_at: memberData.joined_at,
            notes: memberData.notes,
            first_name: memberData.contacts?.first_name,
            last_name: memberData.contacts?.last_name,
            email: memberData.contacts?.email,
            phone: memberData.contacts?.phone,
            lifecycle: 'member'
          },
          {
            lifecycle: 'contact',
            action: 'member_deleted'
          }
        );
      }
    }
    
    return result;
  } catch (err) {
    console.error('Unexpected error in deleteMember:', err);
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } };
  }
}

// Helper function to get members count
export function getMembersCount() {
  return supabase
    .from('members')
    .select('contact_id', { count: 'exact', head: true });
}

// Helper function to get new members this month
export function getNewMembersThisMonth() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return supabase
    .from('members')
    .select('contact_id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());
}

// Helper function to check if a member is serving (has group membership)
export async function getMembersServing() {
  try {
    console.log('🔍 getMembersServing: Starting...');
    
    // Skip the custom function and go directly to fallback logic since the custom function is broken
    console.warn('⚠️ getMembersServing: Skipping custom function, using fallback logic');
    
    // Simplified fallback: Get all members first, then count how many have group memberships
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('contact_id');
    
    if (membersError) {
      console.error('❌ getMembersServing: Error fetching members:', membersError);
      return { data: 0, error: membersError };
    }
    
    const memberContactIds = allMembers?.map(m => m.contact_id) || [];
    console.log('📊 getMembersServing: Total members found:', memberContactIds.length);
    console.log('📊 getMembersServing: Member contact IDs:', memberContactIds);
    
    if (memberContactIds.length === 0) {
      console.log('⚠️ getMembersServing: No members found, returning 0');
      return { data: 0, error: null };
    }
    
    // Get all group memberships for these members
    const { data: groupMemberships, error: groupError } = await supabase
      .from('group_memberships')
      .select('contact_id')
      .in('contact_id', memberContactIds);
    
    if (groupError) {
      console.error('❌ getMembersServing: Error fetching group memberships:', groupError);
      // Fallback to just counting all group memberships
      const { count, error: countError } = await supabase
        .from('group_memberships')
        .select('contact_id', { count: 'exact', head: true });
      
      console.log('🔄 getMembersServing: Final fallback - total group memberships:', count);
      return { data: count || 0, error: countError };
    }
    
    console.log('📊 getMembersServing: Group memberships found:', groupMemberships?.length || 0);
    console.log('📊 getMembersServing: Group membership data:', groupMemberships);
    
    // Count unique members who are serving
    const uniqueServingMembers = new Set(groupMemberships?.map(gm => gm.contact_id) || []);
    const servingCount = uniqueServingMembers.size;
    
    console.log('🎯 getMembersServing: Unique serving members count:', servingCount);
    console.log('🎯 getMembersServing: Unique serving members IDs:', Array.from(uniqueServingMembers));
    console.log('✅ getMembersServing: Returning final result:', servingCount);
    
    return { data: servingCount, error: null };
  } catch (error) {
    console.error('💥 getMembersServing: Unexpected error:', error);
    return { data: 0, error };
  }
}

// Helper function to get member app users count
export async function getMemberAppUsers() {
  try {
    // Skip the custom function and go directly to fallback logic since the custom function is broken
    console.warn('⚠️ getMemberAppUsers: Skipping custom function, using fallback logic');
    
    // Simplified fallback: Get all members first, then count how many are app users
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('contact_id');
    
    if (membersError) {
      console.error('❌ getMemberAppUsers: Error fetching members for app users:', membersError);
      return { data: 0, error: membersError };
    }
    
    const memberContactIds = allMembers?.map(m => m.contact_id) || [];
    console.log('📊 getMemberAppUsers: Total members for app user check:', memberContactIds.length);
    
    if (memberContactIds.length === 0) {
      return { data: 0, error: null };
    }
    
    // Get all app users who are also members
    const { data: appUsers, error: appError } = await supabase
      .from('mobile_app_users')
      .select('contact_id')
      .in('contact_id', memberContactIds);
    
    if (appError) {
      console.error('❌ getMemberAppUsers: Error fetching app users:', appError);
      // Fallback to just counting all app users
      const { count, error: countError } = await supabase
        .from('mobile_app_users')
        .select('contact_id', { count: 'exact', head: true });
      
      console.log('🔄 getMemberAppUsers: Final fallback - total app users:', count);
      return { data: count || 0, error: countError };
    }
    
    // Count unique members who are app users
    const uniqueAppUsers = new Set(appUsers?.map(au => au.contact_id) || []);
    const appUserCount = uniqueAppUsers.size;
    
    console.log('📊 getMemberAppUsers: Member app users:', appUserCount);
    console.log('📊 getMemberAppUsers: App user members:', Array.from(uniqueAppUsers));
    
    return { data: appUserCount, error: null };
  } catch (error) {
    console.error('💥 getMemberAppUsers: Unexpected error:', error);
    return { data: 0, error };
  }
}

// Helper function to get contacts for member creation
export async function getContactsNotMembers() {
  try {
    // Get all contacts
    const { data: allContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, profile_image')
      .order('first_name', { ascending: true });
    
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return { data: [], error: contactsError };
    }
    
    // Get all existing member contact IDs
    const { data: existingMembers, error: membersError } = await supabase
      .from('members')
      .select('contact_id');
    
    if (membersError) {
      console.error('Error fetching existing members:', membersError);
      // If we can't get members, return all contacts rather than failing completely
      return { data: allContacts || [], error: null };
    }
    
    // Create a set of existing member contact IDs for fast lookup
    const existingMemberIds = new Set(existingMembers?.map(m => m.contact_id) || []);
    
    // Filter out contacts who are already members
    const availableContacts = allContacts?.filter(contact => 
      !existingMemberIds.has(contact.id)
    ) || [];
    
    console.log(`Found ${allContacts?.length || 0} total contacts, ${existingMemberIds.size} existing members, ${availableContacts.length} available for membership`);
    
    return { data: availableContacts, error: null };
  } catch (error) {
    console.error('Error in getContactsNotMembers:', error);
    return { data: [], error };
  }
}

// Function to get contacts not in a specific group
export async function getContactsNotInGroup(groupId: string, searchQuery?: string) {
  try {
    // First get all contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, profile_image')
      .order('first_name', { ascending: true });
    
    if (contactsError) throw contactsError;
    
    // Then get all members of the specified group
    const { data: members, error: membersError } = await supabase
      .from('group_memberships')
      .select('contact_id')
      .eq('group_id', groupId);
    
    if (membersError) throw membersError;
    
    // Extract contact IDs that are already members
    const memberContactIds = members?.map(member => member.contact_id) || [];
    
    // Filter out contacts that are already members of this group
    const filteredContacts = contacts?.filter(contact => 
      !memberContactIds.includes(contact.id)
    ) || [];
    
    // If search query provided, filter by name or email
    let result = filteredContacts;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = filteredContacts.filter(contact => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
        const email = (contact.email || '').toLowerCase();
        return fullName.includes(query) || email.includes(query);
      });
    }
    
    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching contacts not in group:', error);
    return { data: [], error };
  }
}

export async function createMembers(members: { contact_id: string; joined_at: string; notes?: string }[]) {
  console.log('Creating multiple members:', JSON.stringify(members, null, 2));
  
  try {
    const results = [];
    const errors = [];
    
    // Process each member creation
    for (const memberData of members) {
      try {
        console.log(`Converting contact ${memberData.contact_id} to member...`);
        const result = await convertContactToMember(memberData.contact_id, memberData.joined_at, memberData.notes);
        
        if (result.error) {
          console.error(`Failed to convert contact ${memberData.contact_id}:`, result.error);
          errors.push({
            contact_id: memberData.contact_id,
            error: result.error
          });
        } else {
          console.log(`Successfully converted contact ${memberData.contact_id} to member`);
          results.push({
            contact_id: memberData.contact_id,
            success: true,
            data: result.data
          });
        }
      } catch (err) {
        console.error(`Unexpected error converting contact ${memberData.contact_id}:`, err);
        errors.push({
          contact_id: memberData.contact_id,
          error: { 
            message: err instanceof Error ? err.message : 'Unknown error',
            details: err
          }
        });
      }
    }
    
    console.log(`Members creation completed: ${results.length} successful, ${errors.length} failed`);
    
    return {
      successful: results,
      failed: errors,
      total: members.length
    };
  } catch (err) {
    console.error('Unexpected error in createMembers:', err);
    return {
      successful: [],
      failed: members.map(m => ({
        contact_id: m.contact_id,
        error: { 
          message: err instanceof Error ? err.message : 'Unknown error',
          details: err
        }
      })),
      total: members.length
    };
  }
}

// Function to convert existing contact to member
export async function convertContactToMember(contact_id: string, joined_at: string, notes?: string) {
  try {
    console.log('Converting contact to member:', { contact_id, joined_at, notes });
    
    // First check if the contact exists
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, lifecycle, first_name, last_name, email')
      .eq('id', contact_id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching contact:', fetchError);
      throw new Error(`Contact not found: ${fetchError.message}`);
    }
    
    console.log('Existing contact found:', existingContact);
    
    // Check if contact is already a member
    if (existingContact.lifecycle === 'member') {
      throw new Error('This person is already a member');
    }

    // Check if member record already exists
    const { data: existingMember } = await supabase
      .from('members')
      .select('contact_id')
      .eq('contact_id', contact_id)
      .single();

    if (existingMember) {
      throw new Error('Member record already exists for this contact');
    }

    // Create the member record
    const memberData = {
      contact_id,
      joined_at,
      notes: notes || null,
      created_at: new Date().toISOString()
    }

    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single()

    if (memberError) {
      console.error('Error creating member record:', memberError);
      throw new Error(`Failed to create member record: ${memberError.message}`);
    }

    // Update contact lifecycle to 'member'
    const { error: lifecycleError } = await supabase
      .from('contacts')
      .update({ lifecycle: 'member' })
      .eq('id', contact_id)

    if (lifecycleError) {
      console.error('Error updating contact lifecycle:', lifecycleError);
      // Try to rollback member creation
      await supabase.from('members').delete().eq('contact_id', contact_id);
      throw new Error(`Failed to update contact lifecycle: ${lifecycleError.message}`);
    }

    // Log member creation in audit logs
    await logCrudAction(
      'create',
      'member',
      contact_id,
      {
        lifecycle: existingContact.lifecycle
      },
      {
        contact_id,
        first_name: existingContact.first_name,
        last_name: existingContact.last_name,
        email: existingContact.email,
        lifecycle: 'member',
        joined_at,
        notes
      }
    )

    // Trigger welcome workflow
    try {
      await triggerWelcomeWorkflow(contact_id)
    } catch (workflowError) {
      console.warn('Warning: Failed to trigger welcome workflow:', workflowError)
      // Don't fail the whole operation if workflow fails
    }

    console.log('✅ Contact successfully converted to member');
    return { data: { contact: existingContact, member }, error: null }
  } catch (error) {
    console.error('Error converting contact to member:', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // If it's a Supabase error, log additional details
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Supabase error code:', (error as any).code)
      console.error('Supabase error details:', (error as any).details)
      console.error('Supabase error hint:', (error as any).hint)
    }
    
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
        code: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined
      }
    }
  }
} 