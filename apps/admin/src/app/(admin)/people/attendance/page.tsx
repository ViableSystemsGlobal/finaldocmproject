'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MetricCard } from '@/components/MetricCard'
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

export default function AttendancePage() {
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
    try {
      setLoadingMore(true)
      
      const { data: eventData, count, error } = await fetchAttendanceEvents({
        offset,
        limit: 3
      })
      
      if (error) throw error
      
      // Update state - make sure to deduplicate events by ID
      setEvents(prev => {
        // Create a map of existing events by ID for quick lookup
        const existingEventMap = new Map(prev.map(event => [event.id, event]));
        
        // Only add events that don't already exist in the list
        const newEvents = (eventData || []).filter(event => !existingEventMap.has(event.id));
        
        return [...prev, ...newEvents];
      });
      
      setTotalEvents(count || 0)
      setHasMore((count || 0) > (offset + eventData.length))
      setOffset(prev => prev + eventData.length)
      
      // Fetch attendance for each new event
      await Promise.all((eventData || []).map(loadEventAttendance))
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
      
      const { success, error } = await deleteAttendance(deleteItem.id)
      
      if (!success || error) throw error
      
      // Remove the deleted item from state
      setAttendanceData(prev => ({
        ...prev,
        [deleteItem.eventId]: prev[deleteItem.eventId].filter(
          item => item.id !== deleteItem.id
        )
      }))
      
      toast({
        title: 'Success',
        description: 'Attendance record deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete attendance record:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete attendance record'
      })
    } finally {
      setIsDeleting(false)
      setDeleteItem(null)
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
        <span className="ml-2">Loading attendance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Check-Ins"
          value={metrics.loading ? '...' : metrics.totalCheckIns.toString()}
          icon={<Check className="h-6 w-6" />}
          loading={metrics.loading}
        />
        <MetricCard
          title="Unique Attendees"
          value={metrics.loading ? '...' : metrics.uniqueAttendees.toString()}
          icon={<Users className="h-6 w-6" />}
          loading={metrics.loading}
        />
        <MetricCard
          title="Avg Attendance/Event"
          value={metrics.loading ? '...' : metrics.avgAttendance.toString()}
          icon={<CalendarDays className="h-6 w-6" />}
          loading={metrics.loading}
        />
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                View and manage attendance records for events
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/people/attendance/new">
                <Plus className="mr-2 h-4 w-4" />
                Record Attendance
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[240px] justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Select date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  {/* Date picker popover content would go here */}
                </Popover>
              </div>
            </div>

            {/* Event Sections */}
            <div className="space-y-8">
              {events.length === 0 ? (
                <div className="rounded-md border border-dashed p-10 text-center">
                  <h3 className="text-lg font-medium">No attendance records found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Records will appear here after check-ins are recorded
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/people/attendance/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Record First Attendance
                    </Link>
                  </Button>
                </div>
              ) : (
                events.map(event => {
                  const eventAttendance = attendanceData[event.id] || [];
                  return (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 p-4">
                        <CardTitle className="text-lg">
                          {event.name} — {formatDate(event.event_date)}
                        </CardTitle>
                        <CardDescription>
                          {eventAttendance.length} check-ins
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {eventAttendance.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            No attendance records for this event
                          </div>
                        ) : (
                          <>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date & Time</TableHead>
                                  <TableHead>Contact</TableHead>
                                  <TableHead>Method</TableHead>
                                  <TableHead>Campus</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {/* Show only the first 3 attendance records */}
                                {eventAttendance.slice(0, 3).map((record) => (
                                  <TableRow key={record.id}>
                                    <TableCell>
                                      <div className="font-medium">
                                        {formatDate(record.check_in_time)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatTime(record.check_in_time)}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {record.contacts ? (
                                        <div>
                                          <div className="font-medium">
                                            {record.contacts.first_name} {record.contacts.last_name}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {record.contacts.phone || record.contacts.email || ''}
                                          </div>
                                        </div>
                                      ) : (
                                        'Unknown Contact'
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <span className="capitalize">
                                        {record.method === 'qr' ? 'QR Code' : record.method}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      {record.campuses?.name || 'Main Campus'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          asChild
                                        >
                                          <Link href={`/people/attendance/${record.id}`}>
                                            <Eye className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          asChild
                                        >
                                          <Link href={`/people/attendance/${record.id}?mode=edit`}>
                                            <Pencil className="h-4 w-4" />
                                          </Link>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => openDeleteDialog(record.id, event.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            {/* Show View All link if there are more than 3 records */}
                            {eventAttendance.length > 3 && (
                              <div className="flex justify-center py-2 bg-muted/20 border-t">
                                <Link 
                                  href={`/people/attendance/event/${event.id}`}
                                  className="text-amber-600 hover:text-amber-700 hover:underline font-medium text-sm py-1 flex items-center"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View all {eventAttendance.length} attendees
                                </Link>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
              
              {/* Pagination for "View All" mode */}
              {viewAll && totalEvents > 10 && (
                <div className="flex justify-center pt-4">
                  <nav className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={offset === 0}
                      onClick={() => {
                        const newOffset = Math.max(0, offset - 30);
                        setOffset(newOffset);
                        
                        // Fetch previous page of events
                        fetchAttendanceEvents({
                          offset: newOffset,
                          limit: 10
                        }).then(response => {
                          if (response.data) {
                            // Update state with deduplication
                            const uniqueEvents = Array.from(
                              new Map(response.data.map(event => [event.id, event])).values()
                            );
                            
                            setEvents(uniqueEvents);
                            setHasMore((response.count || 0) > uniqueEvents.length);
                            
                            // Fetch attendance for each event
                            Promise.all(uniqueEvents.map(loadEventAttendance));
                          }
                        });
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-sm mx-2">
                      Page {Math.floor(offset / 10) + 1} of {Math.ceil(totalEvents / 10)}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={!hasMore}
                      onClick={loadMoreEvents}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </nav>
                </div>
              )}
              
              {/* View More Button (for non-paginated view) */}
              {!viewAll && hasMore && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={loadMoreEvents}
                    variant="outline"
                    disabled={loadingMore}
                    className="bg-white border-amber-500 hover:border-amber-600 hover:bg-amber-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more events...
                      </>
                    ) : (
                      'View More Events'
                    )}
                  </Button>
                </div>
              )}
              
              {/* See All Link */}
              {!viewAll && events.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Link 
                    href="/people/attendance?view=all"
                    className="text-amber-600 hover:text-amber-700 hover:underline font-medium text-sm"
                  >
                    See All Events Attendance
                  </Link>
                </div>
              )}
            </div>
          </div>
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
              onClick={confirmDelete}
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