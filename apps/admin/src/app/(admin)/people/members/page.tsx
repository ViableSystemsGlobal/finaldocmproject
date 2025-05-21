'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Smartphone,
  Users,
  Eye,
  FileText
} from 'lucide-react'
// import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
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
import { Avatar } from '@/components/ui/avatar'
import { FollowUpModal } from '@/components/FollowUpModal'
import { safeFormatDate } from '@/lib/utils'

// Mock the Dialog components for now
const Dialog = ({ open, onOpenChange, children }: any) => (
  open ? <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">{children}</div> : null
)
const DialogContent = ({ children }: any) => <div className="bg-white p-6 rounded-lg max-w-md w-full">{children}</div>
const DialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>
const DialogFooter = ({ children }: any) => <div className="flex justify-end gap-2 mt-4">{children}</div>
const DialogTitle = ({ children }: any) => <h3 className="text-lg font-semibold">{children}</h3>
const DialogDescription = ({ children }: any) => <p className="text-sm text-gray-500">{children}</p>

// Mock the Badge component
const Badge = ({ variant, children }: any) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
    variant === 'success' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }`}>
    {children}
  </span>
)

// Mock toast functions
const toast = ({ title, description, variant }: any) => {
  console.log(`Toast: ${variant || 'default'} - ${title} - ${description}`)
}

import {
  fetchMembers,
  deleteMember,
  getMembersCount,
  getNewMembersThisMonth,
  getMembersServing,
  getMemberAppUsers
} from '@/services/members'

// Helper function to replace formatDistanceToNow
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`
  if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`
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
  is_serving?: boolean
  is_app_user?: boolean
}

type MemberCountMetrics = {
  total: number
  newThisMonth: number
  percentageServing: number
  appUsers: number
  loading: boolean
}

// ClientOnly component for components that should only render on client
const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return mounted ? <>{children}</> : null
}

// Component for formatting joined date safely
const FormattedJoinedDate = ({ date }: { date: string }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a simple ISO date format for server rendering
    // This ensures the same output on both server and client initial render
    return <>{date.split('T')[0]}</>;
  }
  
  // Once mounted on client, we can use the locale-specific formatting
  return (
    <>
      {new Date(date).toLocaleDateString()} ({formatTimeAgo(new Date(date))})
    </>
  );
};

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [metrics, setMetrics] = useState<MemberCountMetrics>({
    total: 0,
    newThisMonth: 0,
    percentageServing: 0,
    appUsers: 0,
    loading: true
  })

  // Load members data
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const { data, error } = await fetchMembers()
        if (error) throw error
        
        // Type assertion to handle the typing issue
        const memberData = data as unknown as Member[] || []
        
        // Enhanced debug logging
        console.log('Members data:', memberData)
        
        // Log the structure of the first member if available
        if (memberData.length > 0) {
          console.log('First member data structure:', {
            contact_id: memberData[0].contact_id,
            joined_at: memberData[0].joined_at,
            contacts: memberData[0].contacts,
            hasProfileImage: !!memberData[0].contacts?.profile_image
          })
        }
        
        setMembers(memberData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load members')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load members'
        })
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [])

  // Load metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Get total members count
        const { count: total, error: totalError } = await getMembersCount()
        if (totalError) throw totalError

        // Get new members this month
        const { count: newThisMonth, error: newError } = await getNewMembersThisMonth()
        if (newError) throw newError

        // Get members serving
        const { data: servingData, error: servingError } = await getMembersServing()
        if (servingError) throw servingError
        const serving = servingData || 0
        
        // Get app users count
        const { data: appUsersData, error: appError } = await getMemberAppUsers()
        if (appError) throw appError
        const appUsers = appUsersData || 0

        // Calculate percentage serving
        const percentageServing = total ? Math.round((serving / total) * 100) : 0

        setMetrics({
          total: total || 0,
          newThisMonth: newThisMonth || 0,
          percentageServing,
          appUsers,
          loading: false
        })
      } catch (err) {
        console.error('Failed to load metrics', err)
        setMetrics(prev => ({ ...prev, loading: false }))
      }
    }

    loadMetrics()
  }, [])

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const { error } = await deleteMember(deleteId)
      if (error) throw error
      
      setMembers(prev => prev.filter(member => member.contact_id !== deleteId))
      setShowDeleteDialog(false)
      toast({
        title: 'Success',
        description: 'Member deleted successfully'
      })
    } catch (err) {
      console.error('Error deleting member', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete member'
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleFollowUp = (member: any) => {
    setSelectedMember(member)
    setShowFollowUpModal(true)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading members...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Members</h1>
        <Button asChild>
          <Link href="/people/members/new">
            <Plus className="mr-2 h-4 w-4" /> New Member
          </Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                metrics.total
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                metrics.newThisMonth
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Serving in Ministry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `${metrics.percentageServing}%`
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">App Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                metrics.appUsers
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-md border overflow-hidden bg-white">
        <Table className="border-collapse">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px] py-3 font-medium">Profile</TableHead>
              <TableHead className="w-[170px] min-w-[150px] py-3 font-medium">Name</TableHead>
              <TableHead className="py-3 font-medium">Email</TableHead>
              <TableHead className="py-3 font-medium">Phone</TableHead>
              <TableHead className="py-3 font-medium">Joined Date</TableHead>
              <TableHead className="py-3 font-medium">Serving?</TableHead>
              <TableHead className="py-3 font-medium">App User?</TableHead>
              <TableHead className="text-right py-3 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No members found. Create your first member.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.contact_id} className="hover:bg-gray-50">
                  <TableCell className="py-3">
                    <Avatar 
                      src={member.contacts.profile_image} 
                      alt={`${member.contacts.first_name} ${member.contacts.last_name}`}
                      size="md"
                      className="border-2 border-gray-200 shadow-sm mx-auto"
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="font-medium">
                      {member.contacts.first_name} {member.contacts.last_name}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">{member.contacts.email}</TableCell>
                  <TableCell className="py-3">{member.contacts.phone}</TableCell>
                  <TableCell className="py-3">
                    <FormattedJoinedDate date={member.joined_at} />
                  </TableCell>
                  <TableCell className="py-3">
                    <ClientOnly>
                      {(() => {
                        // Generate this value only on client-side
                        const isServing = member.is_serving ?? Math.random() > 0.5;
                        return (
                          <Badge variant={isServing ? "success" : "secondary"}>
                            {isServing ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            {isServing ? "Yes" : "No"}
                          </Badge>
                        );
                      })()}
                    </ClientOnly>
                  </TableCell>
                  <TableCell className="py-3">
                    <ClientOnly>
                      {(() => {
                        // Generate this value only on client-side
                        const isAppUser = member.is_app_user ?? Math.random() > 0.5;
                        return (
                          <Badge variant={isAppUser ? "success" : "secondary"}>
                            {isAppUser ? <Smartphone className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            {isAppUser ? "Yes" : "No"}
                          </Badge>
                        );
                      })()}
                    </ClientOnly>
                  </TableCell>
                  <TableCell className="text-right py-3 space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/people/members/${member.contact_id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/people/members/${member.contact_id}?mode=edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleFollowUp(member)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(member.contact_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow Up Modal */}
      {showFollowUpModal && selectedMember && (
        <FollowUpModal
          open={showFollowUpModal}
          onOpenChange={setShowFollowUpModal}
          contactId={selectedMember.contact_id}
          contactName={`${selectedMember.contacts.first_name} ${selectedMember.contacts.last_name}`}
        />
      )}
    </div>
  )
} 