'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Loader2, 
  Pencil, 
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  Mail,
  MessageSquare,
  BellRing,
  Send,
  Download,
  RefreshCw,
  X,
  Zap,
  Target,
  Activity,
  Sparkles,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import { Pagination } from '@/components/ui/pagination'
import { usePagination } from '@/hooks/usePagination'
import { MetricCard } from '@/components/MetricCard'
import { cn } from '@/lib/utils'
import { 
  CommsCampaign,
  fetchCampaigns, 
  deleteCampaign, 
  sendCampaignNow,
  getCommsMetrics,
  GlobalCommsMetrics,
  getCampaignRecipientCount
} from '@/services/comms/campaigns'
import { format, formatDistanceToNow } from 'date-fns'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CommsCampaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CommsCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Recipient counts state
  const [recipientCounts, setRecipientCounts] = useState<Record<string, number>>({})
  
  // Metrics state
  const [metrics, setMetrics] = useState<GlobalCommsMetrics>({
    total_campaigns: 0,
    active_campaigns: 0,
    scheduled_campaigns: 0,
    completed_campaigns: 0,
    total_templates: 0,
    email_templates: 0,
    sms_templates: 0,
    whatsapp_templates: 0,
    push_templates: 0
  })
  const [metricsLoading, setMetricsLoading] = useState(true)
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<CommsCampaign | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Send now dialog state
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [campaignToSend, setCampaignToSend] = useState<CommsCampaign | null>(null)
  const [sending, setSending] = useState(false)
  
  // Pagination
  const pagination = usePagination(filteredCampaigns, {
    initialPageSize: 20,
    totalItems: filteredCampaigns.length
  })
  
  // Load campaigns and metrics
  const loadData = async () => {
    setLoading(true)
    setMetricsLoading(true)
    
    try {
      // Load campaigns
      const { data, error } = await fetchCampaigns()
      
      if (error) throw error
      
      setCampaigns(data || [])
      setFilteredCampaigns(data || [])
      
      // Load recipient counts for each campaign
      if (data && data.length > 0) {
        console.log('Loading recipient counts for', data.length, 'campaigns');
        const counts: Record<string, number> = {}
        await Promise.all(
          data.map(async (campaign) => {
            const { count } = await getCampaignRecipientCount(campaign.id)
            counts[campaign.id] = count
            console.log(`Campaign ${campaign.name} (${campaign.id}) has ${count} recipients`);
          })
        )
        console.log('Final recipient counts:', counts);
        setRecipientCounts(counts)
      }
      
      // Load metrics
      const { data: metricsData, error: metricsError } = await getCommsMetrics()
      
      if (metricsError) throw metricsError
      if (metricsData) {
        setMetrics(metricsData)
      }
    } catch (error) {
      console.error('Failed to load campaigns data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load campaigns data. Please try again.'
      })
    } finally {
      setLoading(false)
      setMetricsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const refreshData = () => {
    setIsRefreshing(true)
    loadData()
  }
  
  // Apply filters when search, channel or status filter changes
  useEffect(() => {
    let filtered = [...campaigns]
    
    // Apply channel filter - campaigns table might not have a direct channel field
    // Skip channel filtering for now since the structure has changed
    if (channelFilter !== 'all') {
      // If channel is part of another field or we need to keep track of it differently,
      // this would need to be updated based on the actual data structure
      // filtered = filtered.filter(campaign => campaign.channel === channelFilter)
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(query) ||
        (campaign.template?.subject || '').toLowerCase().includes(query)
      )
    }
    
    setFilteredCampaigns(filtered)
  }, [campaigns, searchQuery, channelFilter, statusFilter])

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery !== '' || channelFilter !== 'all' || statusFilter !== 'all'
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setChannelFilter('all')
    setStatusFilter('all')
  }
  
  // Handle delete campaign
  const handleDelete = (campaign: CommsCampaign) => {
    setCampaignToDelete(campaign)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!campaignToDelete) return
    
    setDeleting(true)
    
    try {
      const { success, error } = await deleteCampaign(campaignToDelete.id)
      
      if (!success) throw error
      
      // Remove from local state
      setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id))
      
      toast({
        title: 'Campaign deleted',
        description: `Campaign "${campaignToDelete.name}" has been deleted.`
      })
      
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete campaign. Please try again.'
      })
    } finally {
      setDeleting(false)
      setCampaignToDelete(null)
    }
  }
  
  // Handle send campaign now
  const handleSendNow = (campaign: CommsCampaign) => {
    setCampaignToSend(campaign)
    setShowSendDialog(true)
  }
  
  const confirmSend = async () => {
    if (!campaignToSend) return
    
    setSending(true)
    
    try {
      const { success, error } = await sendCampaignNow(campaignToSend.id)
      
      if (!success) throw error
      
      // Update status in local state
      setCampaigns(prev => prev.map(c => 
        c.id === campaignToSend.id ? { ...c, status: 'sending' } : c
      ))
      
      toast({
        title: 'Campaign sending',
        description: `Campaign "${campaignToSend.name}" is now being sent.`
      })
      
      setShowSendDialog(false)
    } catch (error) {
      console.error('Failed to send campaign:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send campaign. Please try again.'
      })
    } finally {
      setSending(false)
      setCampaignToSend(null)
    }
  }
  
  // Get badge color for channel
  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Email</Badge>
      case 'sms':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">SMS</Badge>
      case 'whatsapp':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">WhatsApp</Badge>
      case 'push':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Push</Badge>
      default:
        return <Badge>{channel}</Badge>
    }
  }
  
  // Get badge color for status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Scheduled</Badge>
      case 'sending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Sending</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  // Format date-time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'
    try {
      return format(new Date(dateString), 'PPp') // e.g., "Apr 29, 2023, 5:00 PM"
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  // Get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <BellRing className="h-4 w-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-amber-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Campaigns</h2>
          <p className="text-slate-600">Fetching campaign data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Communications Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-2xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Communications
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage your email, SMS, WhatsApp and push notification communications
                </p>
              </div>
            </div>
          </div>

          {/* Communication Tabs */}
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                <Link
                  href="/comms/templates"
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                    "text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-md"
                  )}
                >
                  <FileText className="h-5 w-5" />
                  Templates
                </Link>
                <Link
                  href="/comms/campaigns"
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                    "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                  )}
                >
                  <Send className="h-5 w-5" />
                  Campaigns
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Campaigns Section Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Communication Campaigns
              </h2>
              <p className="text-lg text-slate-600 mt-2">
                Create and manage campaigns across all communication channels
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={refreshData} 
                disabled={isRefreshing}
                className="rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button 
                asChild
                className="rounded-xl px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                <Link href="/comms/campaigns/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Send className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-medium">Total Campaigns</p>
                  <p className="text-3xl font-bold">
                    {metricsLoading ? (
                      <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      metrics.total_campaigns.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-200" />
                <span className="text-orange-100 text-sm font-medium">All campaigns</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Pencil className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Active/Draft</p>
                  <p className="text-3xl font-bold">
                    {metricsLoading ? (
                      <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      metrics.active_campaigns.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">In progress</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-yellow-100 text-sm font-medium">Scheduled</p>
                  <p className="text-3xl font-bold">
                    {metricsLoading ? (
                      <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      metrics.scheduled_campaigns.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-yellow-200" />
                <span className="text-yellow-100 text-sm font-medium">Upcoming</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Send className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">
                    {metricsLoading ? (
                      <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      metrics.completed_campaigns.toLocaleString()
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-200" />
                <span className="text-green-100 text-sm font-medium">Delivered</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Campaigns</h2>
                <p className="text-slate-300">Find campaigns by name, status, or channel</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="search"
                  placeholder="Search campaigns..."
                  className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="h-12 w-40 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 w-40 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap gap-3 mb-6">
                {searchQuery && (
                  <Badge className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    Search: {searchQuery}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchQuery('')}
                    />
                  </Badge>
                )}
                {channelFilter !== 'all' && (
                  <Badge className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    Channel: {channelFilter}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setChannelFilter('all')}
                    />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white">
                    Status: {statusFilter}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setStatusFilter('all')}
                    />
                  </Badge>
                )}
                <Badge 
                  className="flex items-center gap-2 cursor-pointer hover:bg-red-500 bg-gradient-to-r from-red-400 to-red-500 text-white"
                  onClick={resetFilters}
                >
                  Clear All Filters
                  <X className="h-3 w-3" />
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Campaigns Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {hasActiveFilters() 
                    ? `Filtered Campaigns (${filteredCampaigns.length})`
                    : `All Campaigns (${campaigns.length})`}
                </h3>
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-[200px]" />
                    <Skeleton className="h-12 w-[100px]" />
                    <Skeleton className="h-12 w-[100px]" />
                    <Skeleton className="h-12 w-[100px]" />
                    <Skeleton className="h-12 w-[150px]" />
                    <Skeleton className="h-12 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Send className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Campaigns Found</h3>
                <p className="text-slate-600 mb-6">
                  {campaigns.length === 0 
                    ? "Start by creating your first campaign."
                    : "Try adjusting your filters or search term."}
                </p>
                {hasActiveFilters() ? (
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="rounded-xl px-6"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button 
                    asChild
                    className="rounded-xl px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    <Link href="/comms/campaigns/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
                  <TableRow>
                    <TableHead className="py-4 font-bold text-slate-700">Campaign Name</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Channel</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Recipients</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Scheduled For</TableHead>
                    <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginatedData.map((campaign) => (
                    <TableRow 
                      key={campaign.id}
                      className="cursor-pointer hover:bg-white/80 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div>
                          <div className="font-semibold text-slate-800">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-slate-600">
                            {campaign.template?.subject || "No subject"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(campaign.channel || 'email')}
                          {getChannelBadge(campaign.channel || 'email')}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(campaign.status)}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-800">
                            {recipientCounts[campaign.id] || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-800">
                            {campaign.scheduled_at
                              ? format(new Date(campaign.scheduled_at), 'PPp')
                              : 'Not scheduled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-lg hover:bg-slate-100 text-slate-700">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/comms/campaigns/${campaign.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            
                            {campaign.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleSendNow(campaign)}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Send Now
                              </DropdownMenuItem>
                            )}
                            
                            {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(campaign)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {/* Pagination */}
            {filteredCampaigns.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.pageSize}
                onPageChange={pagination.setCurrentPage}
                onItemsPerPageChange={pagination.setPageSize}
              />
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Delete Campaign</DialogTitle>
              <DialogDescription className="text-slate-600">
                Are you sure you want to delete the campaign "{campaignToDelete?.name}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-xl"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Send Now Confirmation Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Send Campaign Now</DialogTitle>
              <DialogDescription className="text-slate-600">
                Are you sure you want to send the campaign "{campaignToSend?.name}" immediately?
                This will send to all recipients and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowSendDialog(false)}
                disabled={sending}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmSend}
                disabled={sending}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 