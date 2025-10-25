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
  UserCog,
  Plus,
  TrendingUp,
  Activity,
  Sparkles,
  HandHeart,
  UserPlus,
  Users,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { MetricCard } from '@/components/MetricCard'
import { usePermissions } from '@/hooks/usePermissions'
import { useUsers } from '@/hooks/useUsers'
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
  PrayerRequest,
  fetchPrayerRequests,
  deletePrayerRequest,
  markPrayerRequestAnswered,
  assignPrayerRequest,
  assignPrayerRequestWithNotification,
  bulkAssignPrayerRequestsByRole,
  assignPrayerRequestsToUsers,
  getUsersByRole,
  getAllUsers,
  getPrayerRequestMetrics,
  getAssignedUsersForPrayerRequests
} from '@/services/prayerRequests'
import { supabase } from '@/lib/supabase'

export default function PrayerRequestsPage() {
  // Hooks
  const { users } = useUsers()
  const { userPermissions, isLoading: permissionsLoading } = usePermissions()
  
  // State
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([])
  const [assignedUsers, setAssignedUsers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Temporary pagination - will be replaced after filteredRequests
  
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
  
  // Bulk actions state
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkAnswering, setIsBulkAnswering] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showBulkAnswerDialog, setShowBulkAnswerDialog] = useState(false)
  const [bulkAnswerNote, setBulkAnswerNote] = useState('')
  
  // Assignment states
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assigningRequest, setAssigningRequest] = useState<PrayerRequest | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [sendAssignmentNotification, setSendAssignmentNotification] = useState(true)
  
  // Bulk assignment by role states
  const [showBulkAssignByRoleDialog, setShowBulkAssignByRoleDialog] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [distributionMethod, setDistributionMethod] = useState<'all' | 'round_robin'>('all')
  const [sendBulkNotifications, setSendBulkNotifications] = useState(true)
  const [isBulkAssigning, setIsBulkAssigning] = useState(false)
  const [availableRoles] = useState(['admin', 'pastor', 'staff', 'volunteer', 'elder', 'deacon', 'prayer_team'])
  
  // Multi-person assignment states
  const [showMultiPersonAssignDialog, setShowMultiPersonAssignDialog] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [sendMultiPersonNotifications, setSendMultiPersonNotifications] = useState(true)
  const [isMultiPersonAssigning, setIsMultiPersonAssigning] = useState(false)
  
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
        const metricsResponse = await getPrayerRequestMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Fetch prayer requests with permission-based filtering
        console.log('User permissions:', userPermissions.permissions)
        console.log('User ID:', userPermissions.user?.id)
        
        let prayerRequestsQuery;
        
        if (userPermissions.permissions.includes('prayers:view:all')) {
          console.log('User has prayers:view:all permission - showing all prayer requests')
          // User can see all prayer requests - load all for client-side pagination
          prayerRequestsQuery = await fetchPrayerRequests(1, 1000)
        } else if (userPermissions.permissions.includes('prayers:view:department') && userPermissions.department) {
          console.log('User has prayers:view:department permission - filtering by department')
          // For now, fall back to assigned only since we don't have department field
          prayerRequestsQuery = await supabase
            .from('prayer_requests')
            .select(`
              id, title, description, status, submitted_at, assigned_to, source, source_submission_id,
              contacts (id, first_name, last_name, email, lifecycle)
            `)
            .eq('assigned_to', userPermissions.user?.id)
            .order('submitted_at', { ascending: false })
        } else if (userPermissions.permissions.includes('prayers:view:assigned')) {
          console.log('User has prayers:view:assigned permission - filtering by assigned_to:', userPermissions.user?.id)
          // Only show prayer requests assigned to this user
          prayerRequestsQuery = await supabase
            .from('prayer_requests')
            .select(`
              id, title, description, status, submitted_at, assigned_to, source, source_submission_id,
              contacts (id, first_name, last_name, email, lifecycle)
            `)
            .eq('assigned_to', userPermissions.user?.id)
            .order('submitted_at', { ascending: false })
        } else {
          console.log('User has no prayer request permissions')
          // No permission to view prayer requests
          setPrayerRequests([])
          setAssignedUsers({})
          return
        }
        
        const { data, error } = prayerRequestsQuery
        if (error) throw error

        // For prayer requests without contacts, fetch website message data
        const requestsWithoutContacts = data?.filter(req => !req.contacts && req.source_submission_id) || []
        const websiteMessageData: Record<string, any> = {}
        
        if (requestsWithoutContacts.length > 0) {
          const submissionIds = requestsWithoutContacts.map(req => req.source_submission_id).filter(Boolean)
          
          if (submissionIds.length > 0) {
            const { data: websiteMessages } = await supabase
              .from('website_messages')
              .select('id, name, email, phone')
              .in('id', submissionIds)
            
            websiteMessages?.forEach(msg => {
              websiteMessageData[msg.id] = {
                name: msg.name,
                email: msg.email,
                phone: msg.phone
              }
            })
          }
        }

        // Attach website message data to prayer requests
        const enrichedData = data?.map(request => ({
          ...request,
          website_message: request.source_submission_id ? websiteMessageData[request.source_submission_id] : undefined
        })) || []
        
        console.log('Raw prayer requests data from database:', data)
        console.log('Number of prayer requests returned:', data?.length || 0)
        console.log('Enriched prayer requests with website messages:', enrichedData)
        
        const prayerRequestsData = enrichedData as unknown as PrayerRequest[] || []
        setPrayerRequests(prayerRequestsData)
        // Removed setTotalCount since we now use client-side pagination
        
        // Fetch assigned users separately
        const usersMap = await getAssignedUsersForPrayerRequests(prayerRequestsData)
        setAssignedUsers(usersMap)
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
  }, [permissionsLoading, userPermissions]) // Removed currentPage and pageSize since we now use client-side pagination
  
  // Old pagination functions removed - now using usePagination hook
  
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

  // Use new pagination hook
  const pagination = usePagination(filteredRequests, 10)
  
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
          ? { ...r, status: 'answered' as const, response_notes: answerNote } 
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

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedRequests(new Set(pagination.currentItems.map(request => request.id)))
    } else {
      setSelectedRequests(new Set())
    }
  }
  
  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests)
    if (checked) {
      newSelected.add(requestId)
    } else {
      newSelected.delete(requestId)
      setSelectAll(false)
    }
    setSelectedRequests(newSelected)
    
    // Update select all state
    if (newSelected.size === pagination.currentItems.length) {
      setSelectAll(true)
    }
  }
  
  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      const selectedArray = Array.from(selectedRequests)
      
      // Delete all selected requests
      for (const requestId of selectedArray) {
        const { error } = await deletePrayerRequest(requestId)
        if (error) throw error
      }
      
      // Remove deleted requests from state
      setPrayerRequests(prayerRequests.filter(request => !selectedRequests.has(request.id)))
      setSelectedRequests(new Set())
      setSelectAll(false)
      setShowBulkDeleteDialog(false)
      
      toast({
        title: 'Success',
        description: `${selectedArray.length} prayer request(s) deleted successfully`
      })
    } catch (err) {
      console.error('Failed to bulk delete requests:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete some requests'
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }
  
  const handleBulkAnswer = async () => {
    try {
      setIsBulkAnswering(true)
      const selectedArray = Array.from(selectedRequests)
      let successCount = 0
      
      // Mark all selected requests as answered
      for (const requestId of selectedArray) {
        try {
          const { error } = await markPrayerRequestAnswered(requestId, bulkAnswerNote)
          if (error) throw error
          successCount++
        } catch (err) {
          console.error(`Failed to answer request ${requestId}:`, err)
        }
      }
      
      // Refresh the data - load all for client-side pagination
      const { data, error } = await fetchPrayerRequests(1, 1000)
      if (!error) {
        setPrayerRequests(data as unknown as PrayerRequest[] || [])
      }
      
      setSelectedRequests(new Set())
      setSelectAll(false)
      setShowBulkAnswerDialog(false)
      setBulkAnswerNote('')
      
      toast({
        title: 'Success',
        description: `${successCount} prayer request(s) marked as answered`
      })
    } catch (err) {
      console.error('Failed to bulk answer requests:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to answer some requests'
      })
    } finally {
      setIsBulkAnswering(false)
    }
  }
  
  // Assignment handlers
  const openAssignDialog = (request: PrayerRequest) => {
    setAssigningRequest(request)
    setSelectedAssignee(request.assigned_to || 'unassigned')
    setShowAssignDialog(true)
  }
  
  const confirmAssignment = async () => {
    if (!assigningRequest) return

    try {
      setIsAssigning(true)
      
      const assigneeId = selectedAssignee === 'unassigned' ? null : selectedAssignee
      
      // Get current user name for assignment notification
      const currentUserName = userPermissions.user?.user_metadata?.name || 
                             userPermissions.user?.email || 
                             'Administrator'
      
      const { error } = await assignPrayerRequestWithNotification(
        assigningRequest.id, 
        assigneeId,
        {
          sendNotification: sendAssignmentNotification,
          assignedByUserName: currentUserName
        }
      )
      
      if (error) throw error
      
      // Update local state
      const updatedPrayerRequests = prayerRequests.map(request => 
        request.id === assigningRequest.id 
          ? { ...request, assigned_to: assigneeId || undefined, status: assigneeId ? 'in-prayer' : request.status }
          : request
      )
      setPrayerRequests(updatedPrayerRequests)
      
      // Update assigned users map
      const usersMap = await getAssignedUsersForPrayerRequests(updatedPrayerRequests)
      setAssignedUsers(usersMap)
      
      toast({
        title: 'Success',
        description: `Prayer request assignment updated successfully${sendAssignmentNotification && assigneeId ? ' (notification sent)' : ''}`,
      })
      
      setShowAssignDialog(false)
      setAssigningRequest(null)
      setSelectedAssignee('')
    } catch (err) {
      console.error('Error assigning prayer request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign prayer request',
      })
    } finally {
      setIsAssigning(false)
    }
  }
  
  // Bulk assignment by role handlers
  const openBulkAssignByRoleDialog = () => {
    if (selectedRequests.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Prayers Selected',
        description: 'Please select prayer requests to assign'
      })
      return
    }
    setShowBulkAssignByRoleDialog(true)
  }
  
  const confirmBulkAssignByRole = async () => {
    if (selectedRoles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Roles Selected',
        description: 'Please select at least one role'
      })
      return
    }

    try {
      setIsBulkAssigning(true)
      
      const currentUserName = userPermissions.user?.user_metadata?.name || 
                             userPermissions.user?.email || 
                             'Administrator'
      
      const result = await bulkAssignPrayerRequestsByRole(
        Array.from(selectedRequests),
        selectedRoles,
        {
          sendNotifications: sendBulkNotifications,
          assignedByUserName: currentUserName,
          distributionMethod: distributionMethod
        }
      )
      
      if (result.success) {
        // Refresh prayer requests to get updated assignments
        const { data: updatedRequests } = await fetchPrayerRequests(1, 1000)
        if (updatedRequests) {
          setPrayerRequests(updatedRequests as unknown as PrayerRequest[])
          const usersMap = await getAssignedUsersForPrayerRequests(updatedRequests as unknown as PrayerRequest[])
          setAssignedUsers(usersMap)
        }
        
        setSelectedRequests(new Set())
        setSelectAll(false)
        
        toast({
          title: 'Success!',
          description: `Successfully assigned ${result.assigned} prayers to ${result.totalUsers} users${sendBulkNotifications ? ' (notifications sent)' : ''}`,
        })
        
        setShowBulkAssignByRoleDialog(false)
        setSelectedRoles([])
      } else {
        toast({
          variant: 'destructive',
          title: 'Assignment Failed',
          description: result.error || 'Failed to assign prayer requests'
        })
      }
    } catch (err) {
      console.error('Error in bulk assignment by role:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during assignment'
      })
    } finally {
      setIsBulkAssigning(false)
    }
  }
  
  // Multi-person assignment handlers
  const openMultiPersonAssignDialog = async () => {
    if (selectedRequests.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No Prayers Selected',
        description: 'Please select prayer requests to assign'
      })
      return
    }
    
    setShowMultiPersonAssignDialog(true)
    loadAvailableUsers()
  }
  
  const loadAvailableUsers = async (searchQuery?: string) => {
    setLoadingUsers(true)
    try {
      const { users, error } = await getAllUsers(searchQuery)
      if (error) {
        console.error('Failed to load users:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load users for assignment'
        })
      } else {
        setAvailableUsers(users)
      }
    } catch (error) {
      console.error('Exception loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }
  
  const handleUserSearch = async (query: string) => {
    setUserSearchQuery(query)
    await loadAvailableUsers(query)
  }
  

  
  const confirmMultiPersonAssignment = async () => {
    if (selectedUserIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No People Selected',
        description: 'Please select at least one person to assign prayers to'
      })
      return
    }

    try {
      setIsMultiPersonAssigning(true)
      
      const currentUserName = userPermissions.user?.user_metadata?.name || 
                             userPermissions.user?.email || 
                             'Administrator'
      
      const result = await assignPrayerRequestsToUsers(
        Array.from(selectedRequests),
        selectedUserIds,
        {
          sendNotifications: sendMultiPersonNotifications,
          assignedByUserName: currentUserName
        }
      )
      
      if (result.success) {
        // Refresh prayer requests to get updated assignments
        const { data: updatedRequests } = await fetchPrayerRequests(1, 1000)
        if (updatedRequests) {
          setPrayerRequests(updatedRequests as unknown as PrayerRequest[])
          const usersMap = await getAssignedUsersForPrayerRequests(updatedRequests as unknown as PrayerRequest[])
          setAssignedUsers(usersMap)
        }
        
        setSelectedRequests(new Set())
        setSelectAll(false)
        
        toast({
          title: 'Success!',
          description: `Successfully assigned ${result.assigned} prayers to ${result.totalUsers} people${sendMultiPersonNotifications ? ' (notifications sent)' : ''}`,
        })
        
        setShowMultiPersonAssignDialog(false)
        setSelectedUserIds([])
        setUserSearchQuery('')
      } else {
        toast({
          variant: 'destructive',
          title: 'Assignment Failed',
          description: result.error || 'Failed to assign prayer requests'
        })
      }
    } catch (err) {
      console.error('Error in multi-person assignment:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred during assignment'
      })
    } finally {
      setIsMultiPersonAssigning(false)
    }
  }
  
  // Check if user can assign prayer requests
  const canAssignPrayerRequests = userPermissions.permissions.includes('prayers:assign')

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

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Prayer Requests</h2>
          <p className="text-slate-600">Fetching prayer request data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl">
                  <HandHeart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Prayer Requests
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage prayer requests and answered prayers
                </p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href="/people/outreach/prayer-requests/new">
                <Plus className="mr-2 h-5 w-5" /> New Prayer Request
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Clock className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">New Requests</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.newRequests
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Awaiting response</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">In Prayer</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.inPrayerRequests
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Being prayed for</span>
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
                  <p className="text-emerald-100 text-sm font-medium">Answered Prayers</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.answeredRequests
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">God's faithfulness</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <HandHeart className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Total Requests</p>
                  <p className="text-3xl font-bold">{filteredRequests.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">All prayer needs</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Prayer Requests</h2>
                <p className="text-slate-300">Find prayer requests by title, contact, or status</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by title or contact name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
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
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-prayer">In Prayer</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
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
                Showing {filteredRequests.length} of {prayerRequests.length} prayer requests
                {filteredRequests.length !== prayerRequests.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedRequests.size > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-xl mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedRequests.size} prayer request(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canAssignPrayerRequests && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openMultiPersonAssignDialog}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Assign to People
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openBulkAssignByRoleDialog}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Assign by Role
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBulkAnswerDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Answered
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="bg-red-500/80 hover:bg-red-600/80 text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRequests(new Set())
                    setSelectAll(false)
                  }}
                  className="text-white hover:bg-white/20"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Prayer Requests Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 font-bold text-slate-700 w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Date</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Title</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">From</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Source</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Assigned To</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <HandHeart className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No prayer requests found</h3>
                        <p className="text-slate-600">
                          {prayerRequests.length === 0 
                            ? "No prayer requests found. Create the first prayer request."
                            : "No prayer requests match your search criteria."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((request) => (
                  <TableRow key={request.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onCheckedChange={(checked) => handleSelectRequest(request.id, checked)}
                        aria-label={`Select ${request.title}`}
                      />
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {formatDate(request.submitted_at)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800 max-w-[300px]">
                        {request.title}
                      </div>
                      {request.description && (
                        <div className="text-slate-600 text-sm mt-1 max-w-[300px] truncate">
                          {request.description.length > 80 
                            ? `${request.description.substring(0, 80)}...`
                            : request.description
                          }
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-800">
                                                {request.contacts ?
                          `${request.contacts.first_name || ''} ${request.contacts.last_name || ''}`.trim() || 'Unknown'
                          : request.website_message?.name || 'Unknown'
                        }
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {(request.contacts?.email || request.website_message?.email) && (
                          <div className="text-slate-600 text-sm">{request.contacts?.email || request.website_message?.email}</div>
                        )}
                        {request.contacts?.lifecycle && (
                          <Badge 
                            variant="outline" 
                            className={
                              request.contacts.lifecycle === 'member' 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                                : request.contacts.lifecycle === 'visitor'
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-slate-50 text-slate-700 border-slate-300"
                            }
                          >
                            {request.contacts.lifecycle.charAt(0).toUpperCase() + request.contacts.lifecycle.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={
                          request.status === 'answered' ? "default" : 
                          request.status === 'in-prayer' ? "secondary" : 
                          "outline"
                        } 
                        className={
                          request.status === 'answered' 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                            : request.status === 'in-prayer'
                            ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                            : "bg-blue-50 text-blue-700 border-blue-300"
                        }
                      >
                        {request.status === 'new' ? 'New' : 
                         request.status === 'in-prayer' ? 'In Prayer' : 
                         'Answered'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant="outline" 
                        className={
                          request.source === 'app' 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-300" 
                            : request.source === 'website'
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-slate-50 text-slate-700 border-slate-300"
                        }
                      >
                        {request.source === 'app' ? '📱 App' : 
                         request.source === 'website' ? '🌐 Website' : 
                         request.source === 'manual' ? '✋ Manual' :
                         request.source || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {request.assigned_to && assignedUsers[request.assigned_to] ? (
                        <div className="font-medium text-slate-800">
                          {assignedUsers[request.assigned_to].raw_user_meta_data?.name || 
                           assignedUsers[request.assigned_to].raw_user_meta_data?.first_name || 
                           assignedUsers[request.assigned_to].email}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/outreach/prayer-requests/${request.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/outreach/prayer-requests/${request.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {request.status !== 'answered' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAnswerDialog(request)}
                            className="hover:bg-green-50 hover:text-green-600 rounded-lg text-slate-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {canAssignPrayerRequests && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAssignDialog(request)}
                            className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                            title="Assign prayer request"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteDialog(request)}
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
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handlePageChange}
          onItemsPerPageChange={pagination.handleItemsPerPageChange}
          className="mt-6"
        />
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this prayer request? This action cannot be undone.</p>
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

      {/* Enhanced Answer Prayer Dialog */}
      {showAnswerDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Mark Prayer as Answered</h3>
              <p className="text-sm text-slate-600 mt-2">Add a note about how this prayer was answered (optional).</p>
            </div>
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Answer Note
              </label>
              <Textarea
                value={answerNote}
                onChange={(e) => setAnswerNote(e.target.value)}
                placeholder="How was this prayer answered? (optional)"
                className="h-24 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowAnswerDialog(false)}
                disabled={isAnswering}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmAnswer}
                disabled={isAnswering}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isAnswering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  'Mark as Answered'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Bulk Delete</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to delete {selectedRequests.size} prayer request(s)? This action cannot be undone.
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
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  `Delete ${selectedRequests.size} Request(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Answer Confirmation Dialog */}
      {showBulkAnswerDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Mark Prayers as Answered</h3>
              <p className="text-sm text-slate-600 mt-2">
                Mark {selectedRequests.size} prayer request(s) as answered. Add a note about how God answered these prayers.
              </p>
            </div>
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Answer Note (Optional)
              </label>
              <Textarea
                value={bulkAnswerNote}
                onChange={(e) => setBulkAnswerNote(e.target.value)}
                placeholder="How did God answer these prayers? (optional)"
                className="h-24 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkAnswerDialog(false)}
                disabled={isBulkAnswering}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkAnswer}
                disabled={isBulkAnswering}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isBulkAnswering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  `Mark ${selectedRequests.size} as Answered`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Dialog */}
      {showAssignDialog && assigningRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Assign Prayer Request</h3>
              <p className="text-sm text-slate-600 mt-2">
                Assign "{assigningRequest.title}" to a team member for prayer and follow-up.
              </p>
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
                    .filter(user => userPermissions.permissions.includes('prayers:view:all') || 
                                   userPermissions.permissions.includes('prayers:view:assigned') || 
                                   userPermissions.permissions.includes('prayers:view:department'))
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedAssignee !== 'unassigned' && selectedAssignee && (
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-assignment-notification"
                    checked={sendAssignmentNotification}
                    onCheckedChange={setSendAssignmentNotification}
                  />
                  <label
                    htmlFor="send-assignment-notification"
                    className="text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    Send email notification to assigned person
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  They will receive an email with prayer request details and assignment information.
                </p>
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
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Prayer Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assignment by Role Dialog */}
      {showBulkAssignByRoleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-lg w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Assign Prayers by Role</h3>
              <p className="text-sm text-slate-600 mt-2">
                Assign {selectedRequests.size} prayer request(s) to users with specific roles.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select roles to assign prayers to:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map(role => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role])
                        } else {
                          setSelectedRoles(selectedRoles.filter(r => r !== role))
                        }
                      }}
                    />
                    <label
                      htmlFor={`role-${role}`}
                      className="text-sm font-medium text-slate-700 cursor-pointer capitalize"
                    >
                      {role.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Distribution method:
              </label>
              <Select value={distributionMethod} onValueChange={(value: 'all' | 'round_robin') => setDistributionMethod(value)}>
                <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div>
                      <div className="font-medium">Assign to All</div>
                      <div className="text-xs text-slate-500">Each prayer goes to all users with selected roles</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="round_robin">
                    <div>
                      <div className="font-medium">Distribute Evenly</div>
                      <div className="text-xs text-slate-500">Prayers are distributed evenly among users</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-bulk-notifications"
                  checked={sendBulkNotifications}
                  onCheckedChange={setSendBulkNotifications}
                />
                <label
                  htmlFor="send-bulk-notifications"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Send email notifications to all assigned users
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Each user will receive email notifications for the prayers assigned to them.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBulkAssignByRoleDialog(false)
                  setSelectedRoles([])
                }}
                disabled={isBulkAssigning}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmBulkAssignByRole}
                disabled={isBulkAssigning || selectedRoles.length === 0}
                className="rounded-xl px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {isBulkAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCog className="mr-2 h-4 w-4" />
                    Assign Prayers
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Person Assignment Dialog */}
      {showMultiPersonAssignDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-2xl w-full mx-4 border border-white/20 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Assign Prayers to People</h3>
              <p className="text-sm text-slate-600 mt-2">
                Assign {selectedRequests.size} prayer request(s) to specific people.
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search people by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="pl-10 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {/* Selected Users Summary */}
            {selectedUserIds.length > 0 && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-800">
                  {selectedUserIds.length} people selected
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Each prayer will be assigned to all selected people
                </p>
              </div>
            )}
            
            {/* User List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg mb-6 bg-white/50">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  <span className="ml-2 text-slate-600">Loading people...</span>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">
                      {userSearchQuery ? `No people found matching "${userSearchQuery}"` : 'No people available'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {availableUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className={`flex items-center p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                        selectedUserIds.includes(user.user_id) ? 'bg-purple-50 border-purple-200' : ''
                      }`}
                      onClick={() => {
                        if (selectedUserIds.includes(user.user_id)) {
                          setSelectedUserIds(prev => prev.filter(id => id !== user.user_id))
                        } else {
                          setSelectedUserIds(prev => [...prev, user.user_id])
                        }
                      }}
                    >
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUserIds.includes(user.user_id)}
                          onCheckedChange={(checked) => {
                            console.log('Checkbox clicked for user:', user.user_id, 'checked:', checked)
                            if (checked) {
                              setSelectedUserIds(prev => {
                                console.log('Adding user to selection. Previous:', prev, 'Adding:', user.user_id)
                                return [...prev, user.user_id]
                              })
                            } else {
                              setSelectedUserIds(prev => {
                                console.log('Removing user from selection. Previous:', prev, 'Removing:', user.user_id)
                                return prev.filter(id => id !== user.user_id)
                              })
                            }
                          }}
                          className="mr-3"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {user.name}
                          </span>
                          {user.role && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-slate-100 text-slate-600 capitalize"
                            >
                              {user.role.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Notification Option */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-multi-person-notifications"
                  checked={sendMultiPersonNotifications}
                  onCheckedChange={setSendMultiPersonNotifications}
                />
                <label
                  htmlFor="send-multi-person-notifications"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Send email notifications to all assigned people
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Each person will receive email notifications for the prayers assigned to them.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMultiPersonAssignDialog(false)
                  setSelectedUserIds([])
                  setUserSearchQuery('')
                }}
                disabled={isMultiPersonAssigning}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmMultiPersonAssignment}
                disabled={isMultiPersonAssigning || selectedUserIds.length === 0}
                className="rounded-xl px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {isMultiPersonAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Assign to {selectedUserIds.length} People
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 