'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Loader2, 
  Calendar as CalendarIcon,
  Edit, 
  Trash2, 
  Smartphone, 
  Mail, 
  Check, 
  X,
  UserCircle2,
  UserPlus,
  Users,
  CalendarCheck,
  Award,
  Heart,
  TrendingUp,
  Filter,
  RotateCcw,
  Phone,
  MapPin,
  Star,
  Activity,
  MessageSquare,
  Bell,
  Settings,
  MoreHorizontal,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { FollowUpModal } from '@/components/FollowUpModal'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

import { fetchMember, updateMember, deleteMember } from '@/services/members'
import { updateContact, uploadContactImage } from '@/services/contacts'
import { 
  fetchMemberGroupMemberships,
  fetchMemberFollowUps,
  fetchMemberAttendance,
  fetchMemberGivingSummary,
  fetchMemberJourney,
  fetchMemberAppStatus,
  fetchMemberServingStats,
  fetchMemberMetrics,
  fetchMemberGivingByServingStatus
} from '@/services/memberDetails'

import { 
  fetchCustomFields, 
  fetchCustomFieldValues, 
  saveCustomFieldValues,
  type CustomField 
} from '@/services/settings'
import { CustomFieldInput, CustomFieldDisplay } from '@/components/ui/custom-fields'

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Helper to create email template
const createEmailTemplate = (subject: string, message: string, memberName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
            DOCM CHURCH
          </h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 14px;">
            Demonstration of Christ Ministries
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
            Hello ${memberName}!
          </h2>
          
          <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <div style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #718096; font-size: 14px; margin: 0;">
              We hope to see you soon at DOCM Church!
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #edf2f7; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px; margin: 0 0 10px 0;">
            This message was sent from the DOCM Church Management System.
          </p>
          <p style="color: #a0aec0; font-size: 11px; margin: 0;">
            If you have any questions, please contact our church office.
          </p>
          <div style="margin-top: 20px;">
            <p style="color: #a0aec0; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} Demonstration of Christ Ministries
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Icon mapping for journey events
const getJourneyIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    'user-plus': <UserPlus className="h-4 w-4" />,
    'users': <Users className="h-4 w-4" />,
    'calendar-check': <CalendarCheck className="h-4 w-4" />,
    'award': <Award className="h-4 w-4" />,
    'heart': <Heart className="h-4 w-4" />,
    'trending-up': <TrendingUp className="h-4 w-4" />
  }
  return icons[iconName] || <CalendarIcon className="h-4 w-4" />
}

type JourneyEvent = {
  id: string
  type: 'joined' | 'group_joined' | 'follow_up' | 'attendance' | 'giving' | 'milestone' | 'note'
  title: string
  description: string
  date: string
  icon: string
  category?: string
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
}

type GivingSummary = {
  yearToDateTotal: number
  lastContribution: string
  totalContributions?: number
  averageContribution?: number
}

type Group = {
  id: number
  group_name: string
  group_type?: string
  role: string
  joined_date: string
  group_id?: string
}

type FollowUp = {
  id: number
  type: string
  notes: string
  created_at: string
  scheduled_date: string
  completed: boolean
}

