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
  Image as ImageIcon
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
  fetchEvent, 
  updateEvent, 
  deleteEvent, 
  fetchEventImages,
  uploadEventImage 
} from '@/services/events'

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
  const id = params.id as string
  const initialMode = searchParams.get('mode') === 'edit'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [event, setEvent] = useState<any>(null)
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
  
  // Load event data and images
  useEffect(() => {
    const loadEvent = async () => {
      try {
        console.log('Loading event details for ID:', id);
        const { data, error } = await fetchEvent(id)
        if (error) throw error
        
        if (!data) {
          throw new Error('Event not found')
        }
        
        // Set the event data
        setEvent(data)
        console.log('Event data loaded successfully:', data);
        
        // Fetch event images
        console.log('Fetching images for event ID:', id);
        const imagesResponse = await fetchEventImages(id)
        if (imagesResponse.error) {
          console.error('Failed to load event images:', imagesResponse.error)
        } else {
          const imageData = imagesResponse.data || [];
          console.log('Event images loaded:', imageData.length, 'images');
          console.log('Image data:', imageData);
          setEventImages(imageData)
        }
        
        // Parse event date and time
        const eventDate = new Date(data.event_date)
        const hours = eventDate.getHours().toString().padStart(2, '0')
        const minutes = eventDate.getMinutes().toString().padStart(2, '0')
        const eventTime = `${hours}:${minutes}`
        
        // Initialize form with event data
        setFormData({
          name: data.name || '',
          description: data.description || '',
          location: data.location || '',
          capacity: data.capacity?.toString() || '',
          eventDate,
          eventTime,
          isRecurring: data.is_recurring || false,
          recurrenceRule: data.recurrence_rule || 'weekly',
          recurrenceEnd: data.recurrence_end ? new Date(data.recurrence_end) : null,
          recurrenceCount: data.recurrence_count?.toString() || '4',
        })
      } catch (err) {
        console.error('Failed to load event:', err)
        setError(err instanceof Error ? err.message : 'Failed to load event')
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
      const { data } = await fetchEvent(id)
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
  
  // Render the main content
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-destructive mb-4">Error: {error}</div>
        <Button variant="outline" onClick={() => router.push('/events')}>
          Return to Events
        </Button>
      </div>
    )
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp') // Format as "Apr 29, 2023, 5:00 PM"
    } catch (error) {
      return 'Invalid date'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{editMode ? 'Edit Event' : event.name}</h1>
        <div className="flex flex-wrap gap-2">
          {!editMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="transport">Transport</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          {editMode ? (
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Edit Event</CardTitle>
                  <CardDescription>
                    Update the details for this event
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Info Section */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Event Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter event name"
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
                      placeholder="Enter event description"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Enter event location"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        name="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        placeholder="Enter capacity (optional)"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">
                        Event Date <span className="text-red-500">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.eventDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.eventDate ? (
                              format(formData.eventDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.eventDate}
                            onSelectDate={handleDateChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="eventTime">
                        Event Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="eventTime"
                        name="eventTime"
                        type="time"
                        value={formData.eventTime}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Recurrence Section */}
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium flex items-center">
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Recurring Event
                      </h3>
                      <Switch 
                        checked={formData.isRecurring}
                        onCheckedChange={handleSwitchChange}
                      />
                    </div>
                    
                    {formData.isRecurring && (
                      <div className="pt-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="recurrenceRule">Recurrence Pattern</Label>
                            <Select 
                              value={formData.recurrenceRule}
                              onValueChange={(value) => handleSelectChange('recurrenceRule', value)}
                            >
                              <SelectTrigger id="recurrenceRule">
                                <SelectValue placeholder="Select pattern" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="recurrenceCount">Number of Occurrences</Label>
                            <Input
                              id="recurrenceCount"
                              name="recurrenceCount"
                              type="number"
                              value={formData.recurrenceCount}
                              onChange={handleInputChange}
                              min="2"
                              max="52"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="recurrenceEnd">End Date (Optional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !formData.recurrenceEnd && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.recurrenceEnd ? (
                                  format(formData.recurrenceEnd, "PPP")
                                ) : (
                                  <span>Pick an end date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={formData.recurrenceEnd || undefined}
                                onSelectDate={handleRecurrenceEndDateChange}
                                disableFutureDates={false}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <p className="text-sm text-muted-foreground">
                            If set, this will override the number of occurrences
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Event Images</CardTitle>
                  <CardDescription>Add images for this event</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Display existing images */}
                  {eventImages.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {eventImages.map((img) => (
                        <div key={img.id} className="relative h-48 rounded-md overflow-hidden">
                          <Image
                            src={img.url}
                            alt={img.alt_text || 'Event image'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Image upload section */}
                  <div className="space-y-2">
                    <Label htmlFor="image">Add New Image</Label>
                    <div className="flex flex-col space-y-2">
                      <input
                        type="file"
                        id="image"
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
                          className="w-full h-32 flex flex-col items-center justify-center border-dashed"
                        >
                          <Upload className="h-8 w-8 mb-2" />
                          <span>Upload Event Image</span>
                        </Button>
                      ) : (
                        <div className="relative w-full h-48">
                          <Image
                            src={imagePreview}
                            alt="Event preview"
                            fill
                            className="object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {imagePreview && (
                        <Button 
                          type="button"
                          className="mt-2"
                          onClick={handleUploadImage}
                          disabled={uploadingImage}
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
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditMode(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting || !formData.name}
                >
                  {isSubmitting ? (
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
            </form>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Display primary event image if available */}
                  {eventImages.length > 0 && (
                    <div className="mb-6">
                      <div className="relative h-64 w-full rounded-lg overflow-hidden">
                        <Image
                          src={eventImages[0].url}
                          alt={eventImages[0].alt_text || event.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Display additional images in a grid if there are more than one */}
                  {eventImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {eventImages.slice(1).map((img) => (
                        <div key={img.id} className="relative h-20 rounded overflow-hidden">
                          <Image
                            src={img.url}
                            alt={img.alt_text || 'Event image'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                      <p className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(event.event_date)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                      <p className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        {event.location || 'No location specified'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
                      <p className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        {event.capacity ? `${event.capacity} people` : 'Unlimited'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-muted-foreground">Recurring</h3>
                      <p className="flex items-center">
                        <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                        {event.is_recurring ? (
                          <>
                            Yes - {event.recurrence_rule} 
                            {event.recurrence_count && ` (${event.recurrence_count} occurrences)`}
                            {event.recurrence_end && ` until ${format(new Date(event.recurrence_end), 'PP')}`}
                          </>
                        ) : 'No - One-time event'}
                      </p>
                    </div>
                  </div>
                  
                  {event.description && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-line">{event.description}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Registrations Tab */}
        <TabsContent value="registrations" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Registrations</CardTitle>
                  <CardDescription>
                    People registered for this event
                  </CardDescription>
                </div>
                <Button variant="outline" disabled>
                  <Users className="mr-2 h-4 w-4" />
                  Add Registration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Registration Management Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  This feature is under development. Soon you'll be able to manage
                  event registrations and track attendance here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Invitations Tab */}
        <TabsContent value="invitations" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Invitations</CardTitle>
                  <CardDescription>
                    Invitations sent for this event
                  </CardDescription>
                </div>
                <Button variant="outline" disabled>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitations
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Invitation System Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  This feature is under development. Soon you'll be able to send and track
                  event invitations via email, SMS, and other channels.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Transport Tab */}
        <TabsContent value="transport" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Transport</CardTitle>
                  <CardDescription>
                    Transportation arrangements for this event
                  </CardDescription>
                </div>
                <Button variant="outline" disabled>
                  <Car className="mr-2 h-4 w-4" />
                  Manage Transport
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Car className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Transport Management Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  This feature is under development. Soon you'll be able to manage
                  transport requests, assign drivers, and optimize routes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {event.name}? This action cannot be undone
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
    </div>
  )
} 