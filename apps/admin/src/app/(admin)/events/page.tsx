'use client'

import { useState, useEffect } from 'react'
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
  ImageIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  const [filteredEvents, setFilteredEvents] = useState<EventWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [recurringFilter, setRecurringFilter] = useState<string>('all')
  
  // Metrics state
  const [metrics, setMetrics] = useState<EventMetrics>({
    total: 0,
    recurring: 0,
    today: 0,
    loading: true
  })

  // Load events data with images
  useEffect(() => {
    const loadEvents = async () => {
      try {
        console.log('Fetching events with images...');
        
        const { data, error } = await fetchEventsWithImages()
        
        if (error) {
          console.error('Error details:', error);
          throw error
        }
        
        console.log('Events with images data:', data)
        
        setEvents(data || [])
        setFilteredEvents(data || [])
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
  }, [])

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

  // Apply filters when any filter changes
  useEffect(() => {
    if (!events.length) return
    
    let filtered = [...events]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(query) ||
        (event.location?.toLowerCase() || '').includes(query) ||
        (event.description?.toLowerCase() || '').includes(query)
      )
    }
    
    // Apply recurring filter
    if (recurringFilter !== 'all') {
      const isRecurring = recurringFilter === 'recurring'
      filtered = filtered.filter(event => event.is_recurring === isRecurring)
    }
    
    setFilteredEvents(filtered)
  }, [events, searchQuery, recurringFilter])

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    
    try {
      const { error } = await deleteEvent(deleteId)
      if (error) throw error
      
      // Update local state
      setEvents(prev => prev.filter(event => event.id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      })
    } catch (err) {
      console.error('Failed to delete event:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete event'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteId(null)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setRecurringFilter('all')
  }

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp') // Format as "Apr 29, 2023, 5:00 PM"
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading events...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Events</h1>
      
      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          title="Total Events" 
          value={metrics.loading ? 0 : metrics.total}
          icon={<Calendar className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard 
          title="Recurring Events" 
          value={metrics.loading ? 0 : metrics.recurring}
          icon={<CalendarClock className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard 
          title="Today's Events" 
          value={metrics.loading ? 0 : metrics.today}
          icon={<CalendarDays className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>
      
      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Events List</CardTitle>
              <CardDescription>
                View and manage church events and meetings
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/events/new">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={recurringFilter} onValueChange={setRecurringFilter}>
                  <SelectTrigger className="min-w-[180px]">
                    <SelectValue placeholder="Recurring Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="recurring">Recurring Only</SelectItem>
                    <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                  </SelectContent>
                </Select>
                
                {(searchQuery || recurringFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters} size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </div>
            
            {/* Events Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                      <div className="mt-2">Loading events...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {searchQuery || recurringFilter !== 'all' 
                          ? 'No events match your filters'
                          : 'No events found'}
                      </div>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => router.push('/events/new')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Event
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="relative h-12 w-12 overflow-hidden rounded-md">
                          {event.primary_image ? (
                            <Image 
                              src={event.primary_image.url} 
                              alt={event.primary_image.alt_text || event.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{event.name}</div>
                        {event.is_recurring && (
                          <Badge variant="secondary" className="mt-1">Recurring</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatEventDate(event.event_date)}
                        </div>
                      </TableCell>
                      <TableCell>{event.location || 'No location'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="sr-only">Open menu</span>
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 15 15"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                              >
                                <path
                                  d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.id}?mode=edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(event.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone and will remove all registrations, invitations, and associated data.
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
                'Delete Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 