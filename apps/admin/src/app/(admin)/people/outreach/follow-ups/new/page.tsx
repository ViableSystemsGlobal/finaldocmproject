'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { createFollowUp } from '@/services/followUps'
import { supabase } from '@/lib/supabase'
import { useUsers } from '@/hooks/useUsers'
import { useContacts } from '@/hooks/useContacts'

export default function NewFollowUpPage() {
  const router = useRouter()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactId, setContactId] = useState('')
  const [followUpType, setFollowUpType] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('none')
  const [notes, setNotes] = useState('')
  
  // Use the custom hooks for users and contacts
  const { users, isLoading: isUsersLoading, error: usersError } = useUsers()
  const { contacts, isLoading: isContactsLoading, error: contactsError } = useContacts()
  
  // Follow-up types
  const followUpTypes = [
    'First-time visitor',
    'Salvation follow-up',
    'Discipleship',
    'Prayer request',
    'Membership',
    'Absent member',
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
    
    if (!followUpType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Follow-up type is required'
      })
      return
    }
    
    if (!nextActionDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Next action date is required'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Create follow-up
      const { error } = await createFollowUp({
        contact_id: contactId,
        type: followUpType,
        status: 'pending', // New follow-up is always pending
        assigned_to: assignedTo === 'none' ? undefined : assignedTo || undefined,
        next_action_date: nextActionDate,
        notes: notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Follow-up created successfully',
      })
      
      // Navigate back to follow-ups list
      router.push('/people/outreach/follow-ups')
      router.refresh()
    } catch (err) {
      console.error('Error creating follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create follow-up',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Loading state
  const isLoading = isContactsLoading || isUsersLoading

  // Show errors if any
  useEffect(() => {
    if (usersError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users. ' + usersError.message
      })
    }
    
    if (contactsError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contacts. ' + contactsError.message
      })
    }
  }, [usersError, contactsError])

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/people/outreach/follow-ups">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Follow-Up</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Follow-Up</CardTitle>
          <CardDescription>
            Schedule a follow-up action for a contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Select 
                  onValueChange={setContactId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="contact">
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {`${contact.first_name || ''} ${contact.last_name || ''}`}
                        {contact.email && ` - ${contact.email}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The person you want to follow up with
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Follow-Up Type</Label>
                <Select 
                  onValueChange={setFollowUpType}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {followUpTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The type of follow-up
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="next_action_date">Follow-Up Date</Label>
                <Input
                  id="next_action_date"
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  When this follow-up should happen
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To (Optional)</Label>
                <Select 
                  onValueChange={setAssignedTo}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="assigned_to">
                    <SelectValue placeholder="Select a user (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Assigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Who is responsible for this follow-up (optional)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Add any additional notes here"
                  className="resize-none h-24"
                />
                <p className="text-sm text-muted-foreground">
                  Any context or details about this follow-up (optional)
                </p>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/people/outreach/follow-ups')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Follow-Up'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 