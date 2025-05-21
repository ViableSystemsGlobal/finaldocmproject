'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getContactsForMemberSelection, addMembership } from '@/services/groups'

// Format function for date display
const formatDate = (date: Date) => {
  return format(date, 'MMM dd, yyyy')
}

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  profile_image?: string;
};

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  onSuccess?: () => void;
}

export function AddMemberModal({
  open,
  onOpenChange,
  groupId,
  groupName,
  onSuccess
}: AddMemberModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form state
  const [contactId, setContactId] = useState('')
  const [role, setRole] = useState('member') // Default role
  const [joinedDate, setJoinedDate] = useState<Date | undefined>(new Date())
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true)
        const { data, error } = await getContactsForMemberSelection()
        
        if (error) {
          throw new Error(error.message || 'Failed to load contacts')
        }
        
        setContacts(data || [])
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
    
    if (open) {
      loadContacts()
    }
  }, [open])
  
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
    
    if (!contactId || !role) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a contact and role'
      })
      return
    }
    
    setSubmitting(true)
    
    try {
      const { error } = await addMembership(
        groupId,
        contactId,
        role,
        joinedDate ? joinedDate.toISOString() : undefined
      )
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Member added successfully'
      })
      
      // Reset form state
      setContactId('')
      setRole('member')
      setJoinedDate(new Date())
      setSelectedContact(null)
      
      // Close modal and trigger refresh
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to add member:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add member'
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member to {groupName}</DialogTitle>
          <DialogDescription>
            Select a contact to add as a member of this group
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading contacts...</span>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contact">Select Contact</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    <div className="border rounded-md max-h-48 overflow-y-auto">
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
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role in Group</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="co-leader">Co-Leader</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="visitor">Visitor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="joined_date">Joined Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="joined_date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !joinedDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {joinedDate ? formatDate(joinedDate) : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-2 rounded-lg shadow-lg bg-white">
                      <Calendar
                        mode="single"
                        selected={joinedDate}
                        onSelectDate={setJoinedDate}
                        initialFocus
                        disableFutureDates
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || !contactId || !role}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 