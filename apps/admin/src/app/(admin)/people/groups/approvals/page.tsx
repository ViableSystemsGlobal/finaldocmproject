'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  Check, 
  X, 
  User, 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  MessageSquare,
  Shield,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface MembershipRequest {
  id: string
  group_id: string
  group_name: string
  group_type: 'ministry' | 'discipleship'
  group_description?: string
  contact_id: string
  contact_name: string
  contact_email?: string
  contact_phone?: string
  role: string
  status: 'pending'
  requested_at: string
  rejection_reason?: string
  table_source: 'group_memberships' | 'discipleship_memberships'
}

export default function GroupApprovalsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<MembershipRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MembershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'ministry' | 'discipleship'>('all')
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/group-membership-requests')
      const data = await response.json()
      
      if (response.ok) {
        setRequests(data.requests)
        setFilteredRequests(data.requests)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch membership requests'
        })
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch membership requests'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: MembershipRequest) => {
    try {
      setProcessing(prev => new Set(prev).add(request.id))
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You must be logged in to approve requests'
        })
        return
      }

      const response = await fetch('/api/admin/group-membership-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: request.id,
          action: 'approve',
          tableSource: request.table_source,
          userId: user.id
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${request.contact_name} approved for ${request.group_name}`
        })
        fetchRequests()
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to approve request'
        })
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve request'
      })
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(request.id)
        return newSet
      })
    }
  }

  const handleReject = async (request: MembershipRequest, reason?: string) => {
    try {
      setProcessing(prev => new Set(prev).add(request.id))
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You must be logged in to reject requests'
        })
        return
      }

      const response = await fetch('/api/admin/group-membership-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: request.id,
          action: 'reject',
          tableSource: request.table_source,
          rejectionReason: reason,
          userId: user.id
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${request.contact_name} rejected for ${request.group_name}`
        })
        fetchRequests()
        setShowRejectionDialog(false)
        setRejectionReason('')
        setSelectedRequest(null)
      } else {
        const error = await response.json()
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.error || 'Failed to reject request'
        })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject request'
      })
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev)
        newSet.delete(request.id)
        return newSet
      })
    }
  }

  const openRejectionDialog = (request: MembershipRequest) => {
    setSelectedRequest(request)
    setShowRejectionDialog(true)
  }

  // Filter requests based on search and type filter
  useEffect(() => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(request => request.group_type === typeFilter)
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, typeFilter])

  useEffect(() => {
    fetchRequests()
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ministry':
        return 'bg-blue-100 text-blue-800'
      case 'discipleship':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Membership Approvals</h1>
          <p className="text-gray-600">Review and approve pending group membership requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ministry Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.group_type === 'ministry').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Discipleship Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {requests.filter(r => r.group_type === 'discipleship').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, group, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={typeFilter} onValueChange={(value: 'all' | 'ministry' | 'discipleship') => setTypeFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="ministry">Ministry Groups</SelectItem>
            <SelectItem value="discipleship">Discipleship Groups</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-600 text-center">
              {requests.length === 0 
                ? "All caught up! No new membership requests to review."
                : "No requests match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">{request.contact_name}</span>
                      </div>
                      <Badge className={getTypeColor(request.group_type)}>
                        {request.group_type}
                      </Badge>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Requesting to join: <strong>{request.group_name}</strong></span>
                      </div>
                      {request.contact_email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{request.contact_email}</span>
                        </div>
                      )}
                      {request.contact_phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{request.contact_phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Requested: {format(new Date(request.requested_at), 'PPp')}</span>
                      </div>
                    </div>
                    
                    {request.group_description && (
                      <p className="text-sm text-gray-500 mb-4">{request.group_description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRejectionDialog(request)}
                      disabled={processing.has(request.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {processing.has(request.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-1" />
                      )}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request)}
                      disabled={processing.has(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing.has(request.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Membership Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Rejecting Request</h4>
                  <p className="text-sm text-red-700 mt-1">
                    You are about to reject {selectedRequest?.contact_name}'s request to join {selectedRequest?.group_name}.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (optional)
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection that will be visible to the requester..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false)
                  setRejectionReason('')
                  setSelectedRequest(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedRequest && handleReject(selectedRequest, rejectionReason)}
                disabled={processing.has(selectedRequest?.id || '')}
              >
                {processing.has(selectedRequest?.id || '') ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 