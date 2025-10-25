import { supabase, supabaseAdmin } from '@/lib/supabase'

// Types
export type FooterSection = {
  id: string
  title: string
  type: 'links' | 'contact' | 'social' | 'newsletter' | 'custom'
  content: any
  order: number
  enabled: boolean
}

export type FooterLink = {
  id: string
  label: string
  url: string
  external: boolean
  enabled: boolean
}

export type SocialLink = {
  platform: string
  url: string
  enabled: boolean
}

// Database structure
type FooterSettingsDB = {
  id?: string
  enabled: boolean
  layout: string
  background_color: string
  text_color: string
  show_church_logo: boolean
  logo_url?: string
  show_copyright: boolean
  copyright_text: string
  sections: FooterSection[]
  updated_at?: string
  created_at?: string
}

// Component structure (camelCase)
export type FooterSettings = {
  id?: string
  enabled: boolean
  layout: string
  backgroundColor: string
  textColor: string
  showChurchLogo: boolean
  logoUrl?: string
  showCopyright: boolean
  copyrightText: string
  sections: FooterSection[]
  updated_at?: string
  created_at?: string
}

/**
 * Convert database format to component format
 */
function dbToComponent(dbData: FooterSettingsDB): FooterSettings {
  return {
    ...dbData,
    backgroundColor: dbData.background_color,
    textColor: dbData.text_color,
    showChurchLogo: dbData.show_church_logo,
    logoUrl: dbData.logo_url,
    showCopyright: dbData.show_copyright,
    copyrightText: dbData.copyright_text
  }
}

/**
 * Convert component format to database format
 */
function componentToDb(componentData: FooterSettings): FooterSettingsDB {
  return {
    id: componentData.id,
    enabled: componentData.enabled,
    layout: componentData.layout,
    background_color: componentData.backgroundColor,
    text_color: componentData.textColor,
    show_church_logo: componentData.showChurchLogo,
    logo_url: componentData.logoUrl,
    show_copyright: componentData.showCopyright,
    copyright_text: componentData.copyrightText,
    sections: componentData.sections,
    created_at: componentData.created_at,
    updated_at: componentData.updated_at
  }
}

/**
 * Fetch footer settings
 */
export async function fetchFooterSettings(): Promise<{ data: FooterSettings | null, error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('footer_settings')
      .select('*')
      .single()

    if (error && error.code === 'PGRST116') {
      // No data found, return default structure
      return { data: null, error: null }
    }

    if (error) {
      throw error
    }

    return { data: dbToComponent(data as FooterSettingsDB), error: null }
  } catch (error) {
    console.error('Error fetching footer settings:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Save footer settings
 */
export async function saveFooterSettings(settings: Omit<FooterSettings, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean, error?: any }> {
  try {
    // Convert to database format
    const dbData = componentToDb(settings as FooterSettings)
    
    // Check if settings already exist
    const { data: existing } = await supabaseAdmin
      .from('footer_settings')
      .select('id')
      .single()

    if (existing) {
      // Update existing settings
      const { error } = await supabaseAdmin
        .from('footer_settings')
        .update({
          ...dbData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) throw error
    } else {
      // Create new settings
      const { error } = await supabaseAdmin
        .from('footer_settings')
        .insert({
          ...dbData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving footer settings:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get default footer settings
 */
export function getDefaultFooterSettings(): FooterSettings {
  return {
    enabled: true,
    layout: 'columns',
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    showChurchLogo: true,
    showCopyright: true,
    copyrightText: '© 2024 Your Church Name. All rights reserved.',
    sections: [
      {
        id: 'contact',
        title: 'Contact Information',
        type: 'contact',
        content: {
          address: '123 Church Street\nCity, State 12345',
          phone: '(555) 123-4567',
          email: 'info@yourchurch.org',
          website: 'https://yourchurch.org'
        },
        order: 1,
        enabled: true
      },
      {
        id: 'quicklinks',
        title: 'Quick Links',
        type: 'links',
        content: {
          links: [
            { id: '1', label: 'About Us', url: '/about', external: false, enabled: true },
            { id: '2', label: 'Ministries', url: '/ministries', external: false, enabled: true },
            { id: '3', label: 'Events', url: '/events', external: false, enabled: true },
            { id: '4', label: 'Give', url: '/give', external: false, enabled: true },
          ]
        },
        order: 2,
        enabled: true
      },
      {
        id: 'connect',
        title: 'Connect',
        type: 'links',
        content: {
          links: [
            { id: '5', label: 'Prayer Requests', url: '/prayer', external: false, enabled: true },
            { id: '6', label: 'Contact Us', url: '/contact', external: false, enabled: true },
            { id: '7', label: 'Visitor Info', url: '/visit', external: false, enabled: true },
            { id: '8', label: 'Small Groups', url: '/groups', external: false, enabled: true },
          ]
        },
        order: 3,
        enabled: true
      },
      {
        id: 'social',
        title: 'Follow Us',
        type: 'social',
        content: {
          links: [
            { platform: 'facebook', url: 'https://facebook.com/yourchurch', enabled: true },
            { platform: 'instagram', url: 'https://instagram.com/yourchurch', enabled: true },
            { platform: 'youtube', url: 'https://youtube.com/yourchurch', enabled: true },
            { platform: 'twitter', url: 'https://twitter.com/yourchurch', enabled: false },
          ]
        },
        order: 4,
        enabled: true
      }
    ]
  }
} 