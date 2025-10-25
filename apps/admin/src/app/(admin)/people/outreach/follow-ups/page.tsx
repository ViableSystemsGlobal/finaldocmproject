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
  AlertTriangle,
  Plus,
  TrendingUp,
  Activity,
  Sparkles,
  Clock,
  UserPlus,

} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Pagination, usePagination } from '@/components/ui/pagination'
import { 
  FollowUp,
  fetchFollowUps,
  deleteFollowUp,
  markFollowUpComplete,
  getFollowUpMetrics,
  reassignFollowUp
} from '@/services/followUps'
import { useUsers } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'

export default function FollowUpsPage() {
  // Hooks
  const { users } = useUsers()
  const { userPermissions, isLoading: permissionsLoading } = usePermissions()
  
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
  
  // Assignment states
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assigningFollowUp, setAssigningFollowUp] = useState<FollowUp | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  
  // Checkbox selection state
  const [selectedFollowUps, setSelectedFollowUps] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Bulk action states
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false)
  const [bulkAssignUser, setBulkAssignUser] = useState('')
  const [isBulkCompleting, setIsBulkCompleting] = useState(false)
  const [isBulkAssigning, setIsBulkAssigning] = useState(false)
  
  // Email notification states
  const [sendEmailNotification, setSendEmailNotification] = useState(true)
  const [bulkSendEmailNotification, setBulkSendEmailNotification] = useState(true)
  
  // Load initial data and metrics
  useEffect(() => {
    // Don't load data until permissions are loaded
    if (permissionsLoading) {
      console.log('Waiting for permissions to load...')
      return
    }

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
        
        // Fetch follow-ups with permission-based filtering
        let followUpsQuery = supabase
          .from('follow_ups')
          .select('*, contacts(id, first_name, last_name, email, phone)')
          .order('created_at', { ascending: false });

        // Apply permission-based filtering
        console.log('User permissions:', userPermissions.permissions)
        console.log('User ID:', userPermissions.user?.id)
        
        if (userPermissions.permissions.includes('followups:view:all')) {
          console.log('User has view:all permission - showing all follow-ups')
          // User can see all follow-ups - no filter needed
        } else if (userPermissions.permissions.includes('followups:view:department') && userPermissions.department) {
          console.log('User has view:department permission - filtering by department')
          // Filter by department (would need department field in follow_ups or contacts)
          // For now, fall back to assigned only
          followUpsQuery = followUpsQuery.eq('assigned_to', userPermissions.user?.id)
        } else if (userPermissions.permissions.includes('followups:view:assigned')) {
          console.log('User has view:assigned permission - filtering by assigned_to:', userPermissions.user?.id)
          // Only show follow-ups assigned to this user
          followUpsQuery = followUpsQuery.eq('assigned_to', userPermissions.user?.id)
        } else {
          console.log('User has no follow-up permissions')
          // No permission to view follow-ups
          setFollowUps([])
          return
        }

        const { data, error } = await followUpsQuery
        
        if (error) {
          console.error('Database error:', error)
          throw error
        }
        
        console.log('Raw follow-ups data from database:', data)
        console.log('Number of follow-ups returned:', data?.length || 0)
        console.log('Final permissions check - User permissions:', userPermissions.permissions)
        console.log('Final permissions check - User ID:', userPermissions.user?.id)
        setFollowUps(data || [])
      } catch (err) {
        console.error('Failed to load follow-up data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load follow-up data. Please check your database connection.'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [permissionsLoading, userPermissions.permissions])
  
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

  // Use new pagination hook
  const pagination = usePagination(filteredFollowUps, 10)


  
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
      
      // Update follow-up status in state
      setFollowUps(followUps.map(f => 
        f.id === completingFollowUp.id 
          ? { ...f, status: 'completed' as const, completed_at: new Date().toISOString() }
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
  
  // Date helpers
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }
  
  const isOverdue = (dateString: string) => {
    try {
      const dueDate = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    } catch {
      return false
    }
  }

  // Assignment functions
  const openAssignDialog = (followUp: FollowUp) => {
    setAssigningFollowUp(followUp)
    setSelectedAssignee(followUp.assigned_to || '')
    setShowAssignDialog(true)
  }

  const confirmAssignment = async () => {
    if (!assigningFollowUp) return

    try {
      setIsAssigning(true)
      
      const assigneeId = selectedAssignee === 'unassigned' ? null : selectedAssignee
      const assignedByUserName = userPermissions.user?.email || 'Admin'
      
      const { error } = await reassignFollowUp(assigningFollowUp.id, assigneeId, {
        sendNotification: sendEmailNotification && assigneeId !== null,
        assignedByUserName: assignedByUserName
      })
      
      if (error) throw error
      
      // Update local state
      setFollowUps(prev => prev.map(followUp => 
        followUp.id === assigningFollowUp.id 
          ? { ...followUp, assigned_to: assigneeId }
          : followUp
      ))
      
      const emailMessage = sendEmailNotification && assigneeId ? 
        'Follow-up assignment updated successfully! Email notification sent.' :
        'Follow-up assignment updated successfully!'
      
      toast({
        title: 'Success',
        description: emailMessage,
      })
      
      setShowAssignDialog(false)
      setAssigningFollowUp(null)
      setSelectedAssignee('')
      setSendEmailNotification(true) // Reset to default
    } catch (err) {
      console.error('Error assigning follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign follow-up',
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Check if user can assign follow-ups
  const canAssignFollowUps = userPermissions.permissions.includes('followups:assign') || 
                            userPermissions.permissions.includes('followups:reassign')

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedFollowUps(new Set())
    } else {
      setSelectedFollowUps(new Set(pagination.currentItems.map(f => f.id)))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectFollowUp = (id: string) => {
    const newSelected = new Set(selectedFollowUps)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedFollowUps(newSelected)
    setSelectAll(newSelected.size === pagination.currentItems.length && pagination.currentItems.length > 0)
  }

  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      
      for (const id of Array.from(selectedFollowUps)) {
        await deleteFollowUp(id)
      }
      
      // Remove deleted follow-ups from state
      setFollowUps(prev => prev.filter(f => !selectedFollowUps.has(f.id)))
      
      toast({
        title: 'Success',
        description: `${selectedFollowUps.size} follow-ups deleted successfully`
      })
      
      setSelectedFollowUps(new Set())
      setSelectAll(false)
      setShowBulkDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete follow-ups:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete some follow-ups'
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkComplete = async () => {
    try {
      setIsBulkCompleting(true)
      
      for (const id of Array.from(selectedFollowUps)) {
        await markFollowUpComplete(id, 'Bulk completed')
      }
      
      // Update follow-ups in state
      setFollowUps(prev => prev.map(f => 
        selectedFollowUps.has(f.id) 
          ? { ...f, status: 'completed', completed_at: new Date().toISOString() }
          : f
      ))
      
      toast({
        title: 'Success',
        description: `${selectedFollowUps.size} follow-ups marked as completed`
      })
      
      setSelectedFollowUps(new Set())
      setSelectAll(false)
    } catch (err) {
      console.error('Failed to complete follow-ups:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete some follow-ups'
      })
    } finally {
      setIsBulkCompleting(false)
    }
  }

  const handleBulkAssign = async () => {
    if (!bulkAssignUser) return
    
    try {
      setIsBulkAssigning(true)
      
      const assigneeId = bulkAssignUser === 'unassigned' ? null : bulkAssignUser
      const assignedByUserName = userPermissions.user?.email || 'Admin'
      
      for (const id of Array.from(selectedFollowUps)) {
        await reassignFollowUp(id, assigneeId, {
          sendNotification: bulkSendEmailNotification && assigneeId !== null,
          assignedByUserName: assignedByUserName
        })
      }
      
      // Update follow-ups in state
      setFollowUps(prev => prev.map(f => 
        selectedFollowUps.has(f.id) 
          ? { ...f, assigned_to: assigneeId }
          : f
      ))
      
      const emailMessage = bulkSendEmailNotification && assigneeId ? 
        `${selectedFollowUps.size} follow-ups assigned successfully! Email notifications sent.` :
        `${selectedFollowUps.size} follow-ups assigned successfully!`
      
      toast({
        title: 'Success',
        description: emailMessage
      })
      
      setSelectedFollowUps(new Set())
      setSelectAll(false)
      setShowBulkAssignDialog(false)
      setBulkAssignUser('')
      setBulkSendEmailNotification(true) // Reset to default
    } catch (err) {
      console.error('Failed to assign follow-ups:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign some follow-ups'
      })
    } finally {
      setIsBulkAssigning(false)
    }
  }

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Follow-Ups</h2>
          <p className="text-slate-600">Fetching follow-up data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-2xl">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Follow-Ups
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track and manage visitor follow-up activities
                </p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href="/people/outreach/follow-ups/new">
                <Plus className="mr-2 h-5 w-5" /> Create Follow-Up
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-medium">Pending Follow-Ups</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.pendingFollowUps
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-200" />
                <span className="text-orange-100 text-sm font-medium">Require attention</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-red-100 text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.overdueFollowUps
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-200" />
                <span className="text-red-100 text-sm font-medium">Past due date</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Completed Today</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.completedToday
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Today's progress</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Follow-Ups</p>
                  <p className="text-3xl font-bold">{filteredFollowUps.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">All records</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Follow-Ups</h2>
                <p className="text-slate-300">Find follow-ups by contact, status, or type</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by contact name, email, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Status
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Type
                </label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {followUpTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                    setFilterType('all')
                  }}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Summary with Pagination Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredFollowUps.length)} of {filteredFollowUps.length} follow-ups
                  {filteredFollowUps.length !== followUps.length && ` (filtered from ${followUps.length} total)`}
                </span>
                
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Show:</span>
                  <Select value={pagination.itemsPerPage.toString()} onValueChange={(value) => pagination.handleItemsPerPageChange(Number(value))}>
                    <SelectTrigger className="w-20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-slate-600">per page</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFollowUps.size > 0 && (
          <div className="bg-blue-50/80 backdrop-blur-lg rounded-xl border border-blue-200/50 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-700">
                  {selectedFollowUps.size} follow-up{selectedFollowUps.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFollowUps(new Set())
                    setSelectAll(false)
                  }}
                  className="text-xs"
                >
                  Clear selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkComplete}
                  disabled={isBulkCompleting}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                >
                  {isBulkCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Complete Selected
                </Button>
                {canAssignFollowUps && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkAssignDialog(true)}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Assign Selected
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Follow-Ups Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 font-bold text-slate-700 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Contact</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Type</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Due Date</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Assigned To</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Notes</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <UserCheck className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No follow-ups found</h3>
                        <p className="text-slate-600">
                          {followUps.length === 0 
                            ? "No follow-ups found. Create your first follow-up."
                            : "No follow-ups match your search criteria."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((followUp) => (
                  <TableRow key={followUp.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFollowUps.has(followUp.id)}
                          onChange={() => handleSelectFollowUp(followUp.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800">
                        {followUp.contacts ? 
                          `${followUp.contacts.first_name || ''} ${followUp.contacts.last_name || ''}`.trim() || 'Unknown Contact' 
                          : 'Unknown Contact'
                        }
                      </div>
                      {followUp.contacts?.email && (
                        <div className="text-slate-600 text-sm">{followUp.contacts.email}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
                        {followUp.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      <div className={isOverdue(followUp.next_action_date) ? 'text-red-600 font-medium' : ''}>
                        {formatDate(followUp.next_action_date)}
                        {isOverdue(followUp.next_action_date) && (
                          <AlertTriangle className="h-4 w-4 inline ml-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={followUp.status === 'completed' ? "default" : 
                                followUp.status === 'pending' ? "secondary" : "destructive"} 
                        className={
                          followUp.status === 'completed' 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                            : followUp.status === 'pending'
                            ? "bg-slate-100 text-slate-700"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                        }
                      >
                        {followUp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {followUp.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {(() => {
                              const assignedUser = users.find(u => u.id === followUp.assigned_to)
                              return assignedUser ? (assignedUser.name || assignedUser.email) : 'Unknown User'
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600 max-w-[200px]">
                      {followUp.notes ? (
                        followUp.notes.length > 50 ? 
                          `${followUp.notes.substring(0, 50)}...` : 
                          followUp.notes
                      ) : 'No notes'}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/outreach/follow-ups/${followUp.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/outreach/follow-ups/${followUp.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {canAssignFollowUps && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAssignDialog(followUp)}
                            className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                            title="Assign follow-up"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {followUp.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openCompleteDialog(followUp)}
                            className="hover:bg-green-50 hover:text-green-600 rounded-lg text-slate-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteDialog(followUp)}
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
          
          {/* Enhanced Pagination Controls */}
          {filteredFollowUps.length > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
              onItemsPerPageChange={pagination.handleItemsPerPageChange}
            />
          )}
        </div>
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this follow-up? This action cannot be undone.</p>
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

      {/* Enhanced Complete Confirmation Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Mark as Complete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to mark this follow-up as completed?</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCompleteDialog(false)}
                disabled={isCompleting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmComplete}
                disabled={isCompleting}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Mark Complete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Dialog */}
      {showAssignDialog && assigningFollowUp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Assign Follow-Up</h3>
              <p className="text-sm text-slate-600 mt-2">
                Assign this follow-up to a team member
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700">
                  Contact: {assigningFollowUp.contacts ? 
                    `${assigningFollowUp.contacts.first_name || ''} ${assigningFollowUp.contacts.last_name || ''}`.trim() || 'Unknown Contact' 
                    : 'Unknown Contact'
                  }
                </p>
                <p className="text-sm text-slate-600">Type: {assigningFollowUp.type}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign to:
              </label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                                 <SelectContent>
                   <SelectItem value="unassigned">Unassigned</SelectItem>
                   {users
                     .filter(user => userPermissions.permissions.includes('followups:view:all') || 
                                    userPermissions.permissions.includes('followups:view:assigned') || 
                                    userPermissions.permissions.includes('followups:view:department'))
                     .map(user => (
                       <SelectItem key={user.id} value={user.id}>
                         {user.name || user.email}
                       </SelectItem>
                     ))}
                 </SelectContent>
              </Select>
            </div>
            
            {selectedAssignee && selectedAssignee !== 'unassigned' && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="send_email"
                    checked={sendEmailNotification}
                    onCheckedChange={setSendEmailNotification}
                  />
                  <label htmlFor="send_email" className="text-sm font-normal cursor-pointer text-slate-700">
                    Send email notification to assigned person
                  </label>
                </div>
                {sendEmailNotification && (
                  <p className="text-xs text-slate-600 ml-6">
                    ✉️ Will include follow-up details, contact information, due date, and any notes
                  </p>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAssignDialog(false)}
                disabled={isAssigning}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmAssignment}
                disabled={isAssigning}
                className="rounded-xl px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Follow-Up'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Dialog */}
      {showBulkDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Bulk Delete</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to delete {selectedFollowUps.size} follow-up{selectedFollowUps.size !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkDeleteDialog(false)}
                disabled={isBulkDeleting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-6"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Follow-ups'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Dialog */}
      {showBulkAssignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Bulk Assign Follow-ups</h3>
              <p className="text-sm text-slate-600 mt-2">
                Assign {selectedFollowUps.size} follow-up{selectedFollowUps.size !== 1 ? 's' : ''} to a user.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign to:
              </label>
              <Select value={bulkAssignUser} onValueChange={setBulkAssignUser}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users
                    .filter(user => userPermissions.permissions.includes('followups:view:all') || 
                                   userPermissions.permissions.includes('followups:view:assigned') || 
                                   userPermissions.permissions.includes('followups:view:department'))
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {bulkAssignUser && bulkAssignUser !== 'unassigned' && (
              <div className="mb-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="bulk_send_email"
                    checked={bulkSendEmailNotification}
                    onCheckedChange={setBulkSendEmailNotification}
                  />
                  <label htmlFor="bulk_send_email" className="text-sm font-normal cursor-pointer text-slate-700">
                    Send email notifications to assigned person for all follow-ups
                  </label>
                </div>
                {bulkSendEmailNotification && (
                  <p className="text-xs text-slate-600 ml-6">
                    ✉️ Will send individual emails for each follow-up assignment
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBulkAssignDialog(false)
                  setBulkAssignUser('')
                }}
                disabled={isBulkAssigning}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAssign}
                disabled={isBulkAssigning || !bulkAssignUser}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl px-6"
              >
                {isBulkAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  'Assign Follow-ups'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 