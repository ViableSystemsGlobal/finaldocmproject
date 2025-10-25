'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Users, FileText, Clock, UserCheck, CalendarIcon, MapPin, Heart, Plus, X, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { createSoul, createMultipleSouls, getContactsNotMembers, createContactForSoulWinning } from '@/services/soulWinning'
import { fetchMembers } from '@/services/members'

type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  profile_image?: string
  lifecycle?: string
}

type Member = {
  contact_id: string
  joined_at: string
  notes?: string
  created_at: string
  is_serving?: boolean
  is_app_user?: boolean
  contacts: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    profile_image?: string | null
  } | null
}

export default function NewSoulWinningPage() {
  const router = useRouter()
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [type, setType] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [witnessedBy, setWitnessedBy] = useState('none')
  const [notes, setNotes] = useState('')
  
  // Contact selection state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showContactResults, setShowContactResults] = useState(false)
  
  // Contact creation state
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false)
  const [newContactForm, setNewContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })
  const [isCreatingContact, setIsCreatingContact] = useState(false)
  
  // Data state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [isContactsLoading, setIsContactsLoading] = useState(true)
  const [isMembersLoading, setIsMembersLoading] = useState(true)
  
  // Load contacts that are not members
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setIsContactsLoading(true)
        const { data, error } = await getContactsNotMembers()
        
        if (error) {
          throw new Error('Failed to load contacts')
        }
        
        setContacts(data || [])
        setSearchResults(data || [])
        console.log('Loaded non-member contacts:', data?.length || 0)
      } catch (err) {
        console.error('Failed to load contacts:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load contacts'
        })
      } finally {
        setIsContactsLoading(false)
      }
    }
    
    loadContacts()
  }, [])

  // Load members for "witnessed by" dropdown
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsMembersLoading(true)
        const { data, error } = await fetchMembers()
        
        if (error) {
          throw new Error('Failed to load members')
        }
        
        setMembers((data || []) as Member[])
        console.log('Loaded members:', data?.length || 0)
      } catch (err) {
        console.error('Failed to load members:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load members'
        })
      } finally {
        setIsMembersLoading(false)
      }
    }
    
    loadMembers()
  }, [])
  
  // Soul winning types
  const soulWinningTypes = [
    'Salvation',
    'Rededication', 
    'Baptism commitment',
    'Church membership',
    'Prayer for healing',
    'Other'
  ]
  
  // Handle contact search
  const handleContactSearch = (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      setSearchResults(contacts)
      setShowContactResults(false)
      return
    }
    
    const filtered = contacts.filter(contact => {
      const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()
      const email = contact.email?.toLowerCase() || ''
      const phone = contact.phone || ''
      const searchTerm = query.toLowerCase()
      
      return fullName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             phone.includes(searchTerm)
    })
    
    setSearchResults(filtered)
    setShowContactResults(true)
  }
  
  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    // Check if already selected
    if (selectedContacts.some(c => c.id === contact.id)) {
      return
    }
    
    setSelectedContacts(prev => [...prev, contact])
    setSearchQuery('')
    setShowContactResults(false)
  }
  
  // Handle contact removal
  const handleContactRemove = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId))
  }
  
  // Handle new contact creation
  const handleCreateContact = async () => {
    if (!newContactForm.first_name.trim() || !newContactForm.last_name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'First name and last name are required'
      })
      return
    }
    
    try {
      setIsCreatingContact(true)
      
      const { data, error } = await createContactForSoulWinning(newContactForm)
      
      if (error) {
        throw error
      }
      
      if (data) {
        // Add to selected contacts
        setSelectedContacts(prev => [...prev, data])
        
        // Add to contacts list for future searches
        setContacts(prev => [...prev, data])
        setSearchResults(prev => [...prev, data])
        
        // Reset form and close dialog
        setNewContactForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: ''
        })
        setShowCreateContactDialog(false)
        
        toast({
          title: 'Success',
          description: 'Contact created and selected successfully'
        })
      }
    } catch (err: any) {
      console.error('Error creating contact:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to create contact'
      })
    } finally {
      setIsCreatingContact(false)
    }
  }
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (selectedContacts.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select at least one contact'
      })
      return
    }
    
    if (!type) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Soul winning type is required'
      })
      return
    }
    
    if (!date) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Date is required'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      let response
      
      if (selectedContacts.length === 1) {
        // Single contact - use existing function
        response = await createSoul({
          contact_id: selectedContacts[0].id,
          saved: type === 'Salvation',
          inviter_type: type,
          inviter_contact_id: witnessedBy === 'none' ? undefined : witnessedBy || undefined,
          inviter_name: location || undefined,
          notes: notes || undefined
        })
      } else {
        // Multiple contacts - use batch function
        response = await createMultipleSouls({
          contact_ids: selectedContacts.map(c => c.id),
          saved: type === 'Salvation',
          inviter_type: type,
          inviter_contact_id: witnessedBy === 'none' ? undefined : witnessedBy || undefined,
          inviter_name: location || undefined,
          notes: notes || undefined
        })
      }
      
      if (response.error) {
        if ((response.error as any)?.code === 'CONTACT_IS_MEMBER') {
          toast({
            variant: 'destructive',
            title: 'Contact is Already a Member',
            description: 'One or more contacts are already church members. Soul winning records cannot be created for existing members.'
          })
          // Reload contacts to refresh the list
          const { data } = await getContactsNotMembers()
          setContacts(data || [])
          setSearchResults(data || [])
          setIsSubmitting(false)
          return
        } else if ((response.error as any)?.code === 'ALL_CONTACTS_ARE_MEMBERS') {
          toast({
            variant: 'destructive',
            title: 'All Contacts Are Members',
            description: (response.error as any)?.message || 'All selected contacts are already members'
          })
          // Reload contacts to refresh the list
          const { data } = await getContactsNotMembers()
          setContacts(data || [])
          setSearchResults(data || [])
          setIsSubmitting(false)
          return
        }
        throw response.error
      }
      
      // Success message
      const count = selectedContacts.length
      const skipped = (response as any).results?.skipped || 0
      const created = (response as any).results?.created || count
      
      let message = `${created} soul winning record${created > 1 ? 's' : ''} created successfully`
      if (skipped > 0) {
        message += `. ${skipped} contact${skipped > 1 ? 's were' : ' was'} skipped (already member${skipped > 1 ? 's' : ''})`
      }
      
      toast({
        title: 'Success',
        description: message,
      })
      
      // Navigate back to soul winning list
      router.push('/people/outreach/soul-winning')
      router.refresh()
    } catch (err) {
      console.error('Error creating soul winning record(s):', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create soul winning record(s)',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Loading state
  const isLoading = isContactsLoading || isMembersLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100">
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
              <Link href="/people/outreach/soul-winning">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-rose-500 p-4 rounded-2xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  New Soul Winning Record
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Record soul winning encounters and spiritual decisions
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-lg text-slate-600">Loading contacts and members...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Selection Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Select Contacts</h2>
                    <p className="text-blue-100">Choose people for this soul winning record</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                {/* Selected Contacts */}
                {selectedContacts.length > 0 && (
                  <div className="mb-6">
                    <Label className="text-base font-semibold text-slate-700 mb-3 block">
                      Selected Contacts ({selectedContacts.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedContacts.map(contact => (
                        <div key={contact.id} className="flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm">
                          <span>{contact.first_name} {contact.last_name}</span>
                          <button
                            type="button"
                            onClick={() => handleContactRemove(contact.id)}
                            className="ml-2 rounded-full p-0.5 hover:bg-blue-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Contact Search */}
                <div className="space-y-3 relative">
                  <Label className="text-base font-semibold text-slate-700">
                    Search and Select Contacts <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleContactSearch(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      className="pl-10 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {showContactResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
                      {searchResults
                        .filter(contact => !selectedContacts.some(c => c.id === contact.id))
                        .map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => handleContactSelect(contact)}
                            className="w-full rounded-sm p-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {contact.email || contact.phone || 'No contact info'}
                              </div>
                            </div>
                            <Plus className="h-4 w-4 text-slate-400" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                
                {/* Add New Contact Button */}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateContactDialog(true)}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-600"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Contact
                  </Button>
                </div>
              </div>
            </div>

            {/* Decision Type & Date Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Decision & Date</h2>
                    <p className="text-purple-100">Record the decision type and when it happened</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Decision Type */}
                  <div className="space-y-3">
                    <Label htmlFor="type" className="text-base font-semibold text-slate-700">
                      Decision Type <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={setType}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        id="type"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select decision type" />
                      </SelectTrigger>
                      <SelectContent>
                        {soulWinningTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">
                      The type of spiritual decision made
                    </p>
                  </div>
                  
                  {/* Date */}
                  <div className="space-y-3">
                    <Label htmlFor="date" className="text-base font-semibold text-slate-700">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <p className="text-sm text-slate-500">
                      When this encounter happened
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Witness & Details Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Additional Details</h2>
                    <p className="text-emerald-100">Record witness and location information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Location */}
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-base font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="e.g., Church, Home, Street corner..."
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                    <p className="text-sm text-slate-500">
                      Where this encounter took place (optional)
                    </p>
                  </div>
                  
                  {/* Witnessed By */}
                  <div className="space-y-3">
                    <Label htmlFor="witnessed_by" className="text-base font-semibold text-slate-700">
                      <UserCheck className="h-4 w-4 inline mr-2" />
                      Witnessed By
                    </Label>
                    <Select 
                      onValueChange={setWitnessedBy}
                      disabled={isSubmitting}
                      defaultValue="none"
                    >
                      <SelectTrigger 
                        id="witnessed_by"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                      >
                        <SelectValue placeholder="Select a witness (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific witness</SelectItem>
                        {members.map((member) => (
                          <SelectItem key={member.contact_id} value={member.contact_id}>
                            {member.contacts ? 
                              `${member.contacts.first_name || ''} ${member.contacts.last_name || ''}`.trim() || 
                              member.contacts.email || 'Unknown Member'
                              : 'Unknown Member'
                            }
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">
                      Select a church member who witnessed this decision (optional)
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3 mt-6">
                  <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Add any additional details about this soul winning encounter..."
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-sm text-slate-500">
                    Any context or details about this encounter (optional)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/people/outreach/soul-winning')}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || selectedContacts.length === 0}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Record{selectedContacts.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Create {selectedContacts.length} Soul Winning Record{selectedContacts.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
      
      {/* Create Contact Dialog */}
      <Dialog open={showCreateContactDialog} onOpenChange={setShowCreateContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact for soul winning record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newContactForm.first_name}
                  onChange={(e) => setNewContactForm({...newContactForm, first_name: e.target.value})}
                  placeholder="First name"
                  disabled={isCreatingContact}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newContactForm.last_name}
                  onChange={(e) => setNewContactForm({...newContactForm, last_name: e.target.value})}
                  placeholder="Last name"
                  disabled={isCreatingContact}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContactForm.email}
                onChange={(e) => setNewContactForm({...newContactForm, email: e.target.value})}
                placeholder="email@example.com"
                disabled={isCreatingContact}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newContactForm.phone}
                onChange={(e) => setNewContactForm({...newContactForm, phone: e.target.value})}
                placeholder="Phone number"
                disabled={isCreatingContact}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateContactDialog(false)}
              disabled={isCreatingContact}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateContact}
              disabled={isCreatingContact || !newContactForm.first_name.trim() || !newContactForm.last_name.trim()}
            >
              {isCreatingContact ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Contact
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 