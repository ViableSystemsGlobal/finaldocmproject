'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  Loader2,
  Save,
  Search,
  UserPlus,
  Users,
  CalendarDays,
  CheckCircle,
  Sparkles,
  Activity,
  Plus,
  X,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
import { supabase } from '@/lib/supabase'
import { Event, fetchEvents } from '@/services/events'
import { fetchContacts } from '@/services/contacts'

// Type for individual attendee data
type AttendeeData = {
  contactId: string;
  contact: any;
  checkInTime: string;
  method: string;
};

// Type for the form data
type NewAttendanceFormData = {
  eventId: string;
  checkInDate: Date;
  campusId: string;
  attendees: AttendeeData[];
};

function NewAttendancePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [campuses, setCampuses] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingContacts, setLoadingContacts] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState<NewAttendanceFormData>({
    eventId: '',
    checkInDate: new Date(),
    campusId: 'main',
    attendees: [],
  })
  
  // Contact selection state
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [filteredContacts, setFilteredContacts] = useState<any[]>([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [defaultCheckInTime, setDefaultCheckInTime] = useState(format(new Date(), 'HH:mm'))
  const [defaultMethod, setDefaultMethod] = useState('manual')
  
  // Load events and contacts and handle URL parameters
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load events
        setLoadingEvents(true)
        const { data: eventsData, error: eventsError } = await fetchEvents()
        
        if (eventsError) throw eventsError
        setEvents(eventsData || [])
        setLoadingEvents(false)
        
        // Load contacts
        setLoadingContacts(true)
        const { data: contactsData, error: contactsError } = await fetchContacts()
        
        if (contactsError) throw contactsError
        setContacts(contactsData || [])
        setFilteredContacts(contactsData || [])
        setLoadingContacts(false)
        
        // Load campuses
        const { data: campusesData } = await supabase.from('campuses').select('id, name')
        setCampuses(campusesData || [])
      } catch (err) {
        console.error('Failed to load data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load required data'
        })
      }
    }
    
    loadData()
  }, [])

  // Handle URL parameters for pre-selecting event
  useEffect(() => {
    const preSelectedEventId = searchParams.get('event_id')
    if (preSelectedEventId && events.length > 0) {
      // Check if the event exists in our loaded events
      const eventExists = events.some(event => event.id === preSelectedEventId)
      if (eventExists) {
        setFormData(prev => ({
          ...prev,
          eventId: preSelectedEventId
        }))
      }
    }
  }, [searchParams, events])
  
  // Filter contacts when search query changes
  useEffect(() => {
    if (!contactSearchQuery) {
      setFilteredContacts(contacts)
      return
    }
    
    const query = contactSearchQuery.toLowerCase()
    const filtered = contacts.filter(contact => 
      (contact.first_name?.toLowerCase() || '').includes(query) ||
      (contact.last_name?.toLowerCase() || '').includes(query) ||
      (contact.email?.toLowerCase() || '').includes(query) ||
      (contact.phone?.toLowerCase() || '').includes(query)
    )
    
    setFilteredContacts(filtered)
  }, [contactSearchQuery, contacts])
  
  // Form input handlers
  const handleFormChange = (field: 'eventId' | 'checkInDate' | 'campusId', value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Add contact to attendees list
  const addAttendee = () => {
    if (!selectedContactId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a contact to add'
      })
      return
    }
    
    // Check if contact is already added
    const isAlreadyAdded = formData.attendees.some(attendee => attendee.contactId === selectedContactId)
    if (isAlreadyAdded) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'This contact is already in the attendance list'
      })
      return
    }
    
    const contact = contacts.find(c => c.id === selectedContactId)
    if (!contact) return
    
    const newAttendee: AttendeeData = {
      contactId: selectedContactId,
      contact: contact,
      checkInTime: defaultCheckInTime,
      method: defaultMethod
    }
    
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, newAttendee]
    }))
    
    // Reset selection
    setSelectedContactId('')
    setContactSearchQuery('')
  }
  
  // Remove attendee from list
  const removeAttendee = (contactId: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(attendee => attendee.contactId !== contactId)
    }))
  }
  
  // Update individual attendee data
  const updateAttendee = (contactId: string, field: 'checkInTime' | 'method', value: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map(attendee => 
        attendee.contactId === contactId 
          ? { ...attendee, [field]: value }
          : attendee
      )
    }))
  }
  
  // Apply default time to all attendees
  const applyDefaultTimeToAll = () => {
    if (formData.attendees.length === 0) return
    
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map(attendee => ({
        ...attendee,
        checkInTime: defaultCheckInTime
      }))
    }))
    
    toast({
      title: 'Success',
      description: `Applied ${defaultCheckInTime} to all ${formData.attendees.length} attendees`
    })
  }
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.eventId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an event'
      })
      return
    }
    
    if (formData.attendees.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one attendee'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Prepare attendance records for bulk insert
      const attendanceRecords = formData.attendees.map(attendee => {
        // Combine date and time
        const checkInDateTime = new Date(formData.checkInDate)
        const [hours, minutes] = attendee.checkInTime.split(':').map(Number)
        checkInDateTime.setHours(hours, minutes, 0, 0)
        
        return {
          event_id: formData.eventId,
          contact_id: attendee.contactId,
          check_in_time: checkInDateTime.toISOString(),
          method: attendee.method,
          campus_id: formData.campusId === 'main' ? null : formData.campusId,
        }
      })
      
      // Bulk insert records
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select()
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: `Successfully recorded attendance for ${formData.attendees.length} people`
      })
      
      // Navigate back to list
      router.push('/people/attendance')
    } catch (err) {
      console.error('Failed to create attendance records:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create attendance records'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getContactLabel = (contact: any) => {
    if (!contact) return 'Select Contact'
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || contact.phone || 'Unknown Contact'
  }
  
  const getEventLabel = (event: Event) => {
    if (!event) return 'Select Event'
    try {
      const eventDate = new Date(event.event_date)
      return `${event.name} (${format(eventDate, 'MMM d, yyyy')})`
    } catch (error) {
      return event.name
    }
  }
  
  // Get selected event details for display
  const selectedEvent = events.find(event => event.id === formData.eventId)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              size="icon" 
              asChild
              className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl"
            >
              <Link href="/people/attendance">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-2xl">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Record Attendance
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Add multiple people's check-in records for an event
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Summary Card */}
        {selectedEvent && (
          <div className="mb-8">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <CalendarDays className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Selected Event</p>
                      <p className="text-2xl font-bold">{selectedEvent.name}</p>
                      <p className="text-blue-200">
                        {format(new Date(selectedEvent.event_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm font-medium">Attendees Added</p>
                    <p className="text-3xl font-bold">{formData.attendees.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Form Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Event Details</h2>
                  <p className="text-slate-300">Set up basic information</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Event Selection */}
                <div className="space-y-3">
                  <Label htmlFor="event" className="text-base font-semibold text-slate-700">
                    Event <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.eventId} 
                    onValueChange={(value) => handleFormChange('eventId', value)}
                    disabled={loadingEvents || isSubmitting}
                  >
                    <SelectTrigger 
                      id="event" 
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingEvents ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          <span>Loading events...</span>
                        </div>
                      ) : events.length === 0 ? (
                        <div className="p-4 text-center text-slate-500">
                          No events found
                        </div>
                      ) : (
                        events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {getEventLabel(event)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Check-in Date */}
                <div className="space-y-3">
                  <Label htmlFor="checkInDate" className="text-base font-semibold text-slate-700">
                    Check-in Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="checkInDate"
                        variant={"outline"}
                        className={cn(
                          "h-12 w-full justify-start text-left font-normal border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80",
                          !formData.checkInDate && "text-slate-400"
                        )}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-3 h-5 w-5" />
                        {formData.checkInDate ? (
                          format(formData.checkInDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    {/* Date picker content would go here */}
                  </Popover>
                </div>
                
                {/* Campus */}
                <div className="space-y-3">
                  <Label htmlFor="campus" className="text-base font-semibold text-slate-700">
                    Campus
                  </Label>
                  <Select 
                    value={formData.campusId}
                    onValueChange={(value) => handleFormChange('campusId', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger 
                      id="campus"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Campus</SelectItem>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Settings */}
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">Default Settings</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Default Check-in Time */}
                    <div className="space-y-2">
                      <Label htmlFor="defaultTime" className="text-sm font-medium text-slate-600">
                        Default Check-in Time
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="defaultTime"
                            type="time"
                            value={defaultCheckInTime}
                            onChange={(e) => setDefaultCheckInTime(e.target.value)}
                            className="pl-10 h-10 border border-slate-200 rounded-lg bg-white/50"
                            disabled={isSubmitting}
                          />
                        </div>
                        {formData.attendees.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={applyDefaultTimeToAll}
                            className="px-4 rounded-lg"
                          >
                            Apply to All
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Default Method */}
                    <div className="space-y-2">
                      <Label htmlFor="defaultMethod" className="text-sm font-medium text-slate-600">
                        Default Method
                      </Label>
                      <Select 
                        value={defaultMethod} 
                        onValueChange={setDefaultMethod}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger 
                          id="defaultMethod"
                          className="h-10 border border-slate-200 rounded-lg bg-white/50"
                        >
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                          <SelectItem value="qr">QR Code Scan</SelectItem>
                          <SelectItem value="app">Mobile App</SelectItem>
                          <SelectItem value="kiosk">Kiosk Check-in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Add Attendees Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Add Attendees</h2>
                  <p className="text-purple-100">Search and add people to the attendance list</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                {/* Contact Search */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-slate-700">
                    Search Contacts
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      disabled={loadingContacts || isSubmitting}
                    />
                  </div>
                </div>
                
                {/* Contact Selection */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-slate-700">
                    Select Contact
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedContactId} 
                      onValueChange={setSelectedContactId}
                      disabled={loadingContacts || isSubmitting}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Select a contact to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingContacts ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            <span>Loading contacts...</span>
                          </div>
                        ) : filteredContacts.length === 0 ? (
                          <div className="p-4 text-center text-slate-500">
                            {contactSearchQuery ? 'No matching contacts found' : 'No contacts found'}
                          </div>
                        ) : (
                          filteredContacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {getContactLabel(contact)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={addAttendee}
                      disabled={!selectedContactId || isSubmitting}
                      className="px-6 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Attendees List */}
                {formData.attendees.length > 0 && (
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-700">
                        Attendees ({formData.attendees.length})
                      </h3>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {formData.attendees.map((attendee) => (
                        <div key={attendee.contactId} className="bg-white/80 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {getContactLabel(attendee.contact)}
                              </p>
                              <p className="text-sm text-slate-600">
                                {attendee.contact.email || attendee.contact.phone || 'No contact info'}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttendee(attendee.contactId)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {/* Individual Check-in Time */}
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">
                                Check-in Time
                              </Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  type="time"
                                  value={attendee.checkInTime}
                                  onChange={(e) => updateAttendee(attendee.contactId, 'checkInTime', e.target.value)}
                                  className="pl-10 h-9 text-sm border border-slate-200 rounded-lg"
                                />
                              </div>
                            </div>
                            
                            {/* Individual Method */}
                            <div className="space-y-1">
                              <Label className="text-xs font-medium text-slate-600">
                                Method
                              </Label>
                              <Select 
                                value={attendee.method} 
                                onValueChange={(value) => updateAttendee(attendee.contactId, 'method', value)}
                              >
                                <SelectTrigger className="h-9 text-sm border border-slate-200 rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="manual">Manual</SelectItem>
                                  <SelectItem value="qr">QR Code</SelectItem>
                                  <SelectItem value="app">App</SelectItem>
                                  <SelectItem value="kiosk">Kiosk</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/people/attendance')}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.eventId || formData.attendees.length === 0}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving {formData.attendees.length} Records...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Record Attendance ({formData.attendees.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewAttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewAttendancePageContent />
    </Suspense>
  );
} 