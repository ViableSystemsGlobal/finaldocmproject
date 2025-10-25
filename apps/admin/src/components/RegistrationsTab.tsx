'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  X,
  Loader2,
  UserPlus,
  Filter,
  Download
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
import { toast } from '@/components/ui/use-toast'
import { 
  fetchRegistrations, 
  addRegistration, 
  updateRegistration, 
  deleteRegistration,
  Registration 
} from '@/services/events'
import { getContactsForLeaderSelection } from '@/services/contacts'
import { format } from 'date-fns'

interface RegistrationsTabProps {
  eventId: string
}

// Extended Registration type that includes the contacts relation
type RegistrationWithContact = Registration & {
  contacts?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    profile_image: string | null;
  };
}

export function RegistrationsTab({ eventId }: RegistrationsTabProps) {
  const [registrations, setRegistrations] = useState<RegistrationWithContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithContact | null>(null)
  
  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [registrationStatus, setRegistrationStatus] = useState('confirmed')

  // Load registrations
  const loadRegistrations = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchRegistrations(eventId)
      if (error) throw error
      setRegistrations(data || [])
    } catch (error) {
      console.error('Error loading registrations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load registrations',
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
    loadRegistrations()
    loadContacts()
  }, [eventId])

  // Handle add registration
  const handleAddRegistration = async () => {
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
      const { error } = await addRegistration({
        event_id: eventId,
        contact_id: selectedContactId,
        status: registrationStatus
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Registration added successfully'
      })
      
      setShowAddDialog(false)
      setSelectedContactId('')
      setRegistrationStatus('confirmed')
      loadRegistrations()
    } catch (error) {
      console.error('Error adding registration:', error)
      toast({
        title: 'Error',
        description: 'Failed to add registration',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit registration
  const handleEditRegistration = async () => {
    if (!selectedRegistration) return

    try {
      setIsSubmitting(true)
      const { error } = await updateRegistration(selectedRegistration.id, {
        status: registrationStatus
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Registration updated successfully'
      })
      
      setShowEditDialog(false)
      setSelectedRegistration(null)
      loadRegistrations()
    } catch (error) {
      console.error('Error updating registration:', error)
      toast({
        title: 'Error',
        description: 'Failed to update registration',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete registration
  const handleDeleteRegistration = async () => {
    if (!selectedRegistration) return

    try {
      setIsSubmitting(true)
      const { error } = await deleteRegistration(selectedRegistration.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Registration deleted successfully'
      })
      
      setShowDeleteDialog(false)
      setSelectedRegistration(null)
      loadRegistrations()
    } catch (error) {
      console.error('Error deleting registration:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete registration',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (registration: RegistrationWithContact) => {
    setSelectedRegistration(registration)
    setRegistrationStatus(registration.status)
    setShowEditDialog(true)
  }

  // Open delete dialog
  const openDeleteDialog = (registration: RegistrationWithContact) => {
    setSelectedRegistration(registration)
    setShowDeleteDialog(true)
  }

  // Filter registrations
  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = registration.contacts && (
      `${registration.contacts.first_name} ${registration.contacts.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      registration.contacts.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default'
      case 'pending': return 'secondary'
      case 'cancelled': return 'destructive'
      case 'waitlist': return 'outline'
      default: return 'secondary'
    }
  }

  // Format registration date
  const formatRegistrationDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a')
    } catch {
      return dateString
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Event Registrations</h2>
              <p className="text-emerald-100">Manage people registered for this event</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="h-12 px-6 border-2 border-white/30 rounded-xl bg-white/20 hover:bg-white/30 text-white border-white/40"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Add Registration
          </Button>
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
                placeholder="Search registrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="waitlist">Waitlist</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{registrations.length}</div>
              <p className="text-xs text-muted-foreground">Total Registrations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {registrations.filter(r => r.status === 'confirmed').length}
              </div>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {registrations.filter(r => r.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {registrations.filter(r => r.status === 'waitlist').length}
              </div>
              <p className="text-xs text-muted-foreground">Waitlist</p>
            </CardContent>
          </Card>
        </div>

        {/* Registrations Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No matching registrations' : 'No registrations yet'}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding the first registration for this event'
              }
            </p>
            {(!searchQuery && statusFilter === 'all') && (
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Registration
              </Button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.contacts ? 
                        `${registration.contacts.first_name || ''} ${registration.contacts.last_name || ''}`.trim() ||
                        'Unknown Name'
                        : 'Unknown Contact'
                      }
                    </TableCell>
                    <TableCell>{registration.contacts?.email || 'No email'}</TableCell>
                    <TableCell>{registration.contacts?.phone || 'No phone'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(registration.status)}>
                        {registration.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatRegistrationDate(registration.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(registration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(registration)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add Registration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Registration</DialogTitle>
            <DialogDescription>
              Register a person for this event
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
              <label className="text-sm font-medium">Status</label>
              <Select value={registrationStatus} onValueChange={setRegistrationStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRegistration} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Registration Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update registration status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={registrationStatus} onValueChange={setRegistrationStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRegistration} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Registration Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this registration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRegistration} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 