'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  Users,
  Home,
  LayoutGrid,
  Mail,
  UsersRound,
  TrendingUp,
  Activity,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MetricCard } from '@/components/MetricCard'
import { GroupMessageModal } from '@/components/GroupMessageModal'
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
import { toast } from '@/components/ui/use-toast'
import { Group, fetchGroups, deleteGroup, getGroupsCount, getActiveGroupsCount, getTotalGroupMembersCount, fetchGroupMemberIds } from '@/services/groups'

type GroupMetrics = {
  total: number;
  active: number;
  totalMembers: number;
  loading: boolean;
}

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // UI state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([])
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Checkbox selection state
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Metrics state
  const [metrics, setMetrics] = useState<GroupMetrics>({
    total: 0,
    active: 0,
    totalMembers: 0,
    loading: true
  })

  // Load groups data
  useEffect(() => {
    const loadGroups = async () => {
      try {
        // Add debug info first
        console.log('Fetching groups...');
        
        const { data, error } = await fetchGroups()
        
        if (error) {
          console.error('Error details:', error);
          throw error
        }
        
        // Type assertion and calculate member count
        const groupsWithCounts = (data as any[] || []).map(group => ({
          ...group,
          member_count: group.group_memberships ? group.group_memberships.length : 0
        })) as Group[]
        
        console.log('Groups data with member counts:', groupsWithCounts)
        
        setGroups(groupsWithCounts)
        setFilteredGroups(groupsWithCounts)
      } catch (err) {
        console.error('Failed to load groups:', err)
        setError(err instanceof Error ? err.message : 'Failed to load groups')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load groups. Check console for details.'
        })
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  // Load metrics data
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Get total groups count
        const { count: total, error: totalError } = await getGroupsCount()
        if (totalError) throw totalError

        // Get active groups count
        const { count: active, error: activeError } = await getActiveGroupsCount()
        if (activeError) throw activeError

        // Get total group members count
        const { data: totalMembersData, error: membersError } = await getTotalGroupMembersCount()
        if (membersError) throw membersError
        
        // RPC returns an array with a single object containing count
        const totalMembers = totalMembersData && totalMembersData[0]?.count ? Number(totalMembersData[0].count) : 0

        setMetrics({
          total: total || 0,
          active: active || 0,
          totalMembers: totalMembers,
          loading: false
        })
      } catch (err) {
        console.error('Failed to load metrics:', err)
        // Don't show an error toast for metrics, just log it
      }
    }

    loadMetrics()
  }, [])

  // Apply filters when any filter changes
  useEffect(() => {
    if (!groups.length) return
    
    let filtered = [...groups]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(query) ||
        (group.campus?.name || '').toLowerCase().includes(query)
      )
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(group => group.type === typeFilter)
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => group.status === statusFilter)
    }
    
    setFilteredGroups(filtered)
  }, [groups, searchQuery, typeFilter, statusFilter])

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const handleSendMessage = async (group: Group) => {
    setSelectedGroup(group)
    
    try {
      // Fetch member IDs for the group
      const { data: memberIds, error } = await fetchGroupMemberIds(group.id)
      
      if (error) {
        console.error('Error fetching group member IDs:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch group members'
        })
        return
      }
      
      setSelectedGroupMemberIds(memberIds || [])
      setShowMessageModal(true)
    } catch (err) {
      console.error('Error preparing group message:', err)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    try {
      setIsDeleting(true)
      const { error } = await deleteGroup(deleteId)
      if (error) throw error

      // Remove group from local state
      setGroups(prev => prev.filter(group => group.id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Group deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  const getUniqueTypes = () => {
    return Array.from(new Set(groups.map(group => group.type))).filter(Boolean)
  }

  const getUniqueStatuses = () => {
    return Array.from(new Set(groups.map(group => group.status))).filter(Boolean)
  }

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedGroups(new Set(filteredGroups.map(group => group.id)))
    } else {
      setSelectedGroups(new Set())
    }
  }

  const handleSelectGroup = (groupId: string, checked: boolean) => {
    const newSelected = new Set(selectedGroups)
    if (checked) {
      newSelected.add(groupId)
    } else {
      newSelected.delete(groupId)
      setSelectAll(false)
    }
    setSelectedGroups(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedGroups.size === 0) return
    
    const selectedGroupsList = Array.from(selectedGroups)
    const groupNames = selectedGroupsList.map(id => {
      const group = groups.find(g => g.id === id)
      return group ? group.name : 'Unknown'
    })

    const confirmMessage = `Are you sure you want to delete ${selectedGroups.size} group${selectedGroups.size > 1 ? 's' : ''}?\n\n${groupNames.slice(0, 5).join(', ')}${groupNames.length > 5 ? '\n...and ' + (groupNames.length - 5) + ' more' : ''}`
    
    if (!confirm(confirmMessage)) return
    
    try {
      setIsBulkDeleting(true)
      
      let successCount = 0
      let failedGroups: string[] = []
      
      for (const groupId of selectedGroupsList) {
        try {
          const { error } = await deleteGroup(groupId)
          if (error) throw error
          successCount++
        } catch (error) {
          const group = groups.find(g => g.id === groupId)
          const name = group ? group.name : 'Unknown'
          failedGroups.push(name)
        }
      }
      
      // Remove successfully deleted groups from state
      setGroups(prev => prev.filter(group => !selectedGroupsList.includes(group.id) || failedGroups.includes(group.name)))
      setFilteredGroups(prev => prev.filter(group => !selectedGroupsList.includes(group.id) || failedGroups.includes(group.name)))
      
      // Clear selections
      setSelectedGroups(new Set())
      setSelectAll(false)
      
      if (failedGroups.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial deletion completed',
          description: `${successCount} group${successCount !== 1 ? 's' : ''} deleted successfully. ${failedGroups.length} failed: ${failedGroups.slice(0, 3).join(', ')}${failedGroups.length > 3 ? ' and ' + (failedGroups.length - 3) + ' more' : ''}`,
        })
      } else {
        toast({
          title: 'Success',
          description: `${successCount} group${successCount !== 1 ? 's' : ''} deleted successfully.`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete groups.',
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Groups</h2>
          <p className="text-slate-600">Fetching group data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-2xl">
                  <UsersRound className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Ministries & Groups
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage church ministries and small groups
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {selectedGroups.size > 0 && (
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
                      Delete Selected ({selectedGroups.size})
                    </>
                  )}
                </Button>
              )}
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/people/groups/new">
                  <Plus className="mr-2 h-5 w-5" /> Create New Group
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UsersRound className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Total Groups</p>
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
                <TrendingUp className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">All groups</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Active Groups</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.active
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Currently meeting</span>
              </div>
            </div>
          </div>

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
                      metrics.totalMembers
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Across all groups</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <LayoutGrid className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Avg Group Size</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.total > 0 ? Math.round(metrics.totalMembers / metrics.total) : 0
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Members per group</span>
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
                <h2 className="text-2xl font-bold text-white">Search & Filter Groups</h2>
                <p className="text-slate-300">Find groups by name, campus, type, or status</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by group name or campus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-amber-500 focus:ring-amber-500"
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Group Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getUniqueTypes().map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block" style={{ color: 'rgb(15, 23, 42)' }}>
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50" style={{ color: 'rgb(15, 23, 42)' }}>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {getUniqueStatuses().map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                  style={{ color: 'rgb(15, 23, 42)' }}
                >
                  <Filter className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>
                Showing {filteredGroups.length} of {groups.length} groups
                {filteredGroups.length !== groups.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl mb-8">
            <span className="block sm:inline font-medium">{error}</span>
          </div>
        )}

        {/* Enhanced Groups Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 w-12">
                  <Checkbox
                    checked={selectAll && filteredGroups.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={filteredGroups.length === 0}
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Image</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Group Name</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Type</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Campus</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Members</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <UsersRound className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No groups found</h3>
                        <p className="text-slate-600">
                          {filteredGroups.length === 0 && groups.length > 0 
                            ? "No groups match your search criteria."
                            : "No groups found. Create your first group."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGroups.map((group) => (
                  <TableRow key={group.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4 text-slate-600">
                      <Checkbox
                        checked={selectedGroups.has(group.id)}
                        onCheckedChange={(checked) => handleSelectGroup(group.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center justify-center">
                        {group.image_url ? (
                          <img 
                            src={group.image_url} 
                            alt={`${group.name} image`}
                            className="w-12 h-12 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-200 flex items-center justify-center">
                            <UsersRound className="h-6 w-6 text-slate-500" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800">{group.name}</div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
                        {group.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {group.campus?.name || 'No Campus'}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={group.status === 'active' ? "default" : "secondary"} className={
                        group.status === 'active' 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                          : "bg-slate-100 text-slate-700"
                      }>
                        {group.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{group.member_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/groups/${group.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/groups/${group.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSendMessage(group)}
                          className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(group.id)}
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
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full mx-4 border border-white/20">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800">Confirm Delete</h3>
              <p className="text-sm text-slate-600 mt-2">Are you sure you want to delete this group? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
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
            </div>
          </div>
        </div>
      )}

      {/* Group Message Modal */}
      {showMessageModal && selectedGroup && (
        <GroupMessageModal
          open={showMessageModal}
          onOpenChange={setShowMessageModal}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          recipientIds={selectedGroupMemberIds}
        />
      )}
    </div>
  )
} 