'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Loader2,
  Calendar as CalendarIcon,
  CalendarClock,
  Save,
  Upload,
  X,
  Clock,
  MapPin,
  Users,
  Repeat,
  ArrowLeft,
  ImageIcon,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { toast } from '@/components/ui/use-toast'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { createEvent, uploadEventImage } from '@/services/events'
import Link from 'next/link'
import { convertToUTC } from '@/lib/timezone-utils'

import { AddressAutocomplete } from '@/components/transport/AddressAutocomplete'

// Define the type for the form data
type EventFormData = {
  name: string;
  description: string;
  location: string;
  location_data?: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: string;
  eventDate: Date;
  eventTime: string;
  isRecurring: boolean;
  recurrenceRule: string;
  recurrenceEnd: Date | null;
  recurrenceCount: string;
};

export default function NewEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Initialize form data with default values
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    location: '',
    capacity: '',
    eventDate: new Date(),
    eventTime: '',
    isRecurring: false,
    recurrenceRule: 'weekly',
    recurrenceEnd: null,
    recurrenceCount: '4',
  })
  
  // Form input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, eventDate: date }))
    }
  }
  
  const handleRecurrenceEndDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({ ...prev, recurrenceEnd: date }))
    }
  }
  
  // Type-safe wrapper for calendar selection
  const handleCalendarDateSelect = (date: Date | undefined) => {
    handleDateChange(date)
  }
  
  const handleRecurrenceCalendarDateSelect = (date: Date | undefined) => {
    handleRecurrenceEndDateChange(date)
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
  
  // Handle location change with coordinates
  const handleLocationChange = (value: string, locationData?: any) => {
    setFormData(prev => ({
      ...prev,
      location: value,
      location_data: locationData
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Combine date and time using timezone-aware conversion
      const combinedDate = await convertToUTC(formData.eventDate, formData.eventTime)
      
      // Prepare data for API
      const eventData = {
        name: formData.name,
        description: formData.description || null,
        location: formData.location || null,
        // Add location data with coordinates if available
        location_data: formData.location_data || null,
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
      
      // Create event
      console.log('Creating event with data:', eventData);
      const response = await createEvent(eventData)
      
      if (response.error) {
        console.error('Error creating event:', response.error);
        throw response.error
      }
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Event created successfully'
      })
      
      // Get the ID from the created event
      let eventId = null;
      
      if (response.data && Array.isArray(response.data)) {
        const data = response.data as any[];
        if (data.length > 0 && data[0] && data[0].id) {
          eventId = data[0].id;
          
          // Upload image if selected
          if (imageFile && eventId) {
            try {
              await uploadEventImage(eventId, imageFile);
              toast({
                title: 'Image Uploaded',
                description: 'Event image uploaded successfully'
              });
            } catch (imageError) {
              console.error('Error uploading image:', imageError);
              toast({
                variant: 'destructive',
                title: 'Image Upload Failed',
                description: 'Event was created but the image upload failed'
              });
            }
          }
          
          // Redirect to the event detail page
          if (eventId) {
            router.push(`/events/${eventId}`);
          } else {
            router.push('/events');
          }
        } else {
          router.push('/events');
        }
      } else {
        router.push('/events');
      }
    } catch (err) {
      console.error('Failed to create event:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create event'
      })
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <Button
              variant="outline"
              asChild
              className="h-12 w-12 rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80"
            >
              <Link href="/events">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-2xl">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Create New Event
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Set up a new church event or activity
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Event Details */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Event Details</h2>
                  <p className="text-slate-300">Basic information about your event</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Event Name */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="name" className="text-lg font-semibold text-slate-800">
                      Event Name <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-slate-600">Give your event a clear, descriptive name</p>
                  </div>
                </div>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter event name"
                  required
                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Event Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-lg font-semibold text-slate-800">
                      Description
                    </Label>
                    <p className="text-sm text-slate-600">Provide details about what attendees can expect</p>
                  </div>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your event..."
                  rows={4}
                  className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Event Image */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="image" className="text-lg font-semibold text-slate-800">
                      Event Image
                    </Label>
                    <p className="text-sm text-slate-600">Add a visual to make your event more appealing</p>
                  </div>
                </div>
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
                      className="w-full h-32 flex flex-col items-center justify-center border-dashed border-2 border-slate-300 rounded-xl bg-white/50 hover:bg-white/80 hover:border-blue-400"
                    >
                      <Upload className="h-8 w-8 mb-2 text-slate-500" />
                      <span className="text-slate-600 font-medium">Upload Event Image</span>
                    </Button>
                  ) : (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Event preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Date, Time & Location */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">When & Where</h2>
                  <p className="text-blue-100">Set the date, time, and location</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Date */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    <Label htmlFor="date" className="text-lg font-semibold text-slate-800">
                      Date <span className="text-red-500">*</span>
                    </Label>
                  </div>
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
                      <Calendar
                        mode="single"
                        selected={formData.eventDate}
                        onSelectDate={(date) => handleDateChange(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Event Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <Label htmlFor="eventTime" className="text-lg font-semibold text-slate-800">
                      Time <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="eventTime"
                      name="eventTime"
                      type="time"
                      value={formData.eventTime}
                      onChange={handleInputChange}
                      required
                      step="900"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label htmlFor="location" className="text-lg font-semibold text-slate-800">
                      Location
                    </Label>
                    <p className="text-sm text-slate-600">Where will this event take place?</p>
                  </div>
                </div>
                <AddressAutocomplete
                  value={formData.location}
                  onChange={handleLocationChange}
                  placeholder="Enter event location..."
                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Capacity */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label htmlFor="capacity" className="text-lg font-semibold text-slate-800">
                      Capacity
                    </Label>
                    <p className="text-sm text-slate-600">Maximum number of attendees (optional)</p>
                  </div>
                </div>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="Enter capacity"
                  min="1"
                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Recurring Options */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Repeat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Recurring Event</h2>
                  <p className="text-purple-100">Set up repeating schedule if needed</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Recurring Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label htmlFor="isRecurring" className="text-lg font-semibold text-slate-800">
                      Make this a recurring event
                    </Label>
                    <p className="text-sm text-slate-600">Event will repeat on a schedule</p>
                  </div>
                </div>
                <Switch
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={handleSwitchChange}
                />
              </div>

              {/* Recurring Options */}
              {formData.isRecurring && (
                <div className="space-y-6 p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recurrence Rule */}
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceRule" className="font-semibold text-slate-800">
                        Frequency
                      </Label>
                      <Select 
                        value={formData.recurrenceRule} 
                        onValueChange={(value) => handleSelectChange('recurrenceRule', value)}
                      >
                        <SelectTrigger className="h-12 border-2 border-purple-200 rounded-xl bg-white/50">
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

                    {/* Recurrence Count */}
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceCount" className="font-semibold text-slate-800">
                        Number of Occurrences
                      </Label>
                      <Input
                        id="recurrenceCount"
                        name="recurrenceCount"
                        type="number"
                        value={formData.recurrenceCount}
                        onChange={handleInputChange}
                        placeholder="How many times?"
                        min="1"
                        max="52"
                        className="h-12 border-2 border-purple-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Recurrence End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceEnd" className="font-semibold text-slate-800">
                      End Date (Optional)
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal border-2 border-purple-200 rounded-xl bg-white/50",
                            !formData.recurrenceEnd && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.recurrenceEnd ? format(formData.recurrenceEnd, "PPP") : <span>Pick an end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.recurrenceEnd || undefined}
                          onSelectDate={(date) => handleRecurrenceEndDateChange(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
              onClick={() => router.push('/events')}
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
                  Creating Event...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 