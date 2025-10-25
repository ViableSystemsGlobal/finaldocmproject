import { supabase } from '@/lib/supabase';

// =====================
// Enhanced User Types for Multi-App System
// =====================

export type UserType = 'mobile_user' | 'admin_staff' | 'hybrid';
export type AppAccess = 'mobile' | 'admin';

export interface UserProfile {
  id: string;
  user_id: string; // References auth.users
  user_type: UserType;
  app_access: AppAccess[];
  
  // Basic Info
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  
  // Admin-specific fields
  department?: string;
  job_title?: string;
  employee_id?: string;
  hire_date?: string;
  
  // Mobile user linking
  member_id?: string; // Link to church member record
  
  // Status
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  
  // Metadata
  preferences?: Record<string, any>;
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EnhancedAdminUser {
  id: string;
  email: string;
  user_type: UserType;
  app_access: AppAccess[];
  profile?: UserProfile;
  roles?: Role[];
  permissions?: string[];
  
  // Computed properties
  display_name?: string;
  is_active?: boolean;
  
  // Auth metadata
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  department?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================
// User Profile Management
// =====================

export async function fetchUserProfile(userId: string): Promise<{ success: boolean; data: UserProfile | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { success: !error, data: data as UserProfile | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createUserProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data: UserProfile | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([profile])
      .select()
      .single();
    
    return { success: !error, data: data as UserProfile | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; data: UserProfile | null; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    return { success: !error, data: data as UserProfile | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

// =====================
// Multi-App User Management
// =====================

export async function createMobileUser(userData: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  member_id?: string;
}): Promise<{ success: boolean; data: any; error?: any }> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: 'mobile_user'
      }
    });

    if (authError || !authData.user) {
      return { success: false, data: null, error: authError };
    }

    // Create user profile
    const profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
      user_id: authData.user.id,
      user_type: 'mobile_user',
      app_access: ['mobile'],
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      member_id: userData.member_id,
      is_active: true,
      is_verified: false
    };

    const profileResult = await createUserProfile(profileData);
    
    if (!profileResult.success) {
      // Rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, data: null, error: profileResult.error };
    }

