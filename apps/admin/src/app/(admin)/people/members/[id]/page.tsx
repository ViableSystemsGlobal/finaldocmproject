'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Loader2, 
  Calendar as CalendarIcon,
  Edit, 
  Trash2, 
  Smartphone, 
  Mail, 
  Check, 
  X,
  UserCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { FollowUpModal } from '@/components/FollowUpModal'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

import { fetchMember, updateMember, deleteMember } from '@/services/members'

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Mock finance service function for now
const fetchMemberGivingSummary = async (contactId: string) => {
  // In a real implementation, this would call the actual service
  console.log(`Fetching giving summary for member ${contactId}`)
  
  // Return mock data
  return {
    data: {
      yearToDateTotal: 2500.00,
      lastContribution: new Date('2024-05-01').toISOString()
    },
    error: null
  }
}

// Mock service functions for tabs
const fetchMemberships = async (contactId: string) => {
  // In a real implementation, this would call the actual service
  console.log(`Fetching memberships for member ${contactId}`)
  
  // Return mock data
  return {
    data: [
      { id: 1, group_name: 'Worship Team', role: 'Member', joined_date: '2023-01-15' },
      { id: 2, group_name: 'Prayer Warriors', role: 'Leader', joined_date: '2023-03-20' }
    ],
    error: null
  }
}

const fetchFollowUps = async (contactId: string) => {
  // In a real implementation, this would call the actual service
  console.log(`Fetching follow-ups for member ${contactId}`)
  
  // Return mock data
  return {
    data: [
      { id: 1, type: 'call', notes: 'Check in about joining worship team', created_at: '2024-05-10', scheduled_date: '2024-05-20', completed: false },
      { id: 2, type: 'visit', notes: 'Home visit after surgery', created_at: '2024-04-05', scheduled_date: '2024-04-10', completed: true }
    ],
    error: null
  }
}

const fetchAttendance = async (contactId: string) => {
  // In a real implementation, this would call the actual service
  console.log(`Fetching attendance for member ${contactId}`)
  
  // Return mock data
  return {
    data: [
      { id: 1, service_name: 'Sunday Service', service_date: '2024-05-12', checked_in: true },
      { id: 2, service_name: 'Sunday Service', service_date: '2024-05-05', checked_in: true },
      { id: 3, service_name: 'Prayer Meeting', service_date: '2024-05-08', checked_in: true },
      { id: 4, service_name: 'Sunday Service', service_date: '2024-04-28', checked_in: false }
    ],
    error: null
  }
}

type Member = {
  contact_id: string
  joined_at: string
  notes?: string
  created_at: string
  contacts: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    profile_image?: string
  }
}

type GivingSummary = {
  yearToDateTotal: number
  lastContribution: string
}

type Group = {
  id: number
  group_name: string
  role: string
  joined_date: string
}

type FollowUp = {
  id: number
  type: string
  notes: string
  created_at: string
  scheduled_date: string
  completed: boolean
}

