'use client'

import { useState, useEffect, ReactNode, useMemo } from 'react'
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
  FileText,
  Search,
  Filter,
  UserPlus,
  TrendingUp,
  Activity,
  Sparkles,
  UserCheck,
  UserX,
  Calendar,
  Heart,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
// import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pagination, usePagination } from '@/components/ui/pagination'
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { safeFormatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ProtectedRoute, RequirePermission } from '@/components/auth/ProtectedRoute'
import {
  fetchMembers,
  deleteMember,
  getMembersCount,
  getNewMembersThisMonth,
  getMembersServing,
  getMemberAppUsers
} from '@/services/members'
import { toast as showToast } from '@/components/ui/use-toast'

// Mock the Dialog components for now
const Dialog = ({ open, onOpenChange, children }: any) => (
  open ? <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">{children}</div> : null
)
const DialogContent = ({ children }: any) => <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">{children}</div>
const DialogHeader = ({ children }: any) => <div className="mb-6">{children}</div>
const DialogFooter = ({ children }: any) => <div className="flex justify-end gap-3 mt-6">{children}</div>
const DialogTitle = ({ children }: any) => <h3 className="text-xl font-bold text-slate-800">{children}</h3>
const DialogDescription = ({ children }: any) => <p className="text-sm text-slate-600 mt-2">{children}</p>

// Mock toast functions
const toast = ({ title, description, variant }: any) => {
  console.log(`Toast: ${variant || 'default'} - ${title} - ${description}`)
}

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

