import { supabase, supabaseAdmin } from '@/lib/supabase';

// =====================
// TypeScript Types
// =====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string | any;
}

export interface TenantSettings {
  id: string;
  name: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  time_zone: string;
  logo_url?: string;
  logo_white_url?: string;
  logo_black_url?: string;
  logo_mobile_url?: string;
  logo_web_url?: string;
  logo_admin_url?: string;
  primary_color: string;
  secondary_color: string;
  website?: string;
  description?: string;
  // Contact page specific settings
  prayer_line?: string;
  response_time?: string;
  office_hours_weekdays?: string;
  office_hours_weekends?: string;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country: string;
  phone?: string;
  email?: string;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  entity: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'date' | 'dropdown' | 'toggle' | 'number' | 'email' | 'phone';
  options?: string[];
  required: boolean;
  visible: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger_type: 'on_create' | 'on_update' | 'scheduled' | 'manual';
  trigger_config?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_type: 'delay' | 'send_email' | 'send_sms' | 'create_follow_up' | 'assign_group' | 'update_field';
  config: any;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CommsDefault {
  id: string;
  template_name: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push';
  subject?: string;
  body: string;
  variables_schema: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GivingCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Navigation {
  id: string;
  label: string;
  href: string;
  order: number;
  is_active: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  children?: Navigation[];
}

export interface FooterBlock {
  id: string;
  title?: string;
  content?: string;
  block_type: 'text' | 'links' | 'contact' | 'social';
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
  role?: Role;
}

export interface IntegrationSetting {
  id: string;
  provider: string;
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// =====================
// Tenant Settings
// =====================

export async function fetchTenantSettings() {
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .select('*')
      .single();
    
    return { success: !error, data: data as TenantSettings | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

// Get current tenant settings for branding/layout
export async function getCurrentTenantSettings(): Promise<TenantSettings> {
  try {
    const { data, error } = await supabase
      .from('tenant_settings')
      .select('*')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return default
        return {
          id: '',
          name: 'Mobile App Admin',
          time_zone: 'America/New_York',
          primary_color: '#1A202C',
          secondary_color: '#F6E05E',
          logo_url: '/mobile-app-icon.png',
          created_at: '',
          updated_at: ''
        };
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    // Return default settings on error
    return {
      id: '',
      name: 'Mobile App Admin',
      time_zone: 'America/New_York',
      primary_color: '#1A202C',
      secondary_color: '#F6E05E',
      logo_url: '/mobile-app-icon.png',
      created_at: '',
      updated_at: ''
    };
  }
}

export async function updateTenantSettings(updates: Partial<TenantSettings>): Promise<ServiceResponse<TenantSettings>> {
  try {
    console.log('Updating tenant settings with:', updates);
    
    // First, check if any settings exist
    const { data: existing, error: fetchError } = await supabase
      .from('tenant_settings')
      .select('*')
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('tenant_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('tenant_settings')
        .insert({
          name: updates.name || 'Mobile App Admin',
          time_zone: updates.time_zone || 'America/New_York',
          primary_color: updates.primary_color || '#1A202C',
          secondary_color: updates.secondary_color || '#F6E05E',
          ...updates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    }
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update settings' 
    };
  }
}

export async function createTenantSettings(settings: Omit<TenantSettings, 'id' | 'created_at' | 'updated_at'>) {
  try {
    console.log('Creating tenant settings with:', settings);
    
    const { data, error } = await supabase
      .from('tenant_settings')
      .insert([settings])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating tenant settings:', error);
      return { 
        success: false, 
        data: null, 
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      };
    }
    
    console.log('Tenant settings created successfully:', data);
    return { success: true, data: data as TenantSettings, error: null };
  } catch (error) {
    console.error('Unexpected error in createTenantSettings:', error);
    return { success: false, data: null, error: error };
  }
}

// =====================
// Campus Management
// =====================

export async function fetchCampuses() {
  try {
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .order('name');
    
    return { success: !error, data: data as Campus[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function fetchCampus(id: string) {
  try {
    const { data, error } = await supabase
      .from('campuses')
      .select('*')
      .eq('id', id)
      .single();
    
    return { success: !error, data: data as Campus | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createCampus(campus: Omit<Campus, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('campuses')
      .insert([campus])
      .select()
      .single();
    
    return { success: !error, data: data as Campus | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateCampus(id: string, updates: Partial<Campus>) {
  try {
    console.log('Updating campus with ID:', id, 'Updates:', updates);
    
    const { data, error } = await supabase
      .from('campuses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating campus:', error);
      return { 
        success: false, 
        data: null, 
        error: {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        }
      };
    }
    
    console.log('Campus updated successfully:', data);
    return { success: true, data: data as Campus, error: null };
  } catch (error) {
    console.error('Unexpected error in updateCampus:', error);
    
    // Better error handling for different error types
    if (error instanceof Error) {
      return { 
        success: false, 
        data: null, 
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      };
    } else if (typeof error === 'object' && error !== null) {
      return { 
        success: false, 
        data: null, 
        error: error
      };
    } else {
      return { 
        success: false, 
        data: null, 
        error: {
          message: 'An unknown error occurred while updating the campus',
          originalError: String(error)
        }
      };
    }
  }
}

export async function deleteCampus(id: string) {
  try {
    const { error } = await supabase
      .from('campuses')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Custom Fields
// =====================

export async function fetchCustomFields(entity?: string) {
  try {
    let query = supabase.from('custom_fields').select('*');
    
    if (entity) {
      query = query.eq('entity', entity);
    }
    
    const { data, error } = await query.order('order');
    
    return { success: !error, data: data as CustomField[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createCustomField(field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('custom_fields')
      .insert([field])
      .select()
      .single();
    
    return { success: !error, data: data as CustomField | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateCustomField(id: string, updates: Partial<CustomField>) {
  try {
    const { data, error } = await supabase
      .from('custom_fields')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as CustomField | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function deleteCustomField(id: string) {
  try {
    const { error } = await supabase
      .from('custom_fields')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Custom Field Values
// =====================

export async function fetchCustomFieldValues(entityType: string, entityId: string) {
  try {
    // For members, we need to get values from the contacts table via the member's contact_id
    let query;
    if (entityType === 'members') {
      // First get the contact_id from the member
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('contact_id')
        .eq('contact_id', entityId)
        .single();
        
      if (memberError) {
        return { success: false, data: null, error: memberError };
      }
      
      // Then get custom fields from the contact
      query = supabase
        .from('contacts')
        .select('custom_fields')
        .eq('id', memberData.contact_id)
        .single();
    } else {
      // For other entities, get custom_fields directly
      query = supabase
        .from(entityType)
        .select('custom_fields')
        .eq('id', entityId)
        .single();
    }
    
    const { data, error } = await query;
    
    return { 
      success: !error, 
      data: data?.custom_fields || {}, 
      error 
    };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function saveCustomFieldValues(entityType: string, entityId: string, values: Record<string, any>) {
  try {
    let query;
    if (entityType === 'members') {
      // For members, we need to update the contacts table via the member's contact_id
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('contact_id')
        .eq('contact_id', entityId)
        .single();
        
      if (memberError) {
        return { success: false, data: null, error: memberError };
      }
      
      // Update custom fields in the contact
      query = supabase
        .from('contacts')
        .update({ custom_fields: values })
        .eq('id', memberData.contact_id)
        .select('custom_fields')
        .single();
    } else {
      // For other entities, update custom_fields directly
      query = supabase
        .from(entityType)
        .update({ custom_fields: values })
        .eq('id', entityId)
        .select('custom_fields')
        .single();
    }
    
    const { data, error } = await query;
    
    return { 
      success: !error, 
      data: data?.custom_fields || {}, 
      error 
    };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

// =====================
// Workflows
// =====================

export async function fetchWorkflows() {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select(`
        *,
        steps:workflow_steps(*)
      `)
      .order('name');
    
    return { success: !error, data: data as Workflow[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function fetchWorkflow(id: string) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select(`
        *,
        steps:workflow_steps(*)
      `)
      .eq('id', id)
      .single();
    
    return { success: !error, data: data as Workflow | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'steps'>) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .insert([workflow])
      .select()
      .single();
    
    return { success: !error, data: data as Workflow | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateWorkflow(id: string, updates: Partial<Workflow>) {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as Workflow | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Workflow Steps
// =====================

export async function fetchWorkflowSteps(workflowId: string) {
  try {
    const { data, error } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('order');
    
    return { success: !error, data: data as WorkflowStep[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createWorkflowStep(step: Omit<WorkflowStep, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('workflow_steps')
      .insert([step])
      .select()
      .single();
    
    return { success: !error, data: data as WorkflowStep | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateWorkflowStep(id: string, updates: Partial<WorkflowStep>) {
  try {
    const { data, error } = await supabase
      .from('workflow_steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as WorkflowStep | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function deleteWorkflowStep(id: string) {
  try {
    const { error } = await supabase
      .from('workflow_steps')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Communication Defaults
// =====================

export async function fetchCommsDefaults() {
  try {
    const { data, error } = await supabase
      .from('comms_defaults')
      .select('*')
      .order('template_name');
    
    return { success: !error, data: data as CommsDefault[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateCommsDefault(id: string, updates: Partial<CommsDefault>) {
  try {
    const { data, error } = await supabase
      .from('comms_defaults')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as CommsDefault | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createCommsDefault(template: Omit<CommsDefault, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('comms_defaults')
      .insert([template])
      .select()
      .single();
    
    return { success: !error, data: data as CommsDefault | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

// =====================
// Giving Categories
// =====================

export async function fetchGivingCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from('giving_categories')
      .select('*')
      .order('order');
    
    return { success: !error, data: data as GivingCategory[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createGivingCategory(category: Omit<GivingCategory, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('giving_categories')
      .insert([category])
      .select()
      .single();
    
    return { success: !error, data: data as GivingCategory | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateGivingCategory(id: string, updates: Partial<GivingCategory>) {
  try {
    const { data, error } = await supabase
      .from('giving_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as GivingCategory | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function deleteGivingCategory(id: string) {
  try {
    const { error } = await supabase
      .from('giving_categories')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Payment Categories
// =====================

export interface PaymentCategory {
  id: string;
  name: string;
  description: string | null;
  category_type: 'card' | 'bank' | 'cash' | 'digital' | 'crypto' | 'other';
  is_active: boolean;
  requires_reference: boolean;
  order: number;
  processing_fee_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPaymentCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_categories')
      .select('*')
      .eq('is_active', true)
      .order('order');
    
    return { success: !error, data: data as PaymentCategory[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

// =====================
// Navigation & Footer
// =====================

export async function fetchNavLinks() {
  try {
    const { data, error } = await supabase
      .from('navigation')
      .select('*')
      .order('order');
    
    return { success: !error, data: data as Navigation[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createNavLink(link: Omit<Navigation, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('navigation')
      .insert([link])
      .select()
      .single();
    
    return { success: !error, data: data as Navigation | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateNavLink(id: string, updates: Partial<Navigation>) {
  try {
    const { data, error } = await supabase
      .from('navigation')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as Navigation | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function deleteNavLink(id: string) {
  try {
    const { error } = await supabase
      .from('navigation')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchFooterBlocks() {
  try {
    const { data, error } = await supabase
      .from('footer_blocks')
      .select('*')
      .order('order');
    
    return { success: !error, data: data as FooterBlock[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createFooterBlock(block: Omit<FooterBlock, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('footer_blocks')
      .insert([block])
      .select()
      .single();
    
    return { success: !error, data: data as FooterBlock | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateFooterBlock(id: string, updates: Partial<FooterBlock>) {
  try {
    const { data, error } = await supabase
      .from('footer_blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as FooterBlock | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function deleteFooterBlock(id: string) {
  try {
    const { error } = await supabase
      .from('footer_blocks')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

// =====================
// Roles & Permissions
// =====================

export async function fetchRoles() {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    
    return { success: !error, data: data as Role[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert([role])
      .select()
      .single();
    
    return { success: !error, data: data as Role | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function updateRole(id: string, updates: Partial<Role>) {
  try {
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { success: !error, data: data as Role | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function deleteRole(id: string) {
  try {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}

export async function fetchUserRoles(userId?: string) {
  try {
    let query = supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*)
      `);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    return { success: !error, data: data as UserRole[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function assignUserRole(userId: string, roleId: string) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role_id: roleId }])
      .select()
      .single();
    
    return { success: !error, data: data as UserRole | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function removeUserRole(userId: string, roleId: string) {
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

// =====================
// Integration Settings
// =====================

export async function fetchIntegrations() {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .select('*')
      .order('provider');
    
    return { success: !error, data: data as IntegrationSetting[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function upsertIntegration(provider: string, config: any) {
  try {
    const { data, error } = await supabase
      .from('integration_settings')
      .upsert([{ provider, config }], { onConflict: 'provider' })
      .select()
      .single();
    
    return { success: !error, data: data as IntegrationSetting | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

// =====================
// Audit Logs
// =====================

export async function fetchAuditLogs(limit: number = 100, offset: number = 0) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return { success: !error, data: data as AuditLog[] | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([log])
      .select()
      .single();
    
    return { success: !error, data: data as AuditLog | null, error };
  } catch (error) {
    return { success: false, data: null, error };
  }
}

// =====================
// User Management
// =====================

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone?: string;
  department?: string;
  user_metadata: {
    first_name?: string;
    last_name?: string;
    name?: string;
    avatar_url?: string;
  };
  app_metadata: {
    role?: string;
    permissions?: string[];
  };
  // Computed properties
  display_name?: string;
  roles?: Role[];
  is_active?: boolean;
}

export async function fetchUsers() {
  try {
    console.log('🔍 Attempting to fetch users via API...');
    
    const response = await fetch('/api/admin/users');
    const result = await response.json();
    
    if (!response.ok) {
      console.warn('⚠️ API request failed:', result);
      return { success: false, data: null, error: result.error };
    }
    
    console.log('✅ Users fetched successfully via API');
    
    // Transform the API response to match AdminUser interface
    const transformedUsers: AdminUser[] = result.users.map((user: any) => ({
      id: user.user_id, // Map user_id to id
      email: user.email,
      created_at: '', // Not provided by current API
      last_sign_in_at: undefined,
      email_confirmed_at: undefined,
      phone: user.phone,
      department: undefined,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : undefined,
        avatar_url: user.avatar_url
      },
      app_metadata: {
        role: undefined,
        permissions: []
      },
      display_name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
      roles: [],
      is_active: true
    }));
    
    return { success: true, data: transformedUsers, error: null };
    
  } catch (error) {
    console.error('💥 Network error fetching users:', error);
    
    // Better error object handling
    let errorObj;
    if (error instanceof Error) {
      errorObj = {
        message: error.message,
        name: error.name,
        code: 'NETWORK_ERROR'
      };
    } else {
      errorObj = {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        originalError: String(error)
      };
    }
    
    return { success: false, data: null, error: errorObj };
  }
}

export async function createUser(userData: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  role_ids?: string[];
}) {
  try {
    console.log('👤 Creating user via API...');
    
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.warn('⚠️ User creation failed:', result);
      return { success: false, data: null, error: result };
    }
    
    console.log('✅ User created successfully via API');
    // The API returns the user directly, not wrapped in a data field
    return { success: true, data: result, error: null };
    
  } catch (error) {
    console.error('💥 Network error creating user:', error);
    return { 
      success: false, 
      data: null, 
      error: {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export async function updateUser(userId: string, updates: {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  password?: string;
  role_ids?: string[];
}) {
  try {
    console.log('✏️ Updating user via API...');
    
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.warn('⚠️ User update failed:', result);
      return { success: false, data: null, error: result };
    }
    
    console.log('✅ User updated successfully via API');
    // The API returns the user directly, not wrapped in a data field
    return { success: true, data: result, error: null };
    
  } catch (error) {
    console.error('💥 Network error updating user:', error);
    return { 
      success: false, 
      data: null, 
      error: {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export async function deleteUser(userId: string) {
  try {
    console.log('🗑️ Deleting user via API...');
    
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.warn('⚠️ User deletion failed:', result);
      return { success: false, error: result };
    }
    
    console.log('✅ User deleted successfully via API');
    return { success: true, error: null };
    
  } catch (error) {
    console.error('💥 Network error deleting user:', error);
    return { 
      success: false, 
      error: {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export async function resetUserPassword(userId: string) {
  try {
    console.log('🔑 Resetting user password via API...');
    
    const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.warn('⚠️ Password reset failed:', result);
      return { success: false, error: result.error };
    }
    
    console.log('✅ Password reset sent successfully via API');
    return { success: true, error: null };
    
  } catch (error) {
    console.error('💥 Network error resetting password:', error);
    return { 
      success: false, 
      error: {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export async function toggleUserStatus(userId: string, disabled: boolean) {
  try {
    console.log('🔄 Toggling user status via API...');
    
    const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ disabled }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.warn('⚠️ Status toggle failed:', result);
      return { success: false, data: null, error: result.error };
    }
    
    console.log('✅ User status toggled successfully via API');
    return { success: true, data: result.data, error: null };
    
  } catch (error) {
    console.error('💥 Network error toggling status:', error);
    return { 
      success: false, 
      data: null, 
      error: {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
} 