'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, CheckCircle, CalendarIcon, Clock } from 'lucide-react'
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
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { fetchFollowUp, updateFollowUp, markFollowUpComplete, FollowUp } from '@/services/followUps'
import { useUsers } from '@/hooks/useUsers'
import { useContacts } from '@/hooks/useContacts'
import { useNextParams } from '@/lib/nextParams'

export default function FollowUpDetailPage({ params }: { params: { id: string } }) {
  // Safe way to handle params that works with both current and future Next.js
  const { id } = useNextParams(params)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  
  // States
  const [followUp, setFollowUp] = useState<FollowUp | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  
  // Form states
  const [contactId, setContactId] = useState('')
  const [followUpType, setFollowUpType] = useState('')
  const [status, setStatus] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  
  // Get users and contacts
  const { users, isLoading: usersLoading } = useUsers()
  const { contacts, isLoading: contactsLoading } = useContacts()
  
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
  
  // Statuses
  const statuses = ['pending', 'completed']

  // Fetch follow-up data
  useEffect(() => {
    async function loadFollowUp() {
      try {
        setLoading(true)
        const { data, error } = await fetchFollowUp(id)
        
        if (error) throw error
        
        setFollowUp(data)
        
        // Set form fields
        if (data) {
          setContactId(data.contact_id)
          setFollowUpType(data.type)
          setStatus(data.status)
          setNextActionDate(data.next_action_date)
          setAssignedTo(data.assigned_to || 'none')
          setNotes(data.notes || '')
        }
      } catch (err) {
        console.error('Error loading follow-up:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load follow-up details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadFollowUp()
  }, [id])
  
  // Handle save
  const handleSave = async () => {
    if (!followUp) return
    
    try {
      setSaving(true)
      
      const { error } = await updateFollowUp(id, {
        contact_id: contactId,
        type: followUpType,
        status,
        next_action_date: nextActionDate,
        assigned_to: assignedTo === 'none' ? undefined : assignedTo || undefined,
        notes: notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Follow-up updated successfully'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchFollowUp(id)
      if (refreshedData) setFollowUp(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/follow-ups/${id}`)
    } catch (err) {
      console.error('Error updating follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update follow-up'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Handle complete
  const handleComplete = async () => {
    try {
      setCompleting(true)
      
      const { error } = await markFollowUpComplete(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Follow-up marked as complete'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchFollowUp(id)
      if (refreshedData) {
        setFollowUp(refreshedData)
        setStatus(refreshedData.status)
      }
    } catch (err) {
      console.error('Error completing follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark follow-up as complete'
      })
    } finally {
      setCompleting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Get contact name
  const getContactName = (id: string) => {
    const contact = contacts.find(c => c.id === id)
    return contact 
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() 
      : 'Unknown Contact'
  }
  
  // Get user name
  const getUserName = (id: string | null | undefined) => {
    if (!id) return 'Unassigned'
    const user = users.find(u => u.id === id)
    return user ? (user.name || user.email) : 'Unknown User'
  }
  
  const isLoading = loading || usersLoading || contactsLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-4">
            <Link href="/people/outreach/follow-ups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Follow-Up' : 'Follow-Up Details'}
          </h1>
        </div>
        
        {!isEditMode && followUp && followUp.status === 'pending' && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/people/outreach/follow-ups/${id}?edit=true`)}
            >
              Edit
            </Button>
            <Button
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark Complete
            </Button>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      ) : followUp ? (
        isEditMode ? (
          // Edit Form
          <Card>
            <CardHeader>
              <CardTitle>Edit Follow-Up</CardTitle>
              <CardDescription>
                Update follow-up details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Select 
                  value={contactId}
                  onValueChange={setContactId}
                  disabled={saving}
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Follow-Up Type</Label>
                <Select 
                  value={followUpType}
                  onValueChange={setFollowUpType}
                  disabled={saving}
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={status}
                  onValueChange={setStatus}
                  disabled={saving}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === 'pending' ? 'Pending' : 'Completed'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="next_action_date">Follow-Up Date</Label>
                <Input
                  id="next_action_date"
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  disabled={saving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assign To (Optional)</Label>
                <Select 
                  value={assignedTo}
                  onValueChange={setAssignedTo}
                  disabled={saving}
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/people/outreach/follow-ups/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // View Details
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Details</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant={followUp.status === 'completed' ? 'default' : 'secondary'}
                  className={
                    followUp.status === 'completed' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                  }
                >
                  {followUp.status === 'completed' ? 'Completed' : 'Pending'}
                </Badge>
                <Badge variant="outline">
                  {followUp.type || 'General'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                  <p className="text-lg font-medium mt-1">
                    {followUp.contacts ? 
                      `${followUp.contacts.first_name || ''} ${followUp.contacts.last_name || ''}`.trim() : 
                      'Unknown Contact'}
                  </p>
                  {followUp.contacts?.email && (
                    <p className="text-sm text-muted-foreground">{followUp.contacts.email}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Follow-Up Type</h3>
                  <p className="text-lg font-medium mt-1">{followUp.type}</p>
                </div>
                
                <div className="flex items-start gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Follow-Up Date</h3>
                    <p className="text-lg font-medium mt-1">{formatDate(followUp.next_action_date)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Assigned To</h3>
                  <p className="text-lg font-medium mt-1">
                    {followUp.assigned_to ? getUserName(followUp.assigned_to) : 'Unassigned'}
                  </p>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p className="text-sm mt-1">{formatDate(followUp.created_at)}</p>
                </div>
                
                {followUp.completed_at && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                    <p className="text-sm mt-1">{formatDate(followUp.completed_at)}</p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <div className="p-4 rounded-md bg-muted/50 mt-2 whitespace-pre-wrap">
                  {followUp.notes || 'No notes available'}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h3 className="text-lg font-medium">Follow-up not found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The follow-up you're looking for doesn't exist or was deleted
              </p>
              <Button className="mt-4" asChild>
                <Link href="/people/outreach/follow-ups">
                  Go back to Follow-Ups
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 