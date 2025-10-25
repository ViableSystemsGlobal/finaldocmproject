'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Send, 
  Clock, 
  X,
  Loader2,
  UserPlus,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Smartphone,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import { 
  fetchInvitations, 
  addInvitation, 
  updateInvitation, 
  deleteInvitation,
  Invitation 
} from '@/services/events'
import { getContactsForLeaderSelection } from '@/services/contacts'
import { format } from 'date-fns'

interface InvitationsTabProps {
  eventId: string
}

// Extended Invitation type that includes the contacts relation
type InvitationWithContact = Invitation & {
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    profile_image: string | null;
  };
}

export function InvitationsTab({ eventId }: InvitationsTabProps) {
  const [invitations, setInvitations] = useState<InvitationWithContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkInviteDialog, setShowBulkInviteDialog] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationWithContact | null>(null)
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [invitationChannel, setInvitationChannel] = useState('email')
  const [invitationStatus, setInvitationStatus] = useState('pending')
  const [invitationMessage, setInvitationMessage] = useState('')

  // Load invitations
  const loadInvitations = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchInvitations(eventId)
      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invitations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load contacts for selection
  const loadContacts = async (query?: string) => {
    try {
      const { data, error } = await getContactsForLeaderSelection(query)
      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  useEffect(() => {
    loadInvitations()
    loadContacts()
  }, [eventId])

  // Handle add invitation
  const handleAddInvitation = async () => {
    if (!selectedContactId) {
      toast({
        title: 'Error',
        description: 'Please select a contact',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await addInvitation({
        event_id: eventId,
        recipient_contact_id: selectedContactId,
        channel: invitationChannel,
        status: invitationStatus,
        sent_at: invitationStatus === 'sent' ? new Date().toISOString() : null
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Invitation added successfully'
      })
      
      setShowAddDialog(false)
      setSelectedContactId('')
      setInvitationChannel('email')
      setInvitationStatus('pending')
      setInvitationMessage('')
      loadInvitations()
    } catch (error) {
      console.error('Error adding invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to add invitation',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle bulk invitations
  const handleBulkInvitations = async () => {
    if (selectedContactIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one contact',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Create multiple invitations
      const invitationPromises = selectedContactIds.map(contactId => 
        addInvitation({
          event_id: eventId,
          recipient_contact_id: contactId,
          channel: invitationChannel,
          status: invitationStatus,
          sent_at: invitationStatus === 'sent' ? new Date().toISOString() : null
        })
      )
      
      const results = await Promise.allSettled(invitationPromises)
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.length - successCount
      
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} invitation(s) sent successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send invitations',
          variant: 'destructive'
        })
      }
      
      setShowBulkInviteDialog(false)
      setSelectedContactIds([])
      setInvitationChannel('email')
      setInvitationStatus('pending')
      setInvitationMessage('')
      loadInvitations()
    } catch (error) {
      console.error('Error sending bulk invitations:', error)
      toast({
        title: 'Error',
        description: 'Failed to send bulk invitations',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit invitation
  const handleEditInvitation = async () => {
    if (!selectedInvitation) return

    try {
      setIsSubmitting(true)
      const { error } = await updateInvitation(selectedInvitation.id, {
        status: invitationStatus,
        channel: invitationChannel,
        sent_at: invitationStatus === 'sent' && !selectedInvitation.sent_at 
          ? new Date().toISOString() 
          : selectedInvitation.sent_at
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Invitation updated successfully'
      })
      
      setShowEditDialog(false)
      setSelectedInvitation(null)
      loadInvitations()
    } catch (error) {
      console.error('Error updating invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to update invitation',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete invitation
  const handleDeleteInvitation = async () => {
    if (!selectedInvitation) return

    try {
      setIsSubmitting(true)
      const { error } = await deleteInvitation(selectedInvitation.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Invitation deleted successfully'
      })
      
      setShowDeleteDialog(false)
      setSelectedInvitation(null)
      loadInvitations()
    } catch (error) {
      console.error('Error deleting invitation:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete invitation',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (invitation: InvitationWithContact) => {
    setSelectedInvitation(invitation)
    setInvitationStatus(invitation.status)
    setInvitationChannel(invitation.channel || 'email')
    setShowEditDialog(true)
  }

  // Open delete dialog
  const openDeleteDialog = (invitation: InvitationWithContact) => {
    setSelectedInvitation(invitation)
    setShowDeleteDialog(true)
  }

  // Handle bulk contact selection
  const handleContactToggle = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  // Filter invitations
  const filteredInvitations = invitations.filter(invitation => {
    const contact = invitation.contacts as any
    const matchesSearch = contact && (
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter
    const matchesChannel = channelFilter === 'all' || invitation.channel === channelFilter
    return matchesSearch && matchesStatus && matchesChannel
  })

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent': return 'default'
      case 'pending': return 'secondary'
      case 'delivered': return 'default'
      case 'opened': return 'default'
      case 'clicked': return 'default'
      case 'responded': return 'default'
      case 'failed': return 'destructive'
      default: return 'secondary'
    }
  }

  // Get channel icon
  const getChannelIcon = (channel: string | null) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <Smartphone className="h-4 w-4" />
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />
      default: return <Mail className="h-4 w-4" />
    }
  }

  // Format invitation date
  const formatInvitationDate = (dateString: string | null) => {
    if (!dateString) return 'Not sent'
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return dateString
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Event Invitations</h2>
              <p className="text-blue-100">Send and track invitations for this event</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowBulkInviteDialog(true)}
              variant="outline"
              className="h-12 px-6 border-2 border-white/30 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/40"
            >
              <Send className="mr-2 h-5 w-5" />
              Bulk Invite
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="h-12 px-6 border-2 border-white/30 rounded-xl bg-white/20 hover:bg-white/30 text-white border-white/40"
            >
              <Mail className="mr-2 h-5 w-5" />
              Add Invitation
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search invitations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-12 rounded-xl border-slate-200">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[180px] h-12 rounded-xl border-slate-200">
              <SelectValue placeholder="Filter by channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-slate-800">{invitations.length}</div>
              <p className="text-sm text-slate-600 mt-1">Total Invitations</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">
                {invitations.filter(i => i.status === 'sent').length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Sent</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {invitations.filter(i => i.status === 'responded').length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Responded</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600">
                {invitations.filter(i => i.status === 'pending').length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-600">
                {invitations.filter(i => i.status === 'failed').length}
              </div>
              <p className="text-sm text-slate-600 mt-1">Failed</p>
            </CardContent>
          </Card>
        </div>

        {/* Invitations Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Invitations</h3>
              <p className="text-slate-600">Please wait while we load the invitation data...</p>
            </div>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              {searchQuery || statusFilter !== 'all' || channelFilter !== 'all' ? 'No matching invitations' : 'No invitations yet'}
            </h3>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
              {searchQuery || statusFilter !== 'all' || channelFilter !== 'all'
                ? 'Try adjusting your search or filter criteria to find the invitations you\'re looking for.'
                : 'Start building your guest list by sending the first invitation for this event.'
              }
            </p>
            {(!searchQuery && statusFilter === 'all' && channelFilter === 'all') && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-12 px-6 rounded-xl"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send First Invitation
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="font-semibold text-slate-700">Recipient</TableHead>
                  <TableHead className="font-semibold text-slate-700">Email</TableHead>
                  <TableHead className="font-semibold text-slate-700">Channel</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Sent</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const contact = invitation.contacts as any
                  return (
                    <TableRow key={invitation.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <TableCell className="font-medium text-slate-800">
                        {contact ? 
                          `${contact.first_name || ''} ${contact.last_name || ''}`.trim() ||
                          'Unknown Name'
                          : 'Unknown Contact'
                        }
                      </TableCell>
                      <TableCell className="text-slate-600">{contact?.email || 'No email'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(invitation.channel)}
                          <span className="capitalize text-slate-600">{invitation.channel || 'email'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invitation.status)} className="font-medium">
                          {invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatInvitationDate(invitation.sent_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(invitation)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(invitation)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Invitation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Invitation</DialogTitle>
            <DialogDescription>
              Send an invitation to a person for this event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Contact</label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Channel</label>
              <Select value={invitationChannel} onValueChange={setInvitationChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={invitationStatus} onValueChange={setInvitationStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Send Now</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddInvitation} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Invite Dialog */}
      <Dialog open={showBulkInviteDialog} onOpenChange={setShowBulkInviteDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Invitations</DialogTitle>
            <DialogDescription>
              Select multiple contacts to send invitations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Contacts</label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={contact.id}
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={() => handleContactToggle(contact.id)}
                    />
                    <label htmlFor={contact.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {selectedContactIds.length} contact(s) selected
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Channel</label>
              <Select value={invitationChannel} onValueChange={setInvitationChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={invitationStatus} onValueChange={setInvitationStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Send Now</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkInvitations} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invitation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Invitation</DialogTitle>
            <DialogDescription>
              Update invitation details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Channel</label>
              <Select value={invitationChannel} onValueChange={setInvitationChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={invitationStatus} onValueChange={setInvitationStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditInvitation} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invitation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invitation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvitation} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 