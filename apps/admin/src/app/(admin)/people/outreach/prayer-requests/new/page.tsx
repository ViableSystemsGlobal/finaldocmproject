'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Users, FileText, Clock, Heart, CalendarIcon, AlertCircle, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createPrayerRequest } from '@/services/prayerRequests'
import { useContacts } from '@/hooks/useContacts'

export default function NewPrayerRequestPage() {
  const router = useRouter()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactId, setContactId] = useState('')
  const [category, setCategory] = useState('')
  const [request, setRequest] = useState('')
  const [isPrivate, setIsPrivate] = useState('false')
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<any>(null)
  
  // Use the custom hooks for contacts
  const { contacts, isLoading: isContactsLoading, error: contactsError } = useContacts()
  
  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase().includes(query) ||
      (contact.email || '').toLowerCase().includes(query) ||
      (contact.phone || '').toLowerCase().includes(query)
    )
  })
  
  const handleContactSelect = (contact: any) => {
    setContactId(contact.id)
    setSelectedContact(contact)
  }
  
  // Prayer request categories
  const prayerCategories = [
    'Health & Healing',
    'Family & Relationships',
    'Work & Career',
    'Financial',
    'Spiritual Growth',
    'Travel Safety',
    'Grief & Loss',
    'Guidance & Direction',
    'Thanksgiving & Praise',
    'Other'
  ]
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!contactId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Contact is required'
      })
      return
    }
    
    if (!category) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Prayer category is required'
      })
      return
    }
    
    if (!request.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Prayer request is required'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Create prayer request
      const { error } = await createPrayerRequest({
        contact_id: contactId,
        title: category,
        description: `${request.trim()}${notes.trim() ? '\n\nAdditional Notes:\n' + notes.trim() : ''}${isPrivate === 'true' ? '\n\n[PRIVATE REQUEST - Pastoral care only]' : ''}`,
        status: 'new'
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Prayer request created successfully',
      })
      
      // Navigate back to prayer requests list
      router.push('/people/outreach/prayer-requests')
      router.refresh()
    } catch (err) {
      console.error('Error creating prayer request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create prayer request',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Loading state
  const isLoading = isContactsLoading

  // Show errors if any
  useEffect(() => {
    if (contactsError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contacts. ' + contactsError.message
      })
    }
  }, [contactsError])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              asChild
              className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl"
            >
              <Link href="/people/outreach/prayer-requests">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  New Prayer Request
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Submit a new prayer request for the community
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-lg text-slate-600">Loading contacts...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact & Category Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Contact & Category</h2>
                    <p className="text-blue-100">Select the person and prayer category</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="contact" className="text-base font-semibold text-slate-700">
                      Contact <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search contacts by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-4 bg-white/80 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                      />
                      <div className="border-2 border-slate-200 rounded-xl max-h-64 overflow-y-auto bg-white/50 backdrop-blur-sm">
                        {filteredContacts.length === 0 ? (
                          <p className="text-center py-8 text-slate-500">
                            {contacts.length > 0 
                              ? 'No contacts match your search' 
                              : 'No contacts available'}
                          </p>
                        ) : (
                          filteredContacts.map((contact) => (
                            <div 
                              key={contact.id} 
                              className={`flex items-center justify-between p-4 hover:bg-white/70 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 ${
                                contact.id === contactId ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' : ''
                              }`}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleContactSelect(contact)
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar 
                                  alt={`${contact.first_name} ${contact.last_name}`}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-semibold text-slate-800">{contact.first_name} {contact.last_name}</p>
                                  <p className="text-sm text-slate-500">
                                    {contact.email || contact.phone || 'No contact info'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-300">
                                {contact.id === contactId && <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Selected contact display */}
                    {selectedContact && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center gap-4">
                          <Avatar 
                            alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                            size="md"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-lg">
                              {selectedContact.first_name} {selectedContact.last_name}
                            </p>
                            <p className="text-slate-600">
                              {selectedContact.email || selectedContact.phone || 'No contact info'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-slate-500">
                      The person requesting prayer
                    </p>
                  </div>
                  
                  {/* Prayer Category */}
                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-base font-semibold text-slate-700">
                      Prayer Category <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={setCategory}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        id="category"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select prayer category" />
                      </SelectTrigger>
                      <SelectContent>
                        {prayerCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">
                      The type of prayer needed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prayer Request Details Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Prayer Request Details</h2>
                    <p className="text-purple-100">Share the prayer request and privacy preferences</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  {/* Prayer Request */}
                  <div className="space-y-3">
                    <Label htmlFor="request" className="text-base font-semibold text-slate-700">
                      Prayer Request <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="request"
                      value={request}
                      onChange={(e) => setRequest(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Please share what you would like prayer for..."
                      className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                    <p className="text-sm text-slate-500">
                      Describe the situation or need you'd like prayer for
                    </p>
                  </div>

                  {/* Privacy Setting */}
                  <div className="space-y-3">
                    <Label htmlFor="is_private" className="text-base font-semibold text-slate-700">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Privacy Setting
                    </Label>
                    <Select 
                      value={isPrivate}
                      onValueChange={setIsPrivate}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        id="is_private"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select privacy setting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">📢 Public - Share with prayer teams</SelectItem>
                        <SelectItem value="true">🔒 Private - Pastoral care only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">
                      Choose who can see this prayer request
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Additional Notes</h2>
                    <p className="text-emerald-100">Any additional context or details</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Any additional context, background, or specific prayer instructions..."
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-sm text-slate-500">
                    Additional information that might help in prayer (optional)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/people/outreach/prayer-requests')}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Request...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Submit Prayer Request
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 