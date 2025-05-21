'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  RefreshCw, 
  Filter,
  Search, 
  Loader2, 
  Eye, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  Calendar,
  UserCheck,
  AlertTriangle
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
  FollowUp,
  fetchFollowUps,
  deleteFollowUp,
  markFollowUpComplete,
  getFollowUpMetrics
} from '@/services/followUps'

export default function FollowUpsPage() {
  // State
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    pendingFollowUps: 0,
    overdueFollowUps: 0,
    completedToday: 0,
    loading: true
  })
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingFollowUp, setDeletingFollowUp] = useState<FollowUp | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Complete confirmation states
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getFollowUpMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Fetch follow-ups
        const { data, error } = await fetchFollowUps()
        
        if (error) throw error
        
        console.log('Loaded follow-ups:', data)
        setFollowUps(data as unknown as FollowUp[] || [])
      } catch (err) {
        console.error('Failed to load follow-up data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load follow-up data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])
  
  // Filter follow-ups based on search query and filters
  const filteredFollowUps = followUps.filter(followUp => {
    // Check if it matches search query
    const matchesSearch = searchQuery.trim() === '' || 
      (followUp.contacts && 
        (`${followUp.contacts.first_name || ''} ${followUp.contacts.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (followUp.contacts.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
      ) ||
      (followUp.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if it matches status filter
    const matchesStatus = filterStatus === 'all' || followUp.status === filterStatus;
    
    // Check if it matches type filter
    const matchesType = filterType === 'all' || followUp.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Get unique types for filter
  const followUpTypes = Array.from(new Set(followUps.map(followUp => followUp.type)))
    .filter(Boolean)
    .sort();
  
  // Handle delete
  const openDeleteDialog = (followUp: FollowUp) => {
    setDeletingFollowUp(followUp)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deletingFollowUp) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deleteFollowUp(deletingFollowUp.id)
      
      if (error) throw error
      
      // Remove deleted follow-up from state
      setFollowUps(followUps.filter(f => f.id !== deletingFollowUp.id))
      
      // Update metrics if the deleted follow-up was pending
      if (deletingFollowUp.status === 'pending') {
        setMetrics(prev => ({
          ...prev,
          pendingFollowUps: Math.max(0, prev.pendingFollowUps - 1)
        }))
      }
      
      toast({
        title: 'Success',
        description: 'Follow-up deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete follow-up'
      })
    } finally {
      setIsDeleting(false)
      setDeletingFollowUp(null)
    }
  }
  
  // Handle complete
  const openCompleteDialog = (followUp: FollowUp) => {
    setCompletingFollowUp(followUp)
    setShowCompleteDialog(true)
  }
  
  const confirmComplete = async () => {
    if (!completingFollowUp) return
    
    try {
      setIsCompleting(true)
      
      const { error } = await markFollowUpComplete(completingFollowUp.id)
      
      if (error) throw error
      
      // Update the follow-up in state
      setFollowUps(followUps.map(f => 
        f.id === completingFollowUp.id 
          ? { ...f, status: 'completed', completed_at: new Date().toISOString() } 
          : f
      ))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        pendingFollowUps: Math.max(0, prev.pendingFollowUps - 1),
        completedToday: prev.completedToday + 1
      }))
      
      toast({
        title: 'Success',
        description: 'Follow-up marked as complete'
      })
      
      setShowCompleteDialog(false)
    } catch (err) {
      console.error('Failed to complete follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete follow-up'
      })
    } finally {
      setIsCompleting(false)
      setCompletingFollowUp(null)
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

  // Check if a follow-up is overdue
  const isOverdue = (dateString: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const actionDate = new Date(dateString)
    actionDate.setHours(0, 0, 0, 0)
    return actionDate < today
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading follow-up data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Follow-Ups</h1>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Pending Follow-Ups"
          value={metrics.loading ? 0 : metrics.pendingFollowUps}
          icon={<RefreshCw className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Overdue Follow-Ups"
          value={metrics.loading ? 0 : metrics.overdueFollowUps}
          icon={<AlertTriangle className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Completed Today"
          value={metrics.loading ? 0 : metrics.completedToday}
          icon={<CheckCircle className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>

      {/* Follow-Ups List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Follow-Up Tasks</CardTitle>
              <CardDescription>
                {filteredFollowUps.length} tasks found
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/people/outreach/follow-ups/new">
                <RefreshCw className="mr-2 h-4 w-4" />
                New Follow-Up
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
                  placeholder="Search by name, email, notes..."
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
                    <span>{filterStatus === 'all' ? 'All Statuses' : filterStatus}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={filterType}
                  onValueChange={setFilterType}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>{filterType === 'all' ? 'All Types' : filterType}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {followUpTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Follow-Ups Table */}
            {filteredFollowUps.length === 0 ? (
              <div className="rounded-md border border-dashed p-10 text-center">
                <h3 className="text-lg font-medium">No follow-ups found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery.trim() !== '' || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by creating your first follow-up task'}
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/people/outreach/follow-ups/new">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Add Follow-Up
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Next Action</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFollowUps.map((followUp) => (
                      <TableRow key={followUp.id}>
                        <TableCell>
                          <div className="font-medium">
                            {formatDate(followUp.next_action_date)}
                          </div>
                          {followUp.status === 'pending' && isOverdue(followUp.next_action_date) && (
                            <Badge variant="destructive" className="mt-1">Overdue</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {followUp.contacts ? `${followUp.contacts.first_name || ''} ${followUp.contacts.last_name || ''}` : 'Unknown'}
                          </div>
                          {followUp.contacts?.email && (
                            <div className="text-xs text-muted-foreground">
                              {followUp.contacts.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {followUp.type || 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={followUp.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              followUp.status === 'completed' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                            }
                          >
                            {followUp.status === 'completed' ? 'Completed' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {followUp.assigned_to ? 'Assigned' : 'Unassigned'}
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
                                <Link href={`/people/outreach/follow-ups/${followUp.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/people/outreach/follow-ups/${followUp.id}?edit=true`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {followUp.status === 'pending' && (
                                <DropdownMenuItem onClick={() => openCompleteDialog(followUp)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(followUp)}
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
            <DialogTitle>Delete Follow-Up</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone.
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
      
      {/* Complete Confirmation Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Follow-Up</DialogTitle>
            <DialogDescription>
              Mark this follow-up as completed? This will record it as done.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCompleteDialog(false)}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </div>
              ) : (
                'Mark as Complete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 