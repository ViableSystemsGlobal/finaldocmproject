'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Pencil,
  UserPlus,
  Save,
  Trash2,
  MessageSquare,
  Users,
  Calendar,
  Info,
  CalendarDays,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  fetchDiscipleshipGroup, 
  updateDiscipleshipGroup,
  fetchDisciples,
  updateDiscipleRole,
  removeDisciple,
  deleteDiscipleshipGroup,
  updateLeaderRole
} from '@/services/discipleshipGroups'
import { AddDiscipleModal } from '@/components/discipleship/AddDiscipleModal'
import { GroupMessageModal } from '@/components/discipleship/GroupMessageModal'

export default function DiscipleshipGroupDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  const groupId = params.id
  
  // State
  const [group, setGroup] = useState<any>(null)
  const [disciples, setDisciples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddDiscipleModal, setShowAddDiscipleModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  
  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      try {
        setLoading(true)
        
        // Fetch group details
        const { data: groupData, error: groupError } = await fetchDiscipleshipGroup(groupId)
        
        if (groupError) throw groupError
        if (!groupData) throw new Error('Group not found')
        
        setGroup(groupData)
        console.log('Group data loaded:', groupData);
        console.log('Leader ID:', groupData.leader_id);
        
        // Ensure leader role is set if a leader is assigned
        if (groupData.leader_id) {
          const { error: leaderError } = await updateLeaderRole(groupId, groupData.leader_id);
          if (leaderError) {
            console.error('Error ensuring leader role:', leaderError);
            // Continue anyway
          }
        }
        
        // Fetch disciples
        await loadDisciples()
      } catch (err) {
        console.error('Failed to load discipleship group:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load discipleship group'
        })
        
        // Redirect back to list after a short delay
        setTimeout(() => {
          router.push('/people/discipleship-groups')
        }, 2000)
      } finally {
        setLoading(false)
      }
    }
    
    loadGroupData()
  }, [groupId, router])
  
  // Load disciples
  const loadDisciples = async () => {
    try {
      const { data, error } = await fetchDisciples(groupId)
      
      if (error) throw error
      setDisciples(data || [])
      console.log('Disciples loaded:', data);
    } catch (err) {
      console.error('Failed to load disciples:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load disciples'
      })
    }
  }
  
  // Handle delete disciple
  const handleRemoveDisciple = async (contactId: string) => {
    try {
      const { success, error } = await removeDisciple(groupId, contactId)
      
      if (!success || error) throw error
      
      toast({
        title: 'Success',
        description: 'Disciple removed successfully'
      })
      
      // Reload disciples
      await loadDisciples()
    } catch (err) {
      console.error('Failed to remove disciple:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove disciple'
      })
    }
  }
  
  // Handle role change
  const handleRoleChange = async (contactId: string, role: string) => {
    try {
      const { data, error } = await updateDiscipleRole(groupId, contactId, role)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Role updated successfully'
      })
      
      // Reload disciples
      await loadDisciples()
    } catch (err) {
      console.error('Failed to update role:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update role'
      })
    }
  }
  
  // Handle status toggle
  const handleStatusToggle = async () => {
    if (!group) return
    
    try {
      setIsUpdating(true)
      
      const newStatus = group.status === 'active' ? 'inactive' : 'active'
      
      const { data, error } = await updateDiscipleshipGroup(groupId, {
        status: newStatus
      })
      
             if (error) throw error
       
       setGroup((prev: any) => ({
         ...prev,
         status: newStatus
       }))
      
      toast({
        title: 'Success',
        description: `Group ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      })
    } catch (err) {
      console.error('Failed to update group status:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update group status'
      })
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Handle delete group
  const confirmDeleteGroup = async () => {
    try {
      setIsDeleting(true)
      
      const { success, error } = await deleteDiscipleshipGroup(groupId)
      
      if (!success || error) throw error
      
      toast({
        title: 'Success',
        description: 'Discipleship group deleted successfully'
      })
      
      // Redirect to list
      router.push('/people/discipleship-groups')
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
    }
  }
  
  // Format custom fields for display
  const formatCustomField = (key: string, value: any) => {
    // Format keys to be more user-friendly
    const formatKey = (key: string) => {
      return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    
    // Format values based on key
    if (key === 'meeting_day' && value) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    
    if (key === 'meeting_time' && value) {
      return value // already formatted as time
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    
    return value || 'Not specified'
  }
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading discipleship group...</span>
      </div>
    )
  }
  
  if (!group) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Group not found. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/people/discipleship-groups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <div className="flex items-center space-x-2">
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
              {group.campuses?.name && (
                <Badge variant="outline">
                  {group.campuses.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowMessageModal(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            asChild={!isUpdating} 
            disabled={isUpdating}
            onClick={isUpdating ? undefined : handleStatusToggle}
          >
            {isUpdating ? (
              <div>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </div>
            ) : (
              <div>
                <Switch className="mr-2" checked={group.status === 'active'} />
                {group.status === 'active' ? 'Active' : 'Inactive'}
              </div>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            asChild
          >
            <Link href={`/people/discipleship-groups/${groupId}?mode=edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Info className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="disciples">
            <Users className="mr-2 h-4 w-4" />
            Disciples ({disciples.length})
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Calendar className="mr-2 h-4 w-4" />
            Meetings
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Details</CardTitle>
              <CardDescription>
                Basic information about this discipleship group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Leader Information */}
              {group.leader && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Group Leader</h3>
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {group.leader.first_name} {group.leader.last_name}
                      </p>
                      {group.leader.email && (
                        <p className="text-sm text-muted-foreground">{group.leader.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Custom Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                {group.custom_fields && Object.entries(group.custom_fields).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-muted-foreground text-sm">
                      {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Label>
                    <p className="font-medium">{formatCustomField(key, value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Disciples Tab */}
        <TabsContent value="disciples" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Group Members</CardTitle>
                <Button size="sm" onClick={() => setShowAddDiscipleModal(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Disciple
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {disciples.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <h3 className="text-lg font-medium">No disciples in this group yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Get started by adding your first disciple
                  </p>
                  <Button onClick={() => setShowAddDiscipleModal(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Disciple
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Leader</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disciples.map((disciple) => (
                        <TableRow key={disciple.contact_id}>
                          <TableCell>
                            <div className="font-medium">
                              {disciple.contacts?.first_name} {disciple.contacts?.last_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {disciple.contacts?.email && (
                                <div className="text-muted-foreground">{disciple.contacts.email}</div>
                              )}
                              {disciple.contacts?.phone && (
                                <div>{disciple.contacts.phone}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={disciple.role}
                              onValueChange={(value) => handleRoleChange(disciple.contact_id, value)}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mentee">Mentee</SelectItem>
                                <SelectItem value="Leader">Leader</SelectItem>
                                <SelectItem value="Co-Leader">Co-Leader</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Debug logging
                              console.log('Comparing leader:', {
                                'group.leader_id': group.leader_id,
                                'disciple.contact_id': disciple.contact_id,
                                'disciple.role': disciple.role,
                                'group.leader': group.leader,
                                'idMatch': group.leader_id === disciple.contact_id,
                                'roleMatch': disciple.role === 'Leader'
                              });
                              
                              // Check if this disciple is the leader (either by ID or role)
                              const isLeader = group.leader_id === disciple.contact_id || disciple.role === 'Leader';
                              
                              // Return the appropriate UI
                              return isLeader ? (
                                <Badge className="bg-primary text-primary-foreground">
                                  Group Leader
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {disciple.joined_at ? new Date(disciple.joined_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDisciple(disciple.contact_id)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Meetings Tab */}
        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>
                Schedule and manage group meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-dashed p-8 text-center">
                <CalendarDays className="h-10 w-10 mb-4 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">Meeting Management Coming Soon</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  This feature will allow you to schedule recurring meetings, track attendance, and send automatic reminders.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Discipleship Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this discipleship group? This action cannot be undone.
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
              onClick={confirmDeleteGroup}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete Group'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Disciple Modal */}
      <AddDiscipleModal
        groupId={groupId}
        isOpen={showAddDiscipleModal}
        onClose={() => setShowAddDiscipleModal(false)}
        onDiscipleAdded={loadDisciples}
      />
      
      {/* Message Modal */}
      <GroupMessageModal
        groupId={groupId}
        groupName={group.name}
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
      />
    </div>
  )
} 