'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CalendarIcon, User } from 'lucide-react'
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
      
      if (error) throw error
      
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
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading contacts...</span>
      </div>
    )
  }
  
  if (contacts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">New Visitor</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>No Available Contacts</CardTitle>
            <CardDescription>
              You need to create contacts first before adding them as visitors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              There are no contacts available to add as visitors. 
              Please create a contact first.
            </p>
            <Button 
              onClick={() => router.push('/people/contacts/new')}
            >
              Create New Contact
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Visitor</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Visitor Details</CardTitle>
          <CardDescription>
            Add a new visitor by selecting an existing contact and providing details of their first visit.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      {contacts.length > 0 
                        ? 'No contacts match your search' 
                        : 'No contacts available'}
                    </p>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div 
                        key={contact.id} 
                        className={`flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer rounded-md ${
                          contact.id === contactId ? 'bg-muted/70' : ''
                        }`}
                        onClick={() => handleContactSelect(contact.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar 
                            src={contact.profile_image} 
                            alt={`${contact.first_name} ${contact.last_name}`}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact.email || contact.phone || 'No contact info'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border">
                          {contact.id === contactId && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Selected contact display */}
              {selectedContact && (
                <div className="mt-4 p-3 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={selectedContact.profile_image} 
                      alt={`${selectedContact.first_name} ${selectedContact.last_name}`}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.email || selectedContact.phone || 'No contact info'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="first_visit">First Visit Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="first_visit"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !firstVisit && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {firstVisit ? format(firstVisit) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-2 rounded-lg shadow-lg bg-white">
                  <Calendar
                    mode="single"
                    selected={firstVisit}
                    onSelectDate={setFirstVisit}
                    initialFocus
                    disableFutureDates={true}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="saved">Saved Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="saved" 
                    checked={saved}
                    onCheckedChange={setSaved}
                  />
                  <Label htmlFor="saved" className="text-sm font-medium cursor-pointer">
                    {saved ? 'Saved' : 'Not saved'}
                  </Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Mark whether this visitor has accepted Jesus as their savior.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the visitor..."
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/people/visitors')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !contactId || !firstVisit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Visitor'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 