'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Mail, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Send,
  UserPlus,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/use-toast'
import { MemberImportDialog } from '@/components/newsletter/MemberImportDialog'
import { EditSubscriberDialog } from '@/components/newsletter/EditSubscriberDialog'
import { Pagination, usePagination } from '@/components/ui/pagination'
import { Checkbox } from '@/components/ui/checkbox'

interface Newsletter {
  id: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  total_recipients: number
  total_opened: number
  total_clicked: number
  created_at: string
  sent_at?: string
  newsletter_templates?: {
    name: string
    category: string
  }
}

interface Subscriber {
  id: string
  email: string
  first_name?: string
  last_name?: string
  status: 'active' | 'unsubscribed' | 'bounced'
  subscribed_at: string
  segments?: string[]
}

interface Stats {
  totalSubscribers: number
  totalCampaigns: number
  averageOpenRate: number
  totalTemplates: number
}

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSubscribers: 0,
    totalCampaigns: 0,
    averageOpenRate: 0,
    totalTemplates: 0
  })
  
  const [activeTab, setActiveTab] = useState<'overview' | 'newsletters' | 'subscribers'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [subscriberDialogOpen, setSubscriberDialogOpen] = useState(false)
  const [memberImportDialogOpen, setMemberImportDialogOpen] = useState(false)
  const [editSubscriberDialogOpen, setEditSubscriberDialogOpen] = useState(false)
  const [deleteSubscriberDialogOpen, setDeleteSubscriberDialogOpen] = useState(false)
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null)
  const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [newSubscriber, setNewSubscriber] = useState({
    email: '',
    first_name: '',
    last_name: '',
    segments: [] as string[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/newsletter/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Fetch newsletters
      const newslettersResponse = await fetch('/api/newsletter/newsletters')
      if (newslettersResponse.ok) {
        const newslettersData = await newslettersResponse.json()
        setNewsletters(newslettersData.newsletters || [])
      }

      // Fetch subscribers
      const subscribersResponse = await fetch('/api/newsletter/subscribers')
      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse.json()
        setSubscribers(subscribersData.subscribers || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load newsletter data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubscriber = async () => {
    if (!newSubscriber.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/newsletter/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSubscriber),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subscriber added successfully",
        })
        setSubscriberDialogOpen(false)
        setNewSubscriber({ email: '', first_name: '', last_name: '', segments: [] })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to add subscriber",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add subscriber",
        variant: "destructive"
      })
    }
  }

  const handleEditSubscriber = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber)
    setEditSubscriberDialogOpen(true)
  }

  const handleDeleteSubscriber = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber)
    setDeleteSubscriberDialogOpen(true)
  }

  const confirmDeleteSubscriber = async () => {
    if (!selectedSubscriber) return

    try {
      const response = await fetch(`/api/newsletter/subscribers/${selectedSubscriber.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Subscriber deleted successfully"
        })
        setDeleteSubscriberDialogOpen(false)
        setSelectedSubscriber(null)
        fetchData() // Refresh data
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete subscriber",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    }
  }

  // Multiselect handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked && pagination?.currentItems) {
      setSelectedSubscribers(new Set(pagination.currentItems.map(subscriber => subscriber.id)))
    } else {
      setSelectedSubscribers(new Set())
    }
  }

  const handleSelectSubscriber = (subscriberId: string, checked: boolean) => {
    const newSelected = new Set(selectedSubscribers)
    if (checked) {
      newSelected.add(subscriberId)
    } else {
      newSelected.delete(subscriberId)
    }
    setSelectedSubscribers(newSelected)
    
    // Update select all state
    if (pagination?.currentItems && newSelected.size === pagination.currentItems.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }

  const filteredNewsletters = newsletters.filter(newsletter => {
    const matchesSearch = newsletter.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || newsletter.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredSubscribers = subscribers.filter(subscriber => {
    const fullName = `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
    const matchesSearch = 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Add pagination for subscribers - must come after filteredSubscribers is defined
  const pagination = usePagination(filteredSubscribers, 10)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>
      case 'scheduled':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'sending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Sending</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'unsubscribed':
        return <Badge variant="destructive">Unsubscribed</Badge>
      case 'bounced':
        return <Badge variant="outline">Bounced</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateOpenRate = (opened: number, recipients: number) => {
    if (recipients === 0) return 0
    return Math.round((opened / recipients) * 100)
  }

  const calculateClickRate = (clicked: number, opened: number) => {
    if (opened === 0) return 0
    return Math.round((clicked / opened) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-medium">Loading newsletter data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-2xl">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Newsletter Management
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage subscribers and send engaging newsletters
                </p>
              </div>
            </div>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
              <Link href="/comms/newsletter/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Newsletter
              </Link>
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('newsletters')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'newsletters'
                  ? 'border-emerald-500 text-emerald-600 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Newsletters
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'subscribers'
                  ? 'border-emerald-500 text-emerald-600 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Subscribers
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Newsletter Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSubscribers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Active subscribers
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Campaigns Sent</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
                  <p className="text-xs text-muted-foreground">
                    Total newsletters sent
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageOpenRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Across all campaigns
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Templates</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                  <p className="text-xs text-muted-foreground">
                    Available templates
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Newsletters */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle>Recent Newsletters</CardTitle>
                <CardDescription>Latest newsletter campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {newsletters.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No newsletters found</p>
                    <Button asChild className="mt-4">
                      <Link href="/comms/newsletter/new">Create your first newsletter</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newsletters.slice(0, 5).map((newsletter) => (
                      <div key={newsletter.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{newsletter.subject}</h4>
                          <p className="text-sm text-gray-500">
                            {newsletter.total_recipients} recipients • {formatDate(newsletter.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(newsletter.status)}
                          {newsletter.status === 'sent' && (
                            <div className="text-sm text-gray-500">
                              {calculateOpenRate(newsletter.total_opened, newsletter.total_recipients)}% opened
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Newsletters Tab */}
        {activeTab === 'newsletters' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search newsletters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Newsletters Table */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Click Rate</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNewsletters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No newsletters found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNewsletters.map((newsletter) => (
                        <TableRow key={newsletter.id}>
                          <TableCell className="font-medium">{newsletter.subject}</TableCell>
                          <TableCell>{getStatusBadge(newsletter.status)}</TableCell>
                          <TableCell>{newsletter.total_recipients.toLocaleString()}</TableCell>
                          <TableCell>
                            {newsletter.status === 'sent' 
                              ? `${calculateOpenRate(newsletter.total_opened, newsletter.total_recipients)}%`
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {newsletter.status === 'sent' 
                              ? `${calculateClickRate(newsletter.total_clicked, newsletter.total_opened)}%`
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{formatDate(newsletter.sent_at || newsletter.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                              >
                                <Link href={`/comms/newsletter/${newsletter.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {newsletter.status === 'draft' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/comms/newsletter/${newsletter.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline"
                onClick={() => setMemberImportDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Import Contacts
              </Button>
              
              <Dialog open={subscriberDialogOpen} onOpenChange={setSubscriberDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Subscriber
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subscriber</DialogTitle>
                    <DialogDescription>
                      Add a new subscriber to your newsletter list.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newSubscriber.email}
                        onChange={(e) => setNewSubscriber(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="subscriber@example.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newSubscriber.first_name}
                          onChange={(e) => setNewSubscriber(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newSubscriber.last_name}
                          onChange={(e) => setNewSubscriber(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSubscriberDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddSubscriber}>
                      Add Subscriber
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Member Import Dialog */}
            <MemberImportDialog
              open={memberImportDialogOpen}
              onOpenChange={setMemberImportDialogOpen}
              onImportComplete={fetchData}
            />

            {/* Subscribers Table */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll && (pagination?.currentItems?.length || 0) > 0}
                          onCheckedChange={handleSelectAll}
                          disabled={(pagination?.currentItems?.length || 0) === 0}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!pagination || pagination.currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No subscribers found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagination.currentItems.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSubscribers.has(subscriber.id)}
                              onCheckedChange={(checked) => handleSelectSubscriber(subscriber.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{subscriber.email}</TableCell>
                          <TableCell>
                            {`${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim() || '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                          <TableCell>{formatDate(subscriber.subscribed_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditSubscriber(subscriber)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteSubscriber(subscriber)}
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
              </CardContent>
            </Card>

            {/* Pagination */}
            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.handlePageChange}
                onItemsPerPageChange={pagination.handleItemsPerPageChange}
                className="mt-6"
              />
            )}
          </div>
        )}
      </div>

      {/* Edit Subscriber Dialog */}
      <EditSubscriberDialog
        open={editSubscriberDialogOpen}
        onOpenChange={setEditSubscriberDialogOpen}
        subscriber={selectedSubscriber}
        onSubscriberUpdated={fetchData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteSubscriberDialogOpen} 
        onOpenChange={setDeleteSubscriberDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subscriber "{selectedSubscriber?.email}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteSubscriberDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSubscriber}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Subscriber
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 