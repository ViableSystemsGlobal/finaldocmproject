'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  CalendarIcon,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Search,
  Users,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  Sparkles,
  Plus,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { toast } from '@/components/ui/use-toast'
import { AttendanceRecord, fetchAttendanceByEvent } from '@/services/attendance'
import { Event, fetchEventById } from '@/services/events'
import { useNextParams } from '@/lib/nextParams'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 10

export default function EventAttendancePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  
  // Use the useNextParams utility to safely handle params
  const unwrappedParams = useNextParams(params)
  const eventId = unwrappedParams.id as string
  
  // State
  const [event, setEvent] = useState<Event | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Load event and its attendance records
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true)
        
        // Fetch event details
        const { data: eventData, error: eventError } = await fetchEventById(eventId)
        
        if (eventError) throw eventError
        if (!eventData) throw new Error('Event not found')
        
        setEvent(eventData)
        
        // Fetch attendance records for this event
        const { data: attendanceData, error: attendanceError } = await fetchAttendanceByEvent(eventId)
        
        if (attendanceError) throw attendanceError
        
        // Type assertion to handle the API response structure
        const typedAttendanceData = attendanceData as unknown as AttendanceRecord[]
        setAttendanceRecords(typedAttendanceData || [])
        setTotalPages(Math.ceil((typedAttendanceData?.length || 0) / ITEMS_PER_PAGE))
      } catch (err) {
        console.error('Failed to load event data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load event attendance data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadEventData()
  }, [eventId])
  
  // Filter records based on search query
  const filteredRecords = searchQuery.trim() === '' 
    ? attendanceRecords 
    : attendanceRecords.filter(record => {
        const searchTerm = searchQuery.toLowerCase()
        const contactName = `${record.contacts?.first_name || ''} ${record.contacts?.last_name || ''}`.toLowerCase()
        const contactEmail = (record.contacts?.email || '').toLowerCase()
        const contactPhone = (record.contacts?.phone || '').toLowerCase()
        
        return contactName.includes(searchTerm) || 
               contactEmail.includes(searchTerm) || 
               contactPhone.includes(searchTerm)
      })
  
  // Paginate filtered records
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  )
  
  // Update total pages when filtered records change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredRecords.length / ITEMS_PER_PAGE))
    // Reset to first page when filters change
    if (currentPage > 1) setCurrentPage(1)
  }, [filteredRecords.length])
  
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

  // Calculate attendance stats
  const attendanceStats = {
    totalAttendees: attendanceRecords.length,
    uniqueContacts: new Set(attendanceRecords.map(r => r.contact_id)).size,
    methodBreakdown: attendanceRecords.reduce((acc, record) => {
      const method = record.method || 'manual'
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Event Attendance</h2>
          <p className="text-slate-600">Fetching attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-8">
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
                  <CalendarDays className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {event?.name || 'Event Attendance'}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xl text-slate-600 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {event ? formatDate(event.event_date) : 'Unknown date'}
                  </p>
                  <p className="text-xl text-slate-600 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {event ? formatTime(event.event_date) : 'Unknown time'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                asChild
                variant="outline"
                className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl px-6"
              >
                <Link href={`/people/attendance/new?event_id=${eventId}`}>
                  <Plus className="mr-2 h-5 w-5" />
                  Add Attendance
                </Link>
              </Button>
              <Button
                variant="outline"
                className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl px-6"
              >
                <Download className="mr-2 h-5 w-5" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Total Attendees</p>
                  <p className="text-3xl font-bold">{attendanceStats.totalAttendees}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Check-ins recorded</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Unique People</p>
                  <p className="text-3xl font-bold">{attendanceStats.uniqueContacts}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Different attendees</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">QR Scans</p>
                  <p className="text-3xl font-bold">{attendanceStats.methodBreakdown.qr || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Digital check-ins</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-pink-100 text-sm font-medium">Manual Entry</p>
                  <p className="text-3xl font-bold">{attendanceStats.methodBreakdown.manual || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-pink-200" />
                <span className="text-pink-100 text-sm font-medium">Staff recorded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Card */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Search Attendees</h2>
                <p className="text-slate-300">Find specific check-ins by name, email, or phone</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by name, email, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {filteredRecords.length} of {attendanceRecords.length} attendees
                {filteredRecords.length !== attendanceRecords.length && ` (filtered)`}
              </span>
              
              {searchQuery && (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  className="rounded-xl px-6"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Attendance Records */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Attendance Records</h2>
                  <p className="text-emerald-100">{filteredRecords.length} check-ins recorded</p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                      {searchQuery.trim() !== '' ? 'No matching attendees found' : 'No attendance records'}
                    </h3>
                    <p className="text-slate-600">
                      {searchQuery.trim() !== '' 
                        ? 'Try adjusting your search criteria' 
                        : 'No one has checked in to this event yet'
                      }
                    </p>
                  </div>
                  {searchQuery.trim() !== '' && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery('')}
                      className="rounded-xl px-6"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
                    <TableRow>
                      <TableHead className="py-4 font-bold text-slate-700">Contact</TableHead>
                      <TableHead className="py-4 font-bold text-slate-700">Check-in Time</TableHead>
                      <TableHead className="py-4 font-bold text-slate-700">Method</TableHead>
                      <TableHead className="py-4 font-bold text-slate-700">Campus</TableHead>
                      <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-white/80 transition-colors">
                        <TableCell className="py-4">
                          {record.contacts ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {record.contacts.first_name} {record.contacts.last_name}
                              </div>
                              <div className="text-sm text-slate-600">
                                {record.contacts.email && (
                                  <div>{record.contacts.email}</div>
                                )}
                                {record.contacts.phone && (
                                  <div>{record.contacts.phone}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-500">Unknown Contact</div>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold text-slate-800">
                            {formatTime(record.check_in_time)}
                          </div>
                          <div className="text-sm text-slate-600">
                            {formatDate(record.check_in_time)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
                            {record.method === 'qr' ? 'QR Code' : 
                             record.method === 'manual' ? 'Manual' :
                             record.method === 'app' ? 'Mobile App' :
                             record.method === 'kiosk' ? 'Kiosk' :
                             record.method || 'Manual'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-slate-600">
                          {record.campuses?.name || 'Main Campus'}
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild
                              className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                            >
                              <Link href={`/people/attendance/${record.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              asChild
                              className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                            >
                              <Link href={`/people/attendance/${record.id}?mode=edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredRecords.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newSize: number) => {
                      // For client-side pagination, we could update the page size
                      // For now, just log it - implementation would need state management
                      console.log('Page size change to:', newSize)
                    }}
                    className="border-t border-slate-200"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 