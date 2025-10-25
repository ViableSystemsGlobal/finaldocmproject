'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Calendar, Clock, Users, FileText, User, Edit, AlertTriangle, Target, MessageSquare, UserPlus, CheckCircle } from 'lucide-react'
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
import { useNextParams } from '@/lib/nextParams'
import { 
  PlannedVisit, 
  fetchPlannedVisit, 
  updatePlannedVisit 
} from '@/services/plannedVisits'

export default function PlannedVisitDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Safe way to handle params that works with both current and future Next.js
  const resolvedParams = useNextParams(params) as { id: string }
  const id = resolvedParams.id
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams?.get('mode') === 'edit'
  
  // State
  const [plannedVisit, setPlannedVisit] = useState<PlannedVisit>({} as PlannedVisit)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Edit form state
  const [contactId, setContactId] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventName, setEventName] = useState('')
  const [interestLevel, setInterestLevel] = useState('interested')
  const [howHeardAboutUs, setHowHeardAboutUs] = useState('')
  const [comingWithOthers, setComingWithOthers] = useState(false)
  const [companionsCount, setCompanionsCount] = useState(0)
  const [companionsDetails, setCompanionsDetails] = useState('')
  const [specialNeeds, setSpecialNeeds] = useState('')
  const [contactPreference, setContactPreference] = useState('email')
  const [notes, setNotes] = useState('')
  
  // Load contacts
  const { contacts, isLoading: isContactsLoading } = useContacts()
  
  // Load planned visit data
  useEffect(() => {
    if (!id) return
    
    const loadPlannedVisit = async () => {
      try {
        setLoading(true)
        const { data, error } = await fetchPlannedVisit(id)
        
        if (error) throw error
        if (!data) throw new Error('Planned visit not found')
        
        setPlannedVisit(data as PlannedVisit)
        
        // Initialize form fields for edit mode
        if (isEditMode) {
          setContactId(data.contact_id || '')
          const eventDateTime = new Date(data.event_date)
          setEventDate(eventDateTime.toISOString().split('T')[0])
          setEventTime(data.event_time || eventDateTime.toTimeString().slice(0, 5))
          setEventName(data.event_name)
          setInterestLevel(data.interest_level)
          setHowHeardAboutUs(data.how_heard_about_us || '')
          setComingWithOthers(data.coming_with_others || false)
          setCompanionsCount(data.companions_count || 0)
          setCompanionsDetails(data.companions_details || '')
          setSpecialNeeds(data.special_needs || '')
          setContactPreference(data.contact_preference)
          setNotes(data.notes || '')
        }
      } catch (err) {
        console.error('Failed to load planned visit:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load planned visit details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadPlannedVisit()
  }, [id, isEditMode])
  
  // Handle form submission for edit mode
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!id) return
    
    try {
      setSaving(true)
      
      // Combine date and time
      const dateTime = new Date(`${eventDate}T${eventTime}`)
      
      const { error } = await updatePlannedVisit(id, {
        contact_id: contactId,
        event_date: dateTime.toISOString(),
        event_time: eventTime,
        event_name: eventName,
        interest_level: interestLevel,
        how_heard_about_us: howHeardAboutUs || undefined,
        coming_with_others: comingWithOthers,
        companions_count: companionsCount,
        companions_details: companionsDetails || undefined,
        special_needs: specialNeeds || undefined,
        contact_preference: contactPreference,
        notes: notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Planned visit updated successfully'
      })
      
      // Redirect to view mode
      router.push(`/people/outreach/planned-visits/${id}`)
      router.refresh()
    } catch (err) {
      console.error('Failed to update planned visit:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update planned visit'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Event types for church events
  const eventTypes = [
    { value: 'Sunday Morning Service', label: 'Sunday Morning Service' },
    { value: 'Sunday Evening Service', label: 'Sunday Evening Service' },
    { value: 'Wednesday Bible Study', label: 'Wednesday Bible Study' },
    { value: 'Youth Service', label: 'Youth Service' },
    { value: 'Special Event', label: 'Special Event' },
    { value: 'Holiday Service', label: 'Holiday Service' },
    { value: 'Community Outreach', label: 'Community Outreach' },
    { value: 'Other', label: 'Other' }
  ]
  
  // Interest levels
  const interestLevels = [
    { value: 'interested', label: 'Interested' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'tentative', label: 'Tentative' },
    { value: 'cancelled', label: 'Cancelled' }
  ]
  
  // Contact preferences
  const contactPreferences = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'text', label: 'Text Message' },
    { value: 'none', label: 'No Contact' }
  ]
  
  // Helper functions
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-500 text-white">Pending</Badge>
      case 'contacted':
        return <Badge className="bg-yellow-500 text-white">Contacted</Badge>
      case 'confirmed':
        return <Badge className="bg-green-500 text-white">Confirmed</Badge>
      case 'attended':
        return <Badge className="bg-emerald-500 text-white">Attended</Badge>
      case 'no_show':
        return <Badge className="bg-gray-500 text-white">No Show</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-500 text-white">Urgent</Badge>
      case 'high':
        return <Badge className="bg-orange-500 text-white">High</Badge>
      case 'normal':
        return <Badge className="bg-blue-500 text-white">Normal</Badge>
      case 'low':
        return <Badge className="bg-gray-500 text-white">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }
  
  const getInterestLevelBadge = (level: string) => {
    switch (level) {
      case 'confirmed':
        return <Badge className="bg-green-500 text-white">Confirmed</Badge>
      case 'interested':
        return <Badge className="bg-blue-500 text-white">Interested</Badge>
      case 'tentative':
        return <Badge className="bg-yellow-500 text-white">Tentative</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      default:
        return <Badge variant="outline">{level}</Badge>
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading planned visit details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
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
              <Link href="/people/outreach/planned-visits">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Planned Visit' : 'Planned Visit Details'}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {plannedVisit.contacts ? 
                    `${plannedVisit.contacts.first_name} ${plannedVisit.contacts.last_name}` : 
                    'Unknown Contact'
                  } • {plannedVisit.event_name?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {!isEditMode && (
            <div className="flex gap-3 flex-wrap">
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg"
              >
                <Link href={`/people/outreach/planned-visits/${id}?mode=edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Visit
                </Link>
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-green-200 hover:bg-green-50"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-purple-200 hover:bg-purple-50"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Convert to Visitor
              </Button>
            </div>
          )}
        </div>

        {isEditMode ? (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit Visit Details</h2>
                    <p className="text-blue-100">Update the planned visit information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="contact" className="text-base font-semibold text-slate-700">
                      Contact
                    </Label>
                    <Select value={contactId} onValueChange={setContactId}>
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Event Type */}
                  <div className="space-y-3">
                    <Label htmlFor="eventName" className="text-base font-semibold text-slate-700">
                      Event Type
                    </Label>
                    <Select value={eventName} onValueChange={setEventName}>
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date */}
                  <div className="space-y-3">
                    <Label htmlFor="date" className="text-base font-semibold text-slate-700">
                      Event Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50"
                      required
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-3">
                    <Label htmlFor="time" className="text-base font-semibold text-slate-700">
                      Event Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50"
                      required
                    />
                  </div>

                  {/* Interest Level */}
                  <div className="space-y-3">
                    <Label htmlFor="interestLevel" className="text-base font-semibold text-slate-700">
                      Interest Level
                    </Label>
                    <Select value={interestLevel} onValueChange={setInterestLevel}>
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                        <SelectValue placeholder="Select interest level" />
                      </SelectTrigger>
                      <SelectContent>
                        {interestLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* How Heard About Us */}
                <div className="space-y-3 mt-6">
                  <Label htmlFor="howHeardAboutUs" className="text-base font-semibold text-slate-700">
                    How Heard About Us
                  </Label>
                  <Textarea
                    id="howHeardAboutUs"
                    value={howHeardAboutUs}
                    onChange={(e) => setHowHeardAboutUs(e.target.value)}
                    placeholder="How did you hear about us?"
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50"
                    required
                  />
                </div>

                {/* Coming With Others */}
                <div className="space-y-3 mt-6">
                  <Label htmlFor="comingWithOthers" className="text-base font-semibold text-slate-700">
                    Coming With Others
                  </Label>
                  <Select value={comingWithOthers ? 'yes' : 'no'} onValueChange={(value) => setComingWithOthers(value === 'yes')}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                      <SelectValue placeholder="Select yes or no" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Companions Count */}
                <div className="space-y-3 mt-6">
                  <Label htmlFor="companionsCount" className="text-base font-semibold text-slate-700">
                    Companions Count
                  </Label>
                  <Input
                    id="companionsCount"
                    type="number"
                    value={companionsCount}
                    onChange={(e) => setCompanionsCount(parseInt(e.target.value))}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50"
                    required
                  />
                </div>

                {/* Companions Details */}
                <div className="space-y-3 mt-6">
                  <Label htmlFor="companionsDetails" className="text-base font-semibold text-slate-700">
                    Companions Details
                  </Label>
                  <Textarea
                    id="companionsDetails"
                    value={companionsDetails}
                    onChange={(e) => setCompanionsDetails(e.target.value)}
                    placeholder="Enter companions details"
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50"
                    required
                  />
                </div>

                {/* Special Needs */}
                <div className="space-y-3 mt-6">
                  <Label htmlFor="specialNeeds" className="text-base font-semibold text-slate-700">
                    Special Needs
                  </Label>
                  <Textarea
                    id="specialNeeds"
                    value={specialNeeds}
                    onChange={(e) => setSpecialNeeds(e.target.value)}
                    placeholder="Enter special needs"
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50"
                    required
                  />
                </div>

                {/* Contact Preference */}
                <div className="space-y-3 mt-6">
                  <Label htmlFor="contactPreference" className="text-base font-semibold text-slate-700">
                    Contact Preference
                  </Label>
                  <Select value={contactPreference} onValueChange={setContactPreference}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                      <SelectValue placeholder="Select contact preference" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactPreferences.map((preference) => (
                        <SelectItem key={preference.value} value={preference.value}>
                          {preference.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    placeholder="Enter any additional notes"
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/people/outreach/planned-visits/${id}`)}
                disabled={saving}
                className="px-8 py-3 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
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
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-8">
            {/* Overview Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Visit Overview</h2>
                    <p className="text-slate-300">Complete details about this planned visit</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Contact Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Contact Information
                      </h3>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-lg">
                              {plannedVisit.contacts ? 
                                `${plannedVisit.contacts.first_name} ${plannedVisit.contacts.last_name}` : 
                                'Unknown Contact'
                              }
                            </p>
                            {plannedVisit.contacts?.email && (
                              <p className="text-slate-600">{plannedVisit.contacts.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status & Interest Level */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        Status & Interest Level
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-4">
                          {getStatusBadge(plannedVisit.status)}
                          {getInterestLevelBadge(plannedVisit.interest_level)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        Event Schedule
                      </h3>
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                        <p className="text-slate-800 font-semibold text-lg">
                          {formatDateTime(plannedVisit.event_date)}
                        </p>
                        {plannedVisit.event_time && (
                          <p className="text-slate-600 mt-1">
                            Time: {plannedVisit.event_time}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Event Type */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Event Type
                      </h3>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                        <p className="text-slate-800 font-semibold text-lg">
                          {plannedVisit.event_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coming with Others */}
                {plannedVisit.coming_with_others && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Coming with Others
                    </h3>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                      <p className="text-slate-700 mb-2">
                        <strong>Number of companions:</strong> {plannedVisit.companions_count || 0}
                      </p>
                      {plannedVisit.companions_details && (
                        <p className="text-slate-700">
                          <strong>Details:</strong> {plannedVisit.companions_details}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* How Heard About Us */}
                {plannedVisit.how_heard_about_us && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-600" />
                      How They Heard About Us
                    </h3>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                      <p className="text-slate-700 leading-relaxed">
                        {plannedVisit.how_heard_about_us}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {plannedVisit.notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-600" />
                      Notes
                    </h3>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                      <p className="text-slate-700 leading-relaxed">
                        {plannedVisit.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Special Needs */}
                {plannedVisit.special_needs && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Special Needs
                    </h3>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
                      <p className="text-slate-700 leading-relaxed">
                        {plannedVisit.special_needs}
                      </p>
                    </div>
                  </div>
                )}

                {/* Conversion Status */}
                {plannedVisit.converted_to_visitor && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-green-600" />
                      Visitor Conversion
                    </h3>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <p className="text-green-800 font-medium flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        Successfully converted to visitor
                      </p>
                      {plannedVisit.converted_date && (
                        <p className="text-slate-700">
                          <strong>Converted on:</strong> {formatDateTime(plannedVisit.converted_date)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 