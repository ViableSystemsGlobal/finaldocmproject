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
  User,
  BookOpen,
  CheckCircle,
  Sparkles,
  MapPin,
  Clock,
  GraduationCap,
  FileText,
  X,
  Download
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { 
  fetchDiscipleshipGroup, 
  updateDiscipleshipGroup,
  fetchDisciples,
  updateDiscipleRole,
  removeDisciple,
  deleteDiscipleshipGroup,
  updateLeaderRole,
  fetchUpcomingMeetings,
  fetchRecentMeetings,
  getNextScheduledMeeting,
  type DiscipleshipMeeting
} from '@/services/discipleshipGroups'
import { fetchCampuses } from '@/services/settings'
import { AddDiscipleModal } from '@/components/discipleship/AddDiscipleModal'
import { GroupMessageModal } from '@/components/discipleship/GroupMessageModal'
import { CreateMeetingModal } from '@/components/discipleship/CreateMeetingModal'
import { GooglePlacesInput } from '@/components/GooglePlacesInput'
import { FileUpload } from '@/components/ui/FileUpload'
import { LeaderSelect } from '@/components/discipleship/LeaderSelect'
import { useNextParams } from '@/lib/nextParams'

export default function DiscipleshipGroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  // Use the useNextParams utility to safely handle params
  const unwrappedParams = useNextParams(params)
  const groupId = (typeof unwrappedParams === 'string' ? unwrappedParams : unwrappedParams.id) as string
  
  // Check if we're in edit mode
  const isEditMode = searchParams.get('mode') === 'edit'
  
  // State
  const [group, setGroup] = useState<any>(null)
  const [disciples, setDisciples] = useState<any[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<DiscipleshipMeeting[]>([])
  const [recentMeetings, setRecentMeetings] = useState<DiscipleshipMeeting[]>([])
  const [nextScheduledMeeting, setNextScheduledMeeting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [campuses, setCampuses] = useState<{id: string, name: string}[]>([])
  const [loadingCampuses, setLoadingCampuses] = useState(true)
  
  // Edit mode state
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    leaderId: '',
    selectedLeader: undefined as any,
    isActive: true,
    curriculumFile: null as File | null,
    customFields: {
      meeting_day: '',
      meeting_time: '',
      meeting_location: '',
      meeting_location_details: '',
      age_group: '',
      curriculum_name: '',
      curriculum_file_url: ''
    }
  })
  
  // Modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddDiscipleModal, setShowAddDiscipleModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false)
  const [showMeetingDetailsModal, setShowMeetingDetailsModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<DiscipleshipMeeting | null>(null)
  const [showReminderModal, setShowReminderModal] = useState(false)
  
  // Helper functions for file operations
  const handleFileDownload = (filename: string) => {
    try {
      // TODO: Replace with actual file storage URL when implemented
      const link = document.createElement('a');
      link.href = `/api/download/curriculum/${group.id}/${encodeURIComponent(filename)}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Download Started',
        description: `Downloading ${filename}...`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Unable to download the file. Please try again.'
      });
    }
  };

  const handleFilePreview = (filename: string) => {
    try {
      // TODO: Replace with actual file storage URL when implemented
      const previewUrl = `/api/preview/curriculum/${group.id}/${encodeURIComponent(filename)}`;
      window.open(previewUrl, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        variant: 'destructive',
        title: 'Preview Failed',
        description: 'Unable to preview the file. Please try downloading it instead.'
      });
    }
  };

  const getFileTypeIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'text-red-600';
      case 'doc':
      case 'docx':
        return 'text-blue-600';
      case 'ppt':
      case 'pptx':
        return 'text-orange-600';
      case 'txt':
      case 'md':
        return 'text-gray-600';
      default:
        return 'text-indigo-600';
    }
  };
  
  // Load campuses
  useEffect(() => {
    const loadCampuses = async () => {
      try {
        setLoadingCampuses(true)
        const { data, error } = await fetchCampuses()
        
        if (error) throw error
        setCampuses(data || [])
      } catch (err) {
        console.error('Failed to load campuses:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load campuses'
        })
      } finally {
        setLoadingCampuses(false)
      }
    }
    
    loadCampuses()
  }, [])
  
  // Load group data
  const loadGroupData = async () => {
    try {
      setLoading(true)
      
      // Fetch group details
      const { data: groupData, error: groupError } = await fetchDiscipleshipGroup(groupId)
      
      if (groupError) throw groupError
      if (!groupData) throw new Error('Group not found')
      
      setGroup(groupData)
      
      // Set edit form data
      setEditFormData({
        name: groupData.name || '',
        description: groupData.description || '',
        leaderId: groupData.leader_id || '',
        selectedLeader: groupData.leader || undefined,
        isActive: groupData.status === 'active',
        curriculumFile: null,
        customFields: {
          meeting_day: groupData.custom_fields?.meeting_day || '',
          meeting_time: groupData.custom_fields?.meeting_time || '',
          meeting_location: groupData.custom_fields?.meeting_location || '',
          meeting_location_details: groupData.custom_fields?.meeting_location_details || '',
          age_group: groupData.custom_fields?.age_group || '',
          curriculum_name: groupData.custom_fields?.curriculum_name || '',
          curriculum_file_url: groupData.custom_fields?.curriculum_file_url || ''
        }
      })
      
      // Load meeting data
      await loadMeetingData()
      
    } catch (error) {
      console.error('Error loading group data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load group data. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Load meeting data
  const loadMeetingData = async () => {
    try {
      console.log('Loading meeting data for group:', groupId)
      
      // Fetch upcoming meetings
      const { data: upcomingData, error: upcomingError } = await fetchUpcomingMeetings(groupId, 5)
      if (upcomingError) {
        console.error('Error fetching upcoming meetings:', upcomingError)
      } else {
        setUpcomingMeetings(upcomingData || [])
      }
      
      // Fetch recent meetings
      const { data: recentData, error: recentError } = await fetchRecentMeetings(groupId, 5)
      if (recentError) {
        console.error('Error fetching recent meetings:', recentError)
      } else {
        setRecentMeetings(recentData || [])
      }
      
      // Get next scheduled meeting based on group schedule
      const { data: nextMeeting, error: nextError } = await getNextScheduledMeeting(groupId)
      if (nextError) {
        console.error('Error getting next scheduled meeting:', nextError)
      } else {
        setNextScheduledMeeting(nextMeeting)
      }
      
    } catch (error) {
      console.error('Exception loading meeting data:', error)
    }
  }
  
  // Load disciples
  const loadDisciples = async () => {
    try {
      const { data: discipleData, error: discipleError } = await fetchDisciples(groupId)
      
      if (discipleError) throw discipleError
      
      setDisciples(discipleData || [])
    } catch (err) {
      console.error('Failed to load disciples:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load group members'
      })
    }
  }
  
  useEffect(() => {
    const loadData = async () => {
      await loadGroupData()
      await loadDisciples()
    }
    loadData()
  }, [groupId])
  
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
      router.push('/people/discipleship')
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
  
  // Handle edit form changes
  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditCustomFieldChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [field]: value
      }
    }))
  }

  // Handle location change from Google Places in edit mode
  const handleEditLocationChange = (value: string, placeDetails?: any) => {
    setEditFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        meeting_location: value,
        meeting_location_details: placeDetails ? JSON.stringify(placeDetails) : ''
      }
    }))
  }

  // Handle meeting details view
  const handleViewMeetingDetails = (meeting: DiscipleshipMeeting | any) => {
    setSelectedMeeting(meeting)
    setShowMeetingDetailsModal(true)
  }

  // Handle send reminder
  const handleSendReminder = (meeting: DiscipleshipMeeting | any) => {
    setSelectedMeeting(meeting)
    setShowReminderModal(true)
  }

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editFormData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Group name is required'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // TODO: Upload curriculum file if changed
      let curriculumUrl = editFormData.customFields.curriculum_file_url
      if (editFormData.curriculumFile) {
        // For now, we'll just store the filename - implement file upload service later
        curriculumUrl = editFormData.curriculumFile.name
        console.log('Curriculum file to upload:', editFormData.curriculumFile)
      }
      
      const updateData = {
        name: editFormData.name,
        campus_id: group?.campus_id || null,
        leader_id: editFormData.leaderId || undefined,
        status: editFormData.isActive ? 'active' : 'inactive',
        custom_fields: {
          ...editFormData.customFields,
          description: editFormData.description,
          curriculum_file_url: curriculumUrl
        }
      }
      
      const { error: updateError } = await updateDiscipleshipGroup(groupId, updateData)
      
      if (updateError) throw updateError
      
      // Set the leader's role if a leader was selected
      if (editFormData.leaderId) {
        const { error: leaderError } = await updateLeaderRole(groupId, editFormData.leaderId)
        if (leaderError) {
          console.error('Error setting leader role:', leaderError)
          // Continue anyway since the group was updated successfully
        }
      }
      
      toast({
        title: 'Success',
        description: 'Discipleship group updated successfully'
      })
      
      // Reload data and exit edit mode
      await loadGroupData()
      router.push(`/people/discipleship/${groupId}`)
      
    } catch (err) {
      console.error('Failed to update discipleship group:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update discipleship group'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading discipleship group...</p>
        </div>
      </div>
    )
  }
  
  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-4">Group not found. Redirecting...</p>
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              asChild
              className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl"
            >
              <Link href="/people/discipleship">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-2xl">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Group' : group.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge 
                    variant={group.status === 'active' ? 'default' : 'secondary'}
                    className={
                      group.status === 'active' 
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    }
                  >
                    {group.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  {group.campuses?.name && (
                    <Badge variant="outline" className="bg-white/50">
                      {group.campuses.name}
                    </Badge>
                  )}
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-600">{disciples.length} members</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isEditMode && (
            <div className="flex gap-3 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMessageModal(true)}
                className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message Group
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm"
              >
                <Link href={`/people/discipleship/${groupId}?mode=edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Group
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="bg-white/70 hover:bg-red-50 border-white/20 backdrop-blur-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </Button>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        {isEditMode ? (
          /* Edit Mode Form */
          <form onSubmit={handleEditSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information Card */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                      <p className="text-slate-300">Group name, description, and settings</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Group Name */}
                    <div className="space-y-3">
                      <Label htmlFor="edit-name" className="text-base font-semibold text-slate-700">
                        Group Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-name"
                        placeholder="Enter group name"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    
                    {/* Campus */}
                    <div className="space-y-3">
                      <Label htmlFor="edit-campus" className="text-base font-semibold text-slate-700">
                        Campus
                      </Label>
                      <Select 
                        value={group?.campus_id || ''} 
                        onValueChange={(value) => setGroup((prev: any) => ({ ...prev, campus_id: value }))}
                        disabled={loadingCampuses}
                      >
                        <SelectTrigger 
                          id="edit-campus"
                          className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                        >
                          <SelectValue placeholder={loadingCampuses ? "Loading campuses..." : "Select campus"} />
                        </SelectTrigger>
                        <SelectContent>
                          {campuses.map((campus) => (
                            <SelectItem key={campus.id} value={campus.id}>
                              {campus.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-3">
                      <Label htmlFor="edit-description" className="text-base font-semibold text-slate-700">
                        Description
                      </Label>
                      <Textarea
                        id="edit-description"
                        placeholder="Enter group description"
                        value={editFormData.description}
                        onChange={(e) => handleEditFormChange('description', e.target.value)}
                        rows={4}
                        className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    
                    {/* Group Leader */}
                    <div className="space-y-3">
                      <Label htmlFor="edit-leader" className="text-base font-semibold text-slate-700">
                        Group Leader
                      </Label>
                      <LeaderSelect 
                        leaderId={editFormData.leaderId}
                        onLeaderChange={(id) => handleEditFormChange('leaderId', id)}
                        selectedLeader={editFormData.selectedLeader}
                        onSelectedLeaderChange={(leader) => handleEditFormChange('selectedLeader', leader)}
                      />
                    </div>
                    
                    {/* Active Status */}
                    <div className="flex items-center space-x-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                      <Switch
                        id="edit-active"
                        checked={editFormData.isActive}
                        onCheckedChange={(checked) => handleEditFormChange('isActive', checked)}
                      />
                      <Label htmlFor="edit-active" className="font-medium text-slate-700">
                        Active Group
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Details Card */}
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Meeting Details</h2>
                      <p className="text-blue-100">Schedule and location information</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-6">
                    {/* Meeting Day & Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="edit-meeting-day" className="text-base font-semibold text-slate-700">
                          <Calendar className="h-4 w-4 inline mr-2" />
                          Meeting Day
                        </Label>
                        <Select 
                          value={editFormData.customFields.meeting_day} 
                          onValueChange={(value) => handleEditCustomFieldChange('meeting_day', value)}
                        >
                          <SelectTrigger 
                            id="edit-meeting-day"
                            className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          >
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="edit-meeting-time" className="text-base font-semibold text-slate-700">
                          <Clock className="h-4 w-4 inline mr-2" />
                          Meeting Time
                        </Label>
                        <Input
                          id="edit-meeting-time"
                          type="time"
                          value={editFormData.customFields.meeting_time}
                          onChange={(e) => handleEditCustomFieldChange('meeting_time', e.target.value)}
                          className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Meeting Location with Google Places */}
                    <div className="space-y-3">
                      <Label htmlFor="edit-meeting-location" className="text-base font-semibold text-slate-700">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        Meeting Location
                      </Label>
                      <GooglePlacesInput
                        value={editFormData.customFields.meeting_location}
                        onChange={handleEditLocationChange}
                        placeholder="Search for location"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    {/* Age Group */}
                    <div className="space-y-3">
                      <Label htmlFor="edit-age-group" className="text-base font-semibold text-slate-700">
                        <Users className="h-4 w-4 inline mr-2" />
                        Age Group
                      </Label>
                      <Select 
                        value={editFormData.customFields.age_group} 
                        onValueChange={(value) => handleEditCustomFieldChange('age_group', value)}
                      >
                        <SelectTrigger 
                          id="edit-age-group"
                          className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                        >
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="children">Children (5-12)</SelectItem>
                          <SelectItem value="youth">Youth (13-17)</SelectItem>
                          <SelectItem value="young_adults">Young Adults (18-25)</SelectItem>
                          <SelectItem value="adults">Adults (26-54)</SelectItem>
                          <SelectItem value="seniors">Seniors (55+)</SelectItem>
                          <SelectItem value="all_ages">All Ages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum & Resources Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Curriculum & Resources</h2>
                    <p className="text-purple-100">Study materials and resources for the group</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Curriculum Name */}
                  <div className="space-y-3">
                    <Label htmlFor="edit-curriculum-name" className="text-base font-semibold text-slate-700">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Curriculum Name
                    </Label>
                    <Input
                      id="edit-curriculum-name"
                      placeholder="Enter curriculum or study material name"
                      value={editFormData.customFields.curriculum_name}
                      onChange={(e) => handleEditCustomFieldChange('curriculum_name', e.target.value)}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-700">
                      <GraduationCap className="h-4 w-4 inline mr-2" />
                      Curriculum File
                    </Label>
                    <FileUpload
                      onFileSelect={(file) => handleEditFormChange('curriculumFile', file)}
                      selectedFile={editFormData.curriculumFile}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
                      placeholder="Upload curriculum file (PDF, DOC, PPT, etc.)"
                      maxSizeMB={25}
                      disabled={isSubmitting}
                    />
                    {editFormData.customFields.curriculum_file_url && !editFormData.curriculumFile && (
                      <p className="text-sm text-slate-600">
                        Current file: {editFormData.customFields.curriculum_file_url}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/people/discipleship/${groupId}`)}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !editFormData.name.trim()}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode - Modern Cards */
          <div className="space-y-8">
            {/* Overview Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Group Overview</h2>
                    <p className="text-emerald-100">Basic information about this discipleship group</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Leader Section */}
                  {group.leader && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        Group Leader
                      </h3>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-lg">
                              {group.leader.first_name} {group.leader.last_name}
                            </p>
                            {group.leader.email && (
                              <p className="text-slate-600">{group.leader.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Description Section */}
                  {group.custom_fields?.description && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Description
                      </h3>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                        <p className="text-slate-700 leading-relaxed">
                          {group.custom_fields.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Meeting Information Grid */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Meeting Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Meeting Day */}
                    {group.custom_fields?.meeting_day && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-slate-600">Meeting Day</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-800 capitalize">
                          {group.custom_fields.meeting_day}
                        </p>
                      </div>
                    )}
                    
                    {/* Meeting Time */}
                    {group.custom_fields?.meeting_time && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-slate-600">Meeting Time</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-800">
                          {group.custom_fields.meeting_time}
                        </p>
                      </div>
                    )}
                    
                    {/* Age Group */}
                    {group.custom_fields?.age_group && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="h-5 w-5 text-orange-600" />
                          <span className="font-medium text-slate-600">Age Group</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-800 capitalize">
                          {group.custom_fields.age_group.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Location Information */}
                {group.custom_fields?.meeting_location && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-red-600" />
                      Meeting Location
                    </h3>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                      <p className="text-slate-800 font-medium">
                        {group.custom_fields.meeting_location}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Curriculum Information */}
                {(group.custom_fields?.curriculum_name || group.custom_fields?.curriculum_file_url) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                      Curriculum & Resources
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                      <div className="space-y-4">
                        {group.custom_fields.curriculum_name && (
                          <div className="flex items-start gap-3">
                            <BookOpen className="h-5 w-5 text-indigo-600 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-slate-600 font-medium">Curriculum: </span>
                              <span className="text-slate-800 font-semibold">{group.custom_fields.curriculum_name}</span>
                            </div>
                          </div>
                        )}
                        {group.custom_fields.curriculum_file_url && (
                          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-indigo-200">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">
                                  {group.custom_fields.curriculum_file_url}
                                </p>
                                <p className="text-sm text-slate-600">Curriculum attachment</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-indigo-500 hover:bg-indigo-600 text-white"
                                onClick={() => handleFileDownload(group.custom_fields.curriculum_file_url)}
                              >
                                <FileText className="mr-1 h-3 w-3" />
                                Download
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                                onClick={() => handleFilePreview(group.custom_fields.curriculum_file_url)}
                              >
                                <BookOpen className="mr-1 h-3 w-3" />
                                Preview
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Multiple files support - if there are additional resources */}
                        {group.custom_fields?.additional_resources && (
                          <div className="mt-4 pt-4 border-t border-indigo-200">
                            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-indigo-600" />
                              Additional Resources
                            </h4>
                            <div className="space-y-2">
                              {/* Example additional resources - replace with real data */}
                              {[
                                { name: 'Study Guide.pdf', size: '2.4 MB' },
                                { name: 'Discussion Questions.docx', size: '1.1 MB' }
                              ].map((resource, index) => (
                                <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-indigo-600" />
                                    <div>
                                      <span className="text-slate-800 font-medium text-sm">{resource.name}</span>
                                      <span className="text-slate-500 text-xs ml-2">({resource.size})</span>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="ghost" className="text-indigo-600 hover:bg-indigo-50 h-8 px-3">
                                    <FileText className="mr-1 h-3 w-3" />
                                    Download
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* No curriculum message */}
                        {!group.custom_fields.curriculum_name && !group.custom_fields.curriculum_file_url && (
                          <div className="text-center py-6">
                            <GraduationCap className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                            <p className="text-slate-600 font-medium">No curriculum materials yet</p>
                            <p className="text-slate-500 text-sm">Add curriculum materials in edit mode</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Group Members Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Group Members</h2>
                      <p className="text-blue-100">{disciples.length} members in this group</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowAddDiscipleModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>
              </div>
              
              <div className="p-8">
                {disciples.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-8 border-2 border-dashed border-slate-300">
                      <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No members yet</h3>
                      <p className="text-slate-500 mb-6 max-w-md mx-auto">
                        Get started by adding your first group member to begin building your discipleship community.
                      </p>
                      <Button 
                        onClick={() => setShowAddDiscipleModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add First Member
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Name</TableHead>
                          <TableHead className="font-semibold text-slate-700">Contact Info</TableHead>
                          <TableHead className="font-semibold text-slate-700">Role</TableHead>
                          <TableHead className="font-semibold text-slate-700">Leader</TableHead>
                          <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                          <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {disciples.map((disciple, index) => (
                          <TableRow key={disciple.contact_id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">
                                    {disciple.contacts?.first_name?.[0]}{disciple.contacts?.last_name?.[0]}
                                  </span>
                                </div>
                                <div className="font-medium text-slate-800">
                                  {disciple.contacts?.first_name} {disciple.contacts?.last_name}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                {disciple.contacts?.email && (
                                  <div className="text-slate-600">{disciple.contacts.email}</div>
                                )}
                                {disciple.contacts?.phone && (
                                  <div className="text-slate-700 font-medium">{disciple.contacts.phone}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={disciple.role}
                                onValueChange={(value) => handleRoleChange(disciple.contact_id, value)}
                              >
                                <SelectTrigger className="w-32 h-9 border-slate-200 focus:border-blue-500">
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
                                const isLeader = group.leader_id === disciple.contact_id || disciple.role === 'Leader';
                                return isLeader ? (
                                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0">
                                    Group Leader
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-sm">-</span>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-600">
                                {disciple.joined_at ? new Date(disciple.joined_at).toLocaleDateString() : 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDisciple(disciple.contact_id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>

            {/* Meetings Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Meetings & Events</h2>
                      <p className="text-purple-100">Schedule and track group meetings</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowCreateMeetingModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </div>
              </div>
              
              <div className="p-8">
                {/* Meeting Schedule Info */}
                {(group.custom_fields?.meeting_day || group.custom_fields?.meeting_time) && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      Regular Meeting Schedule
                    </h3>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.custom_fields.meeting_day && (
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <div>
                              <span className="text-slate-600 font-medium">Every </span>
                              <span className="text-slate-800 font-semibold capitalize">
                                {group.custom_fields.meeting_day}
                              </span>
                            </div>
                          </div>
                        )}
                        {group.custom_fields.meeting_time && (
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-purple-600" />
                            <div>
                              <span className="text-slate-600 font-medium">at </span>
                              <span className="text-slate-800 font-semibold">
                                {group.custom_fields.meeting_time}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      {group.custom_fields.meeting_location && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div>
                              <span className="text-slate-600 font-medium">Location: </span>
                              <span className="text-slate-800">{group.custom_fields.meeting_location}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upcoming Meetings */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                    Upcoming Meetings
                  </h3>
                  <div className="space-y-4">
                    {/* Show next scheduled meeting if no specific meetings exist */}
                    {upcomingMeetings.length === 0 && nextScheduledMeeting && (
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{nextScheduledMeeting.title}</h4>
                              <p className="text-slate-600 text-sm">Next scheduled meeting</p>
                            </div>
                          </div>
                          <Badge className="bg-indigo-500 text-white">
                            {new Date(nextScheduledMeeting.meeting_date).toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {nextScheduledMeeting.start_time || group.custom_fields?.meeting_time || '7:00 PM'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {nextScheduledMeeting.location || group.custom_fields?.meeting_location || 'Location TBD'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {disciples.length} invited
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-indigo-500 hover:bg-indigo-600 text-white"
                            onClick={() => handleViewMeetingDetails(nextScheduledMeeting)}
                          >
                            <Users className="mr-1 h-3 w-3" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => handleSendReminder(nextScheduledMeeting)}
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Show specific upcoming meetings from database */}
                    {upcomingMeetings.map((meeting) => (
                      <div key={meeting.id} className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{meeting.title}</h4>
                              <p className="text-slate-600 text-sm">
                                {meeting.meeting_type.charAt(0).toUpperCase() + meeting.meeting_type.slice(1)} meeting
                              </p>
                            </div>
                          </div>
                          <Badge className={`text-white ${
                            meeting.status === 'scheduled' ? 'bg-indigo-500' : 
                            meeting.status === 'completed' ? 'bg-green-500' :
                            meeting.status === 'cancelled' ? 'bg-red-500' : 
                            'bg-yellow-500'
                          }`}>
                            {new Date(meeting.meeting_date).toLocaleDateString()}
                          </Badge>
                        </div>
                        {meeting.description && (
                          <p className="text-slate-600 text-sm mb-3">{meeting.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          {meeting.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {meeting.start_time}
                              {meeting.end_time && ` - ${meeting.end_time}`}
                            </div>
                          )}
                          {meeting.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {meeting.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {meeting.attendance_count || disciples.length} invited
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-indigo-500 hover:bg-indigo-600 text-white"
                            onClick={() => handleViewMeetingDetails(meeting)}
                          >
                            <Users className="mr-1 h-3 w-3" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => handleSendReminder(meeting)}
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Send Reminder
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* No meetings placeholder */}
                    {upcomingMeetings.length === 0 && !nextScheduledMeeting && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">No upcoming meetings scheduled</p>
                        <p className="text-slate-500 text-sm">Click "Schedule Meeting" to create your first meeting</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meeting History */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-slate-600" />
                    Recent Meetings
                  </h3>
                  <div className="space-y-3">
                    {/* Show real recent meetings from database */}
                    {recentMeetings.length > 0 ? (
                      recentMeetings.map((meeting) => (
                        <div key={meeting.id} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                meeting.status === 'completed' ? 'bg-green-200' :
                                meeting.status === 'cancelled' ? 'bg-red-200' :
                                'bg-slate-200'
                              }`}>
                                <Calendar className={`h-4 w-4 ${
                                  meeting.status === 'completed' ? 'text-green-600' :
                                  meeting.status === 'cancelled' ? 'text-red-600' :
                                  'text-slate-600'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800">{meeting.title}</h4>
                                <p className="text-sm text-slate-600">
                                  {new Date(meeting.meeting_date).toLocaleDateString()}
                                  {meeting.start_time && ` at ${meeting.start_time}`}
                                </p>
                                {meeting.description && (
                                  <p className="text-xs text-slate-500 mt-1">{meeting.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-slate-600">
                                <Users className="h-4 w-4 inline mr-1" />
                                {meeting.attendance_count || 0} attended
                              </div>
                              <Badge variant={
                                meeting.status === 'completed' ? 'default' :
                                meeting.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }>
                                {meeting.status}
                              </Badge>
                              <Button size="sm" variant="ghost" className="text-slate-600">
                                {meeting.notes ? 'View Notes' : 'Add Notes'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* No meetings placeholder */
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">No meeting history yet</p>
                        <p className="text-slate-500 text-sm">Meeting history will appear here after you've held some meetings</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
        
        {/* Create Meeting Modal */}
        <CreateMeetingModal
          groupId={groupId}
          isOpen={showCreateMeetingModal}
          onClose={() => setShowCreateMeetingModal(false)}
          onMeetingCreated={loadMeetingData}
          groupLocation={group?.custom_fields?.meeting_location}
          groupMeetingTime={group?.custom_fields?.meeting_time}
        />

        {/* Meeting Details Modal */}
        {selectedMeeting && (
          <Dialog open={showMeetingDetailsModal} onOpenChange={setShowMeetingDetailsModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Meeting Details
                </DialogTitle>
                <DialogDescription>
                  View information about this meeting
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Meeting Title and Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">
                      {selectedMeeting.title || 'Regular Meeting'}
                    </h3>
                    <p className="text-slate-600">
                      {selectedMeeting.meeting_type ? 
                        `${selectedMeeting.meeting_type.charAt(0).toUpperCase() + selectedMeeting.meeting_type.slice(1)} meeting` :
                        'Regular discipleship meeting'
                      }
                    </p>
                  </div>
                  {selectedMeeting.status && (
                    <Badge className={`text-white ${
                      selectedMeeting.status === 'scheduled' ? 'bg-indigo-500' : 
                      selectedMeeting.status === 'completed' ? 'bg-green-500' :
                      selectedMeeting.status === 'cancelled' ? 'bg-red-500' : 
                      'bg-yellow-500'
                    }`}>
                      {selectedMeeting.status}
                    </Badge>
                  )}
                </div>

                {/* Meeting Description */}
                {selectedMeeting.description && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2">Description</h4>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                      {selectedMeeting.description}
                    </p>
                  </div>
                )}

                {/* Meeting Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-slate-700">Date</span>
                    </div>
                    <p className="text-slate-800">
                      {selectedMeeting.meeting_date ? 
                        new Date(selectedMeeting.meeting_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) :
                        'Date TBD'
                      }
                    </p>
                  </div>

                  {/* Time */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-slate-700">Time</span>
                    </div>
                    <p className="text-slate-800">
                      {selectedMeeting.start_time || group?.custom_fields?.meeting_time || 'Time TBD'}
                      {selectedMeeting.end_time && ` - ${selectedMeeting.end_time}`}
                    </p>
                  </div>

                  {/* Location */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 md:col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-slate-700">Location</span>
                    </div>
                    <p className="text-slate-800">
                      {selectedMeeting.location || group?.custom_fields?.meeting_location || 'Location TBD'}
                    </p>
                  </div>

                  {/* Attendance */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-slate-700">Expected Attendance</span>
                    </div>
                    <p className="text-slate-800">
                      {selectedMeeting.attendance_count || disciples.length} people invited
                    </p>
                  </div>

                  {/* Meeting Type */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-slate-700">Type</span>
                    </div>
                    <p className="text-slate-800 capitalize">
                      {selectedMeeting.meeting_type || 'Regular'} Meeting
                    </p>
                  </div>
                </div>

                {/* Meeting Notes/Agenda */}
                {(selectedMeeting.notes || selectedMeeting.agenda) && (
                  <div>
                    <h4 className="font-medium text-slate-800 mb-2">
                      {selectedMeeting.notes ? 'Notes' : 'Agenda'}
                    </h4>
                    <div className="bg-slate-50 p-3 rounded-lg border">
                      {selectedMeeting.notes ? (
                        <p className="text-slate-600 whitespace-pre-wrap">
                          {selectedMeeting.notes}
                        </p>
                      ) : selectedMeeting.agenda && Array.isArray(selectedMeeting.agenda) ? (
                        <div className="space-y-2">
                          {selectedMeeting.agenda.map((agendaItem: any, index: number) => (
                            <p key={index} className="text-slate-600">
                              • {typeof agendaItem === 'object' && agendaItem.item ? agendaItem.item : agendaItem}
                            </p>
                          ))}
                        </div>
                      ) : typeof selectedMeeting.agenda === 'string' ? (
                        <p className="text-slate-600 whitespace-pre-wrap">
                          {selectedMeeting.agenda}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowMeetingDetailsModal(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setShowMeetingDetailsModal(false)
                    handleSendReminder(selectedMeeting)
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Reminder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Send Reminder Modal (Reuse Group Message Modal) */}
        {selectedMeeting && (
          <GroupMessageModal
            groupId={groupId}
            groupName={group?.name || 'Discipleship Group'}
            isOpen={showReminderModal}
            onClose={() => {
              setShowReminderModal(false)
              setSelectedMeeting(null)
            }}
            initialSubject={`Reminder: ${selectedMeeting.title || 'Upcoming Meeting'}`}
            initialContent={`Hi {first_name},

This is a friendly reminder about our upcoming meeting:

📅 **Date:** ${selectedMeeting.meeting_date ? new Date(selectedMeeting.meeting_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD'}
⏰ **Time:** ${selectedMeeting.start_time || group?.custom_fields?.meeting_time || 'TBD'}
📍 **Location:** ${selectedMeeting.location || group?.custom_fields?.meeting_location || 'TBD'}

${selectedMeeting.description ? `**About this meeting:**
${selectedMeeting.description}

` : ''}We're looking forward to seeing you there!

Blessings,
{group_name} Leadership`}
          />
        )}
      </div>
    </div>
  )
} 