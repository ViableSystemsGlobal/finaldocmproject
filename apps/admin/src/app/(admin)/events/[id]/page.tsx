'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Loader2, 
  CalendarIcon,
  MapPin, 
  User, 
  Edit, 
  Trash2, 
  Save,
  Users,
  Mail,
  Car,
  CalendarClock,
  Upload,
  X,
  ImageIcon,
  Plus,
  Eye,
  Pencil,
  Search,
  CheckCircle,
  Clock,
  Download,
  Repeat,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { Calendar as CalendarIconComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { 
  Event as EventType,
  fetchEventById, 
  updateEvent, 
  deleteEvent,
  uploadEventImage,
  fetchEventImages,
  deleteEventImage 
} from '@/services/events'
import { useNextParams } from '@/lib/nextParams'
import { AttendanceRecord, fetchAttendanceByEvent, deleteAttendance } from '@/services/attendance'
import { supabase } from '@/lib/supabase'
import { completeEventAndCreateNext, generateFutureOccurrences, getEventOccurrences, autoCompleteOverdueEvents, checkAndAutoComplete } from "@/services/recurringEvents"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RegistrationsTab } from '@/components/RegistrationsTab'
import { InvitationsTab } from '@/components/InvitationsTab'
import EventTransportTab from '@/components/transport/EventTransportTab'
import EventDriversTab from '@/components/transport/EventDriversTab'
import { EventDateTimeDisplay } from '@/components/EventDateTimeDisplay'
import MeetingPlanningTab from '@/components/MeetingPlanningTab'

