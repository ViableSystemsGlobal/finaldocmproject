'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Users, FileText, Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { GooglePlacesInput } from '@/components/GooglePlacesInput'
import { createDiscipleshipMeeting, type DiscipleshipMeeting } from '@/services/discipleshipGroups'

interface CreateMeetingModalProps {
  groupId: string
  isOpen: boolean
  onClose: () => void
  onMeetingCreated: () => void
  groupLocation?: string
  groupMeetingTime?: string
}

export function CreateMeetingModal({
  groupId,
  isOpen,
  onClose,
  onMeetingCreated,
  groupLocation,
  groupMeetingTime
}: CreateMeetingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_date: '',
    start_time: groupMeetingTime || '',
    end_time: '',
    location: groupLocation || '',
    location_details: '',
    meeting_type: 'regular' as 'regular' | 'special' | 'planning' | 'social' | 'outreach',
    agenda: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLocationChange = (value: string, placeDetails?: any) => {
    setFormData(prev => ({
      ...prev,
      location: value,
      location_details: placeDetails ? JSON.stringify(placeDetails) : ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.meeting_date) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in the required fields (title and date)'
      })
      return
    }

    try {
      setIsLoading(true)

      const meetingData: Partial<DiscipleshipMeeting> = {
        discipleship_group_id: groupId,
        title: formData.title,
        description: formData.description || undefined,
        meeting_date: formData.meeting_date,
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
        location: formData.location || undefined,
        meeting_type: formData.meeting_type,
        status: 'scheduled',
        agenda: formData.agenda ? [{ item: formData.agenda }] : undefined
      }

      const { data, error } = await createDiscipleshipMeeting(meetingData)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Meeting scheduled successfully!'
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        meeting_date: '',
        start_time: groupMeetingTime || '',
        end_time: '',
        location: groupLocation || '',
        location_details: '',
        meeting_type: 'regular',
        agenda: ''
      })

      onMeetingCreated()
      onClose()

    } catch (error) {
      console.error('Error creating meeting:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to schedule meeting. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      meeting_date: '',
      start_time: groupMeetingTime || '',
      end_time: '',
      location: groupLocation || '',
      location_details: '',
      meeting_type: 'regular',
      agenda: ''
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-lg"></div>
          <div className="relative bg-white rounded-lg p-6 -m-6 mb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-slate-800">
                    Schedule New Meeting
                  </DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Create a new meeting for your discipleship group
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Meeting Details
            </h3>
            
            {/* Meeting Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                Meeting Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter meeting title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="h-12 border-2 border-slate-200 rounded-xl focus:border-purple-500"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="What will this meeting cover?"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="border-2 border-slate-200 rounded-xl focus:border-purple-500"
              />
            </div>

            {/* Meeting Type */}
            <div className="space-y-2">
              <Label htmlFor="meeting_type" className="text-sm font-medium text-slate-700">
                Meeting Type
              </Label>
              <Select
                value={formData.meeting_type}
                onValueChange={(value) => handleInputChange('meeting_type', value)}
              >
                <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl focus:border-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Meeting</SelectItem>
                  <SelectItem value="special">Special Event</SelectItem>
                  <SelectItem value="planning">Planning Session</SelectItem>
                  <SelectItem value="social">Social Gathering</SelectItem>
                  <SelectItem value="outreach">Outreach Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              When
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meeting Date */}
              <div className="space-y-2">
                <Label htmlFor="meeting_date" className="text-sm font-medium text-slate-700">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="meeting_date"
                  type="date"
                  min={today}
                  value={formData.meeting_date}
                  onChange={(e) => handleInputChange('meeting_date', e.target.value)}
                  className="h-12 border-2 border-slate-200 rounded-xl focus:border-blue-500"
                  required
                />
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-sm font-medium text-slate-700">
                  Start Time
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  className="h-12 border-2 border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-sm font-medium text-slate-700">
                  End Time
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  className="h-12 border-2 border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Where
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                Meeting Location
              </Label>
              <GooglePlacesInput
                value={formData.location}
                onChange={handleLocationChange}
                placeholder="Search for a location or enter address"
                className="h-12 border-2 border-slate-200 rounded-xl focus:border-red-500"
              />
            </div>
          </div>

          {/* Agenda */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Agenda (Optional)
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="agenda" className="text-sm font-medium text-slate-700">
                Meeting Agenda
              </Label>
              <Textarea
                id="agenda"
                placeholder="Outline what will be covered in this meeting"
                value={formData.agenda}
                onChange={(e) => handleInputChange('agenda', e.target.value)}
                rows={3}
                className="border-2 border-slate-200 rounded-xl focus:border-green-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title.trim() || !formData.meeting_date}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 