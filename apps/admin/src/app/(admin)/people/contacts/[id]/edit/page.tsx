'use client'

import { useEffect, useState } from 'react'
import { useNextParams } from '@/lib/nextParams'
import { ContactForm } from '@/components/ContactForm'
import { fetchContact, updateContact } from '@/services/contacts'
import type { Contact } from '@/lib/supabase'
import { Loader2, UserCog } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function EditContactPage() {
  const params = useParams();
  const { id } = useNextParams(params);
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContact = async () => {
      try {
        const { data, error } = await fetchContact(id as string)
        if (error) throw error
        setContact(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact')
      } finally {
        setLoading(false)
      }
    }

    loadContact()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Contact</h2>
          <p className="text-slate-600">Retrieving contact information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-red-500 text-lg font-semibold">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-slate-600 text-lg">Contact not found</div>
          </div>
        </div>
      </div>
    )
  }

  const handleUpdate = async (data: Partial<Contact>) => {
    await updateContact({ ...data, id: contact.id })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl">
                <UserCog className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Edit Contact
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Update contact information for {contact.first_name} {contact.last_name}
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
          <ContactForm contact={contact} onSubmit={handleUpdate} />
        </div>
      </div>
    </div>
  )
} 