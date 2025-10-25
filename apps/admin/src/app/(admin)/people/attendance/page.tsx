'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { syncFormatters } from '@/lib/timezone-utils'
import {
  Calendar,
  CalendarDays,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  CalendarClock,
  TrendingUp,
  Activity,
  Sparkles,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MetricCard } from '@/components/MetricCard'
import { Checkbox } from '@/components/ui/checkbox'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  AttendanceEvent,
  AttendanceRecord,
  fetchAttendanceEvents,
  fetchAttendanceByEvent,
  deleteAttendance,
  getAttendanceMetrics
} from '@/services/attendance'

function AttendancePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewAll = searchParams.get('view') === 'all'
  
  // State
  const [events, setEvents] = useState<AttendanceEvent[]>([])
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceRecord[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [totalEvents, setTotalEvents] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Filter states
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({})
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteItem, setDeleteItem] = useState<{id: string; eventId: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Checkbox selection state
  const [selectedAttendance, setSelectedAttendance] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    totalCheckIns: 0,
    uniqueAttendees: 0,
    avgAttendance: 0,
    loading: true
  })

  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getAttendanceMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Determine how many events to fetch initially
        const limit = viewAll ? 10 : 3
        
        // Fetch attendance events
        const { data: eventData, count, error } = await fetchAttendanceEvents({ 
          offset: 0, 
          limit 
        })
        
        if (error) throw error
        
        // Update state with deduplication
        const uniqueEvents = Array.from(
          new Map((eventData || []).map(event => [event.id, event])).values()
        );
        
        setEvents(uniqueEvents)
        setTotalEvents(count || 0)
        setHasMore((count || 0) > uniqueEvents.length)
        setOffset(uniqueEvents.length)
        
        // Fetch attendance for each event
        await Promise.all((eventData || []).map(loadEventAttendance))
      } catch (err) {
        console.error('Failed to load attendance data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load attendance data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [viewAll])
  
  // Load attendance data for a specific event
  const loadEventAttendance = async (event: AttendanceEvent) => {
    try {
      const { data, error } = await fetchAttendanceByEvent(event.id)
      
      if (error) {
        console.error(`Error details for event ${event.id}:`, JSON.stringify(error, null, 2))
        // Try to extract more details if available
        const errorObj = error as any; // Use type assertion to handle additional properties
        if (errorObj.original) {
          console.error('Original error:', errorObj.original)
        }
        throw error
      }
      
      // Type assertion to handle data from API
      const safeData = data as unknown as AttendanceRecord[]
      
      setAttendanceData(prev => ({
        ...prev,
        [event.id]: safeData || []
      }))
      
      return safeData
    } catch (err) {
      const errorDetails = err instanceof Error ? 
        err.message : 
        JSON.stringify(err);
        
      console.error(`Failed to load attendance for event ${event.id}:`, errorDetails)
      
      // Still add an empty array for this event to avoid repeated errors
      setAttendanceData(prev => ({
        ...prev,
        [event.id]: []
      }))
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not load attendance for event: ${errorDetails}`
      })
      
      return []
    }
  }
  
  // Load more events
  const loadMoreEvents = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const { data: eventData, count, error } = await fetchAttendanceEvents({ 
        offset, 
        limit: 10 
      })
      
      if (error) throw error
      
      // Append new events with deduplication
      const existingIds = new Set(events.map(event => event.id))
      const newEvents = (eventData || []).filter(event => !existingIds.has(event.id))
      
      if (newEvents.length > 0) {
        setEvents(prev => [...prev, ...newEvents])
        setOffset(prev => prev + newEvents.length)
        
        // Load attendance for new events
        await Promise.all(newEvents.map(loadEventAttendance))
      }
      
      setHasMore((count || 0) > events.length + newEvents.length)
    } catch (err) {
      console.error('Failed to load more events:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load more events'
      })
    } finally {
      setLoadingMore(false)
    }
  }
  
  // Handle delete
  const openDeleteDialog = (id: string, eventId: string) => {
    setDeleteItem({ id, eventId })
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deleteItem) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deleteAttendance(deleteItem.id)
      
      if (error) throw error
      
      // Remove from local state
      setAttendanceData(prev => ({
        ...prev,
        [deleteItem.eventId]: prev[deleteItem.eventId]?.filter(
          record => record.id !== deleteItem.id
        ) || []
      }))
      
      toast({
        title: 'Success',
        description: 'Attendance record deleted successfully'
      })
      
      setShowDeleteDialog(false)
      setDeleteItem(null)
    } catch (err) {
      console.error('Failed to delete attendance:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete attendance record'
      })
    } finally {
      setIsDeleting(false)
    }
  }
  
  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return syncFormatters.dateOnly(dateString)
    } catch {
      return 'Invalid date'
    }
  };
  
  // Format time helper
  const formatTime = (dateString: string) => {
    try {
      return syncFormatters.timeOnly(dateString)
    } catch {
      return 'Invalid time'
    }
  };
  
  // Get filtered events and attendance data
  const filteredData = events.filter(event => {
    if (selectedEvent !== 'all' && event.id !== selectedEvent) return false
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesEvent = event.name?.toLowerCase().includes(query)
      const matchesAttendee = attendanceData[event.id]?.some(record =>
        record.contacts?.first_name?.toLowerCase().includes(query) ||
        record.contacts?.last_name?.toLowerCase().includes(query)
      )
      if (!matchesEvent && !matchesAttendee) return false
    }
    
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Attendance</h2>
          <p className="text-slate-600">Fetching attendance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-pink-500 to-rose-500 p-4 rounded-2xl">
                  <CalendarClock className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Attendance Tracking
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track and manage event attendance
                </p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href="/people/attendance/new">
                <Plus className="mr-2 h-5 w-5" /> Record Attendance
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Check className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-pink-100 text-sm font-medium">Total Check-ins</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalCheckIns
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-pink-200" />
                <span className="text-pink-100 text-sm font-medium">All time check-ins</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Unique Attendees</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.uniqueAttendees
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Different people</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Avg Attendance</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      Math.round(metrics.avgAttendance)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Per event average</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <CalendarDays className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Total Events</p>
                  <p className="text-3xl font-bold">{events.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Tracked events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Controls */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Search & Filter Attendance</h2>
                <p className="text-slate-300">Find attendance records by event or attendee</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by event name or attendee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-pink-500 focus:ring-pink-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Event Filter
                </label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {formatDate(event.event_date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedEvent('all')
                    setDateRange({})
                  }}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <Filter className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {filteredData.length} of {events.length} events
                {filteredData.length !== events.length && ` (filtered)`}
              </span>
              
              {!viewAll && hasMore && (
                <Button
                  onClick={() => router.push('/people/attendance?view=all')}
                  variant="outline"
                  className="rounded-xl px-6"
                >
                  View All Events
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Attendance Data */}
        <div className="space-y-8">
          {filteredData.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                    <CalendarClock className="h-8 w-8 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No attendance records found</h3>
                    <p className="text-slate-600">
                      {events.length === 0 
                        ? "No events found. Record your first attendance."
                        : "No records match your search criteria."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            filteredData.map((event) => (
              <div key={event.id} className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                {/* Event Header */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <CalendarDays className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <Link 
                          href={`/people/attendance/event/${event.id}`}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <h3 className="text-2xl font-bold text-white hover:underline cursor-pointer">
                            {event.name}
                          </h3>
                          <p className="text-pink-100">
                            {formatDate(event.event_date)} at {formatTime(event.event_date)}
                          </p>
                        </Link>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-pink-100 text-sm font-medium">Attendance</p>
                        <p className="text-3xl font-bold text-white">
                          {attendanceData[event.id]?.length || 0}
                        </p>
                      </div>
                      
                      {/* Event-level action buttons */}
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-lg"
                        >
                          <Link href={`/people/attendance/event/${event.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View All
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-lg"
                        >
                          <Link href={`/people/attendance/new?event_id=${event.id}`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
                      <TableRow>
                        <TableHead className="py-4 font-bold text-slate-700">Name</TableHead>
                        <TableHead className="py-4 font-bold text-slate-700">Check-in Time</TableHead>
                        <TableHead className="py-4 font-bold text-slate-700">Method</TableHead>
                        <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!attendanceData[event.id] || attendanceData[event.id].length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-12 h-12 rounded-full flex items-center justify-center">
                                <Users className="h-6 w-6 text-slate-500" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800">No attendance records</h4>
                                <p className="text-slate-600 text-sm">No one has checked in for this event yet.</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        // Show only the 4 most recent attendance records (sorted by check_in_time)
                        (() => {
                          const sortedRecords = [...attendanceData[event.id]]
                            .sort((a, b) => new Date(b.check_in_time || b.created_at).getTime() - new Date(a.check_in_time || a.created_at).getTime())
                          const displayRecords = sortedRecords.slice(0, 4)
                          const hasMore = sortedRecords.length > 4
                          
                          return (
                            <>
                              {displayRecords.map((record) => (
                                <TableRow key={record.id} className="hover:bg-white/80 transition-colors">
                                  <TableCell className="py-4">
                                    <div className="font-semibold text-slate-800">
                                      {record.contacts?.first_name} {record.contacts?.last_name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 text-slate-600">
                                    {record.check_in_time ? formatTime(record.check_in_time) : 'N/A'}
                                  </TableCell>
                                  <TableCell className="py-4 text-slate-600">
                                    <span className="capitalize bg-slate-100 px-2 py-1 rounded-full text-sm font-medium">
                                      {record.method === 'qr' ? 'QR Code' : record.method || 'Manual'}
                                    </span>
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
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => openDeleteDialog(record.id, event.id)}
                                        className="hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {hasMore && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-6 bg-gradient-to-r from-slate-50 to-gray-100 border-t border-slate-200">
                                    <div className="flex items-center justify-center gap-4">
                                      <div className="text-slate-600">
                                        <span className="font-medium">+{sortedRecords.length - 4} more attendees</span>
                                      </div>
                                      <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="bg-white hover:bg-slate-50 border-slate-300 rounded-lg"
                                      >
                                        <Link href={`/people/attendance/event/${event.id}`}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View All ({sortedRecords.length})
                                        </Link>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          )
                        })()
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {viewAll && hasMore && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMoreEvents}
              disabled={loadingMore}
              variant="outline"
              className="rounded-xl px-8 py-3"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Events'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this attendance record? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendancePageContent />
    </Suspense>
  )
} 