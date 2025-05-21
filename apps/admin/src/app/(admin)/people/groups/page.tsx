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
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
        
        // Type assertion
        const groupData = data as unknown as Group[] || []
        
        console.log('Groups data:', groupData)
        
        setGroups(groupData)
        setFilteredGroups(groupData)
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

  // Handle sending a message to a group
  const handleSendMessage = async (group: Group) => {
    setSelectedGroup(group)
    
    try {
      // Fetch member IDs for this group
      const { data, error } = await fetchGroupMemberIds(group.id)
      
      if (error) {
        throw error
      }
      
      setSelectedGroupMemberIds(data || [])
      setShowMessageModal(true)
    } catch (err) {
      console.error('Failed to load group member IDs:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load group members'
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    
    try {
      const { error } = await deleteGroup(deleteId)
      if (error) throw error
      
      // Update local state
      setGroups(prev => prev.filter(group => group.id !== deleteId))
      
      toast({
        title: 'Success',
        description: 'Group deleted successfully'
      })
    } catch (err) {
      console.error('Failed to delete group:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete group'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteId(null)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading groups...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ministries & Groups</h1>
      
      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          title="Total Groups" 
          value={metrics.loading ? 0 : metrics.total}
          icon={<LayoutGrid className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard 
          title="Active Groups" 
          value={metrics.loading ? 0 : metrics.active}
          icon={<Users className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard 
          title="Total Group Members" 
          value={metrics.loading ? 0 : metrics.totalMembers}
          icon={<Users className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>
      
      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Groups List</CardTitle>
              <CardDescription>
                View and manage church ministries and groups
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/people/groups/new">
                <Plus className="mr-2 h-4 w-4" />
                New Group
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Group Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="ministry">Ministry</SelectItem>
                    <SelectItem value="small_group">Small Group</SelectItem>
                    <SelectItem value="discipleship">Discipleship</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="min-w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                  <Button variant="outline" onClick={resetFilters} size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredGroups.length} of {groups.length} groups
            </div>
            
            {/* Groups Table */}
            {filteredGroups.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto w-full max-w-lg">
                  <h3 className="text-lg font-medium">No groups found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {groups.length === 0 
                      ? "You haven't added any groups yet. Get started by adding your first group."
                      : "No groups match your current filters. Try changing your search or filter criteria."}
                  </p>
                  {groups.length === 0 && (
                    <Button className="mt-4" asChild>
                      <Link href="/people/groups/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Group
                      </Link>
                    </Button>
                  )}
                  {groups.length > 0 && filteredGroups.length === 0 && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={resetFilters}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Reset Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Campus</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          {group.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {group.type === 'ministry' ? 'Ministry' : 
                             group.type === 'small_group' ? 'Small Group' : 
                             group.type === 'discipleship' ? 'Discipleship' : group.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {group.campus?.name || 'No campus'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={group.status === 'active' ? "success" : "outline"}>
                            {group.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {group.member_count || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <span className="sr-only">Open menu</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <circle cx="5" cy="12" r="1" />
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/people/groups/${group.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/people/groups/${group.id}?mode=edit`}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleSendMessage(group)}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(group.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone and will remove all member associations.
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
                'Delete Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Message Modal */}
      {selectedGroup && (
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