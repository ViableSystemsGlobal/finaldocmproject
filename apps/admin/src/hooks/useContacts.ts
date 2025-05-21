import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  lifecycle?: string
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchContacts() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone, lifecycle')
          .order('last_name')

        if (error) throw new Error(error.message)
        
        setContacts(data || [])
      } catch (err) {
        console.error('Error fetching contacts:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchContacts()
  }, [])

  return { contacts, isLoading, error }
} 