type Attendance = {
  id: number
  service_name: string
  service_date: string
  checked_in: boolean
  method?: string
}

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  // Get the member ID from params with proper type safety
  const memberId = typeof params.id === 'string' ? params.id : '';
  
  // State variables
  const [member, setMember] = useState<Member | null>(null)
  const [isAppUser, setIsAppUser] = useState(false)
  const [givingSummary, setGivingSummary] = useState<GivingSummary | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [journey, setJourney] = useState<JourneyEvent[]>([])
  const [servingStats, setServingStats] = useState<any>(null)
  const [memberMetrics, setMemberMetrics] = useState<any>(null)
  const [givingByServingStatus, setGivingByServingStatus] = useState<any>(null)
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false)
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('groups')
  const [editMode, setEditMode] = useState(searchParams.get('mode') === 'edit')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Email form state
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Simplified filtering state
  const [filters, setFilters] = useState({
    dateRange: '3months', // applies to all tabs
    showCompleted: true
  })

  // Helper function to filter data based on date range
  const filterByDateRange = (data: any[], dateField: string) => {
    if (filters.dateRange === 'all') return data
    
    const now = new Date()
    let cutoffDate = new Date()
    
    switch (filters.dateRange) {
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      default:
        return data
    }
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField])
      return itemDate >= cutoffDate
    })
  }

  // Pagination state for each tab
  const [followUpsPagination, setFollowUpsPagination] = useState({ page: 1, hasMore: false, loading: false, total: 0 })
  const [attendancePagination, setAttendancePagination] = useState({ page: 1, hasMore: false, loading: false, total: 0 })
  const [journeyPagination, setJourneyPagination] = useState({ page: 1, hasMore: false, loading: false, total: 0 })
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    joinedAt: '',
    notes: ''
  })

  // Calculate filtered data for each tab
  const filteredGroups = filterByDateRange(groups, 'joined_date')
  const filteredFollowUps = filterByDateRange(followUps, 'scheduled_date')
  const filteredAttendance = filterByDateRange(attendance, 'service_date')
  const filteredJourney = filterByDateRange(journey, 'date')
  
  // Load member data and related information
  useEffect(() => {
    if (!memberId) return;
    
    const loadMemberData = async () => {
      try {
        console.log('🚀 Starting to load member data for:', memberId);
        
        // Fetch member data
        console.log('📝 Fetching member basic data...');
        const { data, error } = await fetchMember(memberId)
        if (error) {
          console.error('❌ Error fetching member:', error);
          throw error;
        }
        
        const memberData = data as unknown as Member
        console.log('✅ Member data loaded:', memberData);
        setMember(memberData)
        
        // Update form data
        setFormData({
          firstName: memberData.contacts.first_name,
          lastName: memberData.contacts.last_name,
          email: memberData.contacts.email,
          phone: memberData.contacts.phone,
          joinedAt: memberData.joined_at,
          notes: memberData.notes || ''
        })
        
        // Check if member is an app user with new service
        console.log('📱 Checking mobile app status...');
        const { data: appStatusData, error: appError } = await fetchMemberAppStatus(memberId)
        if (appError) {
          console.warn('⚠️ App status check failed:', appError);
        } else {
          console.log('✅ App status loaded:', appStatusData);
          setIsAppUser(appStatusData?.isAppUser || false)
        }
        
        // Fetch giving summary
        console.log('💰 Fetching giving summary...');
        const { data: givingData, error: givingError } = await fetchMemberGivingSummary(memberId)
        if (givingError) {
          console.warn('⚠️ Giving summary failed:', givingError);
        } else {
          console.log('✅ Giving summary loaded:', givingData);
          setGivingSummary(givingData)
        }
        
        // Fetch groups, follow-ups, attendance, and journey data for tabs
        console.log('🔄 Loading tab data in parallel...');
        const [groupsRes, followUpsRes, attendanceRes, journeyRes, servingRes, metricsRes, givingByServingRes] = await Promise.all([
          fetchMemberGroupMemberships(memberId),
          fetchMemberFollowUps(memberId, 1, 10),
          fetchMemberAttendance(memberId, 1, 20),
          fetchMemberJourney(memberId, 1, 4),
          fetchMemberServingStats(memberId),
          fetchMemberMetrics(memberId),
          fetchMemberGivingByServingStatus(memberId)
        ])
        
        console.log('📊 Tab data results:', {
          groups: { count: groupsRes.data?.length, error: groupsRes.error },
          followUps: { count: followUpsRes.data?.length, hasMore: followUpsRes.hasMore, total: followUpsRes.total, error: followUpsRes.error },
          attendance: { count: attendanceRes.data?.length, hasMore: attendanceRes.hasMore, total: attendanceRes.total, error: attendanceRes.error },
          journey: { count: journeyRes.data?.length, hasMore: journeyRes.hasMore, total: journeyRes.total, error: journeyRes.error },
          serving: { data: servingRes.data, error: servingRes.error },
          metrics: { data: metricsRes.data, error: metricsRes.error },
          givingByServing: { data: givingByServingRes.data, error: givingByServingRes.error }
        });
        
        setGroups(groupsRes.data || [])
        setFollowUps(followUpsRes.data || [])
        setAttendance(attendanceRes.data || [])
        setJourney(journeyRes.data || [])
        setServingStats(servingRes.data || null)
        setMemberMetrics(metricsRes.data || null)
        setGivingByServingStatus(givingByServingRes.data || null)
        
        // Update pagination state
        setFollowUpsPagination({ page: 1, hasMore: followUpsRes.hasMore || false, loading: false, total: followUpsRes.total || 0 })
        setAttendancePagination({ page: 1, hasMore: attendanceRes.hasMore || false, loading: false, total: attendanceRes.total || 0 })
        setJourneyPagination({ page: 1, hasMore: journeyRes.hasMore || false, loading: false, total: journeyRes.total || 0 })
        
        // Load custom fields and values
        console.log('🔧 Loading custom fields...');
        setCustomFieldsLoading(true)
        try {
          const [fieldsRes, valuesRes] = await Promise.all([
            fetchCustomFields('members'),
            fetchCustomFieldValues('members', memberData.contact_id)
          ])
          
          if (fieldsRes.success && fieldsRes.data) {
            const visibleFields = fieldsRes.data.filter(field => field.visible)
            setCustomFields(visibleFields)
            console.log('✅ Custom fields loaded:', visibleFields.length, 'visible fields')
          } else {
            console.warn('⚠️ Custom fields loading failed:', fieldsRes.error)
          }
          
          if (valuesRes.success && valuesRes.data) {
            setCustomFieldValues(valuesRes.data)
            console.log('✅ Custom field values loaded:', Object.keys(valuesRes.data).length, 'values')
          } else {
            console.warn('⚠️ Custom field values loading failed:', valuesRes.error)
          }
        } catch (customFieldsError) {
          console.error('💥 Custom fields loading error:', customFieldsError)
        } finally {
          setCustomFieldsLoading(false)
        }
        
        // Show info if we're using mock data
        const hasMockData = (
          (followUpsRes.data?.length === 1 && followUpsRes.data[0].id === 1) ||
          (attendanceRes.data?.length === 3 && attendanceRes.data[0].id === 1) ||
          (givingData?.yearToDateTotal === 2500.00)
        );
        
        if (hasMockData) {
          toast({
            title: 'Info',
            description: 'Some data is currently showing sample information as the full database is being set up.',
            variant: 'default'
          });
        }
        
      } catch (err) {
        console.error('💥 Failed to load member data', err)
        setError(err instanceof Error ? err.message : 'Failed to load member data')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load member data'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadMemberData()
  }, [memberId])
  
  // Function to load more data for each tab
  const loadMoreFollowUps = async () => {
    if (followUpsPagination.loading || !followUpsPagination.hasMore) return;
    
    setFollowUpsPagination(prev => ({ ...prev, loading: true }));
    
    try {
      const nextPage = followUpsPagination.page + 1;
      const { data: newFollowUps, hasMore, total } = await fetchMemberFollowUps(memberId, nextPage, 10);
      
      setFollowUps(prev => [...prev, ...newFollowUps]);
      setFollowUpsPagination({ page: nextPage, hasMore, loading: false, total });
    } catch (error) {
      console.error('Failed to load more follow-ups:', error);
      setFollowUpsPagination(prev => ({ ...prev, loading: false }));
    }
  };

  const loadMoreAttendance = async () => {
    if (attendancePagination.loading || !attendancePagination.hasMore) return;
    
    setAttendancePagination(prev => ({ ...prev, loading: true }));
    
    try {
      const nextPage = attendancePagination.page + 1;
      const { data: newAttendance, hasMore, total } = await fetchMemberAttendance(memberId, nextPage, 20);
      
      setAttendance(prev => [...prev, ...newAttendance]);
      setAttendancePagination({ page: nextPage, hasMore, loading: false, total });
    } catch (error) {
      console.error('Failed to load more attendance:', error);
      setAttendancePagination(prev => ({ ...prev, loading: false }));
    }
  };

  const loadMoreJourney = async () => {
    if (journeyPagination.loading || !journeyPagination.hasMore) return;
    
    setJourneyPagination(prev => ({ ...prev, loading: true }));
    
    try {
      const nextPage = journeyPagination.page + 1;
      const { data: newJourney, hasMore, total } = await fetchMemberJourney(memberId, nextPage, 4);
      
      setJourney(prev => [...prev, ...newJourney]);
      setJourneyPagination({ page: nextPage, hasMore, loading: false, total });
    } catch (error) {
      console.error('Failed to load more journey events:', error);
      setJourneyPagination(prev => ({ ...prev, loading: false }));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Update member information
      const { error: memberError } = await updateMember(memberId, {
        joined_at: formData.joinedAt,
        notes: formData.notes,
      })
      
      if (memberError) {
        throw new Error(memberError.message || 'Failed to update member')
      }
      
      // Update contact information
      await updateContact({
        id: member!.contacts.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      })
      
      // Save custom field values
      if (Object.keys(customFieldValues).length > 0) {
        const customFieldResult = await saveCustomFieldValues('members', member!.contact_id, customFieldValues)
        if (!customFieldResult.success) {
          console.warn('Custom fields save failed:', customFieldResult.error)
          toast({
            title: 'Partial Success',
            description: 'Member details updated but custom fields may not have saved properly.',
            variant: 'default'
          })
        }
      }
      
      // Refresh member data
      const { data: updatedMember } = await fetchMember(memberId)
      setMember(updatedMember as unknown as Member)
      setEditMode(false)
      
      toast({
        title: 'Success',
        description: 'Member updated successfully'
      })
    } catch (error) {
      console.error('Error updating member:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update member'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteMember = async () => {
    setIsSubmitting(true)
    
    try {
      const { error } = await deleteMember(memberId)
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Member deleted successfully'
      })
      
      // Redirect to members list
      router.push('/people/members')
      
    } catch (err) {
      console.error('Failed to delete member', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete member'
      })
      setShowDeleteDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !member) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingImage(true)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload the image
      const imageUrl = await uploadContactImage(member.contacts.id, file)
      
      // Update the member data in state
      setMember(prev => prev ? {
        ...prev,
        contacts: {
          ...prev.contacts,
          profile_image: imageUrl
        }
      } : null)

      toast({
        title: "Profile image updated",
        description: "The profile image has been successfully updated",
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      setImagePreview(null)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSendEmail = async () => {
    if (!member?.contacts.email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No email address available for this member'
      })
      return
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in both subject and message'
      })
      return
    }

    setSendingEmail(true)
    
    try {
      console.log('🚀 Sending email to:', member.contacts.email);
      console.log('📧 Email details:', {
        subject: emailSubject,
        messageLength: emailMessage.length,
        recipientName: `${member.contacts.first_name} ${member.contacts.last_name}`
      });
      
      // Send email using unified email API (with proper fallback system)
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: member.contacts.email,
          subject: emailSubject,
          html: createEmailTemplate(emailSubject, emailMessage, `${member.contacts.first_name} ${member.contacts.last_name}`),
          emailType: 'admin', // Use admin email account
          metadata: {
            member_id: memberId,
            sender: 'admin_user',
            message_type: 'direct_message',
            recipient_name: `${member.contacts.first_name} ${member.contacts.last_name}`
          }
        })
      })
      
      const result = await response.json()
      
      console.log('📊 Email send result:', result);
      
      if (result.success) {
        toast({
          title: 'Email Sent Successfully! ✅',
          description: `Your message has been delivered to ${member.contacts.first_name} ${member.contacts.last_name} at ${member.contacts.email}`
        })
        
        // Reset form and close modal
        setEmailSubject('')
        setEmailMessage('')
        setShowEmailModal(false)
      } else {
        throw new Error(result.error || 'Failed to send email')
      }
      
    } catch (err) {
      console.error('💥 Failed to send email', err)
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Failed to send email. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('SMTP')) {
          errorMessage = 'Email server connection failed. Please check your internet connection and try again.';
        } else if (err.message.includes('authentication')) {
          errorMessage = 'Email authentication failed. Please contact system administrator.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Email sending timed out. Please try again.';
        } else {
          errorMessage = `Email failed: ${err.message}`;
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Email Failed ❌',
        description: errorMessage
      })
    } finally {
      setSendingEmail(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Member Profile</h2>
          <p className="text-purple-200">Fetching the latest information...</p>
        </div>
      </div>
    )
  }
  
  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserCircle2 className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Member Not Found</h2>
            <p className="text-gray-300 mb-6">
              The member you're looking for doesn't exist in our system.
            </p>
            <Button 
              onClick={() => router.push('/people/members')}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0"
            >
              Back to Members
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* Profile Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur-sm"></div>
                <Avatar 
                  src={member.contacts.profile_image} 
                  alt={`${member.contacts.first_name} ${member.contacts.last_name}`}
                  className="relative h-28 w-28 border-4 border-white shadow-2xl"
                />
                <div className="absolute -bottom-2 -right-2">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {isAppUser ? "💚 App User" : "📱 No App"}
                  </div>
                </div>
              </div>
              
              <div className="text-white">
                <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {member.contacts.first_name} {member.contacts.last_name}
                </h1>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Member since {new Date(member.joined_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                  {member.contacts.email && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-medium">{member.contacts.email}</span>
                    </div>
                  )}
                  {member.contacts.phone && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-medium">{member.contacts.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 lg:ml-auto">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setEditMode(!editMode)}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button 
                size="lg"
                onClick={() => setShowFollowUpModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Follow-Up
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setShowDeleteDialog(true)}
                className="bg-red-500/20 backdrop-blur-sm border-red-300 text-red-100 hover:bg-red-500/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 -mt-8 pb-12">
        {/* Main Content - All cards on same line */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden h-full">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <UserCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Additional Stats</h2>
                    <p className="text-slate-300 text-sm">Personal details</p>
                  </div>
                </div>
              </div>
              
              {editMode ? (
                <form onSubmit={handleSaveMember}>
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Profile Image Upload */}
                      <div className="flex flex-col items-center space-y-4 pb-6 border-b border-slate-200">
                        <div className="relative">
                          <Avatar 
                            src={imagePreview || member.contacts.profile_image} 
                            alt={`${member.contacts.first_name} ${member.contacts.last_name}`}
                            className="h-24 w-24 border-4 border-slate-200 shadow-lg"
                          />
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <Label htmlFor="profileImage" className="cursor-pointer">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Edit className="h-4 w-4" />
                                  Change Photo
                                </>
                              )}
                            </div>
                          </Label>
                          <Input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                          <p className="text-xs text-slate-500 mt-2">
                            Upload a new profile photo (max 5MB)
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                            className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                            className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="joinedAt" className="text-sm font-semibold text-slate-700">Member Since</Label>
                          <Input
                            id="joinedAt"
                            name="joinedAt"
                            type="date"
                            value={formData.joinedAt.split('T')[0]}
                            onChange={handleInputChange}
                            required
                            className="h-10 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Additional notes..."
                          className="border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      
                      {/* Custom Fields Section */}
                      {customFields.length > 0 && (
                        <div className="pt-4 border-t border-slate-200">
                          <h4 className="text-sm font-semibold text-slate-700 mb-4">Additional Information</h4>
                          <div className="space-y-4">
                            {customFields.map((field) => (
                              <div key={field.id} className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">
                                  {field.field_label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                <CustomFieldInput
                                  field={field}
                                  value={customFieldValues[field.field_name] || ''}
                                  onChange={(value) => setCustomFieldValues(prev => ({
                                    ...prev,
                                    [field.field_name]: value
                                  }))}
                                  disabled={isSubmitting}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 px-6 py-4 border-t">
                    <div className="flex justify-end gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditMode(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    
                    {member.notes && (
                      <div className="pt-3 border-t border-slate-200">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</Label>
                        <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{member.notes}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Information */}
                    {(customFields.length > 0 || servingStats || memberMetrics) && (
                      <div className="pt-3 border-t border-slate-200">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Additional Information</Label>
                        <div className="mt-2 space-y-3">
                          {/* Serving Status */}
                          {servingStats && (
                            <div>
                              <Label className="text-xs font-medium text-slate-600">Serving Status</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <div className={cn(
                                  "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                  servingStats.isServing 
                                    ? "bg-emerald-100 text-emerald-700" 
                                    : "bg-slate-100 text-slate-600"
                                )}>
                                  <Award className="h-3 w-3" />
                                  {servingStats.isServing ? 'Currently serving' : 'Not serving'}
                                </div>
                                {servingStats.totalGroups > 0 && (
                                  <span className="text-xs text-slate-500">
                                    in {servingStats.totalGroups} group{servingStats.totalGroups > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Attendance Rate */}
                          {memberMetrics && (
                            <div>
                              <Label className="text-xs font-medium text-slate-600">Attendance Rate</Label>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-32">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (memberMetrics.attendanceRate || 0))}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-600 font-medium">
                                  {Math.round(memberMetrics.attendanceRate || 0)}%
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Custom Fields */}
                          {customFields.map((field) => {
                            const value = customFieldValues[field.field_name];
                            if (!value && value !== false) return null;
                            
                            return (
                              <div key={field.id}>
                                <Label className="text-xs font-medium text-slate-600">{field.field_label}</Label>
                                <div className="mt-1">
                                  <CustomFieldDisplay field={field} value={value} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden h-full">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 rounded-xl border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300" 
                  onClick={() => setShowSmsModal(true)}
                >
                  <Smartphone className="h-4 w-4 mr-3 text-blue-500" />
                  <span className="font-medium text-sm">Send SMS</span>
                  <span className="ml-auto text-xs text-slate-500 font-normal">(Coming Soon)</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 rounded-xl border-2 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:border-emerald-300" 
                  onClick={() => setShowEmailModal(true)}
                >
                  <Mail className="h-4 w-4 mr-3 text-emerald-500" />
                  <span className="font-medium text-sm">Send Email</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-10 rounded-xl border-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-300" 
                  asChild
                >
                  <Link href={`/people/groups/assign?member=${params.id}`}>
                    <Users className="h-4 w-4 mr-3 text-purple-500" />
                    <span className="font-medium text-sm">Manage Groups</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>



          {/* Giving Cards - Expanded */}
          {givingSummary && (
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden h-full">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Giving Summary
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Year to Date Total */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {formatCurrency(givingSummary.yearToDateTotal)}
                      </div>
                      <div className="text-sm font-medium text-green-500 uppercase tracking-wide">
                        Year to Date Total
                      </div>
                    </div>
                    
                    {/* Average Contribution */}
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {formatCurrency(givingSummary.averageContribution || 0)}
                      </div>
                      <div className="text-sm font-medium text-purple-500 uppercase tracking-wide">
                        Average Contribution
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional giving insights */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Giving Consistency</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (givingSummary.totalContributions || 0) * 2)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 font-medium">
                            {givingSummary.totalContributions || 0} times
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent Activity</h4>
                        <div className="text-xs text-slate-600">
                          {givingSummary.lastContribution 
                            ? `Last donation: ${new Date(givingSummary.lastContribution).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}`
                            : 'No recent donations recorded'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="mt-12">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Member Activity</h2>
                    <p className="text-slate-300">Groups, follow-ups, attendance, and journey timeline</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium text-slate-300">Filter by:</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1month">Last Month</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="border-b border-slate-200">
              <div className="flex">
                {[
                  { id: 'groups', label: 'Groups', count: filteredGroups.length, color: 'blue' },
                  { id: 'followups', label: 'Follow-Ups', count: filteredFollowUps.length, color: 'emerald' },
                  { id: 'attendance', label: 'Attendance', count: filteredAttendance.length, color: 'purple' },
                  { id: 'journey', label: 'Journey', count: filteredJourney.length, color: 'amber' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "px-8 py-6 font-semibold text-sm transition-all duration-200 relative",
                      activeTab === tab.id 
                        ? "text-blue-600 bg-gradient-to-b from-blue-50 to-white" 
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.label}</span>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        activeTab === tab.id 
                          ? "bg-blue-100 text-blue-600" 
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {tab.count}
                      </span>
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-8">
              {activeTab === 'groups' && (
                <div>
                  {filteredGroups.length > 0 ? (
                    <div className="space-y-4">
                      {filteredGroups.map(group => (
                        <div key={group.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center gap-6">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white">
                              <Users className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-800">{group.group_name}</h4>
                              <p className="text-slate-600 font-medium">
                                {group.role} • Joined {new Date(group.joined_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="lg" className="rounded-xl border-2" asChild>
                            <Link href={`/people/groups/${group.group_id || group.id}`}>
                              View Group
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="h-12 w-12 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No groups yet</h3>
                      <p className="text-slate-600 mb-6 max-w-md mx-auto">This member hasn't joined any groups yet. Get them connected with a community!</p>
                      <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 px-8 py-3 rounded-xl" asChild>
                        <Link href={`/people/groups/assign?member=${params.id}`}>
                          Assign to Group
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'followups' && (
                <div>
                  {filteredFollowUps.length > 0 ? (
                    <div className="space-y-4">
                      {filteredFollowUps.map(followUp => (
                        <div key={followUp.id} className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-6">
                              <div className={cn(
                                "p-4 rounded-2xl",
                                followUp.completed ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                              )}>
                                <CalendarIcon className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-slate-800 capitalize">{followUp.type}</h4>
                                <p className="text-slate-600 font-medium">
                                  {new Date(followUp.scheduled_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={followUp.completed ? "default" : "secondary"}
                              className={cn(
                                "px-4 py-2 text-sm font-bold rounded-full",
                                followUp.completed ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"
                              )}
                            >
                              {followUp.completed ? '✅ Completed' : '⏳ Pending'}
                            </Badge>
                          </div>
                          <div className="pl-20">
                            <p className="text-slate-700 leading-relaxed">{followUp.notes}</p>
                          </div>
                        </div>
                      ))}
                      
                      {followUpsPagination.hasMore && (
                        <Button 
                          variant="outline" 
                          onClick={loadMoreFollowUps}
                          disabled={followUpsPagination.loading}
                          className="w-full mt-6 h-12 rounded-xl border-2"
                        >
                          {followUpsPagination.loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Load More Follow-Ups
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="bg-gradient-to-br from-emerald-100 to-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarIcon className="h-12 w-12 text-emerald-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No follow-ups yet</h3>
                      <p className="text-slate-600 mb-6 max-w-md mx-auto">No follow-ups have been scheduled for this member. Stay connected with regular check-ins!</p>
                      <Button 
                        onClick={() => setShowFollowUpModal(true)}
                        className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 px-8 py-3 rounded-xl"
                      >
                        Schedule Follow-Up
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'attendance' && (
                <div>
                  {filteredAttendance.length > 0 ? (
                    <div className="space-y-4">
                      {filteredAttendance.map(record => (
                        <div key={record.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "p-4 rounded-2xl",
                              record.checked_in ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" : "bg-gradient-to-br from-red-500 to-red-600 text-white"
                            )}>
                              {record.checked_in ? (
                                <Check className="h-6 w-6" />
                              ) : (
                                <X className="h-6 w-6" />
                              )}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-slate-800">{record.service_name}</h4>
                              <p className="text-slate-600 font-medium">
                                {new Date(record.service_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={record.checked_in ? "default" : "secondary"}
                            className={cn(
                              "px-4 py-2 text-sm font-bold rounded-full",
                              record.checked_in ? "bg-emerald-500 text-white" : "bg-red-100 text-red-700"
                            )}
                          >
                            {record.checked_in ? '✅ Present' : '❌ Absent'}
                          </Badge>
                        </div>
                      ))}
                      
                      {attendancePagination.hasMore && (
                        <Button 
                          variant="outline" 
                          onClick={loadMoreAttendance}
                          disabled={attendancePagination.loading}
                          className="w-full mt-6 h-12 rounded-xl border-2"
                        >
                          {attendancePagination.loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Load More Records
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarCheck className="h-12 w-12 text-purple-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No attendance records</h3>
                      <p className="text-slate-600 max-w-md mx-auto">No attendance records found for this member.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'journey' && (
                <div>
                  {filteredJourney.length > 0 ? (
                    <div className="space-y-8">
                      {filteredJourney.map((event, index) => (
                        <div key={event.id} className="flex gap-6">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "p-4 rounded-2xl border-4",
                              event.type === 'joined' && "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-200 text-white",
                              event.type === 'group_joined' && "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-200 text-white",
                              event.type === 'follow_up' && "bg-gradient-to-br from-amber-500 to-amber-600 border-amber-200 text-white",
                              event.type === 'attendance' && "bg-gradient-to-br from-purple-500 to-purple-600 border-purple-200 text-white",
                              event.type === 'giving' && "bg-gradient-to-br from-red-500 to-red-600 border-red-200 text-white",
                              event.type === 'milestone' && "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-200 text-white"
                            )}>
                              {getJourneyIcon(event.icon)}
                            </div>
                            {index < filteredJourney.length - 1 && (
                              <div className="w-1 h-16 bg-gradient-to-b from-slate-300 to-slate-200 mt-4 rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="text-lg font-bold text-slate-800">{event.title}</h4>
                                  <p className="text-slate-600 mt-1">{event.description}</p>
                                </div>
                                <time className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                  {new Date(event.date).toLocaleDateString()}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {journeyPagination.hasMore && (
                        <Button 
                          variant="outline" 
                          onClick={loadMoreJourney}
                          disabled={journeyPagination.loading}
                          className="w-full mt-6 h-12 rounded-xl border-2"
                        >
                          {journeyPagination.loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Load More Events
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarIcon className="h-12 w-12 text-amber-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">No journey events</h3>
                      <p className="text-slate-600 max-w-md mx-auto">No journey events recorded for this member yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Confirm Delete</DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete this member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={isSubmitting}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              {isSubmitting ? (
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
      
      {/* SMS Modal */}
      {showSmsModal && (
        <Dialog open={showSmsModal} onOpenChange={setShowSmsModal}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Send SMS</DialogTitle>
              <DialogDescription>
                Send a text message to {member.contacts.first_name} at {member.contacts.phone || '[No phone number]'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[100px] rounded-xl border-2"
                disabled={!member.contacts.phone}
              />
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSmsModal(false)}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button
                disabled={!member.contacts.phone}
                className="rounded-xl px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Email Modal */}
      {showEmailModal && (
        <Dialog open={showEmailModal} onOpenChange={(open) => {
          setShowEmailModal(open)
          if (!open) {
            // Reset form when modal is closed
            setEmailSubject('')
            setEmailMessage('')
          } else {
            // Set default subject when modal opens
            if (!emailSubject && member) {
              setEmailSubject(`Hello ${member.contacts.first_name}!`)
            }
          }
        }}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Send Email</DialogTitle>
              <DialogDescription>
                Send an email to {member.contacts.first_name} at {member.contacts.email || '[No email address]'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Quick Templates */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailSubject(`Welcome to DOCM Church, ${member.contacts.first_name}!`)
                      setEmailMessage(`Hi ${member.contacts.first_name},\n\nWelcome to DOCM Church! We're so glad to have you as part of our church family.\n\nWe hope you'll join us for our upcoming services and events. If you have any questions or need anything, please don't hesitate to reach out.\n\nBlessings,\nDOCM Church Team`)
                    }}
                    className="text-xs h-8"
                  >
                    Welcome
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailSubject(`Following up from DOCM Church`)
                      setEmailMessage(`Hi ${member.contacts.first_name},\n\nI hope this message finds you well! I wanted to follow up and see how you're doing.\n\nIs there anything we can pray for or help you with? We're here to support you in any way we can.\n\nLooking forward to hearing from you.\n\nBlessings,\nDOCM Church Team`)
                    }}
                    className="text-xs h-8"
                  >
                    Follow-up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailSubject(`We miss you at DOCM Church!`)
                      setEmailMessage(`Hi ${member.contacts.first_name},\n\nWe noticed we haven't seen you at church lately and wanted to reach out to let you know that you're missed!\n\nOur church family isn't the same without you. If there's anything we can do to support you or if you'd like to talk, please don't hesitate to reach out.\n\nWe hope to see you soon!\n\nWith love,\nDOCM Church Team`)
                    }}
                    className="text-xs h-8"
                  >
                    We Miss You
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="font-semibold">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  disabled={!member.contacts.email}
                  className="rounded-xl border-2"
                  style={{ color: 'rgb(15, 23, 42)' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="font-semibold">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="min-h-[150px] rounded-xl border-2"
                  disabled={!member.contacts.email}
                  style={{ color: 'rgb(15, 23, 42)' }}
                />
                <p className="text-xs text-slate-500">
                  ✨ Your message will be automatically formatted with a professional church template
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEmailModal(false)}
                className="rounded-xl px-6"
                disabled={sendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!member.contacts.email || sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  'Send Email'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Follow Up Modal */}
      {showFollowUpModal && (
        <FollowUpModal
          open={showFollowUpModal}
          onOpenChange={setShowFollowUpModal}
          contactId={memberId}
          contactName={`${member.contacts.first_name} ${member.contacts.last_name}`}
        />
      )}
    </div>
  )
} 