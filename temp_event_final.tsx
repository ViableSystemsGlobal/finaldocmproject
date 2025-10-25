'use client'

import { useState, useEffect, useRef } from 'react'
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
  Repeat
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
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { 
  fetchEventById, 
  updateEvent, 
  deleteEvent, 
  fetchEventImages,
  uploadEventImage 
} from '@/services/events'
import { useNextParams } from '@/lib/nextParams'
import { AttendanceRecord, fetchAttendanceByEvent, deleteAttendance } from '@/services/attendance'
import { supabase } from '@/lib/supabase'
import { completeEventAndCreateNext, generateFutureOccurrences, getEventOccurrences } from "@/services/recurringEvents"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  const id = unwrappedParams.id as string
  const initialMode = searchParams.get('mode') === 'edit'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [event, setEvent] = useState<Event | null>(null)
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
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('')
  const [showDeleteAttendanceDialog, setShowDeleteAttendanceDialog] = useState(false)
  const [deleteAttendanceItem, setDeleteAttendanceItem] = useState<string | null>(null)
  const [deletingAttendance, setDeletingAttendance] = useState(false)

  // Recurring events state
  const [eventOccurrences, setEventOccurrences] = useState<Event[]>([])
  const [loadingOccurrences, setLoadingOccurrences] = useState(false)
  const [completingEvent, setCompletingEvent] = useState(false)
  const [generatingOccurrences, setGeneratingOccurrences] = useState(false)
  
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
      
      setAttendanceRecords(data as AttendanceRecord[] || [])
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
      
      // Add to the event images list
      setEventImages([
        ...eventImages, 
        { id: Date.now().toString(), event_id: id, url: imageUrl, alt_text: imageFile.name }
      ])
      
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
  
