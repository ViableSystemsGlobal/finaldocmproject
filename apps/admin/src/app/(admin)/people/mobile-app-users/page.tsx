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
  XCircle,
  Search,
  Filter,
  TrendingUp,
  Activity,
  Sparkles,
  Phone,
  Mail,
  Clock
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
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

export default function MobileAppUsersPage() {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Mobile App Users</h2>
          <p className="text-slate-600">Fetching user data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Mobile App Users
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage church mobile app user accounts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Smartphone className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total App Users</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.total
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Registered users</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <CalendarClock className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">New This Month</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.newThisMonth
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Recent registrations</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Active This Week</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.activeThisWeek
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Recently active</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Users</h2>
                <p className="text-slate-300">Find users by name, email, or phone</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end mb-6">
              <Button 
                onClick={handleRefresh} 
                disabled={loading}
                variant="outline"
                className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Data
              </Button>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {filteredUsers.length} of {appUsers.length} users
                {filteredUsers.length !== appUsers.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Users Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 font-bold text-slate-700">Name</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Contact</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Registered</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Last Active</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <Smartphone className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No mobile app users found</h3>
                        <p className="text-slate-600">
                          {searchQuery.trim() !== ''
                            ? 'No users match your search criteria.'
                            : 'No mobile app users have been registered yet.'
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800 text-lg">
                        {user.contacts 
                          ? `${user.contacts.first_name || ''} ${user.contacts.last_name || ''}`.trim() || 'Unnamed'
                          : 'No Contact Linked'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        {user.contacts?.email && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">{user.contacts.email}</span>
                          </div>
                        )}
                        {user.contacts?.phone && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">{user.contacts.phone}</span>
                          </div>
                        )}
                        {!user.contacts?.email && !user.contacts?.phone && (
                          <span className="text-slate-500 text-sm">No contact info</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-sm">{formatDate(user.registered_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-sm">{formatDate(user.last_active)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        className={user.status === 'active' 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                          : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                        }
                      >
                        {user.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/people/mobile-app-users/${user.id}`)}
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleStatus(user)}
                          className={user.status === 'active' 
                            ? 'hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600' 
                            : 'hover:bg-green-50 hover:text-green-600 rounded-lg text-slate-600'
                          }
                        >
                          {user.status === 'active' 
                            ? <XCircle className="h-4 w-4" /> 
                            : <CheckCircle className="h-4 w-4" />
                          }
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteDialog(user)}
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
      </div>
      
      {/* Enhanced Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Delete Mobile App User</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this mobile app user? This will revoke their app access. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
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
    </div>
  )
} 