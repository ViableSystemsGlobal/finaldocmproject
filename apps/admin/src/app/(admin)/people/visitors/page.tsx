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
  Calendar,
  UserPlus,
  TrendingUp,
  Activity,
  Sparkles,
  Users,
  Heart,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
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
import { FollowUpModal } from '@/components/FollowUpModal'
import { ProtectedRoute, RequirePermission } from '@/components/auth/ProtectedRoute'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionUtils } from '@/lib/permissions'
import { Visitor, fetchVisitors, deleteVisitor, getVisitorsCount, getNewVisitorsThisMonth, getSavedVisitorsCount } from '@/services/visitors'

type VisitorCountMetrics = {
  total: number
  newThisMonth: number
  savedCount: number
  loading: boolean
}

function VisitorsPageContent() {
  const router = useRouter()
  const { userPermissions } = usePermissions()
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [paginatedVisitors, setPaginatedVisitors] = useState<Visitor[]>([])
  
  // UI state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [savedFilter, setSavedFilter] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all')
  
  // Checkbox selection state
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
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
        
        // Sort by first_visit in descending order (most recent first)
        const sortedVisitors = visitorData.sort((a, b) => 
          new Date(b.first_visit).getTime() - new Date(a.first_visit).getTime()
        )
        
        console.log('Visitors data:', sortedVisitors)
        
        setVisitors(sortedVisitors)
        setFilteredVisitors(sortedVisitors)
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
      
      filtered = filtered.filter(visitor => 
        new Date(visitor.first_visit) >= dateLimit
      )
    }
    
    setFilteredVisitors(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [visitors, searchQuery, savedFilter, dateRangeFilter])

  // Apply pagination when filtered visitors or page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedVisitors(filteredVisitors.slice(startIndex, endIndex))
  }, [filteredVisitors, currentPage, pageSize])

  // Calculate pagination info
  const totalPages = Math.ceil(filteredVisitors.length / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, filteredVisitors.length)

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      const { error } = await deleteVisitor(deleteId)
      if (error) throw error

      // Remove visitor from local state
      setVisitors(prev => prev.filter(visitor => visitor.contact_id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Visitor deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete visitor')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleConvertToMember = (visitor: Visitor) => {
    setSelectedVisitor(visitor)
    setShowConvertModal(true)
  }

  const handleConvertSuccess = () => {
    // Close modal first
    setShowConvertModal(false)
    setSelectedVisitor(null)
    
    // Update the visitor's lifecycle in local state to avoid page reload
    if (selectedVisitor) {
      setVisitors(prev => prev.map(visitor => 
        visitor.contact_id === selectedVisitor.contact_id 
          ? { 
              ...visitor, 
              contacts: visitor.contacts ? { 
                ...visitor.contacts, 
                lifecycle: 'member' 
              } : visitor.contacts 
            }
          : visitor
      ))
    }
  }

  const handleFollowUp = (visitor: Visitor) => {
    setSelectedVisitor(visitor)
    setShowFollowUpModal(true)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSavedFilter('all')
    setDateRangeFilter('all')
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const truncateText = (text: string | undefined, length: number = 30) => {
    if (!text) return ''
    return text.length > length ? `${text.substring(0, length)}...` : text
  }

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedVisitors(new Set(paginatedVisitors.map(visitor => visitor.contact_id)))
    } else {
      setSelectedVisitors(new Set())
    }
  }

  const handleSelectVisitor = (visitorId: string, checked: boolean | string) => {
    const isChecked = typeof checked === 'string' ? checked === 'true' : checked
    const newSelected = new Set(selectedVisitors)
    if (isChecked) {
      newSelected.add(visitorId)
    } else {
      newSelected.delete(visitorId)
      setSelectAll(false)
    }
    setSelectedVisitors(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedVisitors.size === 0) return
    
    const selectedVisitorsList = Array.from(selectedVisitors)
    const visitorNames = selectedVisitorsList.map(id => {
      const visitor = visitors.find(v => v.contact_id === id)
      return visitor ? `${visitor.contacts?.first_name || ''} ${visitor.contacts?.last_name || ''}`.trim() || 'Unknown' : 'Unknown'
    })

    const confirmMessage = `Are you sure you want to delete ${selectedVisitors.size} visitor${selectedVisitors.size > 1 ? 's' : ''}?\n\n${visitorNames.slice(0, 5).join(', ')}${visitorNames.length > 5 ? '\n...and ' + (visitorNames.length - 5) + ' more' : ''}`
    
    if (!confirm(confirmMessage)) return
    
    try {
      setIsBulkDeleting(true)
      
      let successCount = 0
      let failedVisitors: string[] = []
      
      for (const visitorId of selectedVisitorsList) {
        try {
          const { error } = await deleteVisitor(visitorId)
          if (error) {
            failedVisitors.push(visitorId)
            console.error(`Failed to delete visitor ${visitorId}:`, error)
          } else {
            successCount++
          }
        } catch (err) {
          failedVisitors.push(visitorId)
          console.error(`Error deleting visitor ${visitorId}:`, err)
        }
      }
      
      // Update local state to remove successfully deleted visitors
      setVisitors(prev => prev.filter(visitor => !selectedVisitorsList.includes(visitor.contact_id) || failedVisitors.includes(visitor.contact_id)))
      
      // Clear selection
      setSelectedVisitors(new Set())
      setSelectAll(false)
      
      // Show results
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} visitor${successCount > 1 ? 's' : ''} deleted successfully${failedVisitors.length > 0 ? `, ${failedVisitors.length} failed` : ''}`
        })
      }
      
      if (failedVisitors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Some deletions failed',
          description: `Failed to delete ${failedVisitors.length} visitor${failedVisitors.length > 1 ? 's' : ''}`
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete visitors')
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete visitors'
      })
    } finally {
      setIsBulkDeleting(false)
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Visitors</h2>
          <p className="text-slate-600">Fetching visitor data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Visitors Directory
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track and follow up with church visitors
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/people/visitors/new">
                  <Plus className="mr-2 h-5 w-5" /> Add New Visitor
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Total Visitors</p>
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
                <TrendingUp className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">All time visitors</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserPlus className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">New This Month</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.newThisMonth
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Recent visitors</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Heart className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Saved Visitors</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.savedCount
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Committed to faith</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Follow-ups Needed</p>
                  <p className="text-3xl font-bold">
                    {filteredVisitors.filter(v => !v.saved).length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Require attention</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Visitors</h2>
                <p className="text-slate-300">Find visitors by name, contact info, or status</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by name, email, phone, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Salvation Status
                </label>
                <Select value={savedFilter} onValueChange={setSavedFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Visitors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Visitors</SelectItem>
                    <SelectItem value="saved">Saved Visitors</SelectItem>
                    <SelectItem value="not-saved">Not Saved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Visit Date Range
                </label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                  style={{ color: 'rgb(15, 23, 42)' }}
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>
                Showing {startItem} to {endItem} of {filteredVisitors.length} visitors
                {filteredVisitors.length !== visitors.length && ` (filtered)`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>
                  Items per page:
                </span>
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-20 h-8 border border-slate-200 rounded-lg bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-8">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}

        {/* Enhanced Visitors Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Bulk Actions */}
          {selectedVisitors.size > 0 && (
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {selectedVisitors.size} visitor{selectedVisitors.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedVisitors(new Set())
                      setSelectAll(false)
                    }}
                  >
                    Clear Selection
                  </Button>
                  <RequirePermission permission="contacts:delete" fallback={null}>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={isBulkDeleting}
                    >
                      {isBulkDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Selected
                        </>
                      )}
                    </Button>
                  </RequirePermission>
                </div>
              </div>
            </div>
          )}
          
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 w-12">
                  <Checkbox
                    checked={selectAll && paginatedVisitors.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={paginatedVisitors.length === 0}
                  />
                </TableHead>
                <TableHead className="w-[80px] py-4 font-bold text-slate-700">Profile</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Name</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Contact</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">First Visit</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Saved?</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Notes</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVisitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No visitors found</h3>
                        <p className="text-slate-600">
                          {filteredVisitors.length === 0 && visitors.length > 0 
                            ? "No visitors match your search criteria."
                            : "No visitors found. Add your first visitor."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVisitors.map((visitor) => (
                  <TableRow key={visitor.contact_id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4 text-slate-600">
                      <Checkbox
                        checked={selectedVisitors.has(visitor.contact_id)}
                        onCheckedChange={(checked) => handleSelectVisitor(visitor.contact_id, checked)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <Avatar 
                        src={visitor.contacts?.profile_image} 
                        alt={`${visitor.contacts?.first_name} ${visitor.contacts?.last_name}`}
                        size="md"
                        className="border-2 border-slate-200 shadow-md mx-auto"
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800">
                        {visitor.contacts?.first_name} {visitor.contacts?.last_name}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="text-slate-600 text-sm">{visitor.contacts?.email}</div>
                        <div className="text-slate-600 text-sm">{visitor.contacts?.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {formatDate(visitor.first_visit)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={visitor.saved ? "default" : "secondary"} className={
                          visitor.saved 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-700"
                        }>
                          {visitor.saved ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                          {visitor.saved ? "Yes" : "No"}
                        </Badge>
                        {visitor.contacts?.lifecycle === 'member' && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <Users className="h-3 w-3 mr-1" />
                            Member
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600 max-w-[200px]">
                      {truncateText(visitor.notes)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/visitors/${visitor.contact_id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <RequirePermission permission="contacts:edit:all" fallback={null}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            asChild
                            className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                          >
                            <Link href={`/people/visitors/${visitor.contact_id}?mode=edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </RequirePermission>
                        
                        <RequirePermission permission="followups:create" fallback={null}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleFollowUp(visitor)}
                            className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                            title="Schedule Follow-up"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </RequirePermission>
                        
                        {visitor.contacts?.lifecycle !== 'member' && (
                          <RequirePermission permission="members:create" fallback={null}>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleConvertToMember(visitor)}
                              className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                              title="Convert to Member"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </RequirePermission>
                        )}
                        
                        <RequirePermission permission="contacts:delete" fallback={null}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(visitor.contact_id)}
                            className="hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </RequirePermission>
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 px-4">
            <div className="text-sm text-slate-600">
              Showing {startItem} to {endItem} of {filteredVisitors.length} visitors
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="rounded-lg px-3 py-1 text-sm"
              >
                First
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                      className="rounded-lg w-8 h-8 p-0 text-sm"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="rounded-lg px-3 py-1 text-sm"
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this visitor? This action cannot be undone.</p>
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

      {/* Convert to Member Modal */}
      {showConvertModal && selectedVisitor && (
        <ConvertToMemberModal
          open={showConvertModal}
          onOpenChange={setShowConvertModal}
          contactId={selectedVisitor.contact_id}
          contactName={`${selectedVisitor.contacts?.first_name} ${selectedVisitor.contacts?.last_name}`}
          onSuccess={handleConvertSuccess}
        />
      )}

      {/* Follow Up Modal */}
      {showFollowUpModal && selectedVisitor && (
        <FollowUpModal
          open={showFollowUpModal}
          onOpenChange={setShowFollowUpModal}
          contactId={selectedVisitor.contact_id}
          contactName={`${selectedVisitor.contacts?.first_name} ${selectedVisitor.contacts?.last_name}`}
        />
      )}
    </div>
  )
}

export default function VisitorsPage() {
  return (
    <ProtectedRoute requiredPermissions={['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned']}>
      <VisitorsPageContent />
    </ProtectedRoute>
  )
} 