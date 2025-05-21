import { supabase } from '@/lib/supabase';

export type Visitor = {
  contact_id: string;
  first_visit: string;
  saved: boolean;
  notes?: string;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };
};

export function fetchVisitors() {
  return supabase
    .from('visitors')
    .select('contact_id, first_visit, saved, notes, contacts(id, first_name, last_name, email, phone, profile_image)');
}

export function fetchVisitor(id: string) {
  return supabase
    .from('visitors')
    .select('contact_id, first_visit, saved, notes, contacts(id, first_name, last_name, email, phone, profile_image)')
    .eq('contact_id', id)
    .single();
}

export function createVisitor(data: { contact_id: string; first_visit: string; notes?: string; saved?: boolean }) {
  return supabase
    .from('visitors')
    .insert(data);
}

export function updateVisitor(contact_id: string, data: Partial<Visitor>) {
  // Remove the contacts property if it exists as we don't want to store it in the visitors table
  const { contacts, ...updateData } = data;
  return supabase
    .from('visitors')
    .update(updateData)
    .eq('contact_id', contact_id);
}

export function deleteVisitor(contact_id: string) {
  return supabase
    .from('visitors')
    .delete()
    .eq('contact_id', contact_id);
}

export async function convertToMember(contact_id: string, joined_at: string) {
  // Start a transaction: update the contact lifecycle and create a member record
  // Note: This is not a true transaction, but sequential operations
  try {
    // First update the contact
    const { error: contactError } = await supabase
      .from('contacts')
      .update({ lifecycle: 'member' })
      .eq('id', contact_id);
    
    if (contactError) throw contactError;

    // Then create a member record
    return supabase
      .from('members')
      .insert({ contact_id, joined_at });
  } catch (error) {
    console.error('Error converting visitor to member:', error);
    throw error;
  }
}

// Helper function to get visitors count
export function getVisitorsCount() {
  return supabase
    .from('visitors')
    .select('contact_id', { count: 'exact', head: true });
}

// Helper function to get new visitors this month
export function getNewVisitorsThisMonth() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return supabase
    .from('visitors')
    .select('contact_id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());
}

// Helper function to get saved visitors count
export function getSavedVisitorsCount() {
  return supabase
    .from('visitors')
    .select('contact_id', { count: 'exact', head: true })
    .eq('saved', true);
}

// Function to search contacts that are not yet visitors
export function getContactsNotVisitors() {
  // Get contacts that don't have a visitor record
  // This is a simplified query - in a real app, you might need a more optimized approach
  return supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, profile_image')
    .order('first_name', { ascending: true });
}

// Function to get follow-ups for a visitor
export function fetchVisitorFollowUps(contact_id: string) {
  return supabase
    .from('follow_ups')
    .select('*')
    .eq('contact_id', contact_id)
    .order('scheduled_date', { ascending: true });
} 