import { supabase } from '@/lib/supabase';

export type MobileAppUser = {
  id: string;
  contact_id: string;
  registered_at: string;
  last_active: string;
  status: string;
  devices: {
    device_id: string;
    device_name: string;
    platform: string;
    os_version: string;
    app_version: string;
    push_token?: string;
    last_used?: string;
  }[];
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
};

export type MobileAppUsersMetrics = {
  total: number;
  newThisMonth: number;
  activeThisWeek: number;
  error: any | null;
};

export async function fetchAppUsers() {
  // First get all mobile app users
  const { data: mobileUsers, error: mobileUsersError } = await supabase
    .from('mobile_app_users')
    .select('id, contact_id, registered_at, last_active, status, devices')
    .order('registered_at', { ascending: false });

  if (mobileUsersError) {
    return { data: [], error: mobileUsersError };
  }

  // Then fetch all contacts and manually join the data
  const contactIds = mobileUsers.map(user => user.contact_id).filter(Boolean);
  
  if (contactIds.length === 0) {
    return { data: mobileUsers, error: null };
  }

  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone')
    .in('id', contactIds);

  if (contactsError) {
    return { data: mobileUsers, error: contactsError };
  }

  // Create a contacts lookup map
  const contactsMap: Record<string, any> = contacts.reduce((map: Record<string, any>, contact) => {
    map[contact.id] = contact;
    return map;
  }, {});

  // Join the data manually
  const enrichedUsers = mobileUsers.map(user => ({
    ...user,
    contacts: user.contact_id ? contactsMap[user.contact_id] || null : null
  }));

  return { data: enrichedUsers, error: null };
}

export async function fetchAppUser(id: string) {
  // First get the mobile app user
  const { data: mobileUser, error: mobileUserError } = await supabase
    .from('mobile_app_users')
    .select('*')
    .eq('id', id)
    .single();

  if (mobileUserError) {
    return { data: null, error: mobileUserError };
  }

  if (!mobileUser.contact_id) {
    return { data: mobileUser, error: null };
  }

  // Then fetch the associated contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone')
    .eq('id', mobileUser.contact_id)
    .single();

  if (contactError) {
    return { data: mobileUser, error: contactError };
  }

  // Join the data manually
  const enrichedUser = {
    ...mobileUser,
    contacts: contact || null
  };

  return { data: enrichedUser, error: null };
}

export function updateAppUser(id: string, data: Partial<MobileAppUser>) {
  return supabase
    .from('mobile_app_users')
    .update(data)
    .eq('id', id);
}

export function deleteAppUser(id: string) {
  return supabase
    .from('mobile_app_users')
    .delete()
    .eq('id', id);
}

export async function getAppUserMetrics(): Promise<MobileAppUsersMetrics> {
  try {
    // Get total app users
    const { count: total, error: totalError } = await supabase
      .from('mobile_app_users')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Get new app users this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const { count: newThisMonth, error: newError } = await supabase
      .from('mobile_app_users')
      .select('*', { count: 'exact', head: true })
      .gte('registered_at', oneMonthAgo.toISOString());
    
    if (newError) throw newError;
    
    // Get active app users this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { count: activeThisWeek, error: activeError } = await supabase
      .from('mobile_app_users')
      .select('*', { count: 'exact', head: true })
      .gte('last_active', oneWeekAgo.toISOString());
    
    if (activeError) throw activeError;
    
    return {
      total: total || 0,
      newThisMonth: newThisMonth || 0,
      activeThisWeek: activeThisWeek || 0,
      error: null
    };
  } catch (error) {
    console.error('Error fetching mobile app user metrics:', error);
    return {
      total: 0,
      newThisMonth: 0,
      activeThisWeek: 0,
      error
    };
  }
}

export async function sendPushNotification(userId: string, title: string, body: string) {
  // This would call your backend API or Edge Function
  // For now, we'll just return a mock response
  return {
    success: true,
    message: 'Push notification sent successfully'
  };
} 