function MembersPageContent() {
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

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [servingFilter, setServingFilter] = useState('all')
  const [appUserFilter, setAppUserFilter] = useState('all')
  const [joinedDateFilter, setJoinedDateFilter] = useState('all')

  // Checkbox selection state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  // Filtered Data
  const filteredMembers = useMemo(() => {
    let filtered = members.filter(member => {
      // Search filter
      const searchTerm = searchQuery.toLowerCase()
      const fullName = `${member.contacts.first_name} ${member.contacts.last_name}`.toLowerCase()
      const matchesSearch = fullName.includes(searchTerm) || 
                           member.contacts.email.toLowerCase().includes(searchTerm) ||
                           member.contacts.phone.includes(searchTerm)

      // Serving filter
      let matchesServing = true
      if (servingFilter === 'serving') {
        matchesServing = member.is_serving === true
      } else if (servingFilter === 'not-serving') {
        matchesServing = member.is_serving !== true
      }

      // App user filter
      let matchesAppUser = true
      if (appUserFilter === 'app-user') {
        matchesAppUser = member.is_app_user === true
      } else if (appUserFilter === 'not-app-user') {
        matchesAppUser = member.is_app_user !== true
      }

      // Date filter
      let matchesDate = true
      if (joinedDateFilter !== 'all') {
        const joinedDate = new Date(member.joined_at)
        const now = new Date()
        
        switch (joinedDateFilter) {
          case 'this-month':
            matchesDate = joinedDate.getMonth() === now.getMonth() && 
                         joinedDate.getFullYear() === now.getFullYear()
            break
          case 'this-year':
            matchesDate = joinedDate.getFullYear() === now.getFullYear()
            break
          case 'last-year':
            matchesDate = joinedDate.getFullYear() === now.getFullYear() - 1
            break
        }
      }

      return matchesSearch && matchesServing && matchesAppUser && matchesDate
    })

    return filtered
  }, [members, searchQuery, servingFilter, appUserFilter, joinedDateFilter])

  // Pagination
  const pagination = usePagination(filteredMembers, 10)

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await fetchMembers()
        if (error) {
          setError(typeof error === 'string' ? error : 'Failed to load members')
          return
        }
        
        // Use the actual data from fetchMembers service which already includes is_serving and is_app_user
        setMembers((data || []) as Member[])
      } catch (err) {
        console.error('Error loading members:', err)
        setError('Failed to load members')
      } finally {
        setLoading(false)
      }
    }

    const loadMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true }))
        
        const [
          totalResult,
          newThisMonthResult,
          servingResult,
          appUsersResult
        ] = await Promise.all([
          getMembersCount(),
          getNewMembersThisMonth(),
          getMembersServing(),
          getMemberAppUsers()
        ])

        // Calculate percentage serving
        let percentageServing = 0
        if (totalResult.count && servingResult.data && typeof totalResult.count === 'number' && typeof servingResult.data === 'number') {
          percentageServing = Math.round((servingResult.data / totalResult.count) * 100)
        }

        setMetrics({
          total: totalResult.count || 0,
          newThisMonth: newThisMonthResult.count || 0,
          percentageServing: percentageServing,
          appUsers: typeof appUsersResult.data === 'number' ? appUsersResult.data : 0,
          loading: false
        })
      } catch (err) {
        console.error('Error loading metrics:', err)
        setMetrics(prev => ({ ...prev, loading: false }))
      }
    }

    loadMembers()
    loadMetrics()
  }, [])

  // Pagination automatically resets when filteredMembers changes

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      const { error } = await deleteMember(deleteId)
      if (error) {
        setError(error.message || 'Failed to delete member')
        return
      }

      // Remove member from local state
      setMembers(prev => prev.filter(member => member.contact_id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Member deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Error deleting member:', err)
      setError('Failed to delete member')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleFollowUp = (member: any) => {
    setSelectedMember(member)
    setShowFollowUpModal(true)
  }

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedMembers(new Set(filteredMembers.map(member => member.contact_id)))
    } else {
      setSelectedMembers(new Set())
    }
  }

  const handleSelectMember = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers)
    if (checked) {
      newSelected.add(memberId)
    } else {
      newSelected.delete(memberId)
      setSelectAll(false)
    }
    setSelectedMembers(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedMembers.size === 0) return
    
    const selectedMembersList = Array.from(selectedMembers)
    const memberNames = selectedMembersList.map(id => {
      const member = members.find(m => m.contact_id === id)
      return member ? `${member.contacts.first_name} ${member.contacts.last_name}` : 'Unknown'
    })

    const confirmMessage = `Are you sure you want to delete ${selectedMembers.size} member${selectedMembers.size > 1 ? 's' : ''}?\n\n${memberNames.slice(0, 5).join(', ')}${memberNames.length > 5 ? '\n...and ' + (memberNames.length - 5) + ' more' : ''}`
    
    if (!confirm(confirmMessage)) return
    
    try {
      setIsBulkDeleting(true)
      
      let successCount = 0
      let failedMembers: string[] = []
      
      for (const memberId of selectedMembersList) {
        try {
          const { error } = await deleteMember(memberId)
          if (error) throw error
          successCount++
        } catch (error) {
          const member = members.find(m => m.contact_id === memberId)
          const name = member ? `${member.contacts.first_name} ${member.contacts.last_name}` : 'Unknown'
          failedMembers.push(name)
        }
      }
      
      // Remove successfully deleted members from state
      setMembers(prev => prev.filter(member => !selectedMembersList.includes(member.contact_id) || failedMembers.includes(`${member.contacts.first_name} ${member.contacts.last_name}`)))
      
      // Clear selections
      setSelectedMembers(new Set())
      setSelectAll(false)
      
      if (failedMembers.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial deletion completed',
          description: `${successCount} member${successCount !== 1 ? 's' : ''} deleted successfully. ${failedMembers.length} failed: ${failedMembers.slice(0, 3).join(', ')}${failedMembers.length > 3 ? ' and ' + (failedMembers.length - 3) + ' more' : ''}`,
        })
      } else {
        toast({
          title: 'Success',
          description: `${successCount} member${successCount !== 1 ? 's' : ''} deleted successfully.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete members.',
      })
    } finally {
      setIsBulkDeleting(false)
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Members</h2>
          <p className="text-slate-600">Fetching member data...</p>
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
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Members Directory
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage your church community
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {selectedMembers.size > 0 && (
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
                      Delete Selected ({selectedMembers.size})
                    </>
                  )}
                </Button>
              )}
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/people/members/new">
                  <Plus className="mr-2 h-5 w-5" /> Add New Member
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Members</p>
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
                <span className="text-blue-100 text-sm font-medium">Active community</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserPlus className="h-8 w-8" />
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
                <TrendingUp className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Growing community</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Serving in Ministry</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${metrics.percentageServing}%`
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Active volunteers</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Smartphone className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">App Users</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.appUsers
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Digital engagement</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Members</h2>
                <p className="text-slate-300">Find members by name, email, or phone. Filter by serving status and more.</p>
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
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Serving Status
                </label>
                <Select value={servingFilter} onValueChange={setServingFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="serving">Serving in Ministry</SelectItem>
                    <SelectItem value="not-serving">Not Serving</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  App User Status
                </label>
                <Select value={appUserFilter} onValueChange={setAppUserFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="app-user">App Users</SelectItem>
                    <SelectItem value="not-app-user">Not App Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Joined Date
                </label>
                <Select value={joinedDateFilter} onValueChange={setJoinedDateFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="last-year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Items per Page
                </label>
                <Select value={pagination.itemsPerPage.toString()} onValueChange={(value) => pagination.handleItemsPerPageChange(parseInt(value))}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>
                Showing {pagination.currentItems.length} of {filteredMembers.length} members
                {filteredMembers.length !== members.length && ` (filtered from ${members.length} total)`}
              </span>
              {(searchQuery || servingFilter !== 'all' || appUserFilter !== 'all' || joinedDateFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setServingFilter('all')
                    setAppUserFilter('all')
                    setJoinedDateFilter('all')
                  }}
                  className="rounded-xl border-2 px-6"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-8">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}

        {/* Enhanced Members Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table className="border-collapse">
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 w-12">
                  <Checkbox
                    checked={selectAll && filteredMembers.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={filteredMembers.length === 0}
                  />
                </TableHead>
                <TableHead className="w-[80px] py-4 font-bold text-slate-700">Profile</TableHead>
                <TableHead className="w-[170px] min-w-[150px] py-4 font-bold text-slate-700">Name</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Email</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Phone</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Joined Date</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Serving?</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">App User?</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No members found</h3>
                        <p className="text-slate-600">
                          {filteredMembers.length === 0 && members.length > 0 
                            ? "No members match your search criteria. Try adjusting your filters."
                            : "No members found. Create your first member."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((member: Member) => (
                  <TableRow key={member.contact_id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4 text-slate-600">
                      <Checkbox
                        checked={selectedMembers.has(member.contact_id)}
                        onCheckedChange={(checked) => handleSelectMember(member.contact_id, checked)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <Avatar 
                        src={member.contacts.profile_image} 
                        alt={`${member.contacts.first_name} ${member.contacts.last_name}`}
                        size="md"
                        className="border-2 border-slate-200 shadow-md mx-auto"
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800">
                        {member.contacts.first_name} {member.contacts.last_name}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">{member.contacts.email}</TableCell>
                    <TableCell className="py-4 text-slate-600">{member.contacts.phone}</TableCell>
                    <TableCell className="py-4 text-slate-600">
                      <FormattedJoinedDate date={member.joined_at} />
                    </TableCell>
                    <TableCell className="py-4">
                      <ClientOnly>
                        {(() => {
                          // Generate this value only on client-side
                          const isServing = member.is_serving ?? false;
                          return (
                            <Badge variant={isServing ? "success" : "secondary"}>
                              {isServing ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              {isServing ? "Yes" : "No"}
                            </Badge>
                          );
                        })()}
                      </ClientOnly>
                    </TableCell>
                    <TableCell className="py-4">
                      <ClientOnly>
                        {(() => {
                          // Generate this value only on client-side
                          const isAppUser = member.is_app_user ?? false;
                          return (
                            <Badge variant={isAppUser ? "success" : "secondary"}>
                              {isAppUser ? <Smartphone className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              {isAppUser ? "Yes" : "No"}
                            </Badge>
                          );
                        })()}
                      </ClientOnly>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/members/${member.contact_id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/members/${member.contact_id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleFollowUp(member)}
                          className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(member.contact_id)}
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
          
          {/* Pagination */}
          {filteredMembers.length > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.handlePageChange}
              onItemsPerPageChange={pagination.handleItemsPerPageChange}
            />
          )}
        </div>
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
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

export default function MembersPage() {
  return (
    <ProtectedRoute requiredPermissions={['members:view:all', 'contacts:view:all']}>
      <MembersPageContent />
    </ProtectedRoute>
  )
} 