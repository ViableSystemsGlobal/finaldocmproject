'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  Calendar,
  Clock,
  CalendarDays,
  CalendarClock,
  ImageIcon,
  TrendingUp,
  Activity,
  Sparkles,
  Users,
  RefreshCw,
  MapPin,
  CheckSquare,
  Square,
  Trash,
  Download,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MetricCard } from '@/components/MetricCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Pagination } from '@/components/ui/pagination'
import { 
  Event, 
  fetchEvents, 
  fetchEventsWithImages,
  deleteEvent, 
  getTotalEventsCount, 
  getRecurringEventsCount, 
  getTodaysEventsCount 
} from '@/services/events'
import { format } from 'date-fns'
import { syncFormatters } from '@/lib/timezone-utils'

// Add this type to represent an event with an image
type EventWithImage = Event & {
  primary_image?: {
    id: string;
    url: string;
    alt_text?: string;
  } | null;
};

type EventMetrics = {
  total: number;
  recurring: number;
  today: number;
  loading: boolean;
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Bulk selection state
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [recurringFilter, setRecurringFilter] = useState<string>('all')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Metrics state
  const [metrics, setMetrics] = useState<EventMetrics>({
    total: 0,
    recurring: 0,
    today: 0,
    loading: true
  })

  // Bulk selection helpers
  const isAllSelected = events.length > 0 && selectedEvents.size === events.length
  const isIndeterminate = selectedEvents.size > 0 && selectedEvents.size < events.length

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(events.map(event => event.id)))
    } else {
      setSelectedEvents(new Set())
    }
  }

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    const newSelected = new Set(selectedEvents)
    if (checked) {
      newSelected.add(eventId)
    } else {
      newSelected.delete(eventId)
    }
    setSelectedEvents(newSelected)
  }

  const clearSelection = () => {
    setSelectedEvents(new Set())
  }

  const handleBulkDelete = () => {
    if (selectedEvents.size === 0) return
    setShowBulkDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      
      // Delete events one by one to get better error handling
      const results = []
      const errors = []
      const selectedEventIds = Array.from(selectedEvents)
      
             for (const eventId of selectedEventIds) {
         try {
           const result = await deleteEvent(eventId)
           if (result.error) {
             throw new Error(typeof result.error === 'string' ? result.error : 'Failed to delete event')
           }
           results.push(eventId)
         } catch (error) {
           console.error(`Failed to delete event ${eventId}:`, error)
           errors.push({
             eventId,
             error: error instanceof Error ? error.message : 'Unknown error'
           })
         }
       }
      
      // Clear selection and refresh data
      setSelectedEvents(new Set())
      setShowBulkDeleteDialog(false)
      
      // Reload events
      const result = await fetchEventsWithImages({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchQuery,
        recurringFilter: recurringFilter
      })
      
      if (result.error) {
        throw result.error
      }
      
      setEvents(result.data || [])
      setTotalPages(result.totalPages || 1)
      setTotalCount(result.count || 0)
      
      // Show appropriate toast based on results
      if (errors.length === 0) {
        toast({
          title: 'Events Deleted',
          description: `Successfully deleted ${results.length} event(s).`,
        })
      } else if (results.length > 0) {
        toast({
          title: 'Partial Success',
          description: `Deleted ${results.length} event(s), but ${errors.length} failed. Check console for details.`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Deletion Failed',
          description: `Failed to delete all ${selectedEventIds.length} event(s). Check console for details.`,
        })
      }
    } catch (err) {
      console.error('Failed to delete events:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete events. Please try again.',
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkExport = () => {
    const selectedEventData = events.filter(event => selectedEvents.has(event.id))
    const csvData = [
      ['Name', 'Date', 'Location', 'Description', 'Recurring'].join(','),
      ...selectedEventData.map(event => [
        `"${event.name}"`,
        event.event_date,
        `"${event.location || ''}"`,
        `"${event.description || ''}"`,
        event.is_recurring ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Export Complete',
      description: `Exported ${selectedEvents.size} event(s) to CSV.`,
    })
  }

  // Clear selection when page changes or data refreshes
  useEffect(() => {
    setSelectedEvents(new Set())
  }, [currentPage, debouncedSearchQuery, recurringFilter])

  // Load events data with pagination and filters
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        console.log('Fetching events with pagination...');
        
        const result = await fetchEventsWithImages({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchQuery,
          recurringFilter: recurringFilter
        })
        
        if (result.error) {
          console.error('Error details:', result.error);
          throw result.error
        }
        
        console.log('Paginated events data:', result)
        
        setEvents(result.data || [])
        setTotalPages(result.totalPages || 1)
        setTotalCount(result.count || 0)
        
        // Update current page if it was adjusted by the service
        if (result.page && result.page !== currentPage) {
          console.log(`📄 Page adjusted from ${currentPage} to ${result.page}`);
          setCurrentPage(result.page);
        }
      } catch (err) {
        console.error('Failed to load events:', err)
        setError(err instanceof Error ? err.message : 'Failed to load events')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load events. Check console for details.'
        })
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [currentPage, itemsPerPage, debouncedSearchQuery, recurringFilter])

  // Load metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Get total events count
        const { count: total, error: totalError } = await getTotalEventsCount()
        if (totalError) throw totalError

        // Get recurring events count
        const { count: recurring, error: recurringError } = await getRecurringEventsCount()
        if (recurringError) throw recurringError

        // Get today's events count
        const { count: today, error: todayError } = await getTodaysEventsCount()
        if (todayError) throw todayError

        setMetrics({
          total: total || 0,
          recurring: recurring || 0,
          today: today || 0,
          loading: false
        })
      } catch (err) {
        console.error('Failed to load metrics:', err)
        // Don't show an error toast for metrics, just log it
      }
    }

    loadMetrics()
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const result = await deleteEvent(deleteId)
      
      if (result.error) {
        throw result.error
      }
      
      setShowDeleteDialog(false)
      setDeleteId(null)
      
      // Remove the deleted event from the current list
      setEvents(prev => prev.filter(event => event.id !== deleteId))
      setTotalCount(prev => prev - 1)
      
      // Update metrics if needed
      setMetrics(prev => ({
        ...prev,
        total: prev.total - 1
      }))
      
      toast({
        title: 'Event Deleted',
        description: 'The event has been successfully deleted.',
      })
    } catch (err) {
      console.error('Failed to delete event:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete event'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setRecurringFilter('all')
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'MMM dd, yyyy • h:mm a')
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateString
    }
  }

  if (loading && !events.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Events</h2>
          <p className="text-slate-600">Preparing event data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-2xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Events Management
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Create, manage, and organize your church events with comprehensive tools
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              asChild 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/events/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Events Overview */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Events Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm font-medium">Total Events</p>
                    <p className="text-3xl font-bold">
                      {metrics.loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        metrics.total
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-200" />
                  <span className="text-blue-100 text-sm font-medium">All scheduled events</span>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <CalendarClock className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-purple-100 text-sm font-medium">Recurring Events</p>
                    <p className="text-3xl font-bold">
                      {metrics.loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        metrics.recurring
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-200" />
                  <span className="text-purple-100 text-sm font-medium">Regularly scheduled</span>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <CalendarDays className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-100 text-sm font-medium">Today's Events</p>
                    <p className="text-3xl font-bold">
                      {metrics.loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        metrics.today
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-200" />
                  <span className="text-emerald-100 text-sm font-medium">Happening today</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedEvents.size > 0 && (
          <div className="bg-indigo-600 text-white rounded-2xl p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckSquare className="h-5 w-5" />
                <span className="font-semibold">
                  {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkExport}
                  className="text-white hover:bg-white/20 rounded-lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-white hover:bg-red-500/20 rounded-lg"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-white hover:bg-white/20 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filter Controls */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Search & Filter Events</h2>
                <p className="text-slate-300">Find events by name, location, or description</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search events by name, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Event Type
                </label>
                <Select value={recurringFilter} onValueChange={setRecurringFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="recurring">Recurring Only</SelectItem>
                    <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} events
                {(searchQuery || recurringFilter !== 'all') && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Events Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 font-bold text-slate-700 w-12">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(ref) => {
                      if (ref) ref.indeterminate = isIndeterminate
                    }}
                    onCheckedChange={handleSelectAll}
                    className="border-slate-400"
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Image</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Event</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Date & Time</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Location</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No events found</h3>
                        <p className="text-slate-600">
                          {searchQuery || recurringFilter !== 'all' 
                            ? 'No events match your search criteria.'
                            : 'No events found. Create your first event.'
                          }
                        </p>
                      </div>
                      {(!searchQuery && recurringFilter === 'all') && (
                        <Button 
                          onClick={() => router.push('/events/new')}
                          className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Event
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event: EventWithImage) => (
                  <TableRow 
                    key={event.id} 
                    className={`hover:bg-white/80 transition-colors ${
                      selectedEvents.has(event.id) ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedEvents.has(event.id)}
                        onCheckedChange={(checked) => handleSelectEvent(event.id, !!checked)}
                        className="border-slate-400"
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl shadow-md">
                        {event.primary_image ? (
                          <Image 
                            src={event.primary_image.url} 
                            alt={event.primary_image.alt_text || event.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <ImageIcon className="h-8 w-8 text-slate-500" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800 text-lg">{event.name}</div>
                      {event.is_recurring && (
                        <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                          Recurring
                        </Badge>
                      )}
                      {event.description && (
                        <div className="text-slate-600 text-sm mt-1 max-w-[300px] truncate">
                          {event.description.length > 60 
                            ? `${event.description.substring(0, 60)}...`
                            : event.description
                          }
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">{formatEventDate(event.event_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span>{event.location || 'No location'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/events/${event.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/events/${event.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(event.id)}
                          className="hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(newItemsPerPage) => setItemsPerPage(newItemsPerPage)}
              className="justify-center"
            />
          </div>
        )}
      </div>
      
      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this event? This action cannot be undone and will remove all registrations, invitations, and associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {isDeleting ? (
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Confirm Bulk Deletion</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''}? 
              This action cannot be undone and will remove all registrations, invitations, and associated data for these events.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isBulkDeleting}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkDelete}
              disabled={isBulkDeleting}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedEvents.size} Event${selectedEvents.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 