import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      get(name: string) {
        return document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
          ?.split('=')[1]
      },
      set(name: string, value: string, options: { path?: string; maxAge?: number }) {
        document.cookie = `${name}=${value}; path=${options.path || '/'}; max-age=${options.maxAge || 3600}`
      },
      remove(name: string, options: { path?: string }) {
        document.cookie = `${name}=; path=${options.path || '/'}; max-age=0`
      },
    },
  }
)

export type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  profile_image: string | null
  tenant_id: string
  campus_id: string | null
  lifecycle: string
  created_at: string
  updated_at: string
}

export type Member = {
  contact_id: string
  joined_at: string
  notes: string | null
  created_at: string
  updated_at: string
  contacts?: Contact
}

export type Group = {
  id: string
  name: string
  description: string | null
  type: string
  tenant_id: string
  campus_id: string | null
  created_at: string
  updated_at: string
}

export type GroupMembership = {
  id: string
  group_id: string
  contact_id: string
  role: string | null
  joined_at: string
  created_at: string
  updated_at: string
}

export type MobileAppUser = {
  id: string
  contact_id: string
  device_token: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      'contacts': {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
      },
      'members': {
        Row: Member
        Insert: Omit<Member, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Member, 'contact_id' | 'created_at' | 'updated_at'>>
      },
      'groups': {
        Row: Group
        Insert: Omit<Group, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Group, 'id' | 'created_at' | 'updated_at'>>
      },
      'group_memberships': {
        Row: GroupMembership
        Insert: Omit<GroupMembership, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<GroupMembership, 'id' | 'created_at' | 'updated_at'>>
      },
      'mobile_app_users': {
        Row: MobileAppUser
        Insert: Omit<MobileAppUser, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MobileAppUser, 'id' | 'created_at' | 'updated_at'>>
      }
    },
    Functions: {
      count_members_serving: {
        Args: Record<string, never>
        Returns: number
      },
      count_member_app_users: {
        Args: Record<string, never>
        Returns: number
      }
    }
  }
} 