'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Search,
  Users,
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { toast } from '@/components/ui/use-toast'
import { AttendanceRecord, fetchAttendanceByEvent } from '@/services/attendance'
import { Event, fetchEventById } from '@/services/events'

const ITEMS_PER_PAGE = 10

export default function EventAttendancePage() {
  const params = useParams<{ id: string }>()
  const eventId = params.id
  
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
  
  // Generate array of pages for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Middle
        pages.push(1)
        pages.push('ellipsis')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }
  
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
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/people/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold mb-1">{event?.name}</h1>
          <p className="text-muted-foreground flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {event ? formatDate(event.event_date) : 'Unknown date'}
          </p>
        </div>
      </div>
      
      {/* Attendance List Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {filteredRecords.length} total attendees for this event
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/people/attendance/new">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Attendance Table */}
            {filteredRecords.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <h3 className="text-lg font-medium">No attendance records found</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {searchQuery.trim() !== '' 
                    ? 'Try adjusting your search query' 
                    : 'No one has checked in to this event yet'}
                </p>
                {searchQuery.trim() !== '' && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Campus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRecords.map((record) => (
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, index) => (
                        page === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page as number)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 