'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  UserPlus, 
  Filter,
  Search, 
  Loader2, 
  Eye, 
  Pencil, 
  Trash2, 
  UserCheck, 
  Users,
  RefreshCw, 
  UserCog,
  Plus,
  TrendingUp,
  Activity,
  Sparkles,
  Heart,
  Target,
  FileText
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
import { FollowUpModal } from '@/components/FollowUpModal'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { 
  SoulWinning, 
  fetchSouls,
  deleteSoul,
  getSoulWinningMetrics,
  convertSoulToVisitor,
  convertSoulToMember
} from '@/services/soulWinning'

export default function SoulWinningPage() {
  // State
  const [souls, setSouls] = useState<SoulWinning[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSaved, setFilterSaved] = useState<string>('all')
  const [filterInviter, setFilterInviter] = useState<string>('all')
  

  
  // Metrics state
  const [metrics, setMetrics] = useState({
    totalSouls: 0,
    totalSaved: 0,
    totalConvertedToVisitor: 0,
    totalConvertedToMember: 0,
    visitorConversionRate: 0,
    memberConversionRate: 0,
    pendingFollowUps: 0,
    byInviterType: {} as Record<string, number>,
    loading: true
  })
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingSoul, setDeletingSoul] = useState<SoulWinning | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Convert confirmation states
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [convertingTo, setConvertingTo] = useState<'visitor' | 'member' | null>(null)
  const [convertingSoul, setConvertingSoul] = useState<SoulWinning | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  
  // Follow-up modal states
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedSoul, setSelectedSoul] = useState<SoulWinning | null>(null)
  
  // Bulk actions state
  const [selectedSouls, setSelectedSouls] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkConverting, setIsBulkConverting] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showBulkConvertDialog, setShowBulkConvertDialog] = useState(false)
  const [bulkConvertTo, setBulkConvertTo] = useState<'visitor' | 'member'>('visitor')
  
  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getSoulWinningMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Fetch souls (load all for client-side pagination)
        const { data, error } = await fetchSouls(1, 1000) // Load more data for client-side pagination
        
        if (error) throw error
        
        console.log('Loaded souls:', data)
        setSouls((data || []) as unknown as SoulWinning[])
      } catch (err) {
        console.error('Failed to load soul winning data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load soul winning data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, []) // Remove dependency on pagination variables since we now use client-side pagination
  
  // Filter souls based on search query and filters
  const filteredSouls = souls.filter(soul => {
    // Use the renamed field for contacts
    const contactsField = soul.contacts ?? null;
    
    // Check if it matches search query
    const matchesSearch = searchQuery.trim() === '' || 
      (contactsField && 
        (`${contactsField.first_name || ''} ${contactsField.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contactsField.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
      ) ||
      (soul.inviter_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (soul.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if it matches saved filter
    const matchesSaved = filterSaved === 'all' || 
      (filterSaved === 'saved' && soul.saved) ||
      (filterSaved === 'unsaved' && !soul.saved);
    
    // Check if it matches inviter filter
    const matchesInviter = filterInviter === 'all' || soul.inviter_type === filterInviter;
    
    return matchesSearch && matchesSaved && matchesInviter;
  });

  // Use new pagination hook
  const pagination = usePagination(filteredSouls, 20)
  
  // Get unique inviter types for filter
  const inviterTypes = Array.from(new Set(souls.map(soul => soul.inviter_type)))
    .filter(Boolean)
    .sort();
  
  // Handle delete
  const openDeleteDialog = (soul: SoulWinning) => {
    setDeletingSoul(soul)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deletingSoul) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deleteSoul(deletingSoul.contact_id)
      
      if (error) throw error
      
      // Remove deleted soul from state
      setSouls(souls.filter(s => s.contact_id !== deletingSoul.contact_id))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalSouls: Math.max(0, prev.totalSouls - 1),
        totalSaved: deletingSoul.saved 
          ? Math.max(0, prev.totalSaved - 1) 
          : prev.totalSaved
      }))
      
      toast({
        title: 'Success',
        description: 'Soul winning record deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete soul winning record:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete soul winning record'
      })
    } finally {
      setIsDeleting(false)
      setDeletingSoul(null)
    }
  }
  
  // Handle convert
  const openConvertDialog = (soul: SoulWinning, convertTo: 'visitor' | 'member') => {
    setConvertingSoul(soul)
    setConvertingTo(convertTo)
    setShowConvertDialog(true)
  }
  
  const confirmConvert = async () => {
    if (!convertingSoul || !convertingTo) return
    
    try {
      setIsConverting(true)
      
      let response
      if (convertingTo === 'visitor') {
        response = await convertSoulToVisitor(convertingSoul.contact_id)
      } else {
        response = await convertSoulToMember(convertingSoul.contact_id)
      }
      
      if (response.error) throw response.error
      
      // Update the soul's converted_to status
      setSouls(souls.map(soul => 
        soul.contact_id === convertingSoul.contact_id 
          ? { ...soul, converted_to: convertingTo }
          : soul
      ))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        [`totalConvertedTo${convertingTo === 'visitor' ? 'Visitor' : 'Member'}`]: 
          prev[`totalConvertedTo${convertingTo === 'visitor' ? 'Visitor' : 'Member'}` as keyof typeof prev] as number + 1,
      }))
      
      setShowConvertDialog(false)
      setConvertingSoul(null)
      setConvertingTo(null)
      
      toast({
        title: 'Success',
        description: `Soul winning record converted to ${convertingTo} successfully`
      })
    } catch (err) {
      console.error('Failed to convert soul:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to convert to ${convertingTo}`
      })
    } finally {
      setIsConverting(false)
    }
  }
  
  const handleFollowUp = (soul: SoulWinning) => {
    setSelectedSoul(soul)
    setShowFollowUpModal(true)
  }
  
  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedSouls(new Set(filteredSouls.map(soul => soul.contact_id)))
    } else {
      setSelectedSouls(new Set())
    }
  }
  
  const handleSelectSoul = (soulId: string, checked: boolean) => {
    const newSelected = new Set(selectedSouls)
    if (checked) {
      newSelected.add(soulId)
    } else {
      newSelected.delete(soulId)
      setSelectAll(false)
    }
    setSelectedSouls(newSelected)
    
    // Update select all state
    if (newSelected.size === filteredSouls.length) {
      setSelectAll(true)
    }
  }
  
  const handleBulkDelete = async () => {
    try {
      setIsBulkDeleting(true)
      const selectedArray = Array.from(selectedSouls)
      
      // Delete all selected souls
      for (const soulId of selectedArray) {
        const { error } = await deleteSoul(soulId)
        if (error) throw error
      }
      
      // Remove deleted souls from state
      setSouls(souls.filter(soul => !selectedSouls.has(soul.contact_id)))
      setSelectedSouls(new Set())
      setSelectAll(false)
      setShowBulkDeleteDialog(false)
      
      toast({
        title: 'Success',
        description: `${selectedArray.length} soul winning record(s) deleted successfully`
      })
    } catch (err) {
      console.error('Failed to bulk delete souls:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete some records'
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }
  
  const handleBulkConvert = async () => {
    try {
      setIsBulkConverting(true)
      const selectedArray = Array.from(selectedSouls)
      let successCount = 0
      
      // Convert all selected souls
      for (const soulId of selectedArray) {
        try {
          if (bulkConvertTo === 'visitor') {
            const { error } = await convertSoulToVisitor(soulId)
            if (error) throw error
          } else {
            const { error } = await convertSoulToMember(soulId)
            if (error) throw error
          }
          successCount++
        } catch (err) {
          console.error(`Failed to convert soul ${soulId}:`, err)
        }
      }
      
      // Refresh the data
      const { data, error, count } = await fetchSouls(currentPage, pageSize)
      if (!error) {
        setSouls((data || []) as unknown as SoulWinning[])
        setTotalCount(count || 0)
      }
      
      setSelectedSouls(new Set())
      setSelectAll(false)
      setShowBulkConvertDialog(false)
      
      toast({
        title: 'Success',
        description: `${successCount} soul(s) converted to ${bulkConvertTo}(s) successfully`
      })
    } catch (err) {
      console.error('Failed to bulk convert souls:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert some records'
      })
    } finally {
      setIsBulkConverting(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Soul Winning</h2>
          <p className="text-slate-600">Fetching soul winning data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-2xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Soul Winning
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track evangelism efforts and spiritual decisions
                </p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
            >
              <Link href="/people/outreach/soul-winning/new">
                <Plus className="mr-2 h-5 w-5" /> Record Soul Winning
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Heart className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-red-100 text-sm font-medium">Total Souls</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalSouls
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-200" />
                <span className="text-red-100 text-sm font-medium">All records</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Saved Souls</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalSaved
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Decisions for Christ</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserPlus className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Converted to Visitors</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalConvertedToVisitor
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Visiting church</span>
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
                  <p className="text-purple-100 text-sm font-medium">Converted to Members</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalConvertedToMember
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Church members</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Soul Winning</h2>
                <p className="text-slate-300">Find soul winning records by contact or status</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by name, email, inviter, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Salvation Status
                </label>
                <Select value={filterSaved} onValueChange={setFilterSaved}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="unsaved">Not Saved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Inviter Type
                </label>
                <Select value={filterInviter} onValueChange={setFilterInviter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {inviterTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterSaved('all')
                    setFilterInviter('all')
                  }}
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
                Showing {filteredSouls.length} of {souls.length} records
                {filteredSouls.length !== souls.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedSouls.size > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedSouls.size} soul winning record(s) selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowBulkConvertDialog(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  Convert
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
                    setSelectedSouls(new Set())
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

        {/* Enhanced Soul Winning Table */}
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
                <TableHead className="py-4 font-bold text-slate-700">Contact</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Inviter</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Date</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Saved?</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSouls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <Heart className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No soul winning records found</h3>
                        <p className="text-slate-600">
                          {souls.length === 0 
                            ? "No records found. Record your first soul winning effort."
                            : "No records match your search criteria."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSouls.map((soul) => (
                  <TableRow key={soul.contact_id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <Checkbox
                        checked={selectedSouls.has(soul.contact_id)}
                        onCheckedChange={(checked) => handleSelectSoul(soul.contact_id, checked)}
                        aria-label={`Select ${soul.contacts ? `${soul.contacts.first_name} ${soul.contacts.last_name}` : 'contact'}`}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800">
                        {soul.contacts ? 
                          `${soul.contacts.first_name || ''} ${soul.contacts.last_name || ''}`.trim() || 'Unknown Contact' 
                          : 'Unknown Contact'
                        }
                      </div>
                      {soul.contacts?.email && (
                        <div className="text-slate-600 text-sm">{soul.contacts.email}</div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-800">{soul.inviter_name}</div>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 mt-1">
                        {soul.inviter_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {formatDate(soul.created_at)}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={soul.saved ? "default" : "secondary"} 
                        className={
                          soul.saved 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-700"
                        }
                      >
                        {soul.saved ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        {soul.converted_to === 'visitor' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                            Visitor
                          </Badge>
                        )}
                        {soul.converted_to === 'member' && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                            Member
                          </Badge>
                        )}
                        {!soul.converted_to && (
                          <span className="text-slate-500 text-sm">Not converted</span>
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
                          <Link href={`/people/outreach/soul-winning/${soul.contact_id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/outreach/soul-winning/${soul.contact_id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleFollowUp(soul)}
                          className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                          title="Schedule Follow-up"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        {/* Conversion Options Dropdown */}
                        {!soul.converted_to && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-amber-50 hover:text-amber-600 rounded-lg text-slate-600"
                                title="Convert to..."
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem 
                                onClick={() => openConvertDialog(soul, 'visitor')}
                                className="flex items-center gap-2"
                              >
                                <UserPlus className="h-4 w-4 text-blue-600" />
                                Convert to Visitor
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openConvertDialog(soul, 'member')}
                                className="flex items-center gap-2"
                              >
                                <UserCog className="h-4 w-4 text-purple-600" />
                                Convert to Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        
                        {/* Show progression option for visitors */}
                        {soul.converted_to === 'visitor' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openConvertDialog(soul, 'member')}
                            className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                            title="Convert to Member"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteDialog(soul)}
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
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this soul winning record? This action cannot be undone.</p>
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

      {/* Enhanced Convert Confirmation Dialog */}
      {showConvertDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                Convert to {convertingTo === 'visitor' ? 'Visitor' : 'Member'}
              </h3>
              <p className="text-sm text-slate-600 mt-2">
                {convertingTo === 'visitor' ? (
                  <>This will create a visitor record and update their lifecycle status. They can then be converted to a member later.</>
                ) : convertingSoul?.converted_to === 'visitor' ? (
                  <>This will promote this visitor to a member and update their lifecycle status.</>
                ) : (
                  <>This will create a member record directly and update their lifecycle status.</>
                )}
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowConvertDialog(false)}
                disabled={isConverting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmConvert}
                disabled={isConverting}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  `Convert to ${convertingTo === 'visitor' ? 'Visitor' : 'Member'}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {showFollowUpModal && selectedSoul && (
        <FollowUpModal
          open={showFollowUpModal}
          onOpenChange={setShowFollowUpModal}
          contactId={selectedSoul.contact_id}
          contactName={selectedSoul.contacts ? 
            `${selectedSoul.contacts.first_name || ''} ${selectedSoul.contacts.last_name || ''}`.trim() || 'Unknown Contact' 
            : 'Unknown Contact'
          }
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {showBulkDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Bulk Delete</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to delete {selectedSouls.size} soul winning record(s)? This action cannot be undone.
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
                  `Delete ${selectedSouls.size} Record(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Convert Confirmation Dialog */}
      {showBulkConvertDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Bulk Convert Souls</h3>
              <p className="text-sm text-slate-600 mt-2">
                Convert {selectedSouls.size} soul(s) to {bulkConvertTo}(s). This will update their lifecycle status.
              </p>
            </div>
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-700 mb-3 block">
                Convert To
              </label>
              <Select value={bulkConvertTo} onValueChange={(value: 'visitor' | 'member') => setBulkConvertTo(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkConvertDialog(false)}
                disabled={isBulkConverting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkConvert}
                disabled={isBulkConverting}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {isBulkConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  `Convert ${selectedSouls.size} Soul(s)`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 