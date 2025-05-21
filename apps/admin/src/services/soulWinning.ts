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

export function fetchSouls() {
  return supabase
    .from('soul_winning')
    .select('created_at, saved, inviter_type, inviter_name, notes, contact_id, converted_to, converted_at, contacts!soul_winning_contact_id_fkey(id, first_name, last_name, email, phone)')
    .order('created_at', { ascending: false });
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

export function createSoul(data: {
  contact_id: string;
  saved: boolean;
  inviter_type: string;
  inviter_contact_id?: string;
  inviter_name?: string;
  notes?: string;
}) {
  return supabase.from('soul_winning').insert(data);
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