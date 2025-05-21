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
  Send
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
import { toast } from '@/components/ui/use-toast'
import { MetricCard } from '@/components/MetricCard'
import { 
  CommsCampaign, 
  fetchCampaigns, 
  deleteCampaign, 
  sendCampaignNow,
  getCommsMetrics,
  GlobalCommsMetrics
} from '@/services/comms/campaigns'
import { format, formatDistanceToNow } from 'date-fns'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CommsCampaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CommsCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
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
  
  // Load campaigns and metrics
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setMetricsLoading(true)
      
      try {
        // Load campaigns
        const { data, error } = await fetchCampaigns()
        
        if (error) throw error
        
        setCampaigns(data || [])
        setFilteredCampaigns(data || [])
        
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
      }
    }
    
    loadData()
  }, [])
  
  // Apply filters when search, channel or status filter changes
  useEffect(() => {
    let filtered = [...campaigns]
    
    // Apply channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.channel === channelFilter)
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
        (campaign.template?.name || '').toLowerCase().includes(query)
      )
    }
    
    setFilteredCampaigns(filtered)
  }, [campaigns, searchQuery, channelFilter, statusFilter])
  
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
  
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Campaigns"
          value={metricsLoading ? 0 : metrics.total_campaigns}
          icon={<Mail className="h-6 w-6" />}
          loading={metricsLoading}
          formatter="number"
        />
        <MetricCard
          title="Active/Draft"
          value={metricsLoading ? 0 : metrics.active_campaigns}
          icon={<Pencil className="h-6 w-6" />}
          loading={metricsLoading}
          formatter="number"
        />
        <MetricCard
          title="Scheduled"
          value={metricsLoading ? 0 : metrics.scheduled_campaigns}
          icon={<Calendar className="h-6 w-6" />}
          loading={metricsLoading}
          formatter="number"
        />
        <MetricCard
          title="Completed"
          value={metricsLoading ? 0 : metrics.completed_campaigns}
          icon={<Send className="h-6 w-6" />}
          loading={metricsLoading}
          formatter="number"
        />
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              Create and manage your communication campaigns
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/comms/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-auto flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[140px]">
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
                  <SelectTrigger className="w-[140px]">
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
            
            {/* Table */}
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">
                  {campaigns.length === 0 ? 
                    'No campaigns found. Create your first campaign!' :
                    'No campaigns match your search criteria.'
                  }
                </p>
                {campaigns.length === 0 && (
                  <Button variant="outline" asChild className="mt-4">
                    <Link href="/comms/campaigns/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Campaign
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Scheduled For</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">
                          {campaign.name}
                        </TableCell>
                        <TableCell>
                          {getChannelBadge(campaign.channel)}
                        </TableCell>
                        <TableCell>
                          {campaign.template?.name || 'Unknown Template'}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(campaign.scheduled_at)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(campaign.status)}
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the campaign "{campaignToDelete?.name}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleting}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Campaign Now</DialogTitle>
            <DialogDescription>
              Are you sure you want to send the campaign "{campaignToSend?.name}" immediately?
              This will send to all recipients and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSendDialog(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={confirmSend}
              disabled={sending}
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
  )
} 