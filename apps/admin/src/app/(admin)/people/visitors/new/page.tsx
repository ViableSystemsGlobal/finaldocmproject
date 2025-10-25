'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CalendarIcon, User, UserPlus, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Avatar } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { createVisitor } from '@/services/visitors'
import { getContactsNotVisitors } from '@/services/visitors'

// Format function for date display
const format = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type Contact = {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  profile_image?: string
}

export default function NewVisitorPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form state
  const [contactId, setContactId] = useState('')
  const [firstVisit, setFirstVisit] = useState<Date | undefined>(new Date())
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true)
        const { data, error } = await getContactsNotVisitors()
        
        if (error) {
          throw new Error(error.message || 'Failed to load contacts')
        }
        
        setContacts(data || [])
        console.log('Loaded contacts:', data?.length || 0)
      } catch (err) {
        console.error('Failed to load contacts:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load contacts'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadContacts()
  }, [])
  
  // Auto-refresh when window gains focus to ensure list is up to date
  useEffect(() => {
    const handleFocus = async () => {
      try {
        const { data, error } = await getContactsNotVisitors()
        if (!error && data) {
          setContacts(data)
          console.log('Refreshed contacts on focus:', data.length)
        }
      } catch (err) {
        console.error('Failed to refresh contacts:', err)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])
  
  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query) ||
      (contact.email || '').toLowerCase().includes(query) ||
      (contact.phone || '').toLowerCase().includes(query)
    )
  })
  
  const handleContactSelect = (id: string) => {
    setContactId(id)
    const contact = contacts.find(c => c.id === id)
    setSelectedContact(contact || null)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contactId || !firstVisit) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a contact and first visit date'
      })
      return
    }

    setSubmitting(true)
    
    try {
      const { error } = await createVisitor({
        contact_id: contactId,
        first_visit: firstVisit.toISOString(),
        notes: notes || undefined,
        saved
      })
      
      if (error) {
        if (error.code === 'VISITOR_EXISTS') {
          toast({
            variant: 'destructive',
            title: 'Contact Already a Visitor',
            description: 'This contact has already been registered as a visitor. Please select a different contact.'
          })
          // Reload contacts to refresh the list
          const { data } = await getContactsNotVisitors()
          setContacts(data || [])
          // Clear the selected contact
          setContactId('')
          setSelectedContact(null)
          setSubmitting(false)
          return
        }
        if (error.code === 'CONTACT_IS_MEMBER') {
          toast({
            variant: 'destructive',
            title: 'Contact is Already a Member',
            description: 'This contact is already a church member. Members cannot be added as visitors.'
          })
          // Reload contacts to refresh the list
          const { data } = await getContactsNotVisitors()
          setContacts(data || [])
          // Clear the selected contact
          setContactId('')
          setSelectedContact(null)
          setSubmitting(false)
          return
        }
        throw error
      }
      
      toast({
        title: 'Success',
        description: 'Visitor created successfully'
      })
      
      router.push('/people/visitors')
    } catch (err) {
      console.error('Failed to create visitor:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create visitor'
      })
      setSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Contacts</h2>
          <p className="text-slate-600">Fetching available contacts...</p>
        </div>
      </div>
    )
  }
  
  if (contacts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/people/visitors')}
                className="hover:bg-white/50 rounded-xl"
                style={{ color: 'rgb(15, 23, 42)' }}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Visitors
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  New Visitor
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Add a new visitor to your system
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-8">
              <div className="text-center">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">No Available Contacts</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  You need to create contacts first before adding them as visitors. 
                  Please create a contact to get started.
                </p>
                <Button 
                  onClick={() => router.push('/people/contacts/new')}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create New Contact
                </Button>
              </div>
            </div>
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
              onClick={() => router.push('/people/visitors')}
              className="hover:bg-white/50 rounded-xl"
              style={{ color: 'rgb(15, 23, 42)' }}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Visitors
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent" style={{ color: 'rgb(15, 23, 42)' }}>
                New Visitor
              </h1>
              <p className="text-xl text-slate-600 mt-2" style={{ color: 'rgb(15, 23, 42)' }}>
                Add a new visitor by selecting an existing contact
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 p-6 border-b border-white/20">
            <h3 className="text-xl font-bold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>Visitor Details</h3>
            <p className="text-slate-600 mt-1" style={{ color: 'rgb(15, 23, 42)' }}>
              Select a contact and provide details of their first visit
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contact" className="text-lg font-semibold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>Select Contact</Label>
                  <Button
                    type="button"
                    onClick={() => {
                      // Open create contact page in new tab and focus on it
                      const newWindow = window.open('/people/contacts/new', '_blank');
                      if (newWindow) {
                        newWindow.focus();
                      }
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Create New Contact
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search contacts by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-4 bg-white/80 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400"
                    style={{ color: 'rgb(15, 23, 42)' }}
                  />
                  <div className="border-2 border-slate-200 rounded-xl max-h-64 overflow-y-auto bg-white/50 backdrop-blur-sm">
                    {filteredContacts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-500 mb-4" style={{ color: 'rgb(15, 23, 42)' }}>
                          {contacts.length > 0 
                            ? 'No contacts match your search' 
                            : 'No contacts available. Members and existing visitors are not shown.'}
                        </p>
                        {contacts.length === 0 && (
                          <Button
                            type="button"
                            onClick={() => {
                              const newWindow = window.open('/people/contacts/new', '_blank');
                              if (newWindow) {
                                newWindow.focus();
                              }
                            }}
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg px-4 py-2 rounded-xl flex items-center gap-2 mx-auto"
                          >
                            <UserPlus className="h-4 w-4" />
                            Create New Contact
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <div 
                          key={contact.id} 
                          className={`flex items-center justify-between p-4 hover:bg-white/70 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 ${
                            contact.id === contactId ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleContactSelect(contact.id)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar 
                              src={contact.profile_image} 
                              alt={`${contact.first_name} ${contact.last_name}`}
                              size="sm"
                            />
                            <div>
                              <p className="font-semibold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>{contact.first_name} {contact.last_name}</p>
                              <p className="text-sm text-slate-500" style={{ color: 'rgb(15, 23, 42)' }}>
                                {contact.email || contact.phone || 'No contact info'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-slate-300">
                            {contact.id === contactId && <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-slate-500">
                    <span className="font-medium">Note:</span> Only contacts who are not already visitors or members are shown.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <Sparkles className="h-4 w-4" />
                    <span>Created a new contact? The list will automatically refresh when you return to this page.</span>
                  </div>
                </div>
                
                {/* Selected contact display */}
                {selectedContact && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center gap-4">
                      <Avatar 
                        src={selectedContact.profile_image} 
                        alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                        size="md"
                      />
                      <div>
                        <p className="font-bold text-slate-800 text-lg" style={{ color: 'rgb(15, 23, 42)' }}>
                          {selectedContact.first_name} {selectedContact.last_name}
                        </p>
                        <p className="text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>
                          {selectedContact.email || selectedContact.phone || 'No contact info'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="first_visit" className="text-lg font-semibold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>First Visit Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="first_visit"
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/80 border-2 border-slate-200 rounded-xl px-4 py-3 hover:bg-white/90",
                        !firstVisit && "text-slate-400"
                      )}
                      style={{ color: 'rgb(15, 23, 42)' }}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5" />
                      {firstVisit ? format(firstVisit) : <span style={{ color: 'rgb(15, 23, 42)' }}>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-2 rounded-xl shadow-xl bg-white/95 backdrop-blur-lg">
                    <Calendar
                      mode="single"
                      selected={firstVisit}
                      onSelectDate={(date) => {
                        setFirstVisit(date)
                        // Don't auto-submit the form
                      }}
                      initialFocus
                      disableFutureDates={true}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="saved" className="text-lg font-semibold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>Salvation Status</Label>
                  <div className="flex items-center space-x-3">
                    <Switch 
                      id="saved" 
                      checked={saved}
                      onCheckedChange={setSaved}
                    />
                    <Label htmlFor="saved" className="text-sm font-medium cursor-pointer">
                      {saved ? (
                        <span className="text-emerald-600 font-semibold" style={{ color: 'rgb(5, 150, 105)' }}>Saved</span>
                      ) : (
                        <span className="text-slate-500" style={{ color: 'rgb(15, 23, 42)' }}>Not saved</span>
                      )}
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-200" style={{ color: 'rgb(15, 23, 42)' }}>
                  <Sparkles className="inline mr-2 h-4 w-4 text-blue-500" />
                  Mark whether this visitor has accepted Jesus as their savior.
                </p>
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="notes" className="text-lg font-semibold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about the visitor's first visit..."
                  rows={4}
                  className="bg-white/80 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400"
                  style={{ color: 'rgb(15, 23, 42)' }}
                />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 p-6 border-t border-white/20">
              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/people/visitors')}
                  className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl px-8 py-3"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !contactId || !firstVisit}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg px-8 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Visitor...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Create Visitor
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 