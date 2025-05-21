'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { 
  Loader2, 
  Users, 
  Calendar, 
  Edit, 
  Trash2,
  UserPlus,
  UserMinus,
  Info,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { AddMemberModal } from '@/components/AddMemberModal'
import { GroupMessageModal } from '@/components/GroupMessageModal'
import { fetchGroup, updateGroup, deleteGroup, fetchMemberships, removeMembership, fetchCampuses, fetchGroupMemberIds } from '@/services/groups'
import { format } from 'date-fns'

// Type definitions
type Group = {
  id: string;
  name: string;
  type: string;
  campus_id: string;
  custom_fields?: any;
  status: string;
  created_at: string;
  campus?: {
    name: string;
  };
};

type Member = {
  contact_id: string;
  role: string;
  joined_at?: string;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };
};

type Campus = {
  id: string;
  name: string;
};

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  
  // State variables
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [memberIds, setMemberIds] = useState<string[]>([])
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(searchParams.get('mode') === 'edit')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    campusId: '',
    status: '',
    description: '',
    customFields: {} as Record<string, any>,
  })
  
  // Custom field state
  const [customFieldName, setCustomFieldName] = useState('')
  const [customFieldValue, setCustomFieldValue] = useState('')
  
  // Load group data
  useEffect(() => {
    const loadGroup = async () => {
      try {
        const { data, error } = await fetchGroup(id)
        if (error) throw error
        
        const groupData = data as unknown as Group
        setGroup(groupData)
        
        // Initialize form data for edit mode
        setFormData({
          name: groupData.name,
          type: groupData.type,
          campusId: groupData.campus_id,
          status: groupData.status,
          description: groupData.custom_fields?.description || '',
          customFields: { ...(groupData.custom_fields || {}) }
        })
        
        // Remove description from custom fields if present
        if (formData.customFields?.description) {
          const { description, ...rest } = formData.customFields
          setFormData(prev => ({ ...prev, customFields: rest }))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load group details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadGroup()
  }, [id])
  
  // Load members
  useEffect(() => {
    const loadMembers = async () => {
      if (!id) return
      
      try {
        const { data, error } = await fetchMemberships(id)
        if (error) throw error
        
        setMembers(data as unknown as Member[] || [])
        
        // Also fetch just the member IDs for messaging
        const { data: contactIds } = await fetchGroupMemberIds(id)
        setMemberIds(contactIds || [])
      } catch (err) {
        console.error('Failed to load members:', err)
        // Don't show a toast for this secondary data
      }
    }
    
    loadMembers()
  }, [id])
  
  // Load campuses
  useEffect(() => {
    const loadCampuses = async () => {
      try {
        const { data, error } = await fetchCampuses()
        if (error) throw error
        
        setCampuses(data as unknown as Campus[] || [])
      } catch (err) {
        console.error('Failed to load campuses:', err)
      }
    }
    
    loadCampuses()
  }, [])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }
  
  const handleStatusChange = (checked: boolean) => {
    setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
  }
  
  const handleAddCustomField = () => {
    if (!customFieldName.trim()) return
    
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [customFieldName]: customFieldValue
      }
    }))
    
    // Reset inputs
    setCustomFieldName('')
    setCustomFieldValue('')
  }
  
  const handleRemoveCustomField = (fieldName: string) => {
    const updatedFields = { ...formData.customFields }
    delete updatedFields[fieldName]
    setFormData(prev => ({ ...prev, customFields: updatedFields }))
  }
  
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Prepare custom fields with description
      const custom_fields = {
        ...formData.customFields,
        description: formData.description
      }
      
      // Update the group data
      const { error } = await updateGroup(id, {
        name: formData.name,
        type: formData.type,
        campus_id: formData.campusId,
        status: formData.status,
        custom_fields
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Group updated successfully'
      })
      
      // Exit edit mode
      setEditMode(false)
      
      // Refresh group data
      const { data } = await fetchGroup(id)
      setGroup(data as unknown as Group)
      
    } catch (err) {
      console.error('Failed to update group', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update group'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteGroup = async () => {
    setIsSubmitting(true)
    
    try {
      const { error } = await deleteGroup(id)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Group deleted successfully'
      })
      
      // Redirect to groups list
      router.push('/people/groups')
      
    } catch (err) {
      console.error('Failed to delete group', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete group'
      })
      setShowDeleteDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleRemoveMember = async () => {
    if (!selectedMemberId) return
    
    setIsSubmitting(true)
    
    try {
      const { error } = await removeMembership(id, selectedMemberId)
      if (error) throw error
      
      // Update local state
      setMembers(prev => prev.filter(member => member.contact_id !== selectedMemberId))
      
      toast({
        title: 'Success',
        description: 'Member removed successfully'
      })
    } catch (err) {
      console.error('Failed to remove member:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove member'
      })
    } finally {
      setIsSubmitting(false)
      setShowRemoveMemberDialog(false)
      setSelectedMemberId(null)
    }
  }
  
  const handleAddMemberSuccess = async () => {
    // Refresh members list
    try {
      const { data, error } = await fetchMemberships(id)
      if (error) throw error
      
      setMembers(data as unknown as Member[] || [])
    } catch (err) {
      console.error('Failed to refresh members:', err)
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading group details...</span>
      </div>
    )
  }
  
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Group Not Found</h1>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="mb-4">The group you're looking for could not be found.</p>
              <Button onClick={() => router.push('/people/groups')}>
                Back to Groups
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), 'MMMM d, yyyy')
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {group.type === 'ministry' ? 'Ministry' : 
               group.type === 'small_group' ? 'Small Group' : 
               group.type === 'discipleship' ? 'Discipleship' : group.type}
            </Badge>
            <Badge variant={group.status === 'active' ? "success" : "outline"}>
              {group.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
            {group.campus && (
              <Badge variant="outline">
                {group.campus.name}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {!editMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMessageModal(true)}
            disabled={memberIds.length === 0}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-4">
          {editMode ? (
            <form onSubmit={handleSaveGroup}>
              <Card>
                <CardHeader>
                  <CardTitle>Edit Group</CardTitle>
                  <CardDescription>
                    Update the details for this group
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Group Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">
                        Group Type <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => handleSelectChange('type', value)}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select group type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ministry">Ministry</SelectItem>
                          <SelectItem value="small_group">Small Group</SelectItem>
                          <SelectItem value="discipleship">Discipleship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="campus">
                        Campus <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.campusId}
                        onValueChange={(value) => handleSelectChange('campusId', value)}
                      >
                        <SelectTrigger id="campus">
                          <SelectValue placeholder="Select campus" />
                        </SelectTrigger>
                        <SelectContent>
                          {campuses.length > 0 ? (
                            campuses.map(campus => (
                              <SelectItem key={campus.id} value={campus.id}>
                                {campus.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No campuses available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter group description"
                      rows={4}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="active_status">Active Status</Label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="active_status" 
                          checked={formData.status === 'active'}
                          onCheckedChange={handleStatusChange}
                        />
                        <Label htmlFor="active_status" className="text-sm font-medium cursor-pointer">
                          {formData.status === 'active' ? 'Active' : 'Inactive'}
                        </Label>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Inactive groups won't appear in active group lists
                    </p>
                  </div>
                  
                  {/* Custom Fields Section */}
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Custom Fields</h3>
                      <div className="p-1 bg-primary/10 rounded-full text-primary">
                        <Info className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Add any additional fields you need to track for this group
                    </p>
                    
                    {/* Custom fields input */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Input
                          placeholder="Field name"
                          value={customFieldName}
                          onChange={(e) => setCustomFieldName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Field value"
                          value={customFieldValue}
                          onChange={(e) => setCustomFieldValue(e.target.value)}
                        />
                      </div>
                      <div>
                        <Button 
                          type="button" 
                          onClick={handleAddCustomField}
                          disabled={!customFieldName.trim()}
                          className="w-full"
                        >
                          Add Field
                        </Button>
                      </div>
                    </div>
                    
                    {/* Custom fields display */}
                    {Object.keys(formData.customFields).length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Current Fields:</h4>
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                  Field Name
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                                  Value
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {Object.entries(formData.customFields).map(([key, value]) => (
                                <tr key={key}>
                                  <td className="px-4 py-2 text-sm">{key}</td>
                                  <td className="px-4 py-2 text-sm">{value as string}</td>
                                  <td className="px-4 py-2 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveCustomField(key)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      Remove
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
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
                    disabled={isSubmitting || !formData.name || !formData.type || !formData.campusId}
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
              </Card>
            </form>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Group Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Group Name</h3>
                      <p className="mt-1 font-medium">{group.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                      <p className="mt-1">
                        <Badge variant="outline">
                          {group.type === 'ministry' ? 'Ministry' : 
                           group.type === 'small_group' ? 'Small Group' : 
                           group.type === 'discipleship' ? 'Discipleship' : group.type}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <p className="mt-1">
                        <Badge variant={group.status === 'active' ? "success" : "outline"}>
                          {group.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Campus</h3>
                      <p className="mt-1">{group.campus?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                      <p className="mt-1">{formatDate(group.created_at)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Members</h3>
                      <p className="mt-1">{members.length}</p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {group.custom_fields?.description && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                      <p className="whitespace-pre-line">{group.custom_fields.description}</p>
                    </div>
                  )}
                  
                  {/* Custom Fields (excluding description) */}
                  {group.custom_fields && Object.keys(group.custom_fields).filter(k => k !== 'description').length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Additional Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(group.custom_fields)
                          .filter(([key]) => key !== 'description')
                          .map(([key, value]) => (
                            <div key={key}>
                              <h4 className="text-sm font-medium">{key}</h4>
                              <p className="text-sm">{value as string}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle>Group Members</CardTitle>
                  <CardDescription>
                    {members.length} people are part of this group
                  </CardDescription>
                </div>
                <Button onClick={() => setShowAddMemberModal(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No members in this group yet</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddMemberModal(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.contact_id}>
                          <TableCell className="font-medium">
                            {member.contacts && (
                              <div className="flex items-center gap-2">
                                <Avatar 
                                  src={member.contacts.profile_image} 
                                  alt={`${member.contacts.first_name} ${member.contacts.last_name}`}
                                  size="sm"
                                />
                                <div>
                                  <p>{member.contacts.first_name} {member.contacts.last_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {member.contacts.email || member.contacts.phone || 'No contact info'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(member.joined_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMemberId(member.contact_id)
                                setShowRemoveMemberDialog(true)
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
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
        
        <TabsContent value="meetings" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Meetings</CardTitle>
              <CardDescription>
                Schedule and track meetings for this group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Meeting Scheduler Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mt-2">
                  This feature is under development. Soon you'll be able to schedule meetings, 
                  track attendance, and send invitations directly from this tab.
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
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {group.name}? This action cannot be undone and will remove all member associations.
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
              onClick={handleDeleteGroup}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
      
      {/* Remove Member Dialog */}
      <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveMemberDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Member Modal */}
      <AddMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        groupId={group.id}
        groupName={group.name}
        onSuccess={handleAddMemberSuccess}
      />
      
      {/* Add GroupMessageModal */}
      <GroupMessageModal
        open={showMessageModal}
        onOpenChange={setShowMessageModal}
        groupId={id}
        groupName={group.name}
        recipientIds={memberIds}
      />
    </div>
  )
} 