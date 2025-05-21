'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  CalendarIcon,
  Loader2,
  Save,
  Trash2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  AttendanceRecord,
  fetchAttendanceById,
  updateAttendance,
  deleteAttendance
} from '@/services/attendance'

export default function AttendanceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const initialMode = searchParams.get('mode') === 'edit'
  
  // State
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(initialMode)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    checkInDate: new Date(),
    checkInTime: '12:00',
    method: 'manual',
  })

  // Load attendance data
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        setLoading(true)
        const { data, error } = await fetchAttendanceById(id)
        
        if (error) throw error
        if (!data) throw new Error('Attendance record not found')
        
        setAttendance(data)
        
        // Parse date and time
        const checkInDate = new Date(data.check_in_time)
        const hours = checkInDate.getHours().toString().padStart(2, '0')
        const minutes = checkInDate.getMinutes().toString().padStart(2, '0')
        const checkInTime = `${hours}:${minutes}`
        
        // Set form data
        setFormData({
          checkInDate,
          checkInTime,
          method: data.method,
        })
      } catch (err) {
        console.error('Failed to load attendance record:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load attendance record'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadAttendance()
  }, [id])
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!attendance) return
    
    try {
      setIsSubmitting(true)
      
      // Combine date and time
      const checkInDateTime = new Date(formData.checkInDate)
      const [hours, minutes] = formData.checkInTime.split(':').map(Number)
      checkInDateTime.setHours(hours, minutes, 0, 0)
      
      // Prepare update data
      const updateData = {
        check_in_time: checkInDateTime.toISOString(),
        method: formData.method,
      }
      
      // Update record
      const { success, error } = await updateAttendance(id, updateData)
      
      if (!success || error) throw error
      
      toast({
        title: 'Success',
        description: 'Attendance record updated successfully'
      })
      
      // Exit edit mode
      setEditMode(false)
      
      // Update local state
      setAttendance(prev => prev ? { ...prev, ...updateData } : null)
    } catch (err) {
      console.error('Failed to update attendance record:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update attendance record'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      const { success, error } = await deleteAttendance(id)
      
      if (!success || error) throw error
      
      toast({
        title: 'Success',
        description: 'Attendance record deleted successfully'
      })
      
      // Navigate back to list
      router.push('/people/attendance')
    } catch (err) {
      console.error('Failed to delete attendance record:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete attendance record'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP'); // Format as "April 29, 2023"
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  // Format time helper
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a'); // Format as "5:00 PM"
    } catch (error) {
      return 'Invalid time';
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading attendance record...</span>
      </div>
    );
  }
  
  if (!attendance) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Record Not Found</h2>
          <p className="text-muted-foreground mt-2">
            The attendance record you're looking for doesn't exist or was deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/people/attendance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Attendance Records
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const contactName = attendance.contacts 
    ? `${attendance.contacts.first_name || ''} ${attendance.contacts.last_name || ''}`.trim()
    : 'Unknown Contact';
    
  const eventName = attendance.events ? attendance.events.name : 'Unknown Event';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/people/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Attendance Record Details</h1>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>
            {eventName}
            {attendance.events && (
              <span className="text-muted-foreground text-base font-normal ml-2">
                — {formatDate(attendance.events.event_date)}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {editMode ? 'Edit attendance record' : 'View attendance details'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Input 
                    id="contact"
                    value={contactName}
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="event">Event</Label>
                  <Input 
                    id="event"
                    value={eventName}
                    disabled
                  />
                </div>
                
                <div>
                  <Label htmlFor="checkInDate">Check-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.checkInDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.checkInDate ? (
                          format(formData.checkInDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    {/* Date picker would go here */}
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="checkInTime">Check-in Time</Label>
                  <Input 
                    id="checkInTime"
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      checkInTime: e.target.value
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="method">Check-in Method</Label>
                  <Select 
                    value={formData.method}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      method: value
                    }))}>
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
                
                <div>
                  <Label htmlFor="campus">Campus</Label>
                  <Input 
                    id="campus"
                    value={attendance.campus?.name || 'Main Campus'}
                    disabled
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
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
                  disabled={isSubmitting}
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
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Event</div>
                  <div>{eventName}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Contact</div>
                  <div className="font-medium">{contactName}</div>
                  <div className="text-sm text-muted-foreground">
                    {attendance.contacts?.phone || attendance.contacts?.email || ''}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Check-in Date</div>
                  <div>{formatDate(attendance.check_in_time)}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Check-in Time</div>
                  <div>{formatTime(attendance.check_in_time)}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Method</div>
                  <div className="capitalize">
                    {attendance.method === 'qr' ? 'QR Code' : attendance.method}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Campus</div>
                  <div>{attendance.campus?.name || 'Main Campus'}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Recorded At</div>
                  <div>{formatDate(attendance.created_at)} at {formatTime(attendance.created_at)}</div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button
                  onClick={() => setEditMode(true)}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 