'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  PlusCircle, 
  Loader2, 
  Search, 
  Eye, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  BookOpen,
  UserCheck,
  Filter,
  TrendingUp,
  Activity,
  Sparkles,
  BarChart3,
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { MetricCard } from '@/components/MetricCard'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { 
  DiscipleshipGroup, 
  fetchDiscipleshipGroups, 
  deleteDiscipleshipGroup,
  getDiscipleshipGroupsMetrics
} from '@/services/discipleshipGroups'
import { GroupMessageModal } from '@/components/discipleship/GroupMessageModal'

export default function DiscipleshipGroupsPage() {
  // State
  const [groups, setGroups] = useState<DiscipleshipGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    totalGroups: 0,
    activeGroups: 0,
    totalDisciples: 0,
    loading: true
  })
  
  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteGroup, setDeleteGroup] = useState<DiscipleshipGroup | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Checkbox selection state
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Message modal states
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<DiscipleshipGroup | null>(null)
  
  // Load initial data and metrics
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        
        // Load metrics first
        const metricsResponse = await getDiscipleshipGroupsMetrics()
        if (metricsResponse.error) {
          throw metricsResponse.error
        }
        
        setMetrics({
          ...metricsResponse,
          loading: false
        })
        
        // Fetch discipleship groups
        const { data, error } = await fetchDiscipleshipGroups()
        
        if (error) throw error
        
        console.log('Loaded discipleship groups:', data);
        console.log('First group sample:', data.length > 0 ? data[0] : 'No groups');
        
        setGroups(data || [])
      } catch (err) {
        console.error('Failed to load discipleship groups data:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load discipleship groups data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadInitialData()
  }, [])
  
  // Filter groups based on search query
  const filteredGroups = searchQuery.trim() === '' 
    ? groups 
    : groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.campus?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
  
  // Handle delete
  const openDeleteDialog = (group: DiscipleshipGroup) => {
    setDeleteGroup(group)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = async () => {
    if (!deleteGroup) return
    
    try {
      setIsDeleting(true)
      
      const { success, error } = await deleteDiscipleshipGroup(deleteGroup.id)
      
      if (!success || error) throw error
      
      // Remove deleted group from state
      setGroups(groups.filter(g => g.id !== deleteGroup.id))
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalGroups: Math.max(0, prev.totalGroups - 1),
        activeGroups: deleteGroup.status === 'active' 
          ? Math.max(0, prev.activeGroups - 1) 
          : prev.activeGroups
      }))
      
      toast({
        title: 'Success',
        description: 'Discipleship group deleted successfully'
      })
      
      setShowDeleteDialog(false)
    } catch (err) {
      console.error('Failed to delete discipleship group:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete discipleship group'
      })
    } finally {
      setIsDeleting(false)
      setDeleteGroup(null)
    }
  }
  
  // Handle open message modal
  const openMessageModal = (group: DiscipleshipGroup) => {
    setSelectedGroup(group)
    setShowMessageModal(true)
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
          const { success, error } = await deleteDiscipleshipGroup(groupId)
          if (!success || error) throw error
          successCount++
        } catch (error) {
          const group = groups.find(g => g.id === groupId)
          const name = group ? group.name : 'Unknown'
          failedGroups.push(name)
        }
      }
      
      // Remove successfully deleted groups from state
      setGroups(prev => prev.filter(group => !selectedGroupsList.includes(group.id) || failedGroups.includes(group.name)))
      
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Discipleship Groups</h2>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-violet-500 to-purple-500 p-4 rounded-2xl">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Discipleship Groups
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Nurture spiritual growth and community
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
                <Link href="/people/discipleship/new">
                  <PlusCircle className="mr-2 h-5 w-5" /> Create Group
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-violet-100 text-sm font-medium">Total Groups</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalGroups
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-200" />
                <span className="text-violet-100 text-sm font-medium">All discipleship groups</span>
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
                      metrics.activeGroups
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
                  <p className="text-blue-100 text-sm font-medium">Total Disciples</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalDisciples
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Growing in faith</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Avg Group Size</p>
                  <p className="text-3xl font-bold">
                    {metrics.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      metrics.totalGroups > 0 ? Math.round(metrics.totalDisciples / metrics.totalGroups) : 0
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Members per group</span>
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
                <p className="text-slate-300">Find discipleship groups by name or campus</p>
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
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-violet-500 focus:ring-violet-500"
              />
            </div>

            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {filteredGroups.length} of {groups.length} groups
                {filteredGroups.length !== groups.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

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
                <TableHead className="py-4 font-bold text-slate-700">Group Name</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Campus</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Leader</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Members</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No discipleship groups found</h3>
                        <p className="text-slate-600">
                          {groups.length === 0 
                            ? "No groups found. Create your first discipleship group."
                            : "No groups match your search criteria."
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
                      <div className="font-semibold text-slate-800">{group.name}</div>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {group.campus?.name || 'No Campus'}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {group.leader ? 
                        `${group.leader.first_name} ${group.leader.last_name}` : 
                        'No Leader'
                      }
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
                          <Link href={`/people/discipleship/${group.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Link href={`/people/discipleship/${group.id}?mode=edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openMessageModal(group)}
                          className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteDialog(group)}
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
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to delete "{deleteGroup?.name}"? This action cannot be undone.
              </p>
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
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
        />
      )}
    </div>
  )
} 