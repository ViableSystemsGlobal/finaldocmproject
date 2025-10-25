'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useNextParams } from '@/lib/nextParams'
import { 
  Loader2, 
  Users, 
  Calendar, 
  Edit, 
  Trash2,
  UserPlus,
  UserMinus,
  Info,
  Mail,
  ArrowLeft,
  Plus,
  Eye,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  ExternalLink,
  Crown,
  Shield
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
import { CreateMeetingModal } from '@/components/CreateMeetingModal'
import AssignLeaderModal from '@/components/AssignLeaderModal'
import { fetchGroup, updateGroup, deleteGroup, fetchMemberships, removeMembership, fetchCampuses, fetchGroupMemberIds, fetchGroupMessages, getGroupMessageStats, fetchGroupLeaders, assignGroupLeader, removeGroupLeader, fetchGroupPermissions, hasGroupPermission, initializeGroupPermissions } from '@/services/groups'
import { fetchGroupMeetings, getMeetingStats, type Meeting, type MeetingStats } from '@/services/meetings'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

// Type definitions
type Group = {
  id: string;
  name: string;
  type: string;
  campus_id: string;
  custom_fields?: any;
  status: string;
  created_at: string;
  image_url?: string;
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
  
  // Use the useNextParams utility to safely handle params
  const unwrappedParams = useNextParams(params)
  const id = typeof unwrappedParams === 'string' ? unwrappedParams : unwrappedParams?.id as string
  
  // State variables
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [messageStats, setMessageStats] = useState({ total: 0, sent: 0, failed: 0, pending: 0 })
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [meetingStats, setMeetingStats] = useState<MeetingStats>({ 
    total_meetings: 0, 
    upcoming_meetings: 0, 
    completed_meetings: 0, 
    cancelled_meetings: 0, 
    avg_attendance: 0 
  })
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [leaders, setLeaders] = useState<any[]>([])
  const [leadersLoading, setLeadersLoading] = useState(false)
  const [permissions, setPermissions] = useState<any[]>([])
  const [currentUserPermissions, setCurrentUserPermissions] = useState<any>({})
  const [showAssignLeaderModal, setShowAssignLeaderModal] = useState(false)
  const [showRemoveLeaderDialog, setShowRemoveLeaderDialog] = useState(false)
  const [selectedLeader, setSelectedLeader] = useState<any>(null)
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(searchParams.get('mode') === 'edit')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
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
  
  // Image upload state for edit mode
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
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
        
        // Initialize image state with existing image
        const existingImageUrl = groupData.image_url || ''
        setImageUrl(existingImageUrl)
        setImagePreview(existingImageUrl)
        setImageFile(null)
        
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
  
  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!id) return
      
      try {
        const { data: messagesData, error: messagesError } = await fetchGroupMessages(id)
        if (messagesError) throw messagesError
        
        setMessages(messagesData || [])
        
        // Load message stats
        const { data: stats, error: statsError } = await getGroupMessageStats(id)
        if (statsError) throw statsError
        
        setMessageStats(stats || { total: 0, sent: 0, failed: 0, pending: 0 })
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }
    
    loadMessages()
  }, [id])
  
  // Load meetings
  useEffect(() => {
    const loadMeetings = async () => {
      if (!id) return
      
      try {
        const { data: meetingsData, error: meetingsError } = await fetchGroupMeetings(id)
        if (meetingsError) throw meetingsError
        
        setMeetings(meetingsData || [])
        
        // Load meeting stats
        const { data: stats, error: statsError } = await getMeetingStats(id)
        if (statsError) throw statsError
        
        setMeetingStats(stats || { 
          total_meetings: 0, 
          upcoming_meetings: 0, 
          completed_meetings: 0, 
          cancelled_meetings: 0, 
          avg_attendance: 0 
        })
      } catch (err) {
        console.error('Failed to load meetings:', err)
      }
    }
    
    loadMeetings()
  }, [id])
  
  // Load current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    
    getCurrentUser()
  }, [])
  
  // Load pending approval requests
  useEffect(() => {
    const loadPendingRequests = async () => {
      if (!id) return
      
      try {
        setApprovalsLoading(true)
        const response = await fetch(`/api/admin/group-membership-requests?group_id=${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch pending requests')
        }
        
        const data = await response.json()
        setPendingRequests(data.requests || [])
      } catch (err) {
        console.error('Failed to load pending requests:', err)
      } finally {
        setApprovalsLoading(false)
      }
    }
    
    loadPendingRequests()
  }, [id])

  // Load group leaders
  useEffect(() => {
    const loadLeaders = async () => {
      if (!id) return
      
      try {
        setLeadersLoading(true)
        const { data, error } = await fetchGroupLeaders(id)
        if (error) throw error
        setLeaders(data || [])
      } catch (error) {
        console.error('Error loading leaders:', error)
      } finally {
        setLeadersLoading(false)
      }
    }

    loadLeaders()
  }, [id])

  // Load group permissions
  useEffect(() => {
    const loadPermissions = async () => {
      if (!id) return
      
      try {
        const { data, error } = await fetchGroupPermissions(id)
        if (error) throw error
        setPermissions(data || [])
      } catch (error) {
        console.error('Error loading permissions:', error)
      }
    }

    loadPermissions()
  }, [id])

  // Load current user permissions
  useEffect(() => {
    const loadCurrentUserPermissions = async () => {
      if (!currentUserId || !id) return
      
      try {
        const permissionTypes = ['approve_requests', 'send_messages', 'edit_group', 'add_members', 'remove_members', 'view_analytics']
        const permissionPromises = permissionTypes.map(async (type) => {
          const hasPermission = await hasGroupPermission(currentUserId, id, type)
          return { [type]: hasPermission }
        })
        
        const results = await Promise.all(permissionPromises)
        const permissionsObject = results.reduce((acc, curr) => ({ ...acc, ...curr }), {})
        setCurrentUserPermissions(permissionsObject)
      } catch (error) {
        console.error('Error loading current user permissions:', error)
      }
    }

    loadCurrentUserPermissions()
  }, [currentUserId, id])
  
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
  
  // Image upload handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setImageUrl('') // Clear URL input when file is selected
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    setImagePreview(url)
    setImageFile(null) // Clear file if URL is provided
  }

  const clearImage = () => {
    setImageUrl('')
    setImageFile(null)
    setImagePreview(null)
  }
  
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Determine the image URL to use
      let finalImageUrl = ''
      
      if (imageFile) {
        // Upload the file to Supabase Storage
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `groups/${fileName}`
        
        console.log('Uploading file to storage:', filePath)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)
        
        finalImageUrl = urlData.publicUrl
        console.log('File uploaded successfully:', finalImageUrl)
        
      } else if (imageUrl) {
        finalImageUrl = imageUrl
      }

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
        custom_fields,
        image_url: finalImageUrl || undefined
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
  
  const handleMessageSuccess = async () => {
    // Refresh messages and stats after sending
    try {
      const { data: messagesData, error: messagesError } = await fetchGroupMessages(id)
      if (messagesError) throw messagesError
      
      setMessages(messagesData || [])
      
      const { data: stats, error: statsError } = await getGroupMessageStats(id)
      if (statsError) throw statsError
      
      setMessageStats(stats || { total: 0, sent: 0, failed: 0, pending: 0 })
    } catch (err) {
      console.error('Failed to refresh messages:', err)
    }
  }
  
  const handleMeetingSuccess = async () => {
    // Refresh meetings and stats after creating/updating
    try {
      const { data: meetingsData, error: meetingsError } = await fetchGroupMeetings(id)
      if (meetingsError) throw meetingsError
      
      setMeetings(meetingsData || [])
      
      const { data: stats, error: statsError } = await getMeetingStats(id)
      if (statsError) throw statsError
      
      setMeetingStats(stats || { 
        total_meetings: 0, 
        upcoming_meetings: 0, 
        completed_meetings: 0, 
        cancelled_meetings: 0, 
        avg_attendance: 0 
      })
    } catch (err) {
      console.error('Failed to refresh meetings:', err)
    }
  }
  
  const handleApproveRequest = async (requestId: string, tableSource: string) => {
    if (!currentUserId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated'
      })
      return
    }
    
    try {
      const response = await fetch('/api/admin/group-membership-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: requestId,
          action: 'approve',
          tableSource,
          userId: currentUserId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve request')
      }
      
      // Refresh pending requests
      const updatedResponse = await fetch(`/api/admin/group-membership-requests?group_id=${id}`)
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setPendingRequests(data.requests || [])
      }
      
      // Refresh members list
      await handleAddMemberSuccess()
      
      toast({
        title: 'Success',
        description: 'Membership request approved successfully'
      })
    } catch (err) {
      console.error('Failed to approve request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve membership request'
      })
    }
  }
  
  const handleRejectRequest = async (requestId: string, tableSource: string, reason?: string) => {
    if (!currentUserId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated'
      })
      return
    }
    
    try {
      const response = await fetch('/api/admin/group-membership-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: requestId,
          action: 'reject',
          tableSource,
          userId: currentUserId,
          rejectionReason: reason,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject request')
      }
      
      // Refresh pending requests
      const updatedResponse = await fetch(`/api/admin/group-membership-requests?group_id=${id}`)
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setPendingRequests(data.requests || [])
      }
      
      toast({
        title: 'Success',
        description: 'Membership request rejected successfully'
      })
    } catch (err) {
      console.error('Failed to reject request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject membership request'
      })
    }
  }

  // Leader handler functions
  const handleAssignLeader = async (userId: string, isPrimary: boolean = false) => {
    try {
      const { error } = await assignGroupLeader(id, userId, isPrimary)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Leader assigned successfully'
      })

      // Refresh leaders
      const { data } = await fetchGroupLeaders(id)
      setLeaders(data || [])
      
      // Initialize permissions for the group if not already done
      await initializeGroupPermissions(id)
    } catch (err) {
      console.error('Failed to assign leader:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign leader'
      })
    }
  }

  const handleRemoveLeader = async (userId: string) => {
    try {
      const { error } = await removeGroupLeader(id, userId)
      if (error) throw error

      toast({
        title: 'Success',
        description: 'Leader removed successfully'
      })

      // Refresh leaders
      const { data } = await fetchGroupLeaders(id)
      setLeaders(data || [])
      
      setShowRemoveLeaderDialog(false)
      setSelectedLeader(null)
    } catch (err) {
      console.error('Failed to remove leader:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove leader'
      })
    }
  }

  const handlePermissionToggle = async (permissionType: string, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/admin/group-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: id,
          permissions: [{ permission_type: permissionType, is_enabled: isEnabled }]
        })
      })

      if (!response.ok) throw new Error('Failed to update permission')

      toast({
        title: 'Success',
        description: `Permission ${isEnabled ? 'enabled' : 'disabled'} successfully`
      })

      // Refresh permissions
      const { data } = await fetchGroupPermissions(id)
      setPermissions(data || [])
    } catch (err) {
      console.error('Failed to update permission:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update permission'
      })
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Group Details</h2>
          <p className="text-slate-600">Fetching group information...</p>
        </div>
      </div>
    )
  }
  
  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Group Not Found</h1>
                  <p className="text-red-100">The requested group could not be located</p>
                </div>
              </div>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-600 mb-6">The group you're looking for could not be found.</p>
              <Button 
                onClick={() => router.push('/people/groups')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl px-8 py-3"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Groups
              </Button>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/people/groups')}
              className="hover:bg-white/50 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {group.name}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className={`${
                    group.type === 'ministry' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
                    group.type === 'small_group' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                    'bg-gradient-to-r from-purple-500 to-purple-600'
                  } text-white border-0`}>
                    {group.type === 'ministry' ? 'Ministry' : 
                     group.type === 'small_group' ? 'Small Group' : 
                     group.type === 'discipleship' ? 'Discipleship' : group.type}
                  </Badge>
                  <Badge className={group.status === 'active' ? 
                    "bg-gradient-to-r from-green-500 to-green-600 text-white border-0" : 
                    "bg-slate-100 text-slate-700 border-slate-300"
                  }>
                    {group.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  {group.campus && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                      {group.campus.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {!editMode && (
                <Button
                  size="sm"
                  onClick={() => setEditMode(true)}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-xl px-6 py-3"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Group
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Ensure other modals are closed before opening message modal
                  setShowDeleteDialog(false)
                  setShowRemoveMemberDialog(false)
                  setShowAddMemberModal(false)
                  // Small delay to ensure other modals are fully closed
                  setTimeout(() => setShowMessageModal(true), 50)
                }}
                disabled={memberIds.length === 0}
                className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl px-6 py-3"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  // Ensure other modals are closed before opening delete dialog
                  setShowMessageModal(false)
                  setShowRemoveMemberDialog(false)
                  setShowAddMemberModal(false)
                  setShowDeleteDialog(true)
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 rounded-xl px-6 py-3"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-8 py-4">
              <TabsList className="bg-white/50 rounded-xl border border-slate-200">
                <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="members" className="rounded-lg">Members ({members.length})</TabsTrigger>
                <TabsTrigger value="leaders" className="rounded-lg">
                  <Crown className="h-4 w-4 mr-2" />
                  Leaders ({leaders.length})
                </TabsTrigger>
                <TabsTrigger value="meetings" className="rounded-lg">Meetings ({meetingStats.total_meetings})</TabsTrigger>
                <TabsTrigger value="messages" className="rounded-lg">Messages ({messageStats.total})</TabsTrigger>
                <TabsTrigger value="approvals" className="rounded-lg">
                  Approvals ({pendingRequests.length})
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 h-2 w-2 bg-orange-500 rounded-full animate-pulse"></span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="p-8">
              {editMode ? (
                <form onSubmit={handleSaveGroup} className="space-y-8">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 -m-8 mb-8 px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Edit className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Edit Group</h2>
                        <p className="text-slate-300">Update the details for this group</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                        Group Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter group name"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-semibold text-slate-700">
                          Group Type <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.type} 
                          onValueChange={(value) => handleSelectChange('type', value)}
                        >
                          <SelectTrigger id="type" className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
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
                        <Label htmlFor="campus" className="text-sm font-semibold text-slate-700">
                          Campus <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.campusId}
                          onValueChange={(value) => handleSelectChange('campusId', value)}
                        >
                          <SelectTrigger id="campus" className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
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
                              <div className="px-2 py-1.5 text-sm text-slate-500">
                                No campuses available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter group description"
                        className="border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                        rows={4}
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Group Image</h3>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4">
                        Add an image to represent this group in the table and other displays
                      </p>

                      {/* Current image preview */}
                      {imagePreview && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">Preview:</p>
                          <div className="relative inline-block">
                            <img 
                              src={imagePreview} 
                              alt="Group image preview" 
                              className="w-20 h-20 object-cover rounded-xl border-2 border-slate-200" 
                            />
                            <button
                              type="button"
                              onClick={clearImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Image URL input */}
                        <div>
                          <Label htmlFor="imageUrl" className="text-sm font-medium text-slate-700">Image URL</Label>
                          <Input
                            id="imageUrl"
                            type="url"
                            value={imageUrl}
                            onChange={handleImageUrlChange}
                            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                            className="mt-1 h-10 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-px bg-slate-300"></div>
                          <span className="text-sm text-slate-500 font-medium">OR</span>
                          <div className="flex-1 h-px bg-slate-300"></div>
                        </div>

                        {/* File upload */}
                        <div>
                          <Label htmlFor="imageFile" className="text-sm font-medium text-slate-700">Upload Image File</Label>
                          <Input
                            id="imageFile"
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                            className="mt-1 h-10 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Supported formats: JPG, PNG, GIF, WebP (Max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <Label htmlFor="active_status" className="text-sm font-semibold text-slate-700">Active Status</Label>
                        <div className="flex items-center space-x-3">
                          <Switch 
                            id="active_status" 
                            checked={formData.status === 'active'}
                            onCheckedChange={handleStatusChange}
                          />
                          <Label htmlFor="active_status" className="text-sm font-medium cursor-pointer text-slate-700">
                            {formData.status === 'active' ? 'Active' : 'Inactive'}
                          </Label>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">
                        Inactive groups won't appear in active group lists
                      </p>
                    </div>

                    {/* Custom Fields Section */}
                    <div className="bg-white/70 backdrop-blur-lg border-2 border-slate-200 rounded-2xl p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                            <Info className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">Custom Fields</h3>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600">
                        Add any additional fields you need to track for this group
                      </p>
                      
                      {/* Custom fields input */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Input
                            placeholder="Field name"
                            value={customFieldName}
                            onChange={(e) => setCustomFieldName(e.target.value)}
                            className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Field value"
                            value={customFieldValue}
                            onChange={(e) => setCustomFieldValue(e.target.value)}
                            className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Button 
                            type="button" 
                            onClick={handleAddCustomField}
                            disabled={!customFieldName.trim()}
                            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-xl"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Field
                          </Button>
                        </div>
                      </div>
                      
                      {/* Custom fields display */}
                      {Object.keys(formData.customFields).length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-700">Current Fields:</h4>
                          <div className="bg-white/70 backdrop-blur-lg border border-slate-200 rounded-xl overflow-hidden">
                            <table className="min-w-full">
                              <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Field Name
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Value
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {Object.entries(formData.customFields).map(([key, value]) => (
                                  <tr key={key} className="hover:bg-white/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{key}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{value as string}</td>
                                    <td className="px-6 py-4 text-right">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveCustomField(key)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-gradient-to-r from-slate-100 to-slate-200 -m-8 mt-8 px-8 py-6">
                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditMode(false)}
                        disabled={isSubmitting}
                        className="px-8 py-3 h-12 border-2 border-slate-300 rounded-xl hover:bg-white/80"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isSubmitting || !formData.name || !formData.type || !formData.campusId}
                        className="px-8 py-3 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 rounded-xl shadow-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
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
                          <div className="mt-1">
                            <Badge className={`${
                              group.type === 'ministry' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 
                              group.type === 'small_group' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 
                              'bg-gradient-to-r from-purple-500 to-purple-600'
                            } text-white border-0`}>
                              {group.type === 'ministry' ? 'Ministry' : 
                               group.type === 'small_group' ? 'Small Group' : 
                               group.type === 'discipleship' ? 'Discipleship' : group.type}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                          <div className="mt-1">
                            <Badge className={group.status === 'active' ? 
                              "bg-gradient-to-r from-green-500 to-green-600 text-white border-0" : 
                              "bg-slate-100 text-slate-700 border-slate-300"
                            }>
                              {group.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
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
                      
                      {/* Group Image */}
                      {group.image_url && (
                        <div className="pt-4 border-t">
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Group Image</h3>
                          <div className="inline-block">
                            <img 
                              src={group.image_url} 
                              alt={`${group.name} image`}
                              className="w-24 h-24 object-cover rounded-xl border-2 border-slate-200 shadow-sm" 
                            />
                          </div>
                        </div>
                      )}
                      
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
                    <Button onClick={() => {
                      // Ensure other modals are closed before opening add member modal
                      setShowMessageModal(false)
                      setShowDeleteDialog(false)
                      setShowRemoveMemberDialog(false)
                      setShowAddMemberModal(true)
                    }}>
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
                        onClick={() => {
                          // Ensure other modals are closed before opening add member modal
                          setShowMessageModal(false)
                          setShowDeleteDialog(false)
                          setShowRemoveMemberDialog(false)
                          setShowAddMemberModal(true)
                        }}
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
                                    // Ensure other modals are closed before opening remove member dialog
                                    setShowMessageModal(false)
                                    setShowDeleteDialog(false)
                                    setShowAddMemberModal(false)
                                    setSelectedMemberId(member.contact_id)
                                    setShowRemoveMemberDialog(true)
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
            
            <TabsContent value="meetings">
              <div className="space-y-6">
                {/* Meeting Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                          <p className="text-2xl font-bold text-gray-900">{meetingStats.total_meetings}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Upcoming</p>
                          <p className="text-2xl font-bold text-green-600">{meetingStats.upcoming_meetings}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completed</p>
                          <p className="text-2xl font-bold text-blue-600">{meetingStats.completed_meetings}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Cancelled</p>
                          <p className="text-2xl font-bold text-red-600">{meetingStats.cancelled_meetings}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                          <p className="text-2xl font-bold text-purple-600">{Math.round(meetingStats.avg_attendance)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Meetings</h3>
                  <Button
                    onClick={() => {
                      setSelectedMeeting(null)
                      setShowCreateMeetingModal(true)
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>

                {/* Meetings List */}
                {meetings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h3>
                      <p className="text-gray-500 mb-4">
                        Get started by scheduling your first group meeting.
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedMeeting(null)
                          setShowCreateMeetingModal(true)
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule First Meeting
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {meetings
                      .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())
                      .map((meeting) => {
                        const isUpcoming = new Date(meeting.meeting_date) >= new Date() && meeting.status === 'scheduled'
                        const statusColor = {
                          'scheduled': 'bg-blue-100 text-blue-800',
                          'completed': 'bg-green-100 text-green-800',
                          'cancelled': 'bg-red-100 text-red-800',
                          'rescheduled': 'bg-yellow-100 text-yellow-800'
                        }[meeting.status] || 'bg-gray-100 text-gray-800'
                        
                        const typeColor = {
                          'regular': 'bg-blue-100 text-blue-800',
                          'special': 'bg-purple-100 text-purple-800',
                          'planning': 'bg-orange-100 text-orange-800',
                          'social': 'bg-green-100 text-green-800',
                          'outreach': 'bg-red-100 text-red-800'
                        }[meeting.meeting_type] || 'bg-gray-100 text-gray-800'

                        return (
                          <Card key={meeting.id} className={`hover:shadow-md transition-shadow ${isUpcoming ? 'border-blue-200' : ''}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900">{meeting.title}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                      {meeting.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                                      {meeting.meeting_type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  
                                  {meeting.description && (
                                    <p className="text-gray-600 mb-3">{meeting.description}</p>
                                  )}
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      <span>{format(new Date(meeting.meeting_date), 'MMM d, yyyy')}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {new Date(`2000-01-01T${meeting.start_time}`).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                        {meeting.end_time && (
                                          ` - ${new Date(`2000-01-01T${meeting.end_time}`).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })}`
                                        )}
                                      </span>
                                    </div>
                                    
                                    {meeting.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{meeting.location}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {meeting.meeting_link && (
                                    <div className="mt-2">
                                      <a 
                                        href={meeting.meeting_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Join Meeting
                                      </a>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMeeting(meeting)
                                      setShowCreateMeetingModal(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {/* TODO: Add meeting details/attendance modal */}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="messages" className="pt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle>Group Messages</CardTitle>
                      <CardDescription>
                        Message history and statistics for this group
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      // Ensure other modals are closed before opening message modal
                      setShowDeleteDialog(false)
                      setShowRemoveMemberDialog(false)
                      setShowAddMemberModal(false)
                      setTimeout(() => setShowMessageModal(true), 50)
                    }}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Message Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">{messageStats.total}</div>
                      <div className="text-sm text-blue-600">Total Messages</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{messageStats.sent}</div>
                      <div className="text-sm text-green-600">Sent Successfully</div>
                    </div>
                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <div className="text-2xl font-bold text-red-700">{messageStats.failed}</div>
                      <div className="text-sm text-red-600">Failed</div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-700">{messageStats.pending}</div>
                      <div className="text-sm text-yellow-600">Pending</div>
                    </div>
                  </div>

                  {/* Message History */}
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No messages yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start engaging with your group by sending your first message
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowDeleteDialog(false)
                          setShowRemoveMemberDialog(false)
                          setShowAddMemberModal(false)
                          setTimeout(() => setShowMessageModal(true), 50)
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send First Message
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {messages.map((message) => (
                            <TableRow key={message.id}>
                              <TableCell className="font-medium">
                                {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {message.channel}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {message.subject || 'No subject'}
                              </TableCell>
                              <TableCell>
                                {message.recipient_ids?.length || 0} people
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  message.status === 'sent' ? 'bg-green-100 text-green-800' :
                                  message.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {message.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Future: Add message details view
                                    toast({
                                      title: 'Message Details',
                                      description: 'Detailed message view coming soon'
                                    })
                                  }}
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
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

            <TabsContent value="leaders" className="pt-4">
              <div className="space-y-6">
                {/* Leaders Section */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-yellow-500" />
                          Group Leaders
                        </CardTitle>
                        <CardDescription>
                          Manage who can lead and moderate this group
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowAssignLeaderModal(true)}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 rounded-xl"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Leader
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {leadersLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : leaders.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Crown className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No leaders assigned</h3>
                        <p className="text-slate-500">This group doesn't have any leaders yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leaders.map((leader) => (
                          <div key={leader.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Avatar className="h-12 w-12">
                                  <img 
                                    src={leader.avatar_url || '/default-avatar.png'} 
                                    alt={`${leader.first_name} ${leader.last_name}`}
                                    className="w-full h-full object-cover"
                                  />
                                </Avatar>
                                {leader.is_primary_leader && (
                                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                    <Crown className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                  {leader.first_name} {leader.last_name}
                                  {leader.is_primary_leader && (
                                    <Badge className="bg-yellow-500 text-white text-xs">
                                      Primary
                                    </Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-slate-600">{leader.email}</p>
                                <p className="text-sm text-slate-500">
                                  Assigned: {formatDate(leader.assigned_at)}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedLeader(leader)
                                setShowRemoveLeaderDialog(true)
                              }}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Permissions Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <CardTitle>Leader Permissions</CardTitle>
                    </div>
                    <CardDescription>
                      Configure what leaders can do for this group
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {permissions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Shield className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No permissions configured</h3>
                        <p className="text-slate-500">Permission settings will appear here once leaders are assigned.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div>
                              <h4 className="font-medium text-slate-900 capitalize">
                                {permission.permission_type.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {permission.permission_type === 'approve_requests' && 'Allow leaders to approve/reject membership requests'}
                                {permission.permission_type === 'send_messages' && 'Allow leaders to send messages to group members'}
                                {permission.permission_type === 'edit_group' && 'Allow leaders to edit group details and settings'}
                                {permission.permission_type === 'add_members' && 'Allow leaders to add new members to the group'}
                                {permission.permission_type === 'remove_members' && 'Allow leaders to remove members from the group'}
                                {permission.permission_type === 'view_analytics' && 'Allow leaders to view group analytics and reports'}
                              </p>
                            </div>
                            <Switch
                              checked={permission.is_enabled}
                              onCheckedChange={(checked) => handlePermissionToggle(permission.permission_type, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="approvals" className="pt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle>Membership Requests</CardTitle>
                      <CardDescription>
                        {pendingRequests.length} pending requests for this group
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {approvalsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No pending requests</h3>
                      <p className="text-slate-500">All membership requests have been processed.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{request.contact_name}</h4>
                              <p className="text-sm text-slate-600">{request.contact_email}</p>
                              <p className="text-sm text-slate-500">
                                Requested: {new Date(request.requested_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id, request.table_source)}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request.id, request.table_source)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
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
          groupName={group?.name || 'Group'}
          recipientIds={memberIds}
          onSuccess={handleMessageSuccess}
        />
        
        <CreateMeetingModal
          open={showCreateMeetingModal}
          onOpenChange={setShowCreateMeetingModal}
          groupId={id}
          groupName={group?.name || 'Group'}
          meeting={selectedMeeting}
          onSuccess={handleMeetingSuccess}
        />
        
        {/* Assign Leader Modal */}
        <AssignLeaderModal
          open={showAssignLeaderModal}
          onOpenChange={setShowAssignLeaderModal}
          groupId={id}
          groupName={group?.name || 'Group'}
          onSuccess={() => {
            // Refresh leaders after successful assignment
            fetchGroupLeaders(id).then(({ data }) => {
              setLeaders(data || [])
            })
          }}
        />
        
        {/* Remove Leader Dialog */}
        <Dialog open={showRemoveLeaderDialog} onOpenChange={setShowRemoveLeaderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Leader</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedLeader?.first_name} {selectedLeader?.last_name} as a leader from this group?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRemoveLeaderDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedLeader && handleRemoveLeader(selectedLeader.user_id)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove Leader'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 