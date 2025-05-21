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
  X
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

export default function NewEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Event</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Enter the details for the new event
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
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="image">Event Image</Label>
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
              </div>
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
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/events')}
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
} 