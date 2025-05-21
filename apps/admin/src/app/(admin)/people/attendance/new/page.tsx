'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  Loader2,
  Save,
  Search,
  UserPlus,
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
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { Event, fetchEvents } from '@/services/events'
import { fetchContacts } from '@/services/contacts'

// Type for the form data
type NewAttendanceFormData = {
  eventId: string;
  contactId: string;
  checkInDate: Date;
  checkInTime: string;
  method: string;
  campusId: string;
};

export default function NewAttendancePage() {
  const router = useRouter()
  
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
    contactId: '',
    checkInDate: new Date(),
    checkInTime: format(new Date(), 'HH:mm'),
    method: 'manual',
    campusId: 'main',
  })
  
  // Search state
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [filteredContacts, setFilteredContacts] = useState<any[]>([])
  
  // Load events and contacts
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
  const handleInputChange = (field: keyof NewAttendanceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.eventId || !formData.contactId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select both an event and a contact'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Combine date and time
      const checkInDateTime = new Date(formData.checkInDate)
      const [hours, minutes] = formData.checkInTime.split(':').map(Number)
      checkInDateTime.setHours(hours, minutes, 0, 0)
      
      // Prepare data for submission
      const attendanceData = {
        event_id: formData.eventId,
        contact_id: formData.contactId,
        check_in_time: checkInDateTime.toISOString(),
        method: formData.method,
        campus_id: formData.campusId === 'main' ? null : formData.campusId,
      }
      
      // Insert record
      const { data, error } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Attendance record created successfully'
      })
      
      // Navigate back to list
      router.push('/people/attendance')
    } catch (err) {
      console.error('Failed to create attendance record:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create attendance record'
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/people/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Record Attendance</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>New Attendance Record</CardTitle>
          <CardDescription>
            Record a check-in for an event
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Event Selection */}
              <div className="space-y-2">
                <Label htmlFor="event">Event <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.eventId} 
                  onValueChange={(value) => handleInputChange('eventId', value)}
                  disabled={loadingEvents || isSubmitting}
                >
                  <SelectTrigger id="event" className="w-full">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingEvents ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Loading events...</span>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
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
              
              {/* Contact Selection */}
              <div className="space-y-2">
                <Label htmlFor="contact">Contact <span className="text-red-500">*</span></Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      className="pl-9"
                      disabled={loadingContacts || isSubmitting}
                    />
                  </div>
                  <Select 
                    value={formData.contactId} 
                    onValueChange={(value) => handleInputChange('contactId', value)}
                    disabled={loadingContacts || isSubmitting}
                  >
                    <SelectTrigger id="contact" className="w-full">
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingContacts ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading contacts...</span>
                        </div>
                      ) : filteredContacts.length === 0 ? (
                        <div className="p-2 text-center text-muted-foreground">
                          No contacts found
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
                </div>
              </div>
              
              {/* Check-in Date */}
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="checkInDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.checkInDate && "text-muted-foreground"
                      )}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
              
              {/* Check-in Time */}
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="checkInTime"
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                    className="pl-9"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              {/* Check-in Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Check-in Method</Label>
                <Select 
                  value={formData.method} 
                  onValueChange={(value) => handleInputChange('method', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="qr">QR Code</SelectItem>
                    <SelectItem value="app">Mobile App</SelectItem>
                    <SelectItem value="kiosk">Kiosk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campus */}
              <div className="space-y-2">
                <Label htmlFor="campus">Campus</Label>
                <Select 
                                  value={formData.campusId}
                onValueChange={(value) => handleInputChange('campusId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="campus">
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
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/people/attendance')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.eventId || !formData.contactId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Record Attendance
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 