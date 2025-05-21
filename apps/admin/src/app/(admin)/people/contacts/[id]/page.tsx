'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ContactForm } from '@/components/ContactForm'
import { fetchContact, updateContact } from '@/services/contacts'
import type { Contact } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function EditContactPage() {
  const params = useParams()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContact = async () => {
      try {
        const { data, error } = await fetchContact(params.id as string)
        if (error) throw error
        setContact(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact')
      } finally {
        setLoading(false)
      }
    }

    loadContact()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div>Contact not found</div>
      </div>
    )
  }

  const handleUpdate = async (data: Partial<Contact>) => {
    await updateContact({ ...data, id: contact.id })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Contact</h1>
      <ContactForm contact={contact} onSubmit={handleUpdate} />
    </div>
  )
} 