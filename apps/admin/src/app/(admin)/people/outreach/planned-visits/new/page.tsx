'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Calendar, Clock, Users, FileText, User, AlertTriangle } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useContacts } from '@/hooks/useContacts'
import { createPlannedVisit } from '@/services/plannedVisits'

export default function NewPlannedVisitPage() {
  const router = useRouter()
  
  // Form state
  const [contactId, setContactId] = useState('none')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [interestLevel, setInterestLevel] = useState('interested')
  const [howHeardAboutUs, setHowHeardAboutUs] = useState('')
  const [comingWithOthers, setComingWithOthers] = useState(false)
  const [companionsCount, setCompanionsCount] = useState(0)
  const [companionsDetails, setCompanionsDetails] = useState('')
  const [specialNeeds, setSpecialNeeds] = useState('')
  const [contactPreference, setContactPreference] = useState('email')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Load contacts
  const { contacts, isLoading: isContactsLoading } = useContacts()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventName || !eventDate || !eventTime) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields'
      })
      return
    }
    
    try {
      setSaving(true)
      
      // Combine date and time
      const dateTime = new Date(`${eventDate}T${eventTime}`)
      
      const { error } = await createPlannedVisit({
        contact_id: (contactId && contactId !== 'none') ? contactId : undefined,
        event_name: eventName,
        event_date: dateTime.toISOString(),
        event_time: eventTime,
        interest_level: interestLevel,
        how_heard_about_us: howHeardAboutUs || undefined,
        coming_with_others: comingWithOthers,
        companions_count: comingWithOthers ? companionsCount : 0,
        companions_details: (comingWithOthers && companionsDetails) ? companionsDetails : undefined,
        special_needs: specialNeeds || undefined,
        contact_preference: contactPreference,
        notes: notes || undefined,
        status: 'pending'
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Planned visit created successfully'
      })
      
      router.push('/people/outreach/planned-visits')
      router.refresh()
    } catch (err) {
      console.error('Failed to create planned visit:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create planned visit'
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
    { value: 'tentative', label: 'Tentative' }
  ]
  
  // Contact preferences
  const contactPreferences = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'text', label: 'Text Message' },
    { value: 'none', label: 'No Contact' }
  ]

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
                  Schedule New Visit
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Plan a visit for someone interested in attending our events
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Event & Contact Details</h2>
                  <p className="text-blue-100">Information about the visitor and event they plan to attend</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Selection */}
                <div className="space-y-3">
                  <Label htmlFor="contact" className="text-base font-semibold text-slate-700">
                    Contact (Optional)
                  </Label>
                  <Select value={contactId} onValueChange={setContactId}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                      <SelectValue placeholder="Select contact (or leave blank for new visitor)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No contact selected</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                          {contact.email && <span className="text-slate-500 ml-2">({contact.email})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Event Type */}
                <div className="space-y-3">
                  <Label htmlFor="eventName" className="text-base font-semibold text-slate-700">
                    Event Type *
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

                {/* Event Date */}
                <div className="space-y-3">
                  <Label htmlFor="eventDate" className="text-base font-semibold text-slate-700">
                    Event Date *
                  </Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50"
                    required
                  />
                </div>

                {/* Event Time */}
                <div className="space-y-3">
                  <Label htmlFor="eventTime" className="text-base font-semibold text-slate-700">
                    Event Time *
                  </Label>
                  <Input
                    id="eventTime"
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

                {/* Contact Preference */}
                <div className="space-y-3">
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
              </div>

              {/* How Heard About Us */}
              <div className="space-y-3 mt-6">
                <Label htmlFor="howHeardAboutUs" className="text-base font-semibold text-slate-700">
                  How They Heard About Us
                </Label>
                <Textarea
                  id="howHeardAboutUs"
                  value={howHeardAboutUs}
                  onChange={(e) => setHowHeardAboutUs(e.target.value)}
                  placeholder="How did they find out about this event/church?"
                  className="min-h-[100px] border-2 border-slate-200 rounded-xl bg-white/50"
                />
              </div>
            </div>
          </div>

          {/* Coming with Others Section */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Companions & Special Needs</h2>
                  <p className="text-emerald-100">Information about who they're bringing and any special requirements</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {/* Coming With Others Checkbox */}
              <div className="flex items-center space-x-3 mb-6">
                <Checkbox
                  id="comingWithOthers"
                  checked={comingWithOthers}
                  onCheckedChange={setComingWithOthers}
                  className="w-5 h-5"
                />
                <Label htmlFor="comingWithOthers" className="text-base font-semibold text-slate-700">
                  Coming with others
                </Label>
              </div>

              {/* Companions Details (only show if coming with others) */}
              {comingWithOthers && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Companions Count */}
                    <div className="space-y-3">
                      <Label htmlFor="companionsCount" className="text-base font-semibold text-slate-700">
                        Number of Companions
                      </Label>
                      <Input
                        id="companionsCount"
                        type="number"
                        min="0"
                        max="20"
                        value={companionsCount}
                        onChange={(e) => setCompanionsCount(parseInt(e.target.value) || 0)}
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50"
                      />
                    </div>
                  </div>

                  {/* Companions Details */}
                  <div className="space-y-3">
                    <Label htmlFor="companionsDetails" className="text-base font-semibold text-slate-700">
                      Companion Details
                    </Label>
                    <Textarea
                      id="companionsDetails"
                      value={companionsDetails}
                      onChange={(e) => setCompanionsDetails(e.target.value)}
                      placeholder="Who are they bringing? (names, ages, relationships, etc.)"
                      className="min-h-[100px] border-2 border-slate-200 rounded-xl bg-white/50"
                    />
                  </div>
                </div>
              )}

              {/* Special Needs */}
              <div className="space-y-3 mt-6">
                <Label htmlFor="specialNeeds" className="text-base font-semibold text-slate-700">
                  Special Needs or Accessibility Requirements
                </Label>
                <Textarea
                  id="specialNeeds"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="Any wheelchair access, hearing assistance, childcare, or other special needs?"
                  className="min-h-[100px] border-2 border-slate-200 rounded-xl bg-white/50"
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Additional Notes</h2>
                  <p className="text-slate-300">Any other important information about this planned visit</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes, context, or important information..."
                  className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/people/outreach/planned-visits')}
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Schedule Visit
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 