// Define the type for the form data
type EventFormData = {
  name: string;
  description: string;
  location: string;
  capacity: string;
  eventDate: Date;
  eventTime: string;
  isRecurring: boolean;
  recurrenceRule: string;
  recurrenceEnd: Date | null;
  recurrenceCount: string;
};

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  // Use the useNextParams utility to safely handle params
  const unwrappedParams = useNextParams(params)
  const id = typeof unwrappedParams === 'string' ? unwrappedParams : unwrappedParams?.id as string
  const initialMode = searchParams.get('mode') === 'edit'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [event, setEvent] = useState<EventType | null>(null)
  const [eventImages, setEventImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(initialMode)
  const [activeTab, setActiveTab] = useState('details')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showDeleteImageDialog, setShowDeleteImageDialog] = useState(false)
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null)
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('')
  const [showDeleteAttendanceDialog, setShowDeleteAttendanceDialog] = useState(false)
  const [deleteAttendanceItem, setDeleteAttendanceItem] = useState<string | null>(null)
  const [deletingAttendance, setDeletingAttendance] = useState(false)

  // Recurring events state
  const [eventOccurrences, setEventOccurrences] = useState<EventType[]>([])
  const [loadingOccurrences, setLoadingOccurrences] = useState(false)
  const [completingEvent, setCompletingEvent] = useState(false)
  const [generatingOccurrences, setGeneratingOccurrences] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [autoCompleting, setAutoCompleting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    location: '',
    capacity: '',
    eventDate: new Date(),
    eventTime: '12:00',
    isRecurring: false,
    recurrenceRule: 'weekly',
    recurrenceEnd: null,
    recurrenceCount: '4',
  })
  
  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true)
        const { data, error } = await fetchEventById(id)
        
        if (error) throw error
        if (!data) throw new Error('Event not found')
        
        setEvent(data)
        
        // Load event images
        const { data: images } = await supabase
          .from('event_images')
          .select('*')
          .eq('event_id', id)
          .order('sort_order')
        
        if (images) {
          setEventImages(images)
        }
        
        // Initialize form data
        const eventDate = new Date(data.event_date)
        
        setFormData({
          name: data.name || '',
          description: data.description || '',
          location: data.location || '',
          capacity: data.capacity?.toString() || '',
          eventDate,
          eventTime: format(eventDate, 'HH:mm'),
          isRecurring: data.is_recurring || false,
          recurrenceRule: data.recurrence_rule || '',
          recurrenceEnd: data.recurrence_end ? new Date(data.recurrence_end) : null,
          recurrenceCount: data.recurrence_count?.toString() || ''
        })

        // Load attendance data
        await loadAttendanceData(id)
        
        // Load event occurrences if this is a recurring event
        if (data.is_recurring) {
          await loadEventOccurrences(id)
        }
        
        // Automatically check and complete overdue events in the background
        checkAndAutoComplete().catch(err => {
          console.log('Background auto-completion check failed:', err)
          // Don't show errors to user for background checks
        })
      } catch (err) {
        console.error('Failed to load event:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load event details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadEvent()
  }, [id])

  // Load attendance data
  const loadAttendanceData = async (eventId: string) => {
    try {
      setAttendanceLoading(true)
      const { data, error } = await fetchAttendanceByEvent(eventId)
      
      if (error) throw error
      
      setAttendanceRecords((data as any) || [])
    } catch (err) {
      console.error('Failed to load attendance data:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load attendance data'
      })
    } finally {
      setAttendanceLoading(false)
    }
  }

  // Handle attendance deletion
  const openDeleteAttendanceDialog = (attendanceId: string) => {
    setDeleteAttendanceItem(attendanceId)
    setShowDeleteAttendanceDialog(true)
  }

  const confirmDeleteAttendance = async () => {
    if (!deleteAttendanceItem) return
    
    try {
      setDeletingAttendance(true)
      
      const { error } = await deleteAttendance(deleteAttendanceItem)
      
      if (error) throw error
      
      // Remove from local state
      setAttendanceRecords(prev => 
        prev.filter(record => record.id !== deleteAttendanceItem)
      )
      
      toast({
        title: 'Success',
        description: 'Attendance record deleted successfully'
      })
      
      setShowDeleteAttendanceDialog(false)
      setDeleteAttendanceItem(null)
    } catch (err) {
      console.error('Failed to delete attendance:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete attendance record'
      })
    } finally {
      setDeletingAttendance(false)
    }
  }

  // Filter attendance records based on search
  const filteredAttendanceRecords = attendanceRecords.filter(record => {
    if (!attendanceSearchQuery.trim()) return true
    
    const searchTerm = attendanceSearchQuery.toLowerCase()
    const contactName = `${record.contacts?.first_name || ''} ${record.contacts?.last_name || ''}`.toLowerCase()
    const contactEmail = (record.contacts?.email || '').toLowerCase()
    const contactPhone = (record.contacts?.phone || '').toLowerCase()
    
    return contactName.includes(searchTerm) || 
           contactEmail.includes(searchTerm) || 
           contactPhone.includes(searchTerm)
  })
  
  // Form input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, eventDate: date }))
  }
  
  const handleRecurrenceEndDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, recurrenceEnd: date }))
  }
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isRecurring: checked }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Image upload handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  const handleUploadImage = async () => {
    if (!imageFile) return
    
    try {
      setUploadingImage(true)
      const imageUrl = await uploadEventImage(id, imageFile)
      
      // Reload event images to get the latest data including the new image
      const { data: updatedImages } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', id)
        .order('sort_order')
      
      if (updatedImages) {
        setEventImages(updatedImages)
      }
      
      // Clear the upload form
      handleRemoveImage()
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully'
      })
    } catch (err) {
      console.error('Failed to upload image:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload image'
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDeleteImage = (imageId: string) => {
    setDeleteImageId(imageId)
    setShowDeleteImageDialog(true)
  }

  const confirmDeleteImage = async () => {
    if (!deleteImageId) return
    
    try {
      const { error } = await deleteEventImage(deleteImageId)
      
      if (error) {
        throw error
      }
      
      // Remove from local state
      setEventImages(eventImages.filter(img => img.id !== deleteImageId))
      
      toast({
        title: 'Success',
        description: 'Image deleted successfully'
      })
      
      setShowDeleteImageDialog(false)
      setDeleteImageId(null)
    } catch (err) {
      console.error('Failed to delete image:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete image'
      })
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Combine date and time
      const combinedDate = new Date(formData.eventDate)
      const [hours, minutes] = formData.eventTime.split(':').map(Number)
      combinedDate.setHours(hours, minutes, 0, 0)
      
      // Prepare data for API
      const eventData = {
        name: formData.name,
        description: formData.description || null,
        location: formData.location || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        event_date: combinedDate.toISOString(),
        is_recurring: formData.isRecurring,
        recurrence_rule: formData.isRecurring ? formData.recurrenceRule : null,
        recurrence_end: formData.isRecurring && formData.recurrenceEnd 
          ? formData.recurrenceEnd.toISOString().split('T')[0] 
          : null,
        recurrence_count: formData.isRecurring && formData.recurrenceCount 
          ? parseInt(formData.recurrenceCount) 
          : null
      }
      
      // Update event
      const { error } = await updateEvent(id, eventData)
      if (error) throw error
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Event updated successfully'
      })
      
      // Reload event data
      const { data } = await fetchEventById(id)
      setEvent(data)
      
      // Exit edit mode
      setEditMode(false)
    } catch (err) {
      console.error('Failed to update event:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update event'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Load event occurrences if this is a recurring event
  const loadEventOccurrences = async (eventId: string) => {
    try {
      setLoadingOccurrences(true)
      const { data, error } = await getEventOccurrences(eventId)
      
      if (error) throw error
      
      setEventOccurrences(data || [])
    } catch (err) {
      console.error('Failed to load event occurrences:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load event occurrences'
      })
    } finally {
      setLoadingOccurrences(false)
    }
  }

  // Complete event and create next occurrence
  const handleCompleteEvent = async () => {
    if (!event) return
    
    try {
      setCompletingEvent(true)
      const { data, error } = await completeEventAndCreateNext(event.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: data.message
      })
      
      // Reload event data
      const { data: updatedEvent } = await fetchEventById(event.id)
      if (updatedEvent) {
        setEvent(updatedEvent)
      }
      
      // Reload occurrences if this is a recurring event
      if (event.is_recurring) {
        await loadEventOccurrences(event.id)
      }
      
    } catch (err) {
      console.error('Failed to complete event:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete event'
      })
    } finally {
      setCompletingEvent(false)
    }
  }

  // Generate future occurrences
  const handleGenerateFutureOccurrences = async (fromToday: boolean = true) => {
    if (!event) return
    
    try {
      setGeneratingOccurrences(true)
      setShowGenerateDialog(false)
      
      // Generate 1 next occurrence - either from today or immediate next
      const { data, error } = await generateFutureOccurrences(event.id, 1, fromToday)
      
      if (error) throw error
      
      const generatedDate = data && data.length > 0 ? new Date(data[0].event_date).toLocaleDateString() : '';
      
      toast({
        title: 'Success',
        description: `Generated ${data?.length || 0} occurrence${data?.length !== 1 ? 's' : ''} ${generatedDate ? `for ${generatedDate}` : ''}`
      })
      
      // Reload occurrences
      await loadEventOccurrences(event.id)
      
    } catch (err) {
      console.error('Failed to generate future occurrences:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate future occurrence'
      })
    } finally {
      setGeneratingOccurrences(false)
    }
  }

  // Auto-complete overdue events
  const handleAutoCompleteOverdue = async () => {
    try {
      setAutoCompleting(true)
      const { data, error } = await autoCompleteOverdueEvents()
      
      if (error) throw error
      
      toast({
        title: 'Auto-Completion Complete',
        description: data.message
      })
      
      // If any events were processed, reload the current event data
      if (data.results && data.results.length > 0) {
        const { data: updatedEvent } = await fetchEventById(event?.id || '')
        if (updatedEvent) {
          setEvent(updatedEvent)
        }
        
        // Reload occurrences if this is a recurring event
        if (event?.is_recurring) {
          await loadEventOccurrences(event.id)
        }
      }
      
    } catch (err) {
      console.error('Failed to auto-complete overdue events:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to auto-complete overdue events'
      })
    } finally {
      setAutoCompleting(false)
    }
  }

  // Handle deletion
  const handleDelete = async () => {
    setIsSubmitting(true)
    
    try {
      const { error } = await deleteEvent(id)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      })
      
      // Redirect back to events list
      router.push('/events')
    } catch (err) {
      console.error('Failed to delete event:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete event'
      })
      setShowDeleteDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP')
    } catch {
      return 'Invalid date'
    }
  }

  // Format time helper
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a')
    } catch {
      return 'Invalid time'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Event</h2>
          <p className="text-slate-600">Fetching event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Event Not Found</h2>
          <p className="text-slate-600 mb-6">
            The event you're looking for doesn't exist or was deleted.
          </p>
          <Button 
            asChild 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl"
          >
            <Link href="/events">
              Back to Events
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-2xl">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {editMode ? 'Edit Event' : event.name}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {editMode ? 'Update event details' : 'View and manage event information'}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {!editMode && (
                <Button
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="h-12 px-6 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              )}
              
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="h-12 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="planning">Meeting Planning</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="drivers">Fleet Management</TabsTrigger>
            <TabsTrigger value="transport">Transportation</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Event Details Card */}
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Edit className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Edit Event Details</h2>
                        <p className="text-slate-300">Update the basic information for this event</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-lg font-semibold text-slate-800">
                        Event Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-2 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-lg font-semibold text-slate-800">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="mt-2 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="eventDate" className="text-lg font-semibold text-slate-800">
                          Event Date <span className="text-red-500">*</span>
                        </Label>
                                                  <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full h-12 justify-start text-left font-normal border-2 border-slate-200 rounded-xl bg-white/50",
                                  !formData.eventDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.eventDate ? format(formData.eventDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarIconComponent
                                mode="single"
                                selected={formData.eventDate}
                                onSelectDate={(date) => handleDateChange(date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                      </div>
                      
                      <div>
                        <Label htmlFor="capacity" className="text-lg font-semibold text-slate-800">
                          Capacity
                        </Label>
                        <Input
                          id="capacity"
                          name="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          min="1"
                          className="mt-2 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="location" className="text-lg font-semibold text-slate-800">
                        Location
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="mt-2 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Image Management Card */}
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <ImageIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Event Image</h2>
                        <p className="text-orange-100">Upload or update the event image</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    {/* Current Images */}
                    {eventImages.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-lg font-semibold text-slate-800">Current Images</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {eventImages.map((img) => (
                            <div key={img.id} className="relative h-48 rounded-xl overflow-hidden group">
                              <Image
                                src={img.url}
                                alt={img.alt_text || 'Event image'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute top-2 right-2">
                                                                     <Button
                                     type="button"
                                     variant="destructive"
                                     size="sm"
                                     onClick={() => handleDeleteImage(img.id)}
                                     className="h-8 w-8 p-0 rounded-full"
                                   >
                                     <X className="h-4 w-4" />
                                   </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image Upload Section */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-slate-800">
                        {eventImages.length > 0 ? 'Add New Image' : 'Upload Event Image'}
                      </Label>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      
                      {!imagePreview ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-32 flex flex-col items-center justify-center border-dashed border-2 border-slate-300 rounded-xl bg-white/50 hover:bg-white/80 hover:border-orange-400"
                        >
                          <Upload className="h-8 w-8 mb-2 text-slate-500" />
                          <span className="text-slate-600 font-medium">Select Image to Upload</span>
                          <span className="text-slate-400 text-sm">PNG, JPG, GIF up to 10MB</span>
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="relative w-full h-48 rounded-xl overflow-hidden">
                            <Image
                              src={imagePreview}
                              alt="Image preview"
                              fill
                              className="object-cover"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              onClick={handleUploadImage}
                              disabled={uploadingImage}
                              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                            >
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Image
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleRemoveImage}
                              className="px-4"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recurring Settings Card */}
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Repeat className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Recurring Settings</h2>
                        <p className="text-purple-100">Configure how this event repeats</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <div>
                        <Label htmlFor="isRecurring" className="text-lg font-semibold text-slate-800">
                          Recurring Event
                        </Label>
                        <p className="text-sm text-slate-600">Enable if this event repeats on a schedule</p>
                      </div>
                      <Switch
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onCheckedChange={handleSwitchChange}
                      />
                    </div>
                    
                    {formData.isRecurring && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                        <div>
                          <Label htmlFor="recurrenceRule" className="font-semibold text-slate-800">
                            Frequency
                          </Label>
                          <Select 
                            value={formData.recurrenceRule}
                            onValueChange={(value) => handleSelectChange('recurrenceRule', value)}
                          >
                            <SelectTrigger className="mt-2 h-12 border-2 border-purple-200 rounded-xl bg-white/50">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="recurrenceCount" className="font-semibold text-slate-800">
                            Number of Occurrences
                          </Label>
                          <Input
                            id="recurrenceCount"
                            name="recurrenceCount"
                            type="number"
                            value={formData.recurrenceCount}
                            onChange={handleInputChange}
                            min="1"
                            max="52"
                            className="mt-2 h-12 border-2 border-purple-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={isSubmitting}
                    className="h-12 px-8 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-8">
                  {/* Event Information Card */}
                  <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <CalendarIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-white">Event Information</h2>
                          <p className="text-indigo-100">Basic details about this event</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">Description</h3>
                            <p className="text-slate-600 leading-relaxed">
                              {event.description || 'No description provided'}
                            </p>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-blue-500" />
                              Location
                            </h3>
                            <p className="text-slate-600">
                              {event.location || 'No location specified'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <CalendarIcon className="h-5 w-5 text-blue-500" />
                              Date & Time
                            </h3>
                            <EventDateTimeDisplay eventDate={event.event_date} />
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <Users className="h-5 w-5 text-blue-500" />
                              Capacity
                            </h3>
                            <p className="text-slate-600">
                              {event.capacity ? `${event.capacity} attendees` : 'No limit set'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recurring Info */}
                      {event.is_recurring && (
                        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Repeat className="h-5 w-5 text-purple-500" />
                            Recurring Event
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-slate-700">Frequency:</span>
                              <span className="ml-2 text-slate-600 capitalize">{event.recurrence_rule}</span>
                            </div>
                            {event.recurrence_count && (
                              <div>
                                <span className="font-medium text-slate-700">Occurrences:</span>
                                <span className="ml-2 text-slate-600">{event.recurrence_count} times</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Recurring Events Management */}
                      {event.is_recurring && (
                        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                          <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Recurring Events
                          </h3>
                          <p className="text-sm text-slate-600 mb-4">
                            This event repeats <strong>{event.recurrence_rule}</strong>. 
                            Click the button below to create the next occurrence.
                          </p>
                          
                          <div className="flex flex-wrap gap-3 mb-4">
                            <Button
                              onClick={() => setShowGenerateDialog(true)}
                              disabled={generatingOccurrences}
                              className="h-10 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                            >
                              {generatingOccurrences ? 'Generating...' : 'Generate Next Occurrence'}
                            </Button>
                            
                            <Button
                              onClick={() => loadEventOccurrences(event.id)}
                              disabled={loadingOccurrences}
                              variant="outline"
                              className="h-10 px-4 border-2 border-gray-200 rounded-lg"
                            >
                              {loadingOccurrences ? 'Loading...' : 'View All Occurrences'}
                            </Button>
                          </div>
                          
                          <div className="text-xs text-slate-500 bg-white/50 p-3 rounded-lg">
                            <p><strong>💡 Tip:</strong> When the event date passes, click "Generate Next Occurrence" to create the next one in the series. 
                            Each occurrence is a separate event with its own registrations and attendance.</p>
                          </div>
                          
                          {/* Show occurrences if loaded */}
                          {eventOccurrences.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-md font-medium text-slate-700 mb-2">
                                Event Occurrences ({eventOccurrences.length})
                              </h4>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {eventOccurrences.map((occurrence) => (
                                  <div
                                    key={occurrence.id}
                                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                                  >
                                    <div>
                                      <p className="font-medium text-slate-800">{occurrence.name}</p>
                                      <p className="text-sm text-slate-600">
                                        {format(new Date(occurrence.event_date), 'PPP p')}
                                      </p>
                                    </div>
                                    <Badge 
                                      variant={occurrence.status === 'completed' ? 'default' : 'secondary'}
                                      className={occurrence.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                                    >
                                      {occurrence.status || 'scheduled'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Images Card */}
                  {eventImages.length > 0 && (
                    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">Event Images</h2>
                            <p className="text-orange-100">Photos from this event</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {eventImages.map((img) => (
                            <div key={img.id} className="relative h-48 rounded-xl overflow-hidden group">
                              <Image
                                src={img.url}
                                alt={img.alt_text || 'Event image'}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Meeting Planning Tab */}
          <TabsContent value="planning" className="pt-4">
            <MeetingPlanningTab eventId={id} />
          </TabsContent>
          
          {/* Registrations Tab */}
          <TabsContent value="registrations" className="pt-4">
            <RegistrationsTab eventId={id} />
          </TabsContent>
          
          {/* Invitations Tab */}
          <TabsContent value="invitations" className="pt-4">
            <InvitationsTab eventId={id} />
          </TabsContent>
          
          {/* Drivers & Vehicles Tab */}
          <TabsContent value="drivers" className="pt-4">
            <EventDriversTab eventId={id} />
          </TabsContent>
          
          {/* Transport Tab */}
          <TabsContent value="transport" className="pt-4">
            <EventTransportTab eventId={id} />
          </TabsContent>
          
          {/* Attendance Tab */}
          <TabsContent value="attendance" className="pt-4">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Event Attendance</h2>
                      <p className="text-purple-100">Track and manage people who attended this event</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      asChild
                      className="h-12 px-6 border-2 border-white/30 rounded-xl bg-white/20 hover:bg-white/30 text-white border-white/40"
                    >
                      <Link href={`/people/attendance/event/${id}`}>
                        <Eye className="mr-2 h-5 w-5" />
                        View All
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      asChild
                      className="h-12 px-6 border-2 border-white/30 rounded-xl bg-white/20 hover:bg-white/30 text-white border-white/40"
                    >
                      <Link href="/people/attendance/new">
                        <Plus className="mr-2 h-5 w-5" />
                        Add Attendance
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                {attendanceLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
                      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Attendance</h3>
                    <p className="text-slate-600">Fetching attendance records...</p>
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-12 w-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">No Attendance Records</h3>
                    <p className="text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
                      No one has checked in to this event yet. Attendance will appear here once people start checking in.
                    </p>
                    <Button 
                      asChild 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg rounded-xl h-12 px-8"
                    >
                      <Link href="/people/attendance/new">
                        <Plus className="mr-2 h-5 w-5" />
                        Record First Attendance
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Search and Stats */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input
                            placeholder="Search attendees by name, email, or phone..."
                            value={attendanceSearchQuery}
                            onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                            className="pl-10 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                          {filteredAttendanceRecords.length} of {attendanceRecords.length} records
                        </span>
                      </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-2">{attendanceRecords.length}</div>
                          <div className="text-sm font-medium text-purple-700">Total Check-ins</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {new Set(attendanceRecords.map(r => r.contact_id)).size}
                          </div>
                          <div className="text-sm font-medium text-blue-700">Unique Attendees</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-emerald-600 mb-2">
                            {attendanceRecords.filter(r => r.method === 'qr').length}
                          </div>
                          <div className="text-sm font-medium text-emerald-700">QR Code Check-ins</div>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="bg-white/50 rounded-xl border border-slate-200 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold text-slate-800">Attendee</TableHead>
                            <TableHead className="font-semibold text-slate-800">Check-in Time</TableHead>
                            <TableHead className="font-semibold text-slate-800">Method</TableHead>
                            <TableHead className="font-semibold text-slate-800">Campus</TableHead>
                            <TableHead className="text-right font-semibold text-slate-800">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAttendanceRecords.map((record) => (
                            <TableRow key={record.id} className="hover:bg-white/70">
                              <TableCell>
                                {record.contacts ? (
                                  <div>
                                    <div className="font-semibold text-slate-800">
                                      {record.contacts.first_name} {record.contacts.last_name}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      {record.contacts.email || record.contacts.phone || ''}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500">Unknown Contact</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-slate-800">
                                  {formatDate(record.check_in_time)}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {formatTime(record.check_in_time)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
                                  {record.method === 'qr' ? 'QR Code' : record.method}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-slate-700 font-medium">
                                  {record.campuses?.name || 'Main Campus'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    asChild
                                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                  >
                                    <Link href={`/people/attendance/${record.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    asChild
                                    className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg"
                                  >
                                    <Link href={`/people/attendance/${record.id}?mode=edit`}>
                                      <Pencil className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => openDeleteAttendanceDialog(record.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {filteredAttendanceRecords.length === 0 && attendanceSearchQuery && (
                      <div className="text-center py-12">
                        <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="h-8 w-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Results Found</h3>
                        <p className="text-slate-600 mb-4">
                          No attendance records match your search for "{attendanceSearchQuery}"
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setAttendanceSearchQuery('')}
                          className="h-10 px-6 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                        >
                          Clear Search
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {event?.name}? This action cannot be undone
                and will remove all registrations, invitations, and associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Event'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Attendance Confirmation Dialog */}
        <Dialog open={showDeleteAttendanceDialog} onOpenChange={setShowDeleteAttendanceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this attendance record? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAttendanceDialog(false)}
                disabled={deletingAttendance}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteAttendance}
                disabled={deletingAttendance}
              >
                {deletingAttendance ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Record'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Image Confirmation Dialog */}
        <Dialog open={showDeleteImageDialog} onOpenChange={setShowDeleteImageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Image Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this image? This action cannot be undone and will permanently remove the image from the event.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteImageDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteImage}
              >
                Delete Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Occurrence Choice Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Next Occurrence</DialogTitle>
              <DialogDescription>
                Choose how to calculate the next event date for <strong>{event?.name}</strong>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Button
                onClick={() => handleGenerateFutureOccurrences(true)}
                disabled={generatingOccurrences}
                className="w-full h-auto p-4 flex flex-col items-start gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Calendar className="h-5 w-5" />
                  Next Future Occurrence (Recommended)
                </div>
                <p className="text-xs text-blue-100 text-left">
                  Skips past dates and creates the next occurrence from today onwards. Best for events that have been inactive.
                </p>
              </Button>
              
              <Button
                onClick={() => handleGenerateFutureOccurrences(false)}
                disabled={generatingOccurrences}
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Repeat className="h-5 w-5" />
                  Immediate Next (May Be Past)
                </div>
                <p className="text-xs text-slate-500 text-left">
                  Creates the next occurrence based on the last event date, even if it's in the past. Use for catching up on missed events.
                </p>
              </Button>
            </div>
            
            <DialogFooter>
              <Button 
                variant="ghost" 
                onClick={() => setShowGenerateDialog(false)}
                disabled={generatingOccurrences}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 