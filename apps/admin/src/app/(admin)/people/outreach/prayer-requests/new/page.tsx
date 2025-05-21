'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Loader2 } from 'lucide-react'
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
import { createPrayerRequest } from '@/services/prayerRequests'
import { supabase } from '@/lib/supabase'

export default function NewPrayerRequestPage() {
  const router = useRouter()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactId, setContactId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [isContactsLoading, setIsContactsLoading] = useState(false)
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [contactRequired, setContactRequired] = useState(false)
  
  // Load contacts
  const loadContacts = async () => {
    try {
      setIsContactsLoading(true)
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .order('last_name')
      
      if (error) throw error
      
      setContacts(data || [])
    } catch (err) {
      console.error('Error loading contacts:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contacts'
      })
    } finally {
      setIsContactsLoading(false)
    }
  }
  
  // Load users
  const loadUsers = async () => {
    try {
      setIsUsersLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .order('email')
      
      if (error) throw error
      
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users'
      })
    } finally {
      setIsUsersLoading(false)
    }
  }
  
  // Load data on mount
  useEffect(() => {
    loadContacts()
    loadUsers()
  }, [])
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!title) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Prayer request title is required'
      })
      return
    }
    
    if (!description) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Prayer request description is required'
      })
      return
    }
    
    if (contactRequired && !contactId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Contact is required for this prayer request'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Create prayer request
      const { error } = await createPrayerRequest({
        contact_id: contactId || undefined,
        title,
        description,
        status: 'new',
        assigned_to: assignedTo || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Prayer request created successfully'
      })
      
      // Navigate back to prayer requests list
      router.push('/people/outreach/prayer-requests')
      router.refresh()
    } catch (err) {
      console.error('Error creating prayer request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create prayer request'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  const isLoading = isContactsLoading || isUsersLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/people/outreach/prayer-requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Prayer Request</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Prayer Request</CardTitle>
          <CardDescription>
            Submit a new prayer request
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
                <Label htmlFor="title">Prayer Request Title</Label>
                <Input 
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Brief title for the prayer request"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  A short, descriptive title for the prayer need
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Describe the prayer need in detail"
                  className="resize-none h-32"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Provide details about the prayer request
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Related Contact (Optional)</Label>
                <Select 
                  onValueChange={setContactId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="contact">
                    <SelectValue placeholder="Select a contact (optional)" />
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
                  The person this prayer request is for (if applicable)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To (Optional)</Label>
                <Select 
                  onValueChange={setAssignedTo}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="assigned_to">
                    <SelectValue placeholder="Assign to someone (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.raw_user_meta_data?.name || 
                          user.email || 
                          `${user.raw_user_meta_data?.first_name || ''} ${user.raw_user_meta_data?.last_name || ''}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Assign this prayer request to a specific person
                </p>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/people/outreach/prayer-requests')}
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
                    <>
                      <Heart className="mr-2 h-4 w-4" />
                      Create Prayer Request
                    </>
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