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
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Group, 
  fetchDiscipleshipGroups, 
  deleteDiscipleshipGroup,
  getDiscipleshipGroupsMetrics
} from '@/services/discipleshipGroups'
import { GroupMessageModal } from '@/components/discipleship/GroupMessageModal'

export default function DiscipleshipGroupsPage() {
  // State
  const [groups, setGroups] = useState<Group[]>([])
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
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Message modal states
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  
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
  const openDeleteDialog = (group: Group) => {
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
  const openMessageModal = (group: Group) => {
    setSelectedGroup(group)
    setShowMessageModal(true)
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading discipleship groups...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Discipleship Groups</h1>

      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Discipleship Groups"
          value={metrics.loading ? 0 : metrics.totalGroups}
          icon={<BookOpen className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Active Discipleship Groups"
          value={metrics.loading ? 0 : metrics.activeGroups}
          icon={<UserCheck className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
        <MetricCard
          title="Total Disciples"
          value={metrics.loading ? 0 : metrics.totalDisciples}
          icon={<Users className="h-6 w-6" />}
          loading={metrics.loading}
          formatter="number"
        />
      </div>

      {/* Groups List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Discipleship Groups</CardTitle>
              <CardDescription>
                {filteredGroups.length} discipleship groups found
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/people/discipleship-groups/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Discipleship Group
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or campus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Groups Table */}
            {filteredGroups.length === 0 ? (
              <div className="rounded-md border border-dashed p-10 text-center">
                <h3 className="text-lg font-medium">No discipleship groups found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery.trim() !== '' 
                    ? 'Try adjusting your search query' 
                    : 'Get started by creating your first discipleship group'}
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/people/discipleship-groups/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Discipleship Group
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Campus</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <div className="font-medium">{group.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={group.status === 'active' ? 'default' : 'secondary'}
                            className={
                              group.status === 'active' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                            }
                          >
                            {group.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {group.campus?.name || 'No Campus'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            console.log('Group leader data:', group.leader, 'Leader ID:', group.leader_id);
                            return group.leader ? (
                              <div className="flex items-center">
                                <span className="text-sm">
                                  {group.leader.first_name || ''} {group.leader.last_name || ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Not assigned {group.leader_id ? `(ID: ${group.leader_id})` : ''}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {group.member_count || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="View group"
                            >
                              <Link href={`/people/discipleship-groups/${group.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Edit group"
                            >
                              <Link href={`/people/discipleship-groups/${group.id}?mode=edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openMessageModal(group)}
                              title="Send message"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(group)}
                              title="Delete group"
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
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discipleship Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the discipleship group &quot;{deleteGroup?.name}&quot;? This action cannot be undone.
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
      
      {/* Message Modal */}
      {selectedGroup && (
        <GroupMessageModal
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  )
} 