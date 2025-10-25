'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Loader2, Pencil, Trash2, Search, Filter, X, RefreshCw, FileText, Mail, MessageSquare, BellRing, Activity, Sparkles, Copy, Eye, Send } from 'lucide-react'
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
import { CommsTemplate, fetchTemplates, deleteTemplate } from '@/services/comms/templates'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export default function UnifiedTemplatesPage() {
  const [templates, setTemplates] = useState<CommsTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<CommsTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<CommsTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Load templates
  const loadTemplates = async () => {
    setLoading(true)
    try {
      console.log('Fetching templates...')
      const { data, error } = await fetchTemplates()
      
      if (error) {
        console.error('Error fetching templates:', error)
        throw error
      }
      
      console.log('Templates loaded:', data)
      setTemplates(data || [])
      setFilteredTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load templates. Please try again.'
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const refreshData = () => {
    setIsRefreshing(true)
    loadTemplates()
  }
  
  // Apply filters when search or channel filter changes
  useEffect(() => {
    let filtered = [...templates]
    
    // Apply channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter(template => template.channel === channelFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        (template.subject || '').toLowerCase().includes(query)
      )
    }
    
    setFilteredTemplates(filtered)
  }, [templates, searchQuery, channelFilter])

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery !== '' || channelFilter !== 'all'
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('')
    setChannelFilter('all')
  }
  
  // Handle delete template
  const handleDelete = (template: CommsTemplate) => {
    setTemplateToDelete(template)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!templateToDelete) return
    
    setDeleting(true)
    
    try {
      const { success, error } = await deleteTemplate(templateToDelete.id)
      
      if (!success) throw error
      
      // Remove from local state
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id))
      
      toast({
        title: 'Template deleted',
        description: `Template "${templateToDelete.name}" has been deleted.`
      })
      
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete template. Please try again.'
      })
    } finally {
      setDeleting(false)
      setTemplateToDelete(null)
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
        return <FileText className="h-4 w-4" />
    }
  }
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return 'Invalid date'
    }
  }

  // Get channel metrics
  const getChannelMetrics = () => {
    const metrics = {
      total: templates.length,
      email: templates.filter(t => t.channel === 'email').length,
      sms: templates.filter(t => t.channel === 'sms').length,
      whatsapp: templates.filter(t => t.channel === 'whatsapp').length,
      push: templates.filter(t => t.channel === 'push').length
    }
    return metrics
  }

  const metrics = getChannelMetrics()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Templates</h2>
          <p className="text-slate-600">Fetching communication templates...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Communications Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl">
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
                    "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                  )}
                >
                  <FileText className="h-5 w-5" />
                  Templates
                </Link>
                <Link
                  href="/comms/campaigns"
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200",
                    "text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-md"
                  )}
                >
                  <Send className="h-5 w-5" />
                  Campaigns
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Templates Section Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Communication Templates
              </h2>
              <p className="text-lg text-slate-600 mt-2">
                Create and manage templates for all communication channels
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-xl px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/comms/templates/new?channel=email">
                      <Mail className="mr-2 h-4 w-4" />
                      Email Template
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/comms/templates/new?channel=sms">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      SMS Template
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/comms/templates/new?channel=whatsapp">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      WhatsApp Template
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/comms/templates/new?channel=push">
                      <BellRing className="mr-2 h-4 w-4" />
                      Push Notification Template
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Total Templates</p>
                  <p className="text-3xl font-bold">{metrics.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">All channels</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Email</p>
                  <p className="text-3xl font-bold">{metrics.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Email templates</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm font-medium">SMS</p>
                  <p className="text-3xl font-bold">{metrics.sms}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-200" />
                <span className="text-green-100 text-sm font-medium">SMS templates</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">WhatsApp</p>
                  <p className="text-3xl font-bold">{metrics.whatsapp}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">WhatsApp templates</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BellRing className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-indigo-100 text-sm font-medium">Push</p>
                  <p className="text-3xl font-bold">{metrics.push}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-200" />
                <span className="text-indigo-100 text-sm font-medium">Push templates</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Templates</h2>
                <p className="text-slate-300">Find templates by name, channel, or content</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  type="search"
                  placeholder="Search templates..."
                  className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-12 w-48 border-2 border-slate-200 rounded-xl bg-white/50">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="push">Push Notifications</SelectItem>
                </SelectContent>
              </Select>
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

        {/* Enhanced Templates Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">
                  {hasActiveFilters() 
                    ? `Filtered Templates (${filteredTemplates.length})`
                    : `All Templates (${templates.length})`}
                </h3>
              </div>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-[200px]" />
                    <Skeleton className="h-12 w-[100px]" />
                    <Skeleton className="h-12 w-[150px]" />
                    <Skeleton className="h-12 w-[120px]" />
                    <Skeleton className="h-12 w-[100px]" />
                  </div>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Templates Found</h3>
                <p className="text-slate-600 mb-6">
                  {templates.length === 0 
                    ? "Start by creating your first communication template."
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="rounded-xl px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/comms/templates/new?channel=email">
                          <Mail className="mr-2 h-4 w-4" />
                          Email Template
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/comms/templates/new?channel=sms">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          SMS Template
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/comms/templates/new?channel=whatsapp">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          WhatsApp Template
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/comms/templates/new?channel=push">
                          <BellRing className="mr-2 h-4 w-4" />
                          Push Notification Template
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
                  <TableRow>
                    <TableHead className="py-4 font-bold text-slate-700">Template Name</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Channel</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Subject/Title</TableHead>
                    <TableHead className="py-4 font-bold text-slate-700">Updated</TableHead>
                    <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow 
                      key={template.id}
                      className="cursor-pointer hover:bg-white/80 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(template.channel)}
                          <span className="font-semibold text-slate-800">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {getChannelBadge(template.channel)}
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-slate-800">
                          {template.subject || 'No subject'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-slate-600">
                          {formatRelativeTime(template.updated_at)}
                        </span>
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
                              <Link href={`/comms/templates/${template.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                              <Link href={`/comms/templates/${template.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(template.body)
                                toast({
                                  title: 'Template copied',
                                  description: 'Template content copied to clipboard'
                                })
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Content
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => handleDelete(template)}
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
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Delete Template</DialogTitle>
              <DialogDescription className="text-slate-600">
                Are you sure you want to delete the template "{templateToDelete?.name}"?
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
                  'Delete Template'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 