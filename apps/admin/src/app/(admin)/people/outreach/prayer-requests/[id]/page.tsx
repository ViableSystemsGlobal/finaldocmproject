'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, CheckCircle, Heart } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useContacts } from '@/hooks/useContacts'
import { useUsers } from '@/hooks/useUsers'
import { useNextParams } from '@/lib/nextParams'
import { 
  PrayerRequest, 
  fetchPrayerRequest, 
  updatePrayerRequest, 
  markPrayerRequestAnswered 
} from '@/services/prayerRequests'

export default function PrayerRequestDetailPage({ params }: { params: { id: string } }) {
  // Safe way to handle params that works with both current and future Next.js
  const { id } = useNextParams(params)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  
  // States
  const [prayerRequest, setPrayerRequest] = useState<PrayerRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [answering, setAnswering] = useState(false)
  
  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactId, setContactId] = useState('')
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [responseNotes, setResponseNotes] = useState('')
  
  // Get users and contacts
  const { users, isLoading: usersLoading } = useUsers()
  const { contacts, isLoading: contactsLoading } = useContacts()
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Fetch prayer request data
  useEffect(() => {
    async function loadPrayerRequest() {
      try {
        setLoading(true)
        const { data, error } = await fetchPrayerRequest(id)
        
        if (error) throw error
        
        setPrayerRequest(data)
        
        // Set form fields
        if (data) {
          setTitle(data.title)
          setDescription(data.description)
          setContactId(data.contact_id || '')
          setStatus(data.status)
          setAssignedTo(data.assigned_to || '')
          setResponseNotes(data.response_notes || '')
        }
      } catch (err) {
        console.error('Error loading prayer request:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load prayer request details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadPrayerRequest()
  }, [id])
  
  // Handle save
  const handleSave = async () => {
    if (!prayerRequest) return
    
    try {
      setSaving(true)
      
      const { error } = await updatePrayerRequest(id, {
        title,
        description,
        contact_id: contactId || undefined,
        status,
        assigned_to: assignedTo || undefined,
        response_notes: responseNotes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Prayer request updated successfully'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchPrayerRequest(id)
      if (refreshedData) setPrayerRequest(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/prayer-requests/${id}`)
    } catch (err) {
      console.error('Error updating prayer request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update prayer request'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Handle marking as answered
  const handleMarkAnswered = async () => {
    if (!prayerRequest) return
    
    try {
      setAnswering(true)
      
      const { error } = await markPrayerRequestAnswered(id, responseNotes)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Prayer request marked as answered'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchPrayerRequest(id)
      if (refreshedData) setPrayerRequest(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/prayer-requests/${id}`)
    } catch (err) {
      console.error('Error marking prayer request as answered:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark prayer request as answered'
      })
    } finally {
      setAnswering(false)
    }
  }
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>
      case 'in-prayer':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">In Prayer</Badge>
      case 'answered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Answered</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-4">
            <Link href="/people/outreach/prayer-requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Prayer Request' : 'Prayer Request Details'}
          </h1>
        </div>
        
        {!isEditMode && prayerRequest && prayerRequest.status !== 'answered' && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/people/outreach/prayer-requests/${id}?edit=true`)}
            >
              Edit
            </Button>
            {prayerRequest.status === 'new' && (
              <Button
                variant="outline"
                className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                onClick={async () => {
                  try {
                    const { error } = await updatePrayerRequest(id, { status: 'in-prayer' })
                    if (error) throw error
                    
                    toast({
                      title: 'Success',
                      description: 'Prayer request status updated to In Prayer'
                    })
                    
                    // Refresh data
                    const { data: refreshedData } = await fetchPrayerRequest(id)
                    if (refreshedData) setPrayerRequest(refreshedData)
                  } catch (err) {
                    console.error('Error updating prayer request status:', err)
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: 'Failed to update prayer request status'
                    })
                  }
                }}
              >
                Mark as In Prayer
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-green-50 text-green-700 hover:bg-green-100"
              onClick={() => {
                setResponseNotes('')
                router.push(`/people/outreach/prayer-requests/${id}?edit=true`)
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Answered
            </Button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading prayer request...</span>
        </div>
      ) : prayerRequest ? (
        isEditMode ? (
          // Edit Form
          <Card>
            <CardHeader>
              <CardTitle>Edit Prayer Request</CardTitle>
              <CardDescription>
                Update information about this prayer request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={saving}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    disabled={saving}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Select
                    value={contactId}
                    onValueChange={setContactId}
                    disabled={saving || contactsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No contact</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unnamed contact'}
                          {contact.email && ` - ${contact.email}`}
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in-prayer">In Prayer</SelectItem>
                      <SelectItem value="answered">Answered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={assignedTo}
                    onValueChange={setAssignedTo}
                    disabled={saving || usersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(status === 'answered' || prayerRequest.status === 'answered') && (
                  <div className="space-y-2">
                    <Label htmlFor="responseNotes">Answer Notes</Label>
                    <Textarea
                      id="responseNotes"
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      rows={4}
                      disabled={saving}
                      placeholder="Describe how this prayer was answered..."
                    />
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/people/outreach/prayer-requests/${id}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  {status === 'answered' && prayerRequest.status !== 'answered' ? (
                    <Button
                      onClick={handleMarkAnswered}
                      disabled={saving || answering}
                    >
                      {answering ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Answered
                        </>
                      )}
                    </Button>
                  ) : (
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
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          // View Mode
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prayer Request Details</span>
                {getStatusBadge(prayerRequest.status)}
              </CardTitle>
              <CardDescription>
                Submitted on {formatDate(prayerRequest.submitted_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                <p className="font-medium">{prayerRequest.title}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="whitespace-pre-wrap">{prayerRequest.description}</p>
              </div>
              
              {prayerRequest.contacts && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                  <p className="font-medium">
                    {`${prayerRequest.contacts.first_name || ''} ${prayerRequest.contacts.last_name || ''}`.trim() || 'Unnamed contact'}
                  </p>
                  {prayerRequest.contacts.email && (
                    <p className="text-sm">{prayerRequest.contacts.email}</p>
                  )}
                </div>
              )}
              
              {prayerRequest.assigned_to && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Assigned To</h3>
                  <p>
                    {prayerRequest.user ? (
                      prayerRequest.user.raw_user_meta_data?.name || 
                      `${prayerRequest.user.raw_user_meta_data?.first_name || ''} ${prayerRequest.user.raw_user_meta_data?.last_name || ''}`.trim() ||
                      prayerRequest.user.email
                    ) : (
                      'Unknown User'
                    )}
                  </p>
                </div>
              )}
              
              {prayerRequest.status === 'answered' && prayerRequest.response_notes && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Answer Notes</h3>
                  <p className="whitespace-pre-wrap">{prayerRequest.response_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">Prayer request not found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The prayer request you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/people/outreach/prayer-requests">
              Back to Prayer Requests
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
} 