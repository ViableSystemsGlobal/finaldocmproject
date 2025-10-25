'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Filter,
  Search, 
  Loader2, 
  Eye, 
  Pencil, 
  Trash2, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Plus,
  TrendingUp,
  Activity,
  MapPin,
  Users,
  CalendarClock,
  UserCheck,
  ClockIcon,
  MessageSquare,
  UserPlus,
  Mail,
  Smartphone,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  PlannedVisit, 
  fetchPlannedVisits,
  deletePlannedVisit,
  markAsAttended,
  rescheduleEvent,
  getPlannedVisitMetrics,
  sendMessage,
  convertToVisitor
} from '@/services/plannedVisits'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination, usePagination } from '@/components/ui/pagination'

export default function PlannedVisitsPage() {
  // State
  const [plannedVisits, setPlannedVisits] = useState<PlannedVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    upcomingVisits: 0,
    overdueVisits: 0,
    completedThisMonth: 0,
    followUpNeeded: 0,
    loading: true
  })
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingVisit, setDeletingVisit] = useState<PlannedVisit | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Complete visit states
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [completingVisit, setCompletingVisit] = useState<PlannedVisit | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [outcomeNote, setOutcomeNote] = useState('')
  const [followUpNeeded, setFollowUpNeeded] = useState(false)
  
  // Send message states
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [messagingVisit, setMessagingVisit] = useState<PlannedVisit | null>(null)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageContent, setMessageContent] = useState('')
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email')
  
  // Convert to visitor states
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [convertingVisit, setConvertingVisit] = useState<PlannedVisit | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionNotes, setConversionNotes] = useState('')
  
  // Checkbox selection state
  const [selectedVisits, setSelectedVisits] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkCompleting, setIsBulkCompleting] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showBulkCompleteDialog, setShowBulkCompleteDialog] = useState(false)
  const [bulkCompleteNote, setBulkCompleteNote] = useState('')
  
  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getPlannedVisitMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          upcomingVisits: metricsResponse.pendingVisits || 0,
          overdueVisits: metricsResponse.overdueVisits || 0,
          completedThisMonth: metricsResponse.attendedThisMonth || 0,
          followUpNeeded: metricsResponse.overdueVisits || 0,
          loading: false
        })
        
        // Fetch all planned visits for client-side pagination
        const { data, error } = await fetchPlannedVisits(1, 1000)
        
        if (error) throw error
        
        console.log('Loaded planned visits:', data)
        setPlannedVisits(data as unknown as PlannedVisit[] || [])
      } catch (err) {
        console.error('Failed to load planned visit data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load planned visit data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])
  
  // Filter and sort the data
  const filteredAndSortedData = useMemo(() => {
    if (!plannedVisits) return []
    
    return plannedVisits
      .filter((visit) => {
        const matchesSearch = 
          !searchQuery ||
          visit.contacts?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.contacts?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          visit.notes?.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesStatus = filterStatus === 'all' || !filterStatus || visit.status === filterStatus
        const matchesType = filterType === 'all' || !filterType || visit.event_name?.toLowerCase().includes(filterType.toLowerCase())
        
        return matchesSearch && matchesStatus && matchesType
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  }, [plannedVisits, searchQuery, filterStatus, filterType])

  // Use new pagination hook
  const pagination = usePagination(filteredAndSortedData, 20)
  
  // Check if visit is overdue (past event date and still pending/confirmed)
  const isOverdue = (visit: PlannedVisit) => {
    const eventDate = new Date(visit.event_date)
    const now = new Date()
    return eventDate < now && (visit.status === 'pending' || visit.status === 'confirmed')
  }
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm">Pending</Badge>
      case 'contacted':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm">Contacted</Badge>
      case 'confirmed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-sm">Confirmed</Badge>
      case 'attended':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">Attended</Badge>
      case 'no_show':
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white shadow-sm">No Show</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-sm">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="shadow-sm">{status}</Badge>
    }
  }
  
  const getInterestLevelBadge = (level: string) => {
    switch (level) {
      case 'confirmed':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-sm">Confirmed</Badge>
      case 'interested':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm">Interested</Badge>
      case 'tentative':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm">Tentative</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-sm">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="shadow-sm">{level}</Badge>
    }
  }
  
  // Handle delete
  const openDeleteDialog = (visit: PlannedVisit) => {
    setDeletingVisit(visit)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deletingVisit) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deletePlannedVisit(deletingVisit.id)
      
      if (error) throw error
      
      // Remove deleted visit from state
      setPlannedVisits(plannedVisits.filter(v => v.id !== deletingVisit.id))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        upcomingVisits: deletingVisit.status === 'scheduled' ? Math.max(0, prev.upcomingVisits - 1) : prev.upcomingVisits
      }))
      
      toast({
        title: 'Success',
        description: 'Planned visit deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete planned visit:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete planned visit'
      })
    } finally {
      setIsDeleting(false)
      setDeletingVisit(null)
    }
  }
  
  // Handle mark as completed
  const openCompleteDialog = (visit: PlannedVisit) => {
    setCompletingVisit(visit)
    setOutcomeNote('')
    setFollowUpNeeded(false)
    setShowCompleteDialog(true)
  }
  
  const confirmComplete = async () => {
    if (!completingVisit) return
    
    try {
      setIsCompleting(true)
      
      const { error } = await markAsAttended(completingVisit.id, outcomeNote)
      
      if (error) throw error
      
      // Update the visit in state
      setPlannedVisits(plannedVisits.map(v => 
        v.id === completingVisit.id 
          ? { ...v, status: 'attended', notes: outcomeNote } 
          : v
      ))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        upcomingVisits: Math.max(0, prev.upcomingVisits - 1),
        completedThisMonth: prev.completedThisMonth + 1,
        followUpNeeded: followUpNeeded ? prev.followUpNeeded + 1 : prev.followUpNeeded
      }))
      
      toast({
        title: 'Success',
        description: 'Visit marked as completed'
      })
      
      setShowCompleteDialog(false)
    } catch (err) {
      console.error('Failed to mark visit as completed:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark visit as completed'
      })
    } finally {
      setIsCompleting(false)
      setCompletingVisit(null)
      setOutcomeNote('')
      setFollowUpNeeded(false)
    }
  }

  // Handle send message
  const openMessageDialog = (visit: PlannedVisit) => {
    setMessagingVisit(visit)
    setMessageContent('')
    setMessageType('email')
    setShowMessageDialog(true)
  }
  
  const confirmSendMessage = async () => {
    if (!messagingVisit || !messageContent.trim()) return
    
    try {
      setIsSendingMessage(true)
      
      // Pass messageType to the service function
      const { error } = await sendMessage(messagingVisit.id, messageContent, messageType)
      
      if (error) throw error
      
      // Update the visit in state
      setPlannedVisits(plannedVisits.map(v => 
        v.id === messagingVisit.id 
          ? { ...v, last_message_sent: new Date().toISOString(), message_count: (v.message_count || 0) + 1 } 
          : v
      ))
      
      toast({
        title: 'Success',
        description: `${messageType === 'email' ? 'Email' : 'SMS'} sent successfully`
      })
      
      setShowMessageDialog(false)
    } catch (err) {
      console.error('Failed to send message:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to send ${messageType === 'email' ? 'email' : 'SMS'}`
      })
    } finally {
      setIsSendingMessage(false)
      setMessagingVisit(null)
      setMessageContent('')
      setMessageType('email')
    }
  }

  // Handle convert to visitor
  const openConvertDialog = (visit: PlannedVisit) => {
    setConvertingVisit(visit)
    setConversionNotes('')
    setShowConvertDialog(true)
  }
  
  const confirmConvertToVisitor = async () => {
    if (!convertingVisit) return
    
    try {
      setIsConverting(true)
      
      const { error } = await convertToVisitor(convertingVisit.id, conversionNotes)
      
      if (error) throw error
      
      // Update the visit in state
      setPlannedVisits(plannedVisits.map(v => 
        v.id === convertingVisit.id 
          ? { 
              ...v, 
              converted_to_visitor: true, 
              converted_date: new Date().toISOString(),
              status: 'attended',
              notes: conversionNotes ? `${v.notes || ''}\n\nConverted to visitor: ${conversionNotes}` : `${v.notes || ''}\n\nConverted to visitor.`
            } 
          : v
      ))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        convertedToVisitors: prev.followUpNeeded + 1 // Using followUpNeeded as a placeholder since we don't have convertedToVisitors in state
      }))
      
      toast({
        title: 'Success',
        description: 'Successfully converted to visitor'
      })
      
      setShowConvertDialog(false)
    } catch (err) {
      console.error('Failed to convert to visitor:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert to visitor'
      })
    } finally {
      setIsConverting(false)
      setConvertingVisit(null)
      setConversionNotes('')
    }
  }
  
  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedVisits(new Set(pagination.currentItems.map(visit => visit.id)))
    } else {
      setSelectedVisits(new Set())
    }
  }
  
  const handleSelectVisit = (visitId: string, checked: boolean) => {
    const newSelected = new Set(selectedVisits)
    if (checked) {
      newSelected.add(visitId)
    } else {
      newSelected.delete(visitId)
      setSelectAll(false)
    }
    setSelectedVisits(newSelected)
    
    // Update select all state
    if (newSelected.size === pagination.currentItems.length) {
      setSelectAll(true)
    }
  }
  
  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      const selectedArray = Array.from(selectedVisits)
      
      // Delete all selected visits
      for (const visitId of selectedArray) {
        const { error } = await deletePlannedVisit(visitId)
        if (error) throw error
      }
      
      // Remove deleted visits from state
      setPlannedVisits(plannedVisits.filter(visit => !selectedVisits.has(visit.id)))
      setSelectedVisits(new Set())
      setSelectAll(false)
      setShowBulkDeleteDialog(false)
      
      toast({
        title: 'Success',
        description: `${selectedArray.length} planned visit(s) deleted successfully`
      })
    } catch (err) {
      console.error('Failed to bulk delete visits:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete some visits'
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }
  
  const handleBulkComplete = async () => {
    try {
      setIsBulkCompleting(true)
      const selectedArray = Array.from(selectedVisits)
      let successCount = 0
      
      // Mark all selected visits as attended
      for (const visitId of selectedArray) {
        try {
          const { error } = await markAsAttended(visitId, bulkCompleteNote)
          if (error) throw error
          successCount++
        } catch (err) {
          console.error(`Failed to complete visit ${visitId}:`, err)
        }
      }
      
      // Refresh the data
      const { data, error } = await fetchPlannedVisits(1, 1000)
      if (!error) {
        setPlannedVisits(data as unknown as PlannedVisit[] || [])
      }
      
      setSelectedVisits(new Set())
      setSelectAll(false)
      setShowBulkCompleteDialog(false)
      setBulkCompleteNote('')
      
      toast({
        title: 'Success',
        description: `${successCount} planned visit(s) marked as attended`
      })
    } catch (err) {
      console.error('Failed to bulk complete visits:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete some visits'
      })
    } finally {
      setIsBulkCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Planned Visits</h2>
          <p className="text-slate-600">Fetching visit data...</p>
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
                  <CalendarClock className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Planned Visits
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Schedule and track pastoral visits and outreach
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button 
                asChild
                variant="outline"
                className="border-2 border-purple-200 hover:bg-purple-50"
              >
                <Link href="/comms/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Communication Settings
                </Link>
              </Button>
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/people/outreach/planned-visits/new">
                  <Plus className="mr-2 h-5 w-5" /> Schedule Visit
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Upcoming Visits</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.upcomingVisits
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Scheduled ahead</span>
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
                  <p className="text-red-100 text-sm font-medium">Overdue Visits</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.overdueVisits
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-red-200" />
                <span className="text-red-100 text-sm font-medium">Need attention</span>
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
                  <p className="text-emerald-100 text-sm font-medium">Completed This Month</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.completedThisMonth
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Great progress</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Follow-up Needed</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.followUpNeeded
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Needs action</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Planned Visits</h2>
                <p className="text-slate-300">Find visits by contact, purpose, type, or status</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by contact name, purpose, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="attended">Attended</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Event Type
                </label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="sunday">Sunday Service</SelectItem>
                    <SelectItem value="wednesday">Wednesday Bible Study</SelectItem>
                    <SelectItem value="youth">Youth Service</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                    <SelectItem value="holiday">Holiday Service</SelectItem>
                    <SelectItem value="outreach">Community Outreach</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                  <Filter className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {filteredAndSortedData.length} of {plannedVisits.length} planned visits
                {filteredAndSortedData.length !== plannedVisits.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedVisits.size > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedVisits.size} planned visit(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBulkCompleteDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Attended
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
                    setSelectedVisits(new Set())
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

        {/* Enhanced Planned Visits Table */}
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
                <TableHead className="py-4 font-bold text-slate-700">Date & Time</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Contact</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Event</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Interest Level</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Companions</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <CalendarClock className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No planned visits found</h3>
                        <p className="text-slate-600">
                          {plannedVisits.length === 0 
                            ? "No planned visits found. Schedule the first visit."
                            : "No planned visits match your search criteria."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((visit) => (
                  <TableRow key={visit.id} className={`hover:bg-white/80 transition-colors ${
                    isOverdue(visit) ? 'bg-red-50/50' : ''
                  }`}>
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedVisits.has(visit.id)}
                        onCheckedChange={(checked) => handleSelectVisit(visit.id, checked)}
                        aria-label={`Select visit for ${visit.contacts ? `${visit.contacts.first_name} ${visit.contacts.last_name}` : 'contact'}`}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="text-slate-800 font-medium">
                          {formatDateTime(visit.event_date).date}
                        </div>
                        {isOverdue(visit) && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {formatDateTime(visit.event_date).time}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-800">
                        {visit.contacts ? 
                          `${visit.contacts.first_name || ''} ${visit.contacts.last_name || ''}`.trim() || 'Unknown' 
                          : 'Unknown'
                        }
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {visit.contacts?.email && (
                          <div className="text-slate-600 text-sm">{visit.contacts.email}</div>
                        )}
                        {visit.contacts?.lifecycle && (
                          <Badge 
                            variant="outline" 
                            className={
                              visit.contacts.lifecycle === 'member' 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                                : visit.contacts.lifecycle === 'visitor'
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-slate-50 text-slate-700 border-slate-300"
                            }
                          >
                            {visit.contacts.lifecycle.charAt(0).toUpperCase() + visit.contacts.lifecycle.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="max-w-[200px] truncate font-medium text-slate-800">
                        {visit.event_name}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getInterestLevelBadge(visit.interest_level)}
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(visit.status)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        {visit.coming_with_others ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">{visit.companions_count || 0}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">Solo</span>
                        )}
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
                          <Link href={`/people/outreach/planned-visits/${visit.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/outreach/planned-visits/${visit.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {(visit.status === 'pending' || visit.status === 'confirmed') && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openMessageDialog(visit)}
                              className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                              title="Send Message"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openConvertDialog(visit)}
                              className="hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600"
                              title="Convert to Visitor"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {visit.status === 'scheduled' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openCompleteDialog(visit)}
                            className="hover:bg-green-50 hover:text-green-600 rounded-lg text-slate-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteDialog(visit)}
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
        
        {/* Results Summary - handled by Pagination component now */}
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this planned visit? This action cannot be undone.</p>
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

      {/* Enhanced Complete Visit Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Mark Visit as Completed</h3>
              <p className="text-sm text-slate-600 mt-2">Add notes about the visit outcome and whether follow-up is needed.</p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Outcome Notes
                </label>
                <Textarea
                  value={outcomeNote}
                  onChange={(e) => setOutcomeNote(e.target.value)}
                  placeholder="How did the visit go? What was discussed?"
                  className="h-24 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUpNeeded"
                  checked={followUpNeeded}
                  onChange={(e) => setFollowUpNeeded(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="followUpNeeded" className="text-sm font-medium text-slate-700">
                  Follow-up needed
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
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
                  'Mark as Completed'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Dialog */}
      {showMessageDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Send Message</h3>
              <p className="text-sm text-slate-600 mt-2">
                Send a message to {messagingVisit?.contacts ? 
                  `${messagingVisit.contacts.first_name} ${messagingVisit.contacts.last_name}` : 
                  'this visitor'
                } about their planned visit.
              </p>
            </div>
            <div className="space-y-4 mb-6">
              {/* Message Type Selection */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-3 block">
                  Message Type
                </label>
                <div className="flex gap-4">
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      messageType === 'email' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 bg-white/50 hover:border-slate-300'
                    }`}
                    onClick={() => setMessageType('email')}
                  >
                    <input
                      type="radio"
                      name="messageType"
                      value="email"
                      checked={messageType === 'email'}
                      onChange={(e) => setMessageType(e.target.value as 'email' | 'sms')}
                      className="sr-only"
                    />
                    <Mail className={`h-5 w-5 ${messageType === 'email' ? 'text-blue-600' : 'text-slate-500'}`} />
                    <div>
                      <p className={`font-medium ${messageType === 'email' ? 'text-blue-800' : 'text-slate-700'}`}>
                        Email
                      </p>
                      <p className="text-xs text-slate-500">
                        {messagingVisit?.contacts?.email || 'No email available'}
                      </p>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      messageType === 'sms' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-slate-200 bg-white/50 hover:border-slate-300'
                    }`}
                    onClick={() => setMessageType('sms')}
                  >
                    <input
                      type="radio"
                      name="messageType"
                      value="sms"
                      checked={messageType === 'sms'}
                      onChange={(e) => setMessageType(e.target.value as 'email' | 'sms')}
                      className="sr-only"
                    />
                    <Smartphone className={`h-5 w-5 ${messageType === 'sms' ? 'text-green-600' : 'text-slate-500'}`} />
                    <div>
                      <p className={`font-medium ${messageType === 'sms' ? 'text-green-800' : 'text-slate-700'}`}>
                        SMS
                      </p>
                      <p className="text-xs text-slate-500">
                        {messagingVisit?.contacts?.phone || 'No phone available'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Warning if contact info is missing */}
              {((messageType === 'email' && !messagingVisit?.contacts?.email) || 
                (messageType === 'sms' && !messagingVisit?.contacts?.phone)) && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {messageType === 'email' 
                      ? 'No email address available for this contact' 
                      : 'No phone number available for this contact'
                    }
                  </p>
                </div>
              )}
              
              {/* Message Content */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  {messageType === 'email' ? 'Email Content' : 'SMS Message'}
                </label>
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={messageType === 'email' 
                    ? "Type your email message here..." 
                    : "Type your SMS message here... (160 characters recommended)"
                  }
                  className="h-32 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                  disabled={
                    (messageType === 'email' && !messagingVisit?.contacts?.email) || 
                    (messageType === 'sms' && !messagingVisit?.contacts?.phone)
                  }
                />
                {messageType === 'sms' && (
                  <p className="text-xs text-slate-500 mt-1">
                    Character count: {messageContent.length} {messageContent.length > 160 && '(Consider shortening for SMS)'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowMessageDialog(false)}
                disabled={isSendingMessage}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmSendMessage}
                disabled={
                  isSendingMessage || 
                  !messageContent.trim() ||
                  (messageType === 'email' && !messagingVisit?.contacts?.email) ||
                  (messageType === 'sms' && !messagingVisit?.contacts?.phone)
                }
                className="rounded-xl px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              >
                {isSendingMessage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    {messageType === 'email' ? (
                      <Mail className="mr-2 h-4 w-4" />
                    ) : (
                      <Smartphone className="mr-2 h-4 w-4" />
                    )}
                    Send {messageType === 'email' ? 'Email' : 'SMS'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Visitor Dialog */}
      {showConvertDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Convert to Visitor</h3>
              <p className="text-sm text-slate-600 mt-2">
                Convert {convertingVisit?.contacts ? 
                  `${convertingVisit.contacts.first_name} ${convertingVisit.contacts.last_name}` : 
                  'this person'
                } from a prospective visitor to a regular visitor.
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Conversion Notes (Optional)
                </label>
                <Textarea
                  value={conversionNotes}
                  onChange={(e) => setConversionNotes(e.target.value)}
                  placeholder="Add any notes about their first visit experience..."
                  className="h-24 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConvertDialog(false)}
                disabled={isConverting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmConvertToVisitor}
                disabled={isConverting}
                className="rounded-xl px-6 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convert to Visitor
                  </>
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
                Are you sure you want to delete {selectedVisits.size} planned visit(s)? This action cannot be undone.
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
                  `Delete ${selectedVisits.size} Visit(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Complete Confirmation Dialog */}
      {showBulkCompleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Mark Visits as Attended</h3>
              <p className="text-sm text-slate-600 mt-2">
                Mark {selectedVisits.size} planned visit(s) as attended. Add notes about the visit experience.
              </p>
            </div>
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Visit Notes (Optional)
              </label>
              <Textarea
                value={bulkCompleteNote}
                onChange={(e) => setBulkCompleteNote(e.target.value)}
                placeholder="How did the visits go? Any follow-up needed? (optional)"
                className="h-24 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkCompleteDialog(false)}
                disabled={isBulkCompleting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkComplete}
                disabled={isBulkCompleting}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isBulkCompleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  `Mark ${selectedVisits.size} as Attended`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 