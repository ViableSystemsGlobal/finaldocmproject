import { supabase } from '@/lib/supabase';

export interface Page {
  id: string;
  slug: string;
  title: string;
  seo_meta: {
    title?: string;
    description?: string;
    image_url?: string;
    keywords?: string[];
  };
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageSection {
  id: string;
  page_id: string;
  type: SectionType;
  order: number;
  props: Record<string, any>;
  created_at: string;
}

export type SectionType = 
  | 'hero'
  | 'event_carousel'
  | 'image_collage'
  | 'sermon_carousel'
  | 'icon_grid'
  | 'testimonial_slider'
  | 'call_to_action'
  | 'media_sections'
  | 'event_list'
  | 'contact_section'
  | 'our_story'
  | 'get_involved'
  | 'mission_vision'
  | 'leadership_team'
  | 'team_highlights';

// Helper function to check if a page is published
export function isPublished(page: Page): boolean {
  return !!page.published_at && new Date(page.published_at) <= new Date();
}

// Pages CRUD operations
export async function fetchPages() {
  return supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function fetchPageBySlug(slug: string) {
  return supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single();
}

export async function fetchPage(id: string) {
  return supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();
}

export async function createPage(data: Omit<Page, 'id' | 'created_at' | 'updated_at'>) {
  return supabase
    .from('pages')
    .insert({
      ...data,
      updated_at: new Date().toISOString()
    })
    .select(); // Add .select() to return the inserted records
}

export async function updatePage(id: string, data: Partial<Omit<Page, 'id' | 'created_at'>>) {
  return supabase
    .from('pages')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
}

export async function deletePage(id: string) {
  return supabase
    .from('pages')
    .delete()
    .eq('id', id);
}

// Page Sections CRUD operations
export async function fetchSections(pageId: string) {
  return supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', pageId)
    .order('order', { ascending: true });
}

export async function createSection(data: Omit<PageSection, 'id' | 'created_at'>) {
  return supabase
    .from('page_sections')
    .insert(data);
}

export async function updateSection(id: string, data: Partial<Omit<PageSection, 'id' | 'created_at'>>) {
  return supabase
    .from('page_sections')
    .update(data)
    .eq('id', id);
}

export async function deleteSection(id: string) {
  return supabase
    .from('page_sections')
    .delete()
    .eq('id', id);
}

// Reorder sections
export async function reorderSections(pageId: string, orderedIds: string[]) {
  // Create a batch of updates
  const updates = orderedIds.map((id, index) => ({
    id,
    order: index
  }));
  
  // Execute updates using a transaction
  return supabase
    .from('page_sections')
    .upsert(updates);
}

// Publish/unpublish a page
export async function publishPage(id: string) {
  return updatePage(id, { published_at: new Date().toISOString() });
}

export async function unpublishPage(id: string) {
  return updatePage(id, { published_at: null });
}

// Save a complete page with its sections
export async function savePageWithSections(
  pageData: Omit<Page, 'id' | 'created_at' | 'updated_at'>,
  sections: Omit<PageSection, 'id' | 'created_at' | 'page_id'>[],
  pageId?: string
) {
  // Start a transaction
  const { data: page, error: pageError } = pageId 
    ? await updatePage(pageId, pageData)
    : await createPage(pageData);
    
  if (pageError) {
    return { error: pageError, data: null };
  }
  
  // Debug page response
  console.log("Page response data:", page);
  
  // Get the page ID based on the response format
  let effectivePageId: string | null = null;
  
  if (pageId) {
    // If we're updating an existing page, use that ID
    effectivePageId = pageId;
  } else if (page) {
    // If creating new page, handle different Supabase response formats
    if (Array.isArray(page) && page.length > 0 && page[0]?.id) {
      // Format when .select() returns array
      effectivePageId = page[0].id;
    } else if (typeof page === 'object' && page !== null && 'id' in page) {
      // Format if returned as single object
      effectivePageId = (page as any).id;
    }
  }
  
  if (!effectivePageId) {
    console.error("Failed to get page ID. Page data:", page);
    return { error: new Error("Failed to get page ID"), data: null };
  }
  
  // Delete existing sections if updating
  if (pageId) {
    await supabase
      .from('page_sections')
      .delete()
      .eq('page_id', pageId);
  }
  
  // Insert new sections
  const { data: newSections, error: sectionsError } = await supabase
    .from('page_sections')
    .insert(
      sections.map((section, index) => ({
        ...section,
        page_id: effectivePageId,
        order: index
      }))
    )
    .select();
    
  if (sectionsError) {
    return { error: sectionsError, data: null };
  }
  
  // Get the full page data with ID
  const { data: fullPageData, error: fetchError } = await fetchPage(effectivePageId);
  
  if (fetchError) {
    console.error("Error fetching complete page data:", fetchError);
    // Still continue with what we have
  }
  
  return { 
    data: { 
      page: fullPageData || { id: effectivePageId, ...pageData },
      sections: newSections 
    }, 
    error: null 
  };
} 