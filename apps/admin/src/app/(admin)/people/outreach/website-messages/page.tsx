'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Mail,
  Phone,
  User,
  Calendar,
  Filter,
  Search,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Archive,
  AlertTriangle,
  Clock,
  UserCheck,
  Loader2,
  TrendingUp,
  Activity,
  Sparkles,
  Plus,
  RefreshCw
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import {
  WebsiteMessage,
  WebsiteMessageMetrics,
  fetchWebsiteMessages,
  deleteWebsiteMessage,
  markMessageAsRead,
  markMessageAsResponded,
  archiveMessage,
  assignMessage,
  getWebsiteMessagesMetrics
} from '@/services/websiteMessages'
import { Pagination, usePagination } from '@/components/ui/pagination'

export default function WebsiteMessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<WebsiteMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<WebsiteMessage | null>(null)
  const [responseNotes, setResponseNotes] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Checkbox selection state
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isBulkArchiving, setIsBulkArchiving] = useState(false)
  
  // Metrics state
  const [metrics, setMetrics] = useState<WebsiteMessageMetrics>({
    totalMessages: 0,
    unreadMessages: 0,
    respondedToday: 0,
    highPriorityMessages: 0,
    loading: true
  })

  // Load messages data
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Load all messages for client-side pagination
        const { data, error } = await fetchWebsiteMessages(1, 1000)
        if (error) throw error
        
        const messageData = data as unknown as WebsiteMessage[] || []
        
        console.log('Website messages data:', messageData)
        
        setMessages(messageData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load website messages')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load website messages'
        })
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [])

  // Load metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const metricsData = await getWebsiteMessagesMetrics()
        setMetrics(metricsData)
      } catch (err) {
        console.error('Failed to load metrics:', err)
      }
    }

    loadMetrics()
  }, [])

  // Apply filters and create filtered dataset
  const filteredMessages = useMemo(() => {
    if (!messages.length) return []
    
    let filtered = [...messages]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(message => 
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        (message.subject || '').toLowerCase().includes(query) ||
        message.message.toLowerCase().includes(query) ||
        (message.category || '').toLowerCase().includes(query)
      )
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(message => message.status === statusFilter)
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(message => message.priority === priorityFilter)
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(message => message.category === categoryFilter)
    }
    
    return filtered
  }, [messages, searchQuery, statusFilter, priorityFilter, categoryFilter])

  // Use new pagination hook
  const pagination = usePagination(filteredMessages, 10)

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      const { error } = await deleteWebsiteMessage(deleteId)
      if (error) throw error

      // Remove message from local state
      setMessages(prev => prev.filter(message => message.id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Message deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await markMessageAsRead(id)
      if (error) throw error

      // Update message in local state
      setMessages(prev => prev.map(message => 
        message.id === id ? { ...message, status: 'read' } : message
      ))
      
      toast({
        title: 'Success',
        description: 'Message marked as read'
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark message as read'
      })
    }
  }

  const handleRespond = (message: WebsiteMessage) => {
    setSelectedMessage(message)
    setResponseNotes('')
    setShowResponseDialog(true)
  }

  const confirmRespond = async () => {
    if (!selectedMessage || !responseNotes.trim()) return

    try {
      setIsResponding(true)
      const { error } = await markMessageAsResponded(selectedMessage.id, responseNotes)
      if (error) throw error

      // Update message in local state
      setMessages(prev => prev.map(message => 
        message.id === selectedMessage.id 
          ? { 
              ...message, 
              status: 'responded', 
              response_notes: responseNotes,
              responded_at: new Date().toISOString()
            } 
          : message
      ))
      
      toast({
        title: 'Success',
        description: 'Response recorded successfully'
      })
      
      setShowResponseDialog(false)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record response'
      })
    } finally {
      setIsResponding(false)
      setSelectedMessage(null)
      setResponseNotes('')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const { error } = await archiveMessage(id)
      if (error) throw error

      // Update message in local state
      setMessages(prev => prev.map(message => 
        message.id === id ? { ...message, status: 'archived' } : message
      ))
      
      toast({
        title: 'Success',
        description: 'Message archived successfully'
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to archive message'
      })
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCategoryFilter('all')
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a')
    } catch {
      return 'Invalid date'
    }
  }

  const truncateText = (text: string | undefined, length: number = 50) => {
    if (!text) return ''
    return text.length > length ? `${text.substring(0, length)}...` : text
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800 border-red-200'
      case 'read': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'responded': return 'bg-green-100 text-green-800 border-green-200'
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedMessages(new Set(pagination.currentItems.map(message => message.id)))
    } else {
      setSelectedMessages(new Set())
    }
  }

  const handleSelectMessage = (messageId: string, checked: boolean) => {
    const newSelected = new Set(selectedMessages)
    if (checked) {
      newSelected.add(messageId)
    } else {
      newSelected.delete(messageId)
      setSelectAll(false)
    }
    setSelectedMessages(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0) return
    
    const selectedMessagesList = Array.from(selectedMessages)
    const messageNames = selectedMessagesList.map(id => {
      const message = messages.find(m => m.id === id)
      return message ? `${message.name} (${message.subject || 'No subject'})` : 'Unknown'
    })

    const confirmMessage = `Are you sure you want to delete ${selectedMessages.size} message${selectedMessages.size > 1 ? 's' : ''}?\n\n${messageNames.slice(0, 3).join(', ')}${messageNames.length > 3 ? '\n...and ' + (messageNames.length - 3) + ' more' : ''}`
    
    if (!confirm(confirmMessage)) return
    
    try {
      setIsBulkDeleting(true)
      
      let successCount = 0
      let failedMessages: string[] = []
      
      for (const messageId of selectedMessagesList) {
        try {
          const { error } = await deleteWebsiteMessage(messageId)
          if (error) throw error
          successCount++
        } catch (error) {
          const message = messages.find(m => m.id === messageId)
          const name = message ? `${message.name} (${message.subject || 'No subject'})` : 'Unknown'
          failedMessages.push(name)
        }
      }
      
      // Remove successfully deleted messages from state
      setMessages(prev => prev.filter(message => !selectedMessagesList.includes(message.id) || failedMessages.some(failed => failed.includes(message.name))))
      
      // Clear selections
      setSelectedMessages(new Set())
      setSelectAll(false)
      
      if (failedMessages.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial deletion completed',
          description: `${successCount} message${successCount !== 1 ? 's' : ''} deleted successfully. ${failedMessages.length} failed.`,
        })
      } else {
        toast({
          title: 'Success',
          description: `${successCount} message${successCount !== 1 ? 's' : ''} deleted successfully.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete messages.',
      })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkArchive = async () => {
    if (selectedMessages.size === 0) return
    
    const selectedMessagesList = Array.from(selectedMessages)
    
    try {
      setIsBulkArchiving(true)
      
      let successCount = 0
      let failedMessages: string[] = []
      
      for (const messageId of selectedMessagesList) {
        try {
          const { error } = await archiveMessage(messageId)
          if (error) throw error
          successCount++
        } catch (error) {
          const message = messages.find(m => m.id === messageId)
          const name = message ? `${message.name} (${message.subject || 'No subject'})` : 'Unknown'
          failedMessages.push(name)
        }
      }
      
      // Update successfully archived messages in state
      setMessages(prev => prev.map(message => 
        selectedMessagesList.includes(message.id) && !failedMessages.some(failed => failed.includes(message.name))
          ? { ...message, status: 'archived' }
          : message
      ))
      
      // Clear selections
      setSelectedMessages(new Set())
      setSelectAll(false)
      
      if (failedMessages.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial archiving completed',
          description: `${successCount} message${successCount !== 1 ? 's' : ''} archived successfully. ${failedMessages.length} failed.`,
        })
      } else {
        toast({
          title: 'Success',
          description: `${successCount} message${successCount !== 1 ? 's' : ''} archived successfully.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to archive messages.',
      })
    } finally {
      setIsBulkArchiving(false)
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Website Messages</h2>
          <p className="text-slate-600">Fetching message data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-2xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Website Messages
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage contact form inquiries and website communications
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {selectedMessages.size > 0 && (
                <>
                  <Button 
                    onClick={handleBulkArchive}
                    disabled={isBulkArchiving}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
                  >
                    {isBulkArchiving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="mr-2 h-5 w-5" />
                        Archive Selected ({selectedMessages.size})
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
                  >
                    {isBulkDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-5 w-5" />
                        Delete Selected ({selectedMessages.size})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-indigo-100 text-sm font-medium">Total Messages</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalMessages
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-200" />
                <span className="text-indigo-100 text-sm font-medium">All time messages</span>
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
                  <p className="text-red-100 text-sm font-medium">Unread Messages</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.unreadMessages
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-200" />
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
                  <p className="text-emerald-100 text-sm font-medium">Responded Today</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.respondedToday
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Today's responses</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">High Priority</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.highPriorityMessages
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Urgent attention</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Messages</h2>
                <p className="text-slate-300">Find messages by sender, content, status, or priority</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by name, email, subject, or message content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Priority
                </label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Category
                </label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="prayer_request">Prayer Request</SelectItem>
                    <SelectItem value="visit_inquiry">Visit Inquiry</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="crisis">Crisis</SelectItem>
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
                Showing {pagination.totalItems} of {messages.length} messages
                {pagination.totalItems !== messages.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-8">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}

        {/* Enhanced Messages Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 w-12">
                  <Checkbox
                    checked={selectAll && pagination.totalItems > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={pagination.totalItems === 0}
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Sender</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Subject</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Message</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Priority</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Date</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.totalItems === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No messages found</h3>
                        <p className="text-slate-600">
                          {pagination.totalItems === 0 && messages.length > 0 
                            ? "No messages match your search criteria."
                            : "No website messages found."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((message) => (
                  <TableRow key={message.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4 text-slate-600">
                      <Checkbox
                        checked={selectedMessages.has(message.id)}
                        onCheckedChange={(checked) => handleSelectMessage(message.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800">{message.name}</div>
                        <div className="text-sm text-slate-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {message.email}
                        </div>
                        {message.phone && (
                          <div className="text-sm text-slate-600 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {message.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-800">
                        {message.subject || 'No subject'}
                      </div>
                      {message.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {message.category.replace('_', ' ')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600 max-w-[300px]">
                      {truncateText(message.message, 100)}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${getStatusColor(message.status)} border`}>
                        {message.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`${getPriorityColor(message.priority)} border`}>
                        {message.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600 text-sm">
                      {formatDate(message.created_at)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/outreach/website-messages/${message.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {message.status === 'unread' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkAsRead(message.id)}
                            className="hover:bg-green-50 hover:text-green-600 rounded-lg text-slate-600"
                            title="Mark as Read"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {message.status !== 'responded' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRespond(message)}
                            className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                            title="Respond"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {message.status !== 'archived' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleArchive(message.id)}
                            className="hover:bg-amber-50 hover:text-amber-600 rounded-lg text-slate-600"
                            title="Archive"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(message.id)}
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
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this message? This action cannot be undone.</p>
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

      {/* Response Dialog */}
      {showResponseDialog && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-2xl w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Record Response</h3>
              <p className="text-sm text-slate-600 mt-2">
                Record your response to {selectedMessage.name}'s message about "{selectedMessage.subject || 'No subject'}"
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="response-notes" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Response Notes
                </Label>
                <Textarea
                  id="response-notes"
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Describe how you responded to this message (e.g., called, emailed, met in person)..."
                  className="h-32 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowResponseDialog(false)}
                disabled={isResponding}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmRespond}
                disabled={isResponding || !responseNotes.trim()}
                className="rounded-xl px-6 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              >
                {isResponding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Response'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 