'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
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
import { Avatar } from '@/components/ui/avatar'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { ConvertToMemberModal } from '@/components/ConvertToMemberModal'
import { Visitor, fetchVisitors, deleteVisitor, getVisitorsCount, getNewVisitorsThisMonth, getSavedVisitorsCount } from '@/services/visitors'

type VisitorCountMetrics = {
  total: number
  newThisMonth: number
  savedCount: number
  loading: boolean
}

export default function VisitorsPage() {
  const router = useRouter()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [savedFilter, setSavedFilter] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all')
  
  // Metrics state
  const [metrics, setMetrics] = useState<VisitorCountMetrics>({
    total: 0,
    newThisMonth: 0,
    savedCount: 0,
    loading: true
  })

  // Load visitors data
  useEffect(() => {
    const loadVisitors = async () => {
      try {
        const { data, error } = await fetchVisitors()
        if (error) throw error
        
        // Type assertion
        const visitorData = data as unknown as Visitor[] || []
        
        console.log('Visitors data:', visitorData)
        
        setVisitors(visitorData)
        setFilteredVisitors(visitorData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitors')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load visitors'
        })
      } finally {
        setLoading(false)
      }
    }

    loadVisitors()
  }, [])

  // Load metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Get total visitors count
        const { count: total, error: totalError } = await getVisitorsCount()
        if (totalError) throw totalError

        // Get new visitors this month
        const { count: newThisMonth, error: newError } = await getNewVisitorsThisMonth()
        if (newError) throw newError

        // Get saved visitors count
        const { count: savedCount, error: savedError } = await getSavedVisitorsCount()
        if (savedError) throw savedError

        setMetrics({
          total: total || 0,
          newThisMonth: newThisMonth || 0,
          savedCount: savedCount || 0,
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
    if (!visitors.length) return
    
    let filtered = [...visitors]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(visitor => 
        `${visitor.contacts?.first_name} ${visitor.contacts?.last_name}`.toLowerCase().includes(query) ||
        visitor.contacts?.email?.toLowerCase().includes(query) ||
        visitor.contacts?.phone?.toLowerCase().includes(query) ||
        visitor.notes?.toLowerCase().includes(query)
      )
    }
    
    // Apply saved filter
    if (savedFilter !== 'all') {
      const isSaved = savedFilter === 'saved'
      filtered = filtered.filter(visitor => visitor.saved === isSaved)
    }
    
    // Apply date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date()
      let dateLimit: Date
      
      switch (dateRangeFilter) {
        case 'week':
          dateLimit = new Date(now.setDate(now.getDate() - 7))
          break
        case 'month':
          dateLimit = new Date(now.setMonth(now.getMonth() - 1))
          break
        case 'quarter':
          dateLimit = new Date(now.setMonth(now.getMonth() - 3))
          break
        default:
          dateLimit = new Date(0) // Beginning of time
      }
      
      filtered = filtered.filter(visitor => {
        const visitDate = new Date(visitor.first_visit)
        return visitDate >= dateLimit
      })
    }
    
    setFilteredVisitors(filtered)
  }, [visitors, searchQuery, savedFilter, dateRangeFilter])

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    
    try {
      const { error } = await deleteVisitor(deleteId)
      if (error) throw error
      
      // Update local state
      setVisitors(prev => prev.filter(visitor => visitor.contact_id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Visitor deleted successfully'
      })
    } catch (err) {
      console.error('Failed to delete visitor:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete visitor'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteId(null)
    }
  }

  const handleConvertToMember = (visitor: Visitor) => {
    setSelectedVisitor(visitor)
    setShowConvertModal(true)
  }

  const handleConvertSuccess = () => {
    // Remove the visitor from the list since they're now a member
    if (selectedVisitor) {
      setVisitors(prev => prev.filter(visitor => visitor.contact_id !== selectedVisitor.contact_id))
      // Redirect to members page
      router.push('/people/members')
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSavedFilter('all')
    setDateRangeFilter('all')
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch (e) {
      return 'Invalid date'
    }
  }

  // Truncate text for display
  const truncateText = (text: string | undefined, length: number = 30) => {
    if (!text) return ''
    return text.length > length ? `${text.substring(0, length)}...` : text
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading visitors...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visitors</h1>
      
      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          title="Total Visitors" 
          value={metrics.loading ? 0 : metrics.total}
          formatter="number"
        />
        <MetricCard 
          title="New Visitors This Month" 
          value={metrics.loading ? 0 : metrics.newThisMonth}
          formatter="number"
        />
        <MetricCard 
          title="Saved Visitors" 
          value={metrics.loading ? 0 : metrics.savedCount}
          formatter="number"
        />
      </div>
      
      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Visitors List</CardTitle>
              <CardDescription>
                View and manage church visitors
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/people/visitors/new">
                <Plus className="mr-2 h-4 w-4" />
                New Visitor
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
                  placeholder="Search visitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={savedFilter} onValueChange={setSavedFilter}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Saved Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visitors</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="unsaved">Unsaved</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
                
                {(searchQuery || savedFilter !== 'all' || dateRangeFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters} size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredVisitors.length} of {visitors.length} visitors
            </div>
            
            {/* Visitors Table */}
            {filteredVisitors.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto w-full max-w-lg">
                  <h3 className="text-lg font-medium">No visitors found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {visitors.length === 0 
                      ? "You haven't added any visitors yet. Get started by adding your first visitor."
                      : "No visitors match your current filters. Try changing your search or filter criteria."}
                  </p>
                  {visitors.length === 0 && (
                    <Button className="mt-4" asChild>
                      <Link href="/people/visitors/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Visitor
                      </Link>
                    </Button>
                  )}
                  {visitors.length > 0 && filteredVisitors.length === 0 && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={resetFilters}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Reset Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>First Visit</TableHead>
                      <TableHead>Saved</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVisitors.map((visitor) => (
                      <TableRow key={visitor.contact_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar 
                              src={visitor.contacts?.profile_image} 
                              alt={visitor.contacts ? `${visitor.contacts.first_name} ${visitor.contacts.last_name}` : 'Visitor'} 
                              size="sm"
                            />
                            <div>
                              {visitor.contacts ? `${visitor.contacts.first_name} ${visitor.contacts.last_name}` : 'Unknown'}
                              {visitor.contacts?.email && (
                                <div className="text-xs text-muted-foreground">
                                  {visitor.contacts.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(visitor.first_visit)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={visitor.saved ? "success" : "outline"}>
                            {visitor.saved ? 'Saved' : 'Not saved'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {truncateText(visitor.notes)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <span className="sr-only">Open menu</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <circle cx="5" cy="12" r="1" />
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/people/visitors/${visitor.contact_id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/people/visitors/${visitor.contact_id}?mode=edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleConvertToMember(visitor)}
                              >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Convert to Member
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(visitor.contact_id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this visitor? This action cannot be undone.
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
                'Delete Visitor'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Convert to Member Modal */}
      {selectedVisitor && (
        <ConvertToMemberModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          contactId={selectedVisitor.contact_id}
          contactName={selectedVisitor.contacts ? `${selectedVisitor.contacts.first_name} ${selectedVisitor.contacts.last_name}` : 'Visitor'}
          onSuccess={handleConvertSuccess}
        />
      )}
    </div>
  )
} 