    return { 
      success: true, 
      data: { 
        user: authData.user, 
        profile: profileResult.data 
      }, 
      error: null 
    };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createAdminUser(userData: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  job_title?: string;
  employee_id?: string;
  role_ids?: string[];
}): Promise<{ success: boolean; data: any; error?: any }> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: 'admin_staff'
      }
    });

    if (authError || !authData.user) {
      return { success: false, data: null, error: authError };
    }

    // Create user profile
    const profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
      user_id: authData.user.id,
      user_type: 'admin_staff',
      app_access: ['admin'],
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      department: userData.department,
      job_title: userData.job_title,
      employee_id: userData.employee_id,
      is_active: true,
      is_verified: true
    };

    const profileResult = await createUserProfile(profileData);
    
    if (!profileResult.success) {
      // Rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, data: null, error: profileResult.error };
    }

    // Assign roles if provided
    if (userData.role_ids && userData.role_ids.length > 0) {
      for (const roleId of userData.role_ids) {
        await assignUserRole(authData.user.id, roleId);
      }
    }

    return { 
      success: true, 
      data: { 
        user: authData.user, 
        profile: profileResult.data 
      }, 
      error: null 
    };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function grantAdminAccess(userId: string, adminData: {
  department?: string;
  job_title?: string;
  employee_id?: string;
  role_ids?: string[];
}): Promise<{ success: boolean; error?: any }> {
  try {
    // Get current profile
    const profileResult = await fetchUserProfile(userId);
    if (!profileResult.success) {
      return { success: false, error: 'User profile not found' };
    }

    const currentProfile = profileResult.data!;
    
    // Update profile to include admin access
    const newAppAccess = Array.from(new Set([...currentProfile.app_access, 'admin' as AppAccess])) as AppAccess[];
    const newUserType = currentProfile.user_type === 'mobile_user' ? 'hybrid' : 'admin_staff';

    const updateResult = await updateUserProfile(userId, {
      user_type: newUserType,
      app_access: newAppAccess,
      department: adminData.department,
      job_title: adminData.job_title,
      employee_id: adminData.employee_id,
      is_verified: true
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Update auth user metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...currentProfile,
        user_type: newUserType
      }
    });

    // Assign roles if provided
    if (adminData.role_ids && adminData.role_ids.length > 0) {
      for (const roleId of adminData.role_ids) {
        await assignUserRole(userId, roleId);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function revokeAdminAccess(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    // Get current profile
    const profileResult = await fetchUserProfile(userId);
    if (!profileResult.success) {
      return { success: false, error: 'User profile not found' };
    }

    const currentProfile = profileResult.data!;
    
    // Update profile to remove admin access
    const newAppAccess = currentProfile.app_access.filter(access => access !== 'admin') as AppAccess[];
    const newUserType = newAppAccess.length === 0 ? 'mobile_user' : 'mobile_user';

    const updateResult = await updateUserProfile(userId, {
      user_type: newUserType,
      app_access: newAppAccess,
      department: undefined,
      job_title: undefined,
      employee_id: undefined
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Update auth user metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...currentProfile,
        user_type: newUserType
      }
    });

    // Remove all role assignments
    await removeAllUserRoles(userId);

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Enhanced User Queries
// =====================

export async function fetchEnhancedUsers(filters?: {
  user_type?: UserType;
  app_access?: AppAccess;
  department?: string;
  is_active?: boolean;
}): Promise<{ success: boolean; data: EnhancedAdminUser[]; error?: any }> {
  try {
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        user_roles (
          role_id,
          roles (*)
        )
      `);

    // Apply filters
    if (filters?.user_type) {
      query = query.eq('user_type', filters.user_type);
    }
    if (filters?.app_access) {
      query = query.contains('app_access', [filters.app_access]);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, data: [], error };
    }

    // Get auth users data
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      return { success: false, data: [], error: authError };
    }

    // Combine profile and auth data
    const enhancedUsers: EnhancedAdminUser[] = data.map((profile: any) => {
      const authUser = authUsers.users.find(u => u.id === profile.user_id);
      
      return {
        id: profile.user_id,
        email: authUser?.email || '',
        user_type: profile.user_type,
        app_access: profile.app_access,
        profile: profile,
        roles: profile.user_roles?.map((ur: any) => ur.roles) || [],
        permissions: profile.user_roles?.flatMap((ur: any) => ur.roles?.permissions || []) || [],
        display_name: profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile.first_name || profile.last_name || authUser?.email || '',
        is_active: profile.is_active,
        created_at: authUser?.created_at || profile.created_at,
        last_sign_in_at: authUser?.last_sign_in_at,
        email_confirmed_at: authUser?.email_confirmed_at
      };
    });

    return { success: true, data: enhancedUsers, error: null };
  } catch (error) {
    return { success: false, data: [], error };
  }
}

export async function fetchAdminUsers(): Promise<{ success: boolean; data: EnhancedAdminUser[]; error?: any }> {
  return fetchEnhancedUsers({ app_access: 'admin' });
}

export async function fetchMobileUsers(): Promise<{ success: boolean; data: EnhancedAdminUser[]; error?: any }> {
  return fetchEnhancedUsers({ user_type: 'mobile_user' });
}

// =====================
// Role Management (Enhanced)
// =====================

export async function assignUserRole(userId: string, roleId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert([{
        user_id: userId,
        role_id: roleId,
        assigned_at: new Date().toISOString()
      }]);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

export async function removeUserRole(userId: string, roleId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

export async function removeAllUserRoles(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Member Linking for Mobile Users
// =====================

export async function linkUserToMember(userId: string, memberId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const updateResult = await updateUserProfile(userId, {
      member_id: memberId
    });

    return updateResult;
  } catch (error) {
    return { success: false, error };
  }
}

export async function unlinkUserFromMember(userId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const updateResult = await updateUserProfile(userId, {
      member_id: undefined
    });

    return updateResult;
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// User Status Management
// =====================

export async function toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: any }> {
  try {
    // Update profile status
    const profileResult = await updateUserProfile(userId, {
      is_active: isActive
    });

    if (!profileResult.success) {
      return profileResult;
    }

    // Update auth user status
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: isActive ? 'none' : '876000h' // ~100 years for disabled users
    });

    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Utility Functions
// =====================

export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles (
          permissions
        )
      `)
      .eq('user_id', userId);

    if (error || !data) {
      return [];
    }

    // Flatten and deduplicate permissions
    const permissions = data.flatMap((ur: any) => ur.roles?.permissions || []);
    return Array.from(new Set(permissions));
  } catch (error) {
    return [];
  }
}

export async function checkUserHasPermission(userId: string, permission: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function checkUserHasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some(permission => userPermissions.includes(permission));
} 