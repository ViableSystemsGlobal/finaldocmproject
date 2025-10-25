'use client'

import { useState, useEffect } from 'react'
import { Loader2, Search, Plus, X, Calendar as CalendarIcon, Users, UserPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getContactsNotInGroup } from '@/services/members'
import { addMembership } from '@/services/groups'

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

type SelectedMember = {
  contact: Contact;
  role: string;
  joinedAt: Date;
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
  
  // Form state for multiple member selection
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([])
  
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true)
        const { data, error } = await getContactsNotInGroup(groupId)
        
        if (error) {
          throw new Error('Failed to load contacts')
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
  }, [open, groupId])
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedMembers([])
      setSearchQuery('')
    }
  }, [open])
  
  // Filter contacts based on search query and exclude already selected
  const filteredContacts = contacts.filter(contact => {
    // Check if contact is already selected
    const isSelected = selectedMembers.some(member => member.contact.id === contact.id)
    if (isSelected) return false
    
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(query) ||
      (contact.email || '').toLowerCase().includes(query) ||
      (contact.phone || '').toLowerCase().includes(query)
    )
  })
  
  const handleContactAdd = (contact: Contact) => {
    const newMember: SelectedMember = {
      contact,
      role: 'member', // Default role
      joinedAt: new Date()
    }
    setSelectedMembers(prev => [...prev, newMember])
  }
  
  const handleMemberRemove = (contactId: string) => {
    setSelectedMembers(prev => prev.filter(member => member.contact.id !== contactId))
  }
  
  const handleMemberRoleChange = (contactId: string, newRole: string) => {
    setSelectedMembers(prev => 
      prev.map(member => 
        member.contact.id === contactId 
          ? { ...member, role: newRole }
          : member
      )
    )
  }
  
  const handleMemberDateChange = (contactId: string, newDate: Date) => {
    setSelectedMembers(prev => 
      prev.map(member => 
        member.contact.id === contactId 
          ? { ...member, joinedAt: newDate }
          : member
      )
    )
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedMembers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select at least one member to add'
      })
      return
    }
    
    setSubmitting(true)
    
    try {
      let successCount = 0
      let errorCount = 0
      
      // Add members one by one
      for (const member of selectedMembers) {
        try {
          const { error } = await addMembership(
            groupId,
            member.contact.id,
            member.role,
            member.joinedAt.toISOString(),
            false // Admin adds members directly, no approval needed
          )
          
          if (error) {
            console.error(`Failed to add ${member.contact.first_name} ${member.contact.last_name}:`, error)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error(`Failed to add ${member.contact.first_name} ${member.contact.last_name}:`, err)
          errorCount++
        }
      }
      
      // Show results
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} member${successCount > 1 ? 's' : ''} added successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        })
      }
      
      if (errorCount > 0 && successCount === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to add members. Please try again.'
        })
      }
      
      // Reset form state
      setSelectedMembers([])
      setSearchQuery('')
      
      // Close modal and trigger refresh
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to add members:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add members'
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Members to {groupName}
          </DialogTitle>
          <DialogDescription>
            Select multiple contacts to add as members of this group. You can set individual roles and join dates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Available Contacts */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Available Contacts</Label>
              <p className="text-xs text-muted-foreground">Click to add to group</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm">Loading contacts...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {contacts.length > 0 
                      ? 'No contacts match your search' 
                      : 'No contacts available to add'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredContacts.map((contact) => (
                    <div 
                      key={contact.id} 
                      className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer rounded-md transition-colors"
                      onClick={() => handleContactAdd(contact)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar 
                          src={contact.profile_image} 
                          alt={`${contact.first_name} ${contact.last_name}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">{contact.first_name} {contact.last_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {contact.email || contact.phone || 'No contact info'}
                          </p>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Selected Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Selected Members</Label>
                <p className="text-xs text-muted-foreground">
                  {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              {selectedMembers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedMembers.length}
                </Badge>
              )}
            </div>
            
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {selectedMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No members selected yet</p>
                  <p className="text-xs">Click contacts from the left to add them</p>
                </div>
              ) : (
                <div className="p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Member</TableHead>
                        <TableHead className="text-xs">Role</TableHead>
                        <TableHead className="text-xs w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMembers.map((member) => (
                        <TableRow key={member.contact.id}>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              <Avatar 
                                src={member.contact.profile_image} 
                                alt={`${member.contact.first_name} ${member.contact.last_name}`}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium text-xs">
                                  {member.contact.first_name} {member.contact.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {member.contact.email || 'No email'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Select 
                              value={member.role} 
                              onValueChange={(value) => handleMemberRoleChange(member.contact.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="visitor">Visitor</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMemberRemove(member.contact.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            
            {/* Global Settings for Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <Label className="text-xs font-semibold">Group Settings</Label>
                <div className="text-xs text-muted-foreground">
                  All members will be added with today's date: <strong>{formatDate(new Date())}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedMembers.length > 0 && (
                <span>{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} ready to add</span>
              )}
            </div>
            
            <div className="space-x-2">
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
                onClick={handleSubmit}
                disabled={submitting || selectedMembers.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add {selectedMembers.length} Member{selectedMembers.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 