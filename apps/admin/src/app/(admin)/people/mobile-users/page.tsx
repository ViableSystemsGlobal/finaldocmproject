'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Smartphone, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Plus, 
  CalendarClock, 
  Users,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/MetricCard'
import { MobileAppUser, fetchAppUsers, deleteAppUser, updateAppUser, getAppUserMetrics } from '@/services/mobileAppUsers'

export default function MobileUsersPage() {
  const router = useRouter()
  
  // States
  const [appUsers, setAppUsers] = useState<MobileAppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [metrics, setMetrics] = useState({
    total: 0,
    newThisMonth: 0,
    activeThisWeek: 0,
    loading: true
  })
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingUser, setDeletingUser] = useState<MobileAppUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getAppUserMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Fetch app users
        const { data, error } = await fetchAppUsers()
        
        if (error) throw error
        
        setAppUsers((data || []) as unknown as MobileAppUser[])
      } catch (err) {
        console.error('Failed to load mobile app user data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load mobile app user data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])
  
  // Handle refresh data
  const handleRefresh = async () => {
    try {
      setLoading(true)
      
      // Refresh metrics
      const metricsResponse = await getAppUserMetrics()
      if (metricsResponse.error) {
        throw metricsResponse.error
      }
      
      setMetrics({
        ...metricsResponse,
        loading: false
      })
      
      // Refresh app users
      const { data, error } = await fetchAppUsers()
      
      if (error) throw error
      
      setAppUsers((data || []) as unknown as MobileAppUser[])
      
      toast({
        title: 'Success',
        description: 'Mobile app user data refreshed'
      })
    } catch (err) {
      console.error('Failed to refresh mobile app user data:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh mobile app user data'
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Handle delete
  const openDeleteDialog = (user: MobileAppUser) => {
    setDeletingUser(user)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deletingUser) return
    
    try {
      setIsDeleting(true)
      
      const { error } = await deleteAppUser(deletingUser.id)
      
      if (error) throw error
      
      // Remove deleted user from state
      setAppUsers(appUsers.filter(u => u.id !== deletingUser.id))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }))
      
      toast({
        title: 'Success',
        description: 'Mobile app user deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete mobile app user:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete mobile app user'
      })
    } finally {
      setIsDeleting(false)
      setDeletingUser(null)
    }
  }
  
  // Handle toggle status
  const handleToggleStatus = async (user: MobileAppUser) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      
      const { error } = await updateAppUser(user.id, { status: newStatus })
      
      if (error) throw error
      
      // Update user in state
      setAppUsers(appUsers.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ))
      
      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}`
      })
    } catch (err) {
      console.error('Failed to update user status:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user status'
      })
    }
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Filter app users based on search query
  const filteredUsers = appUsers.filter(user => {
    const contactName = user.contacts ? 
      `${user.contacts.first_name || ''} ${user.contacts.last_name || ''}`.trim().toLowerCase() : ''
    const email = user.contacts?.email?.toLowerCase() || ''
    const phone = user.contacts?.phone?.toLowerCase() || ''
    
    const searchLower = searchQuery.toLowerCase()
    
    return searchLower === '' || 
      contactName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
  })
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mobile App Users</h1>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total App Users"
          value={metrics.loading ? 0 : metrics.total}
          icon={<Smartphone className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="New This Month"
          value={metrics.loading ? 0 : metrics.newThisMonth}
          icon={<CalendarClock className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Active This Week"
          value={metrics.loading ? 0 : metrics.activeThisWeek}
          icon={<Users className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>

      {/* Users List */}
      <div className="rounded-md border">
        <div className="p-4 flex justify-between items-center">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </div>
        
        <div className="border-t">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading mobile app users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center">
              <h3 className="text-lg font-medium">No mobile app users found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery.trim() !== ''
                  ? 'Try adjusting your search' 
                  : 'No mobile app users have been registered yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Registered At</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.contacts 
                          ? `${user.contacts.first_name || ''} ${user.contacts.last_name || ''}`.trim() || 'Unnamed'
                          : 'No Contact Linked'
                        }
                      </TableCell>
                      <TableCell>
                        {user.contacts?.email || '—'}
                      </TableCell>
                      <TableCell>
                        {user.contacts?.phone || '—'}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.registered_at)}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.last_active)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={user.status === 'active' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                          }
                        >
                          {user.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => router.push(`/people/mobile-users/${user.id}`)}
                          >
                            <span className="sr-only">View details</span>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => handleToggleStatus(user)}
                          >
                            <span className="sr-only">Toggle status</span>
                            {user.status === 'active' 
                              ? <XCircle className="h-4 w-4 text-red-500" /> 
                              : <CheckCircle className="h-4 w-4 text-green-500" />
                            }
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500" 
                            onClick={() => openDeleteDialog(user)}
                          >
                            <span className="sr-only">Delete</span>
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
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mobile App User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mobile app user? This will revoke their app access. This action cannot be undone.
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
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 