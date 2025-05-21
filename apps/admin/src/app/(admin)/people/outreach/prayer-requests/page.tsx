'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Heart, 
  Filter,
  Search, 
  Loader2, 
  Eye, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  UserCog 
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  PrayerRequest, 
  fetchPrayerRequests,
  deletePrayerRequest,
  markPrayerRequestAnswered,
  getPrayerRequestMetrics
} from '@/services/prayerRequests'

export default function PrayerRequestsPage() {
  // State
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    newRequests: 0,
    inPrayerRequests: 0,
    answeredRequests: 0,
    loading: true
  })
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingRequest, setDeletingRequest] = useState<PrayerRequest | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Answer confirmation states
  const [showAnswerDialog, setShowAnswerDialog] = useState(false)
  const [answeringRequest, setAnsweringRequest] = useState<PrayerRequest | null>(null)
  const [isAnswering, setIsAnswering] = useState(false)
  const [answerNote, setAnswerNote] = useState('')
  
  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getPrayerRequestMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Fetch prayer requests
        const { data, error } = await fetchPrayerRequests()
        
        if (error) throw error
        
        console.log('Loaded prayer requests:', data)
        setPrayerRequests(data as unknown as PrayerRequest[] || [])
      } catch (err) {
        console.error('Failed to load prayer request data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load prayer request data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])
  
  // Filter prayer requests based on search query and filters
  const filteredRequests = prayerRequests.filter(request => {
    // Check if it matches search query
    const matchesSearch = searchQuery.trim() === '' || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.contacts && 
        (`${request.contacts.first_name || ''} ${request.contacts.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    
    // Check if it matches status filter
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle delete
  const openDeleteDialog = (request: PrayerRequest) => {
    setDeletingRequest(request)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deletingRequest) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deletePrayerRequest(deletingRequest.id)
      
      if (error) throw error
      
      // Remove deleted request from state
      setPrayerRequests(prayerRequests.filter(r => r.id !== deletingRequest.id))
      
      // Update metrics based on deleted request status
      setMetrics(prev => {
        const newMetrics = { ...prev }
        if (deletingRequest.status === 'new') {
          newMetrics.newRequests = Math.max(0, prev.newRequests - 1)
        } else if (deletingRequest.status === 'in-prayer') {
          newMetrics.inPrayerRequests = Math.max(0, prev.inPrayerRequests - 1)
        } else if (deletingRequest.status === 'answered') {
          newMetrics.answeredRequests = Math.max(0, prev.answeredRequests - 1)
        }
        return newMetrics
      })
      
      toast({
        title: 'Success',
        description: 'Prayer request deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete prayer request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete prayer request'
      })
    } finally {
      setIsDeleting(false)
      setDeletingRequest(null)
    }
  }
  
  // Handle mark as answered
  const openAnswerDialog = (request: PrayerRequest) => {
    setAnsweringRequest(request)
    setAnswerNote('')
    setShowAnswerDialog(true)
  }
  
  const confirmAnswer = async () => {
    if (!answeringRequest) return
    
    try {
      setIsAnswering(true)
      
      const { error } = await markPrayerRequestAnswered(answeringRequest.id, answerNote)
      
      if (error) throw error
      
      // Update the request in state
      setPrayerRequests(prayerRequests.map(r => 
        r.id === answeringRequest.id 
          ? { ...r, status: 'answered', response_notes: answerNote } 
          : r
      ))
      
      // Update metrics
      setMetrics(prev => {
        const newMetrics = { ...prev }
        if (answeringRequest.status === 'new') {
          newMetrics.newRequests = Math.max(0, prev.newRequests - 1)
        } else if (answeringRequest.status === 'in-prayer') {
          newMetrics.inPrayerRequests = Math.max(0, prev.inPrayerRequests - 1)
        }
        newMetrics.answeredRequests = prev.answeredRequests + 1
        return newMetrics
      })
      
      toast({
        title: 'Success',
        description: 'Prayer request marked as answered'
      })
      
      setShowAnswerDialog(false)
    } catch (err) {
      console.error('Failed to mark prayer request as answered:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark prayer request as answered'
      })
    } finally {
      setIsAnswering(false)
      setAnsweringRequest(null)
      setAnswerNote('')
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>
      case 'in-prayer':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">In Prayer</Badge>
      case 'answered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Answered</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading prayer request data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Prayer Requests</h1>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="New Requests"
          value={metrics.loading ? 0 : metrics.newRequests}
          icon={<Heart className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="In Prayer"
          value={metrics.loading ? 0 : metrics.inPrayerRequests}
          icon={<UserCog className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Answered Prayers"
          value={metrics.loading ? 0 : metrics.answeredRequests}
          icon={<CheckCircle className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>

      {/* Prayer Requests List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Prayer Requests</CardTitle>
              <CardDescription>
                {filteredRequests.length} requests found
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/people/outreach/prayer-requests/new">
                <Heart className="mr-2 h-4 w-4" />
                New Prayer Request
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filterStatus}
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger className="w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>{filterStatus === 'all' ? 'All Statuses' : filterStatus === 'in-prayer' ? 'In Prayer' : filterStatus === 'new' ? 'New' : 'Answered'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-prayer">In Prayer</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prayer Requests Table */}
            {filteredRequests.length === 0 ? (
              <div className="rounded-md border border-dashed p-10 text-center">
                <h3 className="text-lg font-medium">No prayer requests found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery.trim() !== '' || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by creating your first prayer request'}
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/people/outreach/prayer-requests/new">
                    <Heart className="mr-2 h-4 w-4" />
                    Add Prayer Request
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {formatDate(request.submitted_at)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium truncate max-w-[200px]" title={request.title}>
                            {request.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.contacts ? (
                            <div className="text-sm">
                              {`${request.contacts.first_name || ''} ${request.contacts.last_name || ''}`}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Anonymous</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {request.assigned_to ? 'Assigned' : 'Unassigned'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/people/outreach/prayer-requests/${request.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/people/outreach/prayer-requests/${request.id}?edit=true`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {request.status !== 'answered' && (
                                <DropdownMenuItem onClick={() => openAnswerDialog(request)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Answered
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(request)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
            <DialogTitle>Delete Prayer Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prayer request? This action cannot be undone.
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
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Answer Dialog */}
      <Dialog open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Prayer Request as Answered</DialogTitle>
            <DialogDescription>
              Record how this prayer was answered (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="grid w-full gap-1.5">
                <label htmlFor="answerNote" className="text-sm font-medium">
                  Answer Note
                </label>
                <textarea
                  id="answerNote"
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe how this prayer was answered..."
                  value={answerNote}
                  onChange={(e) => setAnswerNote(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAnswerDialog(false)}
              disabled={isAnswering}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmAnswer}
              disabled={isAnswering}
            >
              {isAnswering ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </div>
              ) : (
                'Mark as Answered'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 