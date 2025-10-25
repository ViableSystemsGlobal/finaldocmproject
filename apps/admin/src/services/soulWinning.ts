import { supabase } from '@/lib/supabase';

export type SoulWinning = {
  contact_id: string;
  saved: boolean;
  inviter_type: string;
  inviter_contact_id?: string;
  inviter_name?: string;
  notes?: string;
  created_at: string;
  converted_to?: 'visitor' | 'member' | null;
  converted_at?: string | null;
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  inviter_contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export function fetchSouls(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  
  return supabase
    .from('soul_winning')
    .select('created_at, saved, inviter_type, inviter_name, notes, contact_id, converted_to, converted_at, contacts!soul_winning_contact_id_fkey(id, first_name, last_name, email, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
}

export function fetchSoul(contact_id: string) {
  return supabase
    .from('soul_winning')
    .select(`
      *, 
      contacts!soul_winning_contact_id_fkey(id, first_name, last_name, email, phone),
      inviter_contact:contacts!soul_winning_inviter_contact_id_fkey(id, first_name, last_name, email, phone)
    `)
    .eq('contact_id', contact_id)
    .single();
}

export async function createSoul(data: {
  contact_id: string;
  saved: boolean;
  inviter_type: string;
  inviter_contact_id?: string;
  inviter_name?: string;
  notes?: string;
}) {
  // First check if this contact is already a member
  const { data: existingContact, error: contactError } = await supabase
    .from('contacts')
    .select('lifecycle')
    .eq('id', data.contact_id)
    .single();
  
  if (contactError) {
    return { data: null, error: contactError };
  }
  
  if (existingContact?.lifecycle === 'member') {
    return { 
      data: null, 
      error: { 
        message: 'Cannot create soul winning record for a member. Members have already joined the church.',
        code: 'CONTACT_IS_MEMBER'
      } 
    };
  }

  return supabase.from('soul_winning').insert(data);
}

export async function createMultipleSouls(data: {
  contact_ids: string[];
  saved: boolean;
  inviter_type: string;
  inviter_contact_id?: string;
  inviter_name?: string;
  notes?: string;
}) {
  try {
    // First, check which contacts are already members
    const { data: existingContacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, lifecycle')
      .in('id', data.contact_ids);
    
    if (contactError) {
      return { data: null, error: contactError };
    }
    
    // Filter out contacts that are already members
    const memberContacts = existingContacts?.filter(c => c.lifecycle === 'member') || [];
    const validContacts = existingContacts?.filter(c => c.lifecycle !== 'member') || [];
    
    if (validContacts.length === 0) {
      return { 
        data: null, 
        error: { 
          message: 'All selected contacts are already members. Soul winning records cannot be created for existing members.',
          code: 'ALL_CONTACTS_ARE_MEMBERS'
        } 
      };
    }
    
    // Create soul winning records for valid contacts
    const soulWinningRecords = validContacts.map(contact => ({
      contact_id: contact.id,
      saved: data.saved,
      inviter_type: data.inviter_type,
      inviter_contact_id: data.inviter_contact_id,
      inviter_name: data.inviter_name,
      notes: data.notes
    }));
    
    const { data: insertedData, error: insertError } = await supabase
      .from('soul_winning')
      .insert(soulWinningRecords);
    
    if (insertError) {
      return { data: null, error: insertError };
    }
    
    // Return results with information about any skipped members
    return {
      data: insertedData,
      error: null,
      results: {
        created: validContacts.length,
        skipped: memberContacts.length,
        skippedMembers: memberContacts.map(c => c.id)
      }
    };
  } catch (error) {
    console.error('Error creating multiple soul winning records:', error);
    return { data: null, error };
  }
}

export function updateSoul(contact_id: string, data: Partial<SoulWinning>) {
  return supabase.from('soul_winning').update(data).eq('contact_id', contact_id);
}

export function deleteSoul(contact_id: string) {
  return supabase.from('soul_winning').delete().eq('contact_id', contact_id);
}

export async function convertSoulToVisitor(contact_id: string) {
  try {
    console.log('Converting soul to visitor, contact_id:', contact_id);
    
    // Step 1: Update contact lifecycle
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ lifecycle: 'visitor' })
      .eq('id', contact_id);
    
    if (updateError) {
      console.error('Error updating contact lifecycle:', updateError);
      throw updateError;
    }
    
    console.log('Contact lifecycle updated to visitor');
    
    // Step 2: Check if visitor record already exists
    const { data: existingVisitor, error: checkError } = await supabase
      .from('visitors')
      .select('*')
      .eq('contact_id', contact_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing visitor:', checkError);
      throw checkError;
    }
    
    console.log('Existing visitor check result:', existingVisitor);
    
    let data;
    
    // Step 3: Insert or update visitor record
    if (!existingVisitor) {
      console.log('No existing visitor found, creating new visitor record');
      
      // Insert new visitor record if none exists
      const { data: insertedData, error: insertError } = await supabase
        .from('visitors')
        .insert([{ contact_id, first_visit: new Date().toISOString() }])
        .select();
      
      if (insertError) {
        console.error('Error inserting visitor record:', insertError);
        throw insertError;
      }
      
      console.log('New visitor record created:', insertedData);
      data = insertedData;
    } else {
      console.log('Using existing visitor record');
      // Visitor record already exists, just return it
      data = existingVisitor;
    }
    
    // Step 4: Mark soul_winning record as converted instead of deleting
    const { error: updateSoulError } = await supabase
      .from('soul_winning')
      .update({ 
        converted_to: 'visitor',
        converted_at: new Date().toISOString()
      })
      .eq('contact_id', contact_id);
    
    if (updateSoulError) {
      console.warn('Warning: Could not update soul_winning record:', updateSoulError);
      // Continue anyway - we don't want to fail the conversion if only this step fails
    } else {
      console.log('Soul winning record marked as converted to visitor');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error converting soul to visitor:", error);
    return { data: null, error };
  }
}

export async function convertSoulToMember(contact_id: string) {
  try {
    console.log('Converting soul to member, contact_id:', contact_id);
    
    // Step 1: Update contact lifecycle
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ lifecycle: 'member' })
      .eq('id', contact_id);
    
    if (updateError) {
      console.error('Error updating contact lifecycle:', updateError);
      throw updateError;
    }
    
    console.log('Contact lifecycle updated to member');
    
    // Step 2: Check if member record already exists
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('*')
      .eq('contact_id', contact_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing member:', checkError);
      throw checkError;
    }
    
    console.log('Existing member check result:', existingMember);
    
    let data;
    
    // Step 3: Insert or update member record
    if (!existingMember) {
      console.log('No existing member found, creating new member record');
      
      // Insert new member record if none exists
      const { data: insertedData, error: insertError } = await supabase
        .from('members')
        .insert([{ contact_id, joined_at: new Date().toISOString() }])
        .select();
      
      if (insertError) {
        console.error('Error inserting member record:', insertError);
        throw insertError;
      }
      
      console.log('New member record created:', insertedData);
      data = insertedData;
    } else {
      console.log('Using existing member record');
      // Member record already exists, just return it
      data = existingMember;
    }
    
    // Step 4: Mark soul_winning record as converted instead of deleting
    const { error: updateSoulError } = await supabase
      .from('soul_winning')
      .update({ 
        converted_to: 'member',
        converted_at: new Date().toISOString()
      })
      .eq('contact_id', contact_id);
    
    if (updateSoulError) {
      console.warn('Warning: Could not update soul_winning record:', updateSoulError);
      // Continue anyway - we don't want to fail the conversion if only this step fails
    } else {
      console.log('Soul winning record marked as converted to member');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error converting soul to member:", error);
    return { data: null, error };
  }
}

export async function getSoulWinningMetrics() {
  try {
    // Get total souls
    const { count: totalSouls, error: totalError } = await supabase
      .from('soul_winning')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get total saved souls
    const { count: totalSaved, error: savedError } = await supabase
      .from('soul_winning')
      .select('*', { count: 'exact', head: true })
      .eq('saved', true);

    if (savedError) throw savedError;
    
    // Get souls converted to visitors
    const { count: totalConvertedToVisitor, error: visitorError } = await supabase
      .from('soul_winning')
      .select('*', { count: 'exact', head: true })
      .eq('converted_to', 'visitor');

    if (visitorError) throw visitorError;
    
    // Get souls converted to members
    const { count: totalConvertedToMember, error: memberError } = await supabase
      .from('soul_winning')
      .select('*', { count: 'exact', head: true })
      .eq('converted_to', 'member');

    if (memberError) throw memberError;

    // Get pending follow-ups for souls
    const { data: souls, error: soulsError } = await supabase
      .from('soul_winning')
      .select('contact_id');

    if (soulsError) throw soulsError;

    let pendingFollowUps = 0;
    if (souls && souls.length > 0) {
      const contactIds = souls.map(s => s.contact_id);
      
      const { count, error: followUpsError } = await supabase
        .from('follow_ups')
        .select('*', { count: 'exact', head: true })
        .in('contact_id', contactIds)
        .eq('status', 'pending');
        
      if (followUpsError) throw followUpsError;
      
      pendingFollowUps = count || 0;
    }

    // Get souls by inviter type
    const { data: allSouls, error: allSoulsError } = await supabase
      .from('soul_winning')
      .select('inviter_type');

    if (allSoulsError) throw allSoulsError;

    // Count occurrences of each inviter type
    const byInviterType: Record<string, number> = {};
    allSouls?.forEach((soul: { inviter_type: string }) => {
      const inviterType = soul.inviter_type || 'Unknown';
      byInviterType[inviterType] = (byInviterType[inviterType] || 0) + 1;
    });
    
    // Calculate percentages
    const visitorConversionRate = totalSouls ? (totalConvertedToVisitor || 0) / totalSouls * 100 : 0;
    const memberConversionRate = totalSouls ? (totalConvertedToMember || 0) / totalSouls * 100 : 0;

    return {
      totalSouls: totalSouls || 0,
      totalSaved: totalSaved || 0,
      totalConvertedToVisitor: totalConvertedToVisitor || 0,
      totalConvertedToMember: totalConvertedToMember || 0,
      visitorConversionRate: parseFloat(visitorConversionRate.toFixed(1)),
      memberConversionRate: parseFloat(memberConversionRate.toFixed(1)),
      pendingFollowUps,
      byInviterType,
      error: null
    };
  } catch (error) {
    console.error('Error fetching soul winning metrics:', error);
    return {
      totalSouls: 0,
      totalSaved: 0,
      totalConvertedToVisitor: 0,
      totalConvertedToMember: 0,
      visitorConversionRate: 0,
      memberConversionRate: 0,
      pendingFollowUps: 0,
      byInviterType: {},
      error
    };
  }
}

// Function to get contacts that are not members (for soul winning records)
export async function getContactsNotMembers() {
  try {
    // Get all contacts
    const { data: allContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, profile_image')
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
    
    console.log(`Found ${allContacts?.length || 0} total contacts, ${existingMemberIds.size} existing members, ${availableContacts.length} available for soul winning`);
    
    return { data: availableContacts, error: null };
  } catch (error) {
    console.error('Error in getContactsNotMembers:', error);
    return { data: [], error };
  }
}

export async function createContactForSoulWinning(data: {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}) {
  try {
    // Add a default tenant_id and lifecycle for soul winning
    const contactData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      lifecycle: 'soul', // Default to soul lifecycle
      tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Default UUID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Creating contact for soul winning:', contactData);
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact:', error);
      
      // Handle specific errors
      if (error.code === '23505') { // Unique constraint violation
        if (error.message.includes('contacts_email_key')) {
          throw new Error('This email address is already in use. Please use a different email or select the existing contact.');
        } else if (error.message.includes('contacts_phone_key')) {
          throw new Error('This phone number is already in use. Please use a different phone number or select the existing contact.');
        } else {
          throw new Error('A contact with this information already exists. Please check the details and try again.');
        }
      }
      
      throw error;
    }
    
    console.log('Contact created successfully:', contact);
    return { data: contact, error: null };
  } catch (error) {
    console.error('Error in createContactForSoulWinning:', error);
    return { data: null, error };
  }
} 