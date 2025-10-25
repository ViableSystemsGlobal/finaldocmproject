'use client'

import { useEffect, useState } from 'react'
import { useNextParams } from '@/lib/nextParams'
import { fetchContact } from '@/services/contacts'
import type { Contact } from '@/lib/supabase'
import { Loader2, User, Mail, Phone, MapPin, Briefcase, Calendar, ArrowLeft, Edit } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ViewContactPage() {
  const router = useRouter()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/people/contacts')}
              className="hover:bg-white/50 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Contacts
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {contact.first_name} {contact.last_name}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Contact Details
                </p>
              </div>
            </div>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href={`/people/contacts/${contact.id}/edit`}>
                <Edit className="mr-2 h-5 w-5" />
                Edit Contact
              </Link>
            </Button>
          </div>
        </div>

        {/* Contact Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <span className="text-sm text-slate-500">Full Name</span>
                  <p className="text-slate-800 font-medium">{contact.first_name} {contact.last_name}</p>
                </div>
              </div>
              
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-500">Email</span>
                    <p className="text-slate-800 font-medium">{contact.email}</p>
                  </div>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-500">Phone</span>
                    <p className="text-slate-800 font-medium">{contact.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div>
                  <span className="text-sm text-slate-500">Lifecycle Stage</span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ml-2 ${
                    contact.lifecycle === 'member' 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                      : contact.lifecycle === 'visitor' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {contact.lifecycle}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Additional Details
            </h3>
            
            <div className="space-y-4">
              {contact.date_of_birth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-500">Date of Birth</span>
                    <p className="text-slate-800 font-medium">
                      {new Date(contact.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              {contact.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-500">Location</span>
                    <p className="text-slate-800 font-medium">{contact.location}</p>
                  </div>
                </div>
              )}
              
              {contact.occupation && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="text-sm text-slate-500">Occupation</span>
                    <p className="text-slate-800 font-medium">{contact.occupation}</p>
                  </div>
                </div>
              )}
              
              {!contact.date_of_birth && !contact.location && !contact.occupation && (
                <div className="text-slate-500 text-center py-8">
                  <p>No additional details available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 