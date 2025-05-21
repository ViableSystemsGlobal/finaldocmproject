import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type User = {
  id: string
  email: string
  raw_user_meta_data: {
    first_name?: string
    last_name?: string
    name?: string
  }
  // Computed properties for compatibility
  name?: string
  first_name?: string
  last_name?: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true)
        let userData: User[] = [];
        
        try {
          // First, try to use the users view if it exists
          const { data, error } = await supabase
            .from('users')
            .select('id, email, raw_user_meta_data')
            .order('email');
            
          if (!error) {
            userData = data || [];
          }
        } catch (viewError) {
          console.log('Users view not available, falling back to auth API');
          // If the view doesn't exist, try to use auth.users directly
          const { data, error } = await supabase.auth.admin.listUsers();
          
          if (error) throw error;
          
          // Map from auth.users format to our expected format
          userData = (data?.users || []).map(user => ({
            id: user.id,
            email: user.email || '',
            raw_user_meta_data: user.user_metadata || {},
          }));
        }
        
        // Process the raw data to extract name fields from raw_user_meta_data
        const processedUsers = userData.map(user => ({
          ...user,
          name: user.raw_user_meta_data?.name || 
                `${user.raw_user_meta_data?.first_name || ''} ${user.raw_user_meta_data?.last_name || ''}`.trim() || 
                user.email,
          first_name: user.raw_user_meta_data?.first_name,
          last_name: user.raw_user_meta_data?.last_name
        }))
        
        setUsers(processedUsers)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return { users, isLoading, error }
} 