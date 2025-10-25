import { supabase } from '@/lib/supabase';

export type GetInvolvedTemplate = {
  id: string;
  title: string;
  description: string;
  excerpt: string;
  featured_image?: string;
  icon_emoji?: string;
  gradient_colors: {
    from: string;
    to: string;
  };
  ministry_group_id?: string;
  category: 'ministry' | 'volunteer' | 'community' | 'discipleship' | 'outreach' | 'other';
  requirements?: string[];
  benefits?: string[];
  time_commitment?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  application_form_url?: string;
  custom_cta_text?: string;
  custom_cta_url?: string;
  priority_order: number;
  status: 'draft' | 'published' | 'archived';
  seo_meta: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at?: string;
  // Related ministry/group data (populated from join)
  ministry_group?: {
    id: string;
    name: string;
    type: string;
    member_count?: number;
  };
};

// CRUD Operations
export async function fetchGetInvolvedTemplates() {
  try {
    const { data, error } = await supabase
      .from('get_involved_templates')
      .select(`
        *,
        ministry_group:groups(
          id,
          name,
          type
        )
      `)
      .order('priority_order', { ascending: true });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching get involved templates:', error);
    return { data: [], error };
  }
}

export async function fetchGetInvolvedTemplate(id: string) {
  try {
    const { data, error } = await supabase
      .from('get_involved_templates')
      .select(`
        *,
        ministry_group:groups(
          id,
          name,
          type
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching get involved template:', error);
    return { data: null, error };
  }
}

export async function createGetInvolvedTemplate(templateData: Partial<GetInvolvedTemplate>) {
  try {
    const { ministry_group, ...data } = templateData;
    
    const { data: created, error } = await supabase
      .from('get_involved_templates')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: created, error: null };
  } catch (error) {
    console.error('Error creating get involved template:', error);
    return { data: null, error };
  }
}

export async function updateGetInvolvedTemplate(id: string, templateData: Partial<GetInvolvedTemplate>) {
  try {
    const { ministry_group, ...data } = templateData;
    
    const { data: updated, error } = await supabase
      .from('get_involved_templates')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: updated, error: null };
  } catch (error) {
    console.error('Error updating get involved template:', error);
    return { data: null, error };
  }
}

export async function deleteGetInvolvedTemplate(id: string) {
  try {
    const { error } = await supabase
      .from('get_involved_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting get involved template:', error);
    return { error };
  }
}

// Status Management
export async function publishGetInvolvedTemplate(id: string) {
  try {
    const { data, error } = await supabase
      .from('get_involved_templates')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error publishing get involved template:', error);
    return { data: null, error };
  }
}

export async function unpublishGetInvolvedTemplate(id: string) {
  try {
    const { data, error } = await supabase
      .from('get_involved_templates')
      .update({
        status: 'draft',
        published_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error unpublishing get involved template:', error);
    return { data: null, error };
  }
}

export async function archiveGetInvolvedTemplate(id: string) {
  try {
    const { data, error } = await supabase
      .from('get_involved_templates')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error archiving get involved template:', error);
    return { data: null, error };
  }
}

// Utility Functions
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getTemplateCategories() {
  return [
    { value: 'ministry', label: 'Ministry', icon: '⛪' },
    { value: 'volunteer', label: 'Volunteer', icon: '🤝' },
    { value: 'community', label: 'Community', icon: '🏘️' },
    { value: 'discipleship', label: 'Discipleship', icon: '📖' },
    { value: 'outreach', label: 'Outreach', icon: '🌍' },
    { value: 'other', label: 'Other', icon: '⭐' },
  ];
}

export function getGradientPresets() {
  return [
    { name: 'Ocean Blue', from: 'blue-800', to: 'indigo-900' },
    { name: 'Purple Dream', from: 'purple-800', to: 'pink-900' },
    { name: 'Forest Green', from: 'green-800', to: 'teal-900' },
    { name: 'Sunset Orange', from: 'orange-800', to: 'red-900' },
    { name: 'Royal Purple', from: 'indigo-800', to: 'purple-900' },
    { name: 'Emerald Sea', from: 'emerald-800', to: 'cyan-900' },
    { name: 'Golden Hour', from: 'amber-800', to: 'orange-900' },
    { name: 'Deep Night', from: 'slate-800', to: 'gray-900' },
  ];
}

// Metrics and Analytics
export async function getGetInvolvedMetrics() {
  try {
    // Get total count
    const { count: total, error: totalError } = await supabase
      .from('get_involved_templates')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;

    // Get published count
    const { count: published, error: publishedError } = await supabase
      .from('get_involved_templates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    if (publishedError) throw publishedError;

    // Get draft count
    const { count: drafts, error: draftsError } = await supabase
      .from('get_involved_templates')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft');
    
    if (draftsError) throw draftsError;

    // Get categories breakdown
    const { data: categoryData, error: categoryError } = await supabase
      .from('get_involved_templates')
      .select('category')
      .eq('status', 'published');
    
    if (categoryError) throw categoryError;

    const categoriesBreakdown = categoryData?.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      data: {
        total: total || 0,
        published: published || 0,
        drafts: drafts || 0,
        archived: (total || 0) - (published || 0) - (drafts || 0),
        categoriesBreakdown,
        publishRate: total ? Math.round(((published || 0) / total) * 100) : 0,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching get involved metrics:', error);
    return {
      data: {
        total: 0,
        published: 0,
        drafts: 0,
        archived: 0,
        categoriesBreakdown: {},
        publishRate: 0,
      },
      error,
    };
  }
}

// For public-facing website (published templates only)
export async function fetchPublishedGetInvolvedTemplates() {
  try {
    const { data, error } = await supabase
      .from('get_involved_templates')
      .select(`
        *,
        ministry_group:groups(
          id,
          name,
          type
        )
      `)
      .eq('status', 'published')
      .order('priority_order', { ascending: true });
    
    if (error) throw error;
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching published get involved templates:', error);
    return { data: [], error };
  }
} 