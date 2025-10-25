'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, Plus, Loader2, X, Mail } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { createMeeting, updateMeeting, type Meeting } from '@/services/meetings'
import { fetchGroupMemberIds } from '@/services/groups'
import { Checkbox } from '@/components/ui/checkbox'
import { GooglePlacesInput } from '@/components/GooglePlacesInput'
import { supabase } from '@/lib/supabase'

type CreateMeetingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
  meeting?: Meeting | null
  onSuccess?: () => void | Promise<void>
}

export function CreateMeetingModal({
  open,
  onOpenChange,
  groupId,
  groupName,
  meeting = null,
  onSuccess
}: CreateMeetingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_date: '',
    start_time: '',
    end_time: '',
    location: '',
    meeting_type: 'regular' as 'regular' | 'special' | 'planning' | 'social' | 'outreach',
    max_attendees: '',
    meeting_link: '',
    agenda: [] as string[]
  })
  const [newAgendaItem, setNewAgendaItem] = useState('')
  const [sendNotification, setSendNotification] = useState(true)
  const [memberCount, setMemberCount] = useState(0)

  // Reset form when modal opens/closes or when meeting changes
  useEffect(() => {
    if (open) {
      if (meeting) {
        // Edit mode - populate form with meeting data
        setFormData({
          title: meeting.title,
          description: meeting.description || '',
          meeting_date: meeting.meeting_date,
          start_time: meeting.start_time,
          end_time: meeting.end_time || '',
          location: meeting.location || '',
          meeting_type: meeting.meeting_type,
          max_attendees: meeting.max_attendees?.toString() || '',
          meeting_link: meeting.meeting_link || '',
          agenda: meeting.agenda || []
        })
      } else {
        // Create mode - reset form
        setFormData({
          title: '',
          description: '',
          meeting_date: '',
          start_time: '',
          end_time: '',
          location: '',
          meeting_type: 'regular',
          max_attendees: '',
          meeting_link: '',
          agenda: []
        })
      }
      setNewAgendaItem('')
      setSendNotification(true)
      
      // Load member count for notification info
      loadMemberCount()
    }
  }, [open, meeting])

  // Load member count
  const loadMemberCount = async () => {
    try {
      const { data: memberIds } = await fetchGroupMemberIds(groupId)
      setMemberCount(memberIds?.length || 0)
    } catch (err) {
      console.error('Failed to load member count:', err)
      setMemberCount(0)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const addAgendaItem = () => {
    if (newAgendaItem.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda: [...prev.agenda, newAgendaItem.trim()]
      }))
      setNewAgendaItem('')
    }
  }

  const removeAgendaItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Meeting title is required')
      }
      if (!formData.meeting_date) {
        throw new Error('Meeting date is required')
      }
      if (!formData.start_time) {
        throw new Error('Start time is required')
      }

      // Prepare meeting data
      const meetingData = {
        group_id: groupId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        meeting_date: formData.meeting_date,
        start_time: formData.start_time,
        end_time: formData.end_time || undefined,
        location: formData.location.trim() || undefined,
        meeting_type: formData.meeting_type,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        meeting_link: formData.meeting_link.trim() || undefined,
        agenda: formData.agenda.length > 0 ? formData.agenda : undefined
      }

      let result
      if (meeting) {
        // Update existing meeting
        result = await updateMeeting(meeting.id, meetingData)
      } else {
        // Create new meeting
        result = await createMeeting(meetingData)
      }

      if (result.error) {
        throw result.error
      }

      toast({
        title: 'Success',
        description: `Meeting ${meeting ? 'updated' : 'created'} successfully`
      })

      // Send notification if requested
      if (sendNotification && memberCount > 0) {
        try {
          const { data: memberIds } = await fetchGroupMemberIds(groupId)
          
          if (memberIds && memberIds.length > 0) {
            // Get contact emails using Supabase directly
            const { data: contacts, error: contactsError } = await supabase
              .from('contacts')
              .select('id, first_name, last_name, email')
              .in('id', memberIds)
              .not('email', 'is', null)
            
            if (contactsError) throw contactsError
            
            if (contacts && contacts.length > 0) {
              // Prepare notification email content
              const emailSubject = `${meeting ? 'Meeting Updated' : 'New Meeting Scheduled'}: ${formData.title}`
              const meetingTime = new Date(`2000-01-01T${formData.start_time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
              
              const emailContent = `
                <h2>${meeting ? 'Meeting Updated' : 'New Meeting Scheduled'}</h2>
                <h3>${formData.title}</h3>
                ${formData.description ? `<p><strong>Description:</strong> ${formData.description}</p>` : ''}
                <p><strong>Date:</strong> ${new Date(formData.meeting_date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Time:</strong> ${meetingTime}${formData.end_time ? ` - ${new Date(`2000-01-01T${formData.end_time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}` : ''}</p>
                ${formData.location ? `<p><strong>Location:</strong> ${formData.location}</p>` : ''}
                ${formData.meeting_link ? `<p><strong>Join Online:</strong> <a href="${formData.meeting_link}">${formData.meeting_link}</a></p>` : ''}
                ${formData.agenda.length > 0 ? `
                  <h4>Agenda:</h4>
                  <ul>
                    ${formData.agenda.map(item => `<li>${item}</li>`).join('')}
                  </ul>
                ` : ''}
                <p>See you there!</p>
              `
              
              // Send emails to all contacts
              let notificationSuccess = 0
              for (const contact of contacts) {
                if (contact.email) {
                  try {
                    const response = await fetch('/api/email/bypass-queue', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: contact.email,
                        subject: emailSubject,
                        html: emailContent,
                        text: emailContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
                        emailType: 'meeting_notification',
                        metadata: {
                          group_id: groupId,
                          meeting_id: result.data?.id,
                          contact_id: contact.id,
                          notification_type: meeting ? 'meeting_updated' : 'meeting_created'
                        }
                      })
                    })
                    
                    const emailResult = await response.json()
                    if (emailResult.success) {
                      notificationSuccess++
                    }
                    
                    // Small delay between sends
                    await new Promise(resolve => setTimeout(resolve, 100))
                  } catch (emailErr) {
                    console.error(`Failed to send notification to ${contact.email}:`, emailErr)
                  }
                }
              }
              
              if (notificationSuccess > 0) {
                toast({
                  title: 'Notifications Sent',
                  description: `Meeting notification sent to ${notificationSuccess} members`
                })
              }
            }
          }
        } catch (notificationErr) {
          console.error('Failed to send notifications:', notificationErr)
          toast({
            title: 'Notification Warning',
            description: 'Meeting created successfully, but notifications failed to send',
            variant: 'destructive'
          })
        }
      }

      if (onSuccess) {
        await onSuccess()
      }

      onOpenChange(false)
    } catch (err) {
      console.error('Error saving meeting:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to ${meeting ? 'update' : 'create'} meeting`,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {meeting ? 'Edit Meeting' : 'Schedule New Meeting'}
          </DialogTitle>
          <DialogDescription>
            {meeting ? `Update meeting details for ${groupName}` : `Schedule a new meeting for ${groupName}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Meeting Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter meeting title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Meeting description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting_type">Meeting Type</Label>
                <select
                  id="meeting_type"
                  value={formData.meeting_type}
                  onChange={(e) => handleSelectChange('meeting_type', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="regular">Regular Meeting</option>
                  <option value="special">Special Event</option>
                  <option value="planning">Planning Session</option>
                  <option value="social">Social Gathering</option>
                  <option value="outreach">Outreach Activity</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attendees">Max Attendees</Label>
                <Input
                  id="max_attendees"
                  name="max_attendees"
                  type="number"
                  value={formData.max_attendees}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting_date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="meeting_date"
                  name="meeting_date"
                  type="date"
                  value={formData.meeting_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Physical Location</Label>
                <GooglePlacesInput
                  value={formData.location}
                  onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                  placeholder="Enter meeting location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_link">Online Meeting Link</Label>
                <Input
                  id="meeting_link"
                  name="meeting_link"
                  type="url"
                  value={formData.meeting_link}
                  onChange={handleInputChange}
                  placeholder="Zoom, Teams, etc."
                />
              </div>
            </div>
          </div>

          {/* Agenda */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agenda
            </h3>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  placeholder="Add agenda item"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAgendaItem()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addAgendaItem}
                  disabled={!newAgendaItem.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.agenda.length > 0 && (
                <div className="space-y-2">
                  {formData.agenda.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAgendaItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notifications
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="sendNotification"
                  checked={sendNotification}
                  onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="sendNotification" className="font-medium">
                    Notify all group members
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Send an email notification about this {meeting ? 'meeting update' : 'new meeting'} to all {memberCount} group members
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {meeting ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  {meeting ? 'Update Meeting' : 'Create Meeting'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 