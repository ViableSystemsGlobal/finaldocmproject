'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useNextParams } from '@/lib/nextParams'
import { format } from 'date-fns'
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  Save,
  Trash2,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar as CalendarCheckIcon,
  Smartphone,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
  
  // Extract ID from params safely
  const id = typeof params === 'string' ? params : params?.id as string
  
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
        description: 'Attendance record updated successfully',
        variant: 'default',
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

  // Get method display info
  const getMethodInfo = (method: string) => {
    switch (method) {
      case 'qr':
        return { label: 'QR Code', icon: Smartphone, color: 'bg-purple-500' }
      case 'app':
        return { label: 'Mobile App', icon: Smartphone, color: 'bg-blue-500' }
      case 'kiosk':
        return { label: 'Kiosk', icon: Smartphone, color: 'bg-green-500' }
      default:
        return { label: 'Manual', icon: Edit3, color: 'bg-slate-500' }
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-6 rounded-2xl border border-white/20 shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-lg font-medium text-slate-700">Loading attendance record...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!attendance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
          <div className="text-center bg-white/80 backdrop-blur-sm p-12 rounded-3xl border border-white/20 shadow-xl max-w-md">
            <div className="bg-gradient-to-br from-red-100 to-red-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CalendarCheckIcon className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Record Not Found</h2>
            <p className="text-slate-600 mb-8">
              The attendance record you're looking for doesn't exist or was deleted.
            </p>
            <Button asChild className="rounded-xl px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700">
              <Link href="/people/attendance">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Attendance Records
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const contactName = attendance.contacts 
    ? `${attendance.contacts.first_name || ''} ${attendance.contacts.last_name || ''}`.trim()
    : 'Unknown Contact';
    
  const eventName = attendance.events ? attendance.events.name : 'Unknown Event';
  const methodInfo = getMethodInfo(attendance.method);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center gap-6">
          <Button 
            variant="outline" 
            size="icon" 
            asChild
            className="h-12 w-12 rounded-xl border-2 border-slate-200 bg-white/80 hover:bg-white shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Link href="/people/attendance">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Attendance Record
            </h1>
            <p className="text-slate-600 mt-1">
              {editMode ? 'Edit attendance record details' : 'View attendance record information'}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{eventName}</h2>
                {attendance.events && (
                  <p className="text-indigo-100 flex items-center gap-2">
                    <CalendarCheckIcon className="h-4 w-4" />
                    {formatDate(attendance.events.event_date)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Present
                </Badge>
                <div className={`${methodInfo.color} p-3 rounded-xl`}>
                  <methodInfo.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-sm font-semibold text-slate-700">Contact</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="contact"
                        value={contactName}
                        disabled
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="event" className="text-sm font-semibold text-slate-700">Event</Label>
                    <div className="relative">
                      <CalendarCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="event"
                        value={eventName}
                        disabled
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate" className="text-sm font-semibold text-slate-700">Check-in Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal rounded-xl border-slate-200 bg-white",
                            !formData.checkInDate && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 text-slate-400" />
                          {formData.checkInDate ? (
                            format(formData.checkInDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 border-0 shadow-xl rounded-xl">
                                                 <div className="p-4 text-center">
                           <p className="text-sm text-slate-600 mb-2">Selected date:</p>
                           <p className="font-medium">{format(formData.checkInDate, "PPP")}</p>
                           <Button
                             type="button"
                             variant="outline"
                             size="sm"
                             className="mt-2"
                             onClick={() => setFormData(prev => ({ ...prev, checkInDate: new Date() }))}
                           >
                             Set to Today
                           </Button>
                         </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime" className="text-sm font-semibold text-slate-700">Check-in Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="checkInTime"
                        type="time"
                        value={formData.checkInTime}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          checkInTime: e.target.value
                        }))}
                        className="pl-10 h-12 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="method" className="text-sm font-semibold text-slate-700">Check-in Method</Label>
                    <Select 
                      value={formData.method}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        method: value
                      }))}>
                      <SelectTrigger id="method" className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-xl">
                        <SelectItem value="manual">Manual Entry</SelectItem>
                        <SelectItem value="qr">QR Code Scan</SelectItem>
                        <SelectItem value="app">Mobile App</SelectItem>
                        <SelectItem value="kiosk">Check-in Kiosk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="campus" className="text-sm font-semibold text-slate-700">Campus</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        id="campus"
                        value={attendance.campuses?.name || 'Main Campus'}
                        disabled
                        className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Changes...
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
              <div className="space-y-8">
                {/* Contact & Event Info */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Contact Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-800">{contactName}</div>
                      <div className="text-sm text-slate-600">
                        {attendance.contacts?.phone && (
                          <div>📞 {attendance.contacts.phone}</div>
                        )}
                        {attendance.contacts?.email && (
                          <div>✉️ {attendance.contacts.email}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <CalendarCheckIcon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Event Details</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-slate-800">{eventName}</div>
                      {attendance.events && (
                        <div className="text-sm text-slate-600">
                          📅 {formatDate(attendance.events.event_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Details */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200">
                    <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm font-medium text-slate-600 mb-1">Check-in Date</div>
                    <div className="text-lg font-semibold text-slate-800">{formatDate(attendance.check_in_time)}</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl border border-orange-200">
                    <div className="bg-orange-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm font-medium text-slate-600 mb-1">Check-in Time</div>
                    <div className="text-lg font-semibold text-slate-800">{formatTime(attendance.check_in_time)}</div>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl border border-indigo-200">
                    <div className={`${methodInfo.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <methodInfo.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-sm font-medium text-slate-600 mb-1">Check-in Method</div>
                    <div className="text-lg font-semibold text-slate-800">{methodInfo.label}</div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-slate-500 p-2 rounded-lg">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Campus Location</h3>
                    </div>
                    <div className="font-medium text-slate-800">{attendance.campuses?.name || 'Main Campus'}</div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-100 p-6 rounded-2xl border border-teal-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-teal-500 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Record Created</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-slate-800">{formatDate(attendance.created_at)}</div>
                      <div className="text-sm text-slate-600">at {formatTime(attendance.created_at)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Record
                  </Button>
                  <Button
                    onClick={() => setEditMode(true)}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl max-w-md w-full mx-4 border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-red-100 to-red-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Attendance Record</h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete this attendance record? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="rounded-xl px-8 border-2 border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl px-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Record'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 