type Attendance = {
  id: number
  service_name: string
  service_date: string
  checked_in: boolean
}

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  
  // State variables
  const [member, setMember] = useState<Member | null>(null)
  const [isAppUser, setIsAppUser] = useState(false)
  const [givingSummary, setGivingSummary] = useState<GivingSummary | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('groups')
  const [editMode, setEditMode] = useState(searchParams.get('mode') === 'edit')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    joinedAt: '',
    notes: ''
  })
  
  // Load member data and related information
  useEffect(() => {
    const loadMemberData = async () => {
      try {
        // Fetch member data
        const { data, error } = await fetchMember(id)
        if (error) throw error
        
        const memberData = data as unknown as Member
        setMember(memberData)
        
        // Update form data
        setFormData({
          firstName: memberData.contacts.first_name,
          lastName: memberData.contacts.last_name,
          email: memberData.contacts.email,
          phone: memberData.contacts.phone,
          joinedAt: memberData.joined_at,
          notes: memberData.notes || ''
        })
        
        // Check if member is an app user
        const { data: appUserData, error: appUserError } = await supabase
          .from('mobile_app_users')
          .select('id')
          .eq('contact_id', id)
          .single()
        
        setIsAppUser(!!appUserData && !appUserError)
        
        // Fetch giving summary
        const { data: givingData, error: givingError } = await fetchMemberGivingSummary(id)
        if (!givingError) {
          setGivingSummary(givingData)
        }
        
        // Fetch groups, follow-ups, and attendance data for tabs
        const [groupsRes, followUpsRes, attendanceRes] = await Promise.all([
          fetchMemberships(id),
          fetchFollowUps(id),
          fetchAttendance(id)
        ])
        
        setGroups(groupsRes.data || [])
        setFollowUps(followUpsRes.data || [])
        setAttendance(attendanceRes.data || [])
        
      } catch (err) {
        console.error('Failed to load member data', err)
        setError(err instanceof Error ? err.message : 'Failed to load member data')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load member data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadMemberData()
  }, [id])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Update the member data
      const { error } = await updateMember(id, {
        joined_at: formData.joinedAt,
        notes: formData.notes || undefined
      })
      
      if (error) throw error
      
      // We would also update contact information here in a real implementation
      
      toast({
        title: 'Success',
        description: 'Member updated successfully'
      })
      
      // Exit edit mode
      setEditMode(false)
      
      // Refresh member data
      const { data } = await fetchMember(id)
      setMember(data as unknown as Member)
      
    } catch (err) {
      console.error('Failed to update member', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update member'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteMember = async () => {
    setIsSubmitting(true)
    
    try {
      const { error } = await deleteMember(id)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Member deleted successfully'
      })
      
      // Redirect to members list
      router.push('/people/members')
      
    } catch (err) {
      console.error('Failed to delete member', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete member'
      })
      setShowDeleteDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading member data...</span>
      </div>
    )
  }
  
  if (!member) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Member not found</h2>
          <p className="text-muted-foreground mt-2">
            The member you're looking for doesn't exist.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/people/members')}
          >
            Back to Members
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">
            {member.contacts.first_name} {member.contacts.last_name}
          </h1>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Joined: {new Date(member.joined_at).toLocaleDateString()}
            </Badge>
            <Badge variant={isAppUser ? "default" : "secondary"} className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Mobile App: {isAppUser ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setEditMode(!editMode)}
          >
            <Edit className="h-4 w-4 mr-1" />
            {editMode ? 'Cancel Edit' : 'Edit'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowSmsModal(true)}
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Send SMS
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowEmailModal(true)}
          >
            <Mail className="h-4 w-4 mr-1" />
            Send Email
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:bg-destructive/10" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Member Information</CardTitle>
              <CardDescription>
                {editMode ? 'Edit member details below' : 'Overview of member contact information'}
              </CardDescription>
            </CardHeader>
            
            {editMode ? (
              <form onSubmit={handleSaveMember}>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 mb-6">
                    <Avatar 
                      src={member.contacts.profile_image} 
                      alt={`${member.contacts.first_name} ${member.contacts.last_name}`}
                      size="lg"
                      className="border-2 border-white shadow-sm"
                    />
                    <div>
                      <h3 className="font-medium">Profile Photo</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your profile picture from the contact details page
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="joinedAt">Joined Date</Label>
                      <Input
                        id="joinedAt"
                        name="joinedAt"
                        type="date"
                        value={formData.joinedAt.split('T')[0]}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Any additional information about this member..."
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditMode(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 mb-6">
                  <Avatar 
                    src={member.contacts.profile_image} 
                    alt={`${member.contacts.first_name} ${member.contacts.last_name}`}
                    size="lg"
                    className="border-2 border-white shadow-sm"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">First Name</h3>
                    <p>{member.contacts.first_name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Name</h3>
                    <p>{member.contacts.last_name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p>{member.contacts.email || 'None'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                    <p>{member.contacts.phone || 'None'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Joined Date</h3>
                    <p>{new Date(member.joined_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {member.notes && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                    <p className="whitespace-pre-line">{member.notes}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
          
          {/* Tabs */}
          <div className="mt-6">
            <div className="border-b">
              <div className="flex">
                <button
                  className={cn(
                    "px-4 py-2 font-medium text-sm",
                    activeTab === 'groups' 
                      ? "border-b-2 border-primary text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab('groups')}
                >
                  Groups
                </button>
                <button
                  className={cn(
                    "px-4 py-2 font-medium text-sm",
                    activeTab === 'followups' 
                      ? "border-b-2 border-primary text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab('followups')}
                >
                  Follow-Ups
                </button>
                <button
                  className={cn(
                    "px-4 py-2 font-medium text-sm",
                    activeTab === 'attendance' 
                      ? "border-b-2 border-primary text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab('attendance')}
                >
                  Attendance
                </button>
              </div>
            </div>
            
            <div className="py-4">
              {activeTab === 'groups' && (
                <div>
                  {groups.length > 0 ? (
                    <div className="divide-y">
                      {groups.map(group => (
                        <div key={group.id} className="py-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{group.group_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Role: {group.role} • Joined: {new Date(group.joined_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/people/groups/${group.id}`}>
                              View Group
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <UserCircle2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>This member is not part of any groups yet.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        asChild
                      >
                        <Link href={`/people/groups/assign?member=${id}`}>
                          Assign to Group
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'followups' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Follow-up History</h3>
                    <Button 
                      size="sm" 
                      onClick={() => setShowFollowUpModal(true)}
                    >
                      + Follow-Up
                    </Button>
                  </div>
                  
                  {followUps.length > 0 ? (
                    <div className="divide-y">
                      {followUps.map(followUp => (
                        <div key={followUp.id} className="py-3">
                          <div className="flex justify-between">
                            <h4 className="font-medium capitalize">{followUp.type}</h4>
                            <Badge variant={followUp.completed ? "success" : "outline"}>
                              {followUp.completed ? 'Completed' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Scheduled: {new Date(followUp.scheduled_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm mt-1">{followUp.notes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No follow-ups scheduled for this member.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'attendance' && (
                <div>
                  <h3 className="font-medium mb-4">Recent Attendance</h3>
                  
                  {attendance.length > 0 ? (
                    <div className="divide-y">
                      {attendance.map(record => (
                        <div key={record.id} className="py-3 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{record.service_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.service_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={record.checked_in ? "success" : "secondary"}>
                            {record.checked_in ? (
                              <><Check className="h-3 w-3 mr-1" /> Present</>
                            ) : (
                              <><X className="h-3 w-3 mr-1" /> Absent</>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <p>No attendance records found for this member.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Giving Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Giving Summary</CardTitle>
              <CardDescription>Year-to-date giving information</CardDescription>
            </CardHeader>
            <CardContent>
              {givingSummary ? (
                <div>
                  <div className="mb-6">
                    <p className="text-muted-foreground text-sm">Total This Year</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(givingSummary.yearToDateTotal)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last contribution: {new Date(givingSummary.lastContribution).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/finance/pledges?contact_id=${id}`}>
                        View Pledges
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href={`/finance/givings?contact_id=${id}`}>
                        View Other Givings
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No giving records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Additional side panels could go here */}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
      
      {/* SMS Modal */}
      {showSmsModal && (
        <Dialog open={showSmsModal} onOpenChange={setShowSmsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send SMS</DialogTitle>
              <DialogDescription>
                Send a text message to {member.contacts.first_name} at {member.contacts.phone || '[No phone number]'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[100px]"
                disabled={!member.contacts.phone}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSmsModal(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!member.contacts.phone}
              >
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Email Modal */}
      {showEmailModal && (
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
              <DialogDescription>
                Send an email to {member.contacts.first_name} at {member.contacts.email || '[No email address]'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  disabled={!member.contacts.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  className="min-h-[150px]"
                  disabled={!member.contacts.email}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!member.contacts.email}
              >
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Follow Up Modal */}
      {showFollowUpModal && (
        <FollowUpModal
          open={showFollowUpModal}
          onOpenChange={setShowFollowUpModal}
          contactId={id}
          contactName={`${member.contacts.first_name} ${member.contacts.last_name}`}
        />
      )}
    </div>
  )
} 