'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Users,
  Lock,
  Check,
  X,
  Crown,
  Briefcase,
  CreditCard,
  Eye,
  UserPlus,
  Mail,
  Phone,
  Key,
  Ban,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  fetchRoles, 
  createRole,
  updateRole,
  deleteRole,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  toggleUserStatus,
  type Role,
  type AdminUser
} from '@/services/settings'

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  department: z.string().optional(),
  permissions: z.array(z.string()),
  is_active: z.boolean(),
})

const userSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role_ids: z.array(z.string()),
})

type RoleFormData = z.infer<typeof roleSchema>
type UserFormData = z.infer<typeof userSchema>

const availablePermissions = [
  // People & Contact Management
  { category: 'Contacts', permissions: [
    // View Permissions
    { id: 'contacts:view:all', label: 'View All Contacts', description: 'View all members, visitors, and contacts' },
    { id: 'contacts:view:assigned', label: 'View Assigned Contacts', description: 'View only contacts assigned to user' },
    { id: 'contacts:view:department', label: 'View Department Contacts', description: 'View contacts in same department' },
    { id: 'contacts:view:details', label: 'View Contact Details', description: 'View full contact information' },
    { id: 'contacts:view:sensitive', label: 'View Sensitive Info', description: 'View financial, health, or sensitive data' },
    
    // Create/Edit Permissions
    { id: 'contacts:create', label: 'Create Contacts', description: 'Add new contacts to the system' },
    { id: 'contacts:edit:all', label: 'Edit All Contacts', description: 'Edit any contact information' },
    { id: 'contacts:edit:assigned', label: 'Edit Assigned Contacts', description: 'Edit only assigned contacts' },
    { id: 'contacts:edit:basic', label: 'Edit Basic Info', description: 'Edit name, phone, email only' },
    { id: 'contacts:edit:sensitive', label: 'Edit Sensitive Info', description: 'Edit financial or health information' },
    
    // Administrative Permissions
    { id: 'contacts:delete', label: 'Delete Contacts', description: 'Remove contacts from system' },
    { id: 'contacts:merge', label: 'Merge Contacts', description: 'Merge duplicate contact records' },
    { id: 'contacts:import', label: 'Import Contacts', description: 'Bulk import contact data' },
    { id: 'contacts:export', label: 'Export Contacts', description: 'Export contact data' },
    { id: 'contacts:assign', label: 'Assign Contacts', description: 'Assign contacts to team members' },
  ]},

  // Member Management
  { category: 'Members', permissions: [
    { id: 'members:view:all', label: 'View All Members', description: 'View all church members' },
    { id: 'members:view:membership', label: 'View Membership Status', description: 'View member status and history' },
    { id: 'members:edit:membership', label: 'Edit Membership Status', description: 'Change membership status and dates' },
    { id: 'members:view:giving', label: 'View Giving History', description: 'View donation records' },
    { id: 'members:manage:groups', label: 'Manage Group Membership', description: 'Add/remove from groups' },
    { id: 'members:create', label: 'Add Members', description: 'Add new church members' },
    { id: 'members:transfer', label: 'Transfer Members', description: 'Transfer members between locations' },
  ]},

  // Groups & Small Groups
  { category: 'Groups', permissions: [
    { id: 'groups:view:all', label: 'View All Groups', description: 'View all groups and small groups' },
    { id: 'groups:view:department', label: 'View Department Groups', description: 'View groups in same department' },
    { id: 'groups:create', label: 'Create Groups', description: 'Create new groups and small groups' },
    { id: 'groups:edit:all', label: 'Edit All Groups', description: 'Update any group information' },
    { id: 'groups:edit:assigned', label: 'Edit Assigned Groups', description: 'Edit only assigned groups' },
    { id: 'groups:delete', label: 'Delete Groups', description: 'Remove groups from system' },
    { id: 'groups:manage:members', label: 'Manage Group Members', description: 'Add/remove group members' },
    { id: 'groups:assign:leaders', label: 'Assign Group Leaders', description: 'Assign and manage group leaders' },
  ]},

  // Attendance Management
  { category: 'Attendance', permissions: [
    { id: 'attendance:view:all', label: 'View All Attendance', description: 'View attendance for all events' },
    { id: 'attendance:view:events', label: 'View Event Attendance', description: 'View attendance for assigned events' },
    { id: 'attendance:check_in', label: 'Record Check-ins', description: 'Record attendance and check-ins' },
    { id: 'attendance:edit:all', label: 'Edit All Records', description: 'Edit any attendance record' },
    { id: 'attendance:edit:events', label: 'Edit Event Records', description: 'Edit attendance for assigned events' },
    { id: 'attendance:delete', label: 'Delete Records', description: 'Remove attendance records' },
    { id: 'attendance:export', label: 'Export Attendance', description: 'Export attendance data' },
    { id: 'attendance:reports', label: 'Attendance Reports', description: 'Generate attendance reports' },
  ]},

  // Follow-ups & Outreach
  { category: 'Follow-ups', permissions: [
    { id: 'followups:view:all', label: 'View All Follow-ups', description: 'View all follow-ups in system' },
    { id: 'followups:view:assigned', label: 'View Assigned Follow-ups', description: 'View only assigned follow-ups' },
    { id: 'followups:view:department', label: 'View Department Follow-ups', description: 'View follow-ups in same department' },
    { id: 'followups:create', label: 'Create Follow-ups', description: 'Create new follow-up tasks' },
    { id: 'followups:edit:all', label: 'Edit All Follow-ups', description: 'Edit any follow-up task' },
    { id: 'followups:edit:assigned', label: 'Edit Assigned Follow-ups', description: 'Edit only assigned follow-ups' },
    { id: 'followups:delete', label: 'Delete Follow-ups', description: 'Remove follow-up tasks' },
    { id: 'followups:assign', label: 'Assign Follow-ups', description: 'Assign follow-ups to team members' },
    { id: 'followups:reassign', label: 'Reassign Follow-ups', description: 'Change follow-up assignments' },
    { id: 'followups:complete', label: 'Complete Follow-ups', description: 'Mark follow-ups as completed' },
  ]},

  // Prayer Requests
  { category: 'Prayer Requests', permissions: [
    { id: 'prayers:view:all', label: 'View All Prayers', description: 'View all prayer requests' },
    { id: 'prayers:view:assigned', label: 'View Assigned Prayers', description: 'View only assigned prayer requests' },
    { id: 'prayers:view:public', label: 'View Public Prayers', description: 'View public prayer requests only' },
    { id: 'prayers:view:private', label: 'View Private Prayers', description: 'View confidential prayer requests' },
    { id: 'prayers:create', label: 'Create Prayer Requests', description: 'Add new prayer requests' },
    { id: 'prayers:edit:all', label: 'Edit All Prayers', description: 'Edit any prayer request' },
    { id: 'prayers:edit:assigned', label: 'Edit Assigned Prayers', description: 'Edit only assigned prayer requests' },
    { id: 'prayers:delete', label: 'Delete Prayer Requests', description: 'Remove prayer requests' },
    { id: 'prayers:assign', label: 'Assign Prayer Requests', description: 'Assign prayer requests to team' },
    { id: 'prayers:respond', label: 'Respond to Prayers', description: 'Add responses and updates' },
  ]},
  
  // Events Management
  { category: 'Events', permissions: [
    { id: 'events:view:all', label: 'View All Events', description: 'View all events and activities' },
    { id: 'events:view:assigned', label: 'View Assigned Events', description: 'View only assigned events' },
    { id: 'events:create', label: 'Create Events', description: 'Create new events and activities' },
    { id: 'events:edit:all', label: 'Edit All Events', description: 'Update any event details' },
    { id: 'events:edit:assigned', label: 'Edit Assigned Events', description: 'Edit only assigned events' },
    { id: 'events:delete', label: 'Delete Events', description: 'Remove events from the system' },
    { id: 'events:manage:registration', label: 'Manage Registration', description: 'Handle event registrations' },
    { id: 'events:assign:staff', label: 'Assign Event Staff', description: 'Assign staff to events' },
  ]},

  // Content Management
  { category: 'Content', permissions: [
    { id: 'sermons:view:all', label: 'View All Sermons', description: 'View all sermon content' },
    { id: 'sermons:create', label: 'Create Sermons', description: 'Add new sermon content' },
    { id: 'sermons:edit:all', label: 'Edit All Sermons', description: 'Edit any sermon content' },
    { id: 'sermons:edit:own', label: 'Edit Own Sermons', description: 'Edit only own sermon content' },
    { id: 'sermons:delete', label: 'Delete Sermons', description: 'Remove sermon content' },
    { id: 'sermons:publish', label: 'Publish Sermons', description: 'Publish sermon content' },
    
    { id: 'blogs:view:all', label: 'View All Blogs', description: 'View all blog content' },
    { id: 'blogs:create', label: 'Create Blogs', description: 'Create new blog posts' },
    { id: 'blogs:edit:all', label: 'Edit All Blogs', description: 'Edit any blog content' },
    { id: 'blogs:edit:own', label: 'Edit Own Blogs', description: 'Edit only own blog posts' },
    { id: 'blogs:delete', label: 'Delete Blogs', description: 'Remove blog content' },
    { id: 'blogs:publish', label: 'Publish Blogs', description: 'Publish blog content' },
    
    { id: 'media:view:all', label: 'View All Media', description: 'View all media files' },
    { id: 'media:upload', label: 'Upload Media', description: 'Upload new media files' },
    { id: 'media:edit:all', label: 'Edit All Media', description: 'Edit any media files' },
    { id: 'media:delete', label: 'Delete Media', description: 'Remove media files' },
    { id: 'media:organize', label: 'Organize Media', description: 'Create collections and organize media' },
  ]},
  
  // Communications
  { category: 'Communications', permissions: [
    { id: 'comms:view:all', label: 'View All Communications', description: 'View campaigns and templates' },
    { id: 'comms:send:email', label: 'Send Emails', description: 'Send email messages' },
    { id: 'comms:send:sms', label: 'Send SMS', description: 'Send SMS messages' },
    { id: 'comms:campaigns', label: 'Manage Campaigns', description: 'Create and manage communication campaigns' },
    { id: 'comms:templates', label: 'Manage Templates', description: 'Create and edit message templates' },
    { id: 'comms:scheduled', label: 'Schedule Messages', description: 'Schedule future communications' },
    { id: 'comms:reports', label: 'Communication Reports', description: 'View communication analytics' },
  ]},
  
  // Giving & Finance
  { category: 'Finance', permissions: [
    { id: 'giving:view:all', label: 'View All Giving', description: 'View all donation records' },
    { id: 'giving:view:summary', label: 'View Giving Summary', description: 'View donation summaries only' },
    { id: 'giving:manage', label: 'Manage Giving', description: 'Add, edit, and manage donations' },
    { id: 'giving:reports', label: 'Financial Reports', description: 'Generate and export financial reports' },
    { id: 'giving:settings', label: 'Giving Settings', description: 'Manage giving categories and settings' },
    { id: 'giving:statements', label: 'Generate Statements', description: 'Create giving statements' },
    { id: 'giving:batch', label: 'Batch Processing', description: 'Process donation batches' },
  ]},

  // Discipleship & Growth
  { category: 'Discipleship', permissions: [
    { id: 'discipleship:view:all', label: 'View All Programs', description: 'View all discipleship programs' },
    { id: 'discipleship:view:assigned', label: 'View Assigned Programs', description: 'View only assigned programs' },
    { id: 'discipleship:create', label: 'Create Programs', description: 'Create discipleship programs' },
    { id: 'discipleship:edit:all', label: 'Edit All Programs', description: 'Edit any discipleship program' },
    { id: 'discipleship:edit:assigned', label: 'Edit Assigned Programs', description: 'Edit only assigned programs' },
    { id: 'discipleship:track:progress', label: 'Track Progress', description: 'Monitor member progress' },
    { id: 'discipleship:assign:mentors', label: 'Assign Mentors', description: 'Assign mentors to members' },
  ]},
  
  // Reports & Analytics
  { category: 'Reports', permissions: [
    { id: 'reports:view:all', label: 'View All Reports', description: 'Access all system reports' },
    { id: 'reports:view:department', label: 'View Department Reports', description: 'View reports for own department' },
    { id: 'reports:create', label: 'Create Custom Reports', description: 'Build custom reports' },
    { id: 'reports:export', label: 'Export Reports', description: 'Export report data' },
    { id: 'reports:schedule', label: 'Schedule Reports', description: 'Schedule automated reports' },
    { id: 'reports:analytics', label: 'Advanced Analytics', description: 'Access advanced analytics' },
  ]},
  
  // Dashboard
  { category: 'Dashboard', permissions: [
    { id: 'dashboard:view', label: 'View Dashboard', description: 'Access the main dashboard and overview screens' },
  ]},
  
  // Administration
  { category: 'Administration', permissions: [
    { id: 'admin:settings', label: 'System Settings', description: 'Access system configuration and settings' },
    { id: 'admin:users', label: 'User Management', description: 'Manage staff users and their roles' },
    { id: 'admin:roles', label: 'Role Management', description: 'Create and manage user roles and permissions' },
    { id: 'admin:departments', label: 'Department Management', description: 'Manage departments and assignments' },
    { id: 'admin:audit', label: 'Audit Logs', description: 'View system audit logs and activity' },
    { id: 'admin:integrations', label: 'Integrations', description: 'Manage third-party integrations' },
    { id: 'admin:backup', label: 'Backup & Restore', description: 'System backup and restore functions' },
    { id: 'admin:maintenance', label: 'System Maintenance', description: 'System maintenance and updates' },
  ]},
]

// Department structure for assignment and organization
const departments = [
  { id: 'pastoral_care', name: 'Pastoral Care', color: '#10B981', description: 'Pastoral care and counseling' },
  { id: 'outreach', name: 'Outreach Team', color: '#F59E0B', description: 'Community outreach and evangelism' },
  { id: 'follow_up', name: 'Follow-up Team', color: '#EF4444', description: 'Member and visitor follow-up' },
  { id: 'prayer', name: 'Prayer Team', color: '#8B5CF6', description: 'Prayer ministry and intercession' },
  { id: 'youth', name: 'Youth Ministry', color: '#06B6D4', description: 'Youth and young adult ministry' },
  { id: 'worship', name: 'Worship Team', color: '#EC4899', description: 'Music and worship ministry' },
  { id: 'children', name: 'Children Ministry', color: '#84CC16', description: 'Children and family ministry' },
  { id: 'discipleship', name: 'Discipleship', color: '#6366F1', description: 'Discipleship and spiritual growth' },
  { id: 'communications', name: 'Communications', color: '#F97316', description: 'Media and communications' },
  { id: 'finance', name: 'Finance Team', color: '#059669', description: 'Financial management and giving' },
  { id: 'events', name: 'Events Team', color: '#DC2626', description: 'Event planning and coordination' },
  { id: 'admin', name: 'Administration', color: '#6B7280', description: 'System administration and IT' },
]

const roleIcons = {
  admin: Crown,
  staff: Briefcase,
  finance: CreditCard,
  viewer: Eye,
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('roles')
  
  // Role dialogs
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    role: Role | null
  }>({ open: false, role: null })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    role: Role | null
  }>({ open: false, role: null })
  
  // User dialogs
  const [userDialog, setUserDialog] = useState<{
    open: boolean
    user: AdminUser | null
  }>({ open: false, user: null })
  const [deleteUserDialog, setDeleteUserDialog] = useState<{
    open: boolean
    user: AdminUser | null
  }>({ open: false, user: null })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
      department: 'none',
      permissions: [],
      is_active: true,
    },
  })

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      department: 'none',
      role_ids: [],
    },
  })

  const watchPermissions = form.watch('permissions')
  const watchUserRoles = userForm.watch('role_ids')

  useEffect(() => {
    loadRoles()
    if (activeTab === 'users') {
      loadUsers()
    }
  }, [activeTab])

  async function loadRoles() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchRoles()
      
      if (success && data) {
        setRoles(data)
      } else {
        console.error('Error loading roles:', error)
        toast({
          title: 'Error',
          description: 'Failed to load roles. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function loadUsers() {
    try {
      setUsersLoading(true)
      const { success, data, error } = await fetchUsers()
      
      if (success && data) {
        setUsers(data)
      } else {
        console.error('Error loading users:', error)
        
        // More descriptive error message based on error code
        let errorMessage = 'Failed to load users. Please try again.'
        if (error && typeof error === 'object') {
          if ('code' in error) {
            switch (error.code) {
              case 'AUTH_ADMIN_ERROR':
                errorMessage = 'Admin access required for user management. Please check your permissions.'
                break
              case 'NETWORK_ERROR':
                errorMessage = 'Network error occurred. Please check your connection and try again.'
                break
              case 'ADMIN_ACCESS_REQUIRED':
                errorMessage = 'User management requires server-side admin setup. Please contact your administrator.'
                break
              default:
                errorMessage = error.message || 'Failed to load users. Please try again.'
            }
          } else if ('message' in error) {
            errorMessage = error.message as string
          }
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUsersLoading(false)
    }
  }

  function openEditDialog(role?: Role) {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description || '',
        department: role.department || 'none',
        permissions: role.permissions || [],
        is_active: role.is_active,
      })
    } else {
      form.reset({
        name: '',
        description: '',
        department: 'none',
        permissions: [],
        is_active: true,
      })
    }
    setEditDialog({ open: true, role: role || null })
  }

  function togglePermission(permissionId: string) {
    const currentPermissions = form.getValues('permissions')
    if (currentPermissions.includes(permissionId)) {
      form.setValue('permissions', currentPermissions.filter(p => p !== permissionId))
    } else {
      form.setValue('permissions', [...currentPermissions, permissionId])
    }
  }

  function toggleCategoryPermissions(category: string) {
    const categoryPermissions = availablePermissions
      .find(cat => cat.category === category)
      ?.permissions.map(p => p.id) || []
    
    const currentPermissions = form.getValues('permissions')
    const hasAll = categoryPermissions.every(p => currentPermissions.includes(p))
    
    if (hasAll) {
      // Remove all category permissions
      form.setValue('permissions', currentPermissions.filter(p => !categoryPermissions.includes(p)))
    } else {
      // Add all category permissions
      const newPermissions = [...currentPermissions]
      categoryPermissions.forEach(p => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p)
        }
      })
      form.setValue('permissions', newPermissions)
    }
  }

  async function onSubmit(data: RoleFormData) {
    try {
      setIsSubmitting(true)
      
      // Transform 'none' department back to null/undefined for API
      // Temporarily remove department field until DB migration is applied
      const submitData = {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        is_active: data.is_active
      }
      
      let result
      if (editDialog.role) {
        // Update existing role
        result = await updateRole(editDialog.role.id, submitData)
      } else {
        // Create new role
        result = await createRole(submitData)
      }
      
      if (result.success) {
        toast({
          title: editDialog.role ? 'Role updated' : 'Role created',
          description: `Role "${data.name}" has been ${editDialog.role ? 'updated' : 'created'} successfully.`,
        })
        setEditDialog({ open: false, role: null })
        loadRoles()
      } else {
        console.error('Error saving role:', result.error)
        toast({
          title: 'Error',
          description: 'Failed to save role. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteRole() {
    if (!deleteDialog.role) return

    try {
      setIsDeleting(true)
      const { success, error } = await deleteRole(deleteDialog.role.id)
      
      if (success) {
        setRoles(prev => prev.filter(r => r.id !== deleteDialog.role?.id))
        toast({
          title: 'Role deleted',
          description: 'The role has been deleted successfully.',
        })
        setDeleteDialog({ open: false, role: null })
      } else {
        console.error('Error deleting role:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete role. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function getRoleIcon(roleName: string) {
    const name = roleName.toLowerCase()
    if (name.includes('admin')) return roleIcons.admin
    if (name.includes('finance')) return roleIcons.finance
    if (name.includes('viewer')) return roleIcons.viewer
    return roleIcons.staff
  }

  // ==================
  // User Management Functions
  // ==================

  function openUserDialog(user?: AdminUser) {
    if (user) {
      userForm.reset({
        email: user.email,
        password: '', // Don't populate password for edit
        first_name: user.user_metadata.first_name || '',
        last_name: user.user_metadata.last_name || '',
        phone: user.phone || '',
        department: user.department || 'none',
        role_ids: user.roles?.map(r => r.id) || [],
      })
    } else {
      userForm.reset({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        department: 'none',
        role_ids: [],
      })
    }
    setUserDialog({ open: true, user: user || null })
  }

  async function onUserSubmit(data: UserFormData) {
    try {
      console.log('🔍 Form submitted with data:', data);
      console.log('🔍 User dialog state:', userDialog);
      setIsSubmitting(true)
      
      let result
      if (userDialog.user) {
        // Update existing user (don't send password if empty)
        const updateData = { 
          ...data,
          department: data.department === 'none' ? undefined : data.department
        }
        if (!updateData.password || updateData.password === '') {
          delete updateData.password
        }
        console.log('🔍 Updating user with data:', updateData);
        result = await updateUser(userDialog.user.id, updateData)
      } else {
        // Create new user
        if (!data.password || data.password === '') {
          toast({
            title: 'Error',
            description: 'Password is required for new users.',
            variant: 'destructive',
          })
          return
        }
        // Ensure password is a string for createUser
        const createData = {
          ...data,
          password: data.password as string,
          department: data.department === 'none' ? undefined : data.department
        }
        console.log('🔍 Creating user with data:', { ...createData, password: '[REDACTED]' });
        result = await createUser(createData)
      }
      
      console.log('🔍 Result from API:', result);
      
      if (result.success) {
        toast({
          title: userDialog.user ? 'User updated' : 'User created',
          description: `User "${data.email}" has been ${userDialog.user ? 'updated' : 'created'} successfully.`,
        })
        setUserDialog({ open: false, user: null })
        loadUsers()
      } else {
        console.error('Error saving user:', result.error)
        const errorMessage = result.error && typeof result.error === 'object' && 'message' in result.error 
          ? (result.error as any).message 
          : 'Failed to save user. Please try again.'
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserDialog.user) return

    try {
      setIsDeleting(true)
      const { success, error } = await deleteUser(deleteUserDialog.user.id)
      
      if (success) {
        setUsers(prev => prev.filter(u => u.id !== deleteUserDialog.user?.id))
        toast({
          title: 'User deleted',
          description: 'The user has been deleted successfully.',
        })
        setDeleteUserDialog({ open: false, user: null })
      } else {
        console.error('Error deleting user:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete user. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleResetPassword(user: AdminUser) {
    try {
      const { success, error } = await resetUserPassword(user.id)
      
      if (success) {
        toast({
          title: 'Password reset sent',
          description: `Password reset email has been sent to ${user.email}.`,
        })
      } else {
        console.error('Error resetting password:', error)
        toast({
          title: 'Error',
          description: 'Failed to send password reset email.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }
  }

  async function handleToggleUserStatus(user: AdminUser) {
    try {
      const disabled = !(user.app_metadata as any)?.disabled
      const { success, error } = await toggleUserStatus(user.id, disabled)
      
      if (success) {
        // Update user in state
        setUsers(prev => prev.map(u => 
          u.id === user.id 
            ? { ...u, app_metadata: { ...u.app_metadata, disabled } }
            : u
        ))
        
        toast({
          title: 'User status updated',
          description: `User has been ${disabled ? 'disabled' : 'enabled'}.`,
        })
      } else {
        console.error('Error updating user status:', error)
        toast({
          title: 'Error',
          description: 'Failed to update user status.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading roles...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-red-700/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  User Roles & Permissions
                </h1>
                <p className="text-xl text-amber-100 mt-2">
                  Manage staff users, roles and access permissions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Dialog open={userDialog.open} onOpenChange={(open) => setUserDialog({ open, user: null })}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => openUserDialog()}
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm shadow-lg"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, role: null })}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => openEditDialog()}
                    className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-amber-100 mt-4">
            <span>• Access Control</span>
            <span>• Permission Management</span>
            <span>• Role Assignment</span>
            <span>• Security Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm shadow-lg border border-white/20">
            <TabsTrigger value="roles" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-6">
            {roles.length === 0 ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 bg-amber-100 rounded-full mb-4">
                    <Shield className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">No Roles Yet</h3>
                  <p className="text-slate-600 text-center max-w-md mb-6">
                    Start by creating your first user role. Define permissions and access levels for your staff members.
                  </p>
                  <Button 
                    onClick={() => openEditDialog()}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Role
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-amber-600" />
                        <span>User Roles</span>
                      </CardTitle>
                      <CardDescription>
                        Manage user roles and their permissions
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                      {roles.filter(r => r.is_active).length} Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/50">
                        <TableHead>Role</TableHead>
                        {/* <TableHead>Department</TableHead> */}
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => {
                        const Icon = getRoleIcon(role.name)
                        return (
                          <TableRow key={role.id} className="border-slate-200/50">
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                  <Icon className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">
                                    {role.name}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
{/* Department column temporarily disabled */}
                            {false && (
                              <TableCell>
                                {role.department && role.department !== 'none' ? (
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: departments.find(d => d.id === role.department)?.color || '#6B7280' }}
                                    />
                                    <span className="text-sm text-slate-600">
                                      {departments.find(d => d.id === role.department)?.name || role.department}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-400">No department</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="text-sm text-slate-600 max-w-xs truncate">
                                {role.description || 'No description'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {role.permissions?.length || 0} permissions
                                </Badge>
                                {role.permissions?.includes('admin:settings') && (
                                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {role.is_active ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => openEditDialog(role)}
                                  className="text-slate-600 hover:text-slate-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setDeleteDialog({ open: true, role })}
                                  className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600 mr-2" />
                <span className="text-slate-600">Loading users...</span>
              </div>
            ) : (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        <span>Staff Users</span>
                      </CardTitle>
                      <CardDescription>
                        Manage staff users and their role assignments
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                      {users.length} Users
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/50">
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-slate-200/50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {user.display_name?.charAt(0) || user.email.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">
                                  {user.display_name || 'No name set'}
                                </div>
                                {user.phone && (
                                  <div className="text-sm text-slate-500 flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1 text-slate-400" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.department && user.department !== 'none' ? (
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: departments.find(d => d.id === user.department)?.color || '#6B7280' }}
                                />
                                <span className="text-sm text-slate-600">
                                  {departments.find(d => d.id === user.department)?.name || user.department}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">No department</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles && user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                  <Badge key={role.id} variant="outline" className="text-xs">
                                    {role.name}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  No roles
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(user.app_metadata as any)?.disabled ? (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="w-3 h-3 mr-1" />
                                Disabled
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-600">
                              {user.last_sign_in_at 
                                ? new Date(user.last_sign_in_at).toLocaleDateString()
                                : 'Never'
                              }
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openUserDialog(user)}
                                className="text-slate-600 hover:text-slate-900"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleResetPassword(user)}
                                className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleUserStatus(user)}
                                className={(user.app_metadata as any)?.disabled 
                                  ? "text-green-600 hover:text-green-900 hover:bg-green-50"
                                  : "text-orange-600 hover:text-orange-900 hover:bg-orange-50"
                                }
                              >
                                {(user.app_metadata as any)?.disabled ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Ban className="w-4 h-4" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDeleteUserDialog({ open: true, user })}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, role: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editDialog.role ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
            <DialogDescription>
              {editDialog.role 
                ? 'Update the role details and permissions below.'
                : 'Create a new role and assign permissions.'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Staff Member, Finance Manager" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Role</FormLabel>
                        <FormDescription>
                          Whether this role can be assigned to users
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

{/* Department field temporarily disabled until DB migration */}
              {false && (
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: dept.color }}
                                />
                                <span>{dept.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign this role to a specific department for better organization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this role's responsibilities..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Select the permissions that users with this role should have.
                  </p>
                </div>

                {availablePermissions.map((category) => {
                  const categoryPermissions = category.permissions.map(p => p.id)
                  const hasAll = categoryPermissions.every(p => watchPermissions.includes(p))

                  return (
                    <div key={category.category} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-slate-900">{category.category}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCategoryPermissions(category.category)}
                          className={hasAll ? 'bg-amber-50 border-amber-200' : ''}
                        >
                          {hasAll ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              watchPermissions.includes(permission.id)
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                            onClick={() => togglePermission(permission.id)}
                          >
                            <div className="flex items-center justify-center w-5 h-5 mt-0.5">
                              {watchPermissions.includes(permission.id) ? (
                                <Check className="w-4 h-4 text-amber-600" />
                              ) : (
                                <div className="w-4 h-4 border border-slate-300 rounded" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900 text-sm">
                                {permission.label}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                {permission.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setEditDialog({ open: false, role: null })}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editDialog.role ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {editDialog.role ? 'Update' : 'Create'} Role
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialog.open} onOpenChange={(open) => setUserDialog({ open, user: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {userDialog.user ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {userDialog.user 
                ? 'Update the user details and role assignments below.'
                : 'Create a new user account and assign roles.'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={userForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="john.doe@example.com" 
                        {...field}
                        disabled={!!userDialog.user} // Disable email editing for existing users
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user's department (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: dept.color }}
                              />
                              <span>{dept.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Assign this user to a department for access control and assignment purposes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!userDialog.user && (
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Minimum 6 characters" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        User will receive an email to set up their account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={userForm.control}
                name="role_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Roles</FormLabel>
                    <FormDescription>
                      Select the roles this user should have
                    </FormDescription>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {roles.filter(r => r.is_active).map((role) => (
                        <div
                          key={role.id}
                          className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            field.value?.includes(role.id)
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            const currentRoles = field.value || []
                            if (currentRoles.includes(role.id)) {
                              field.onChange(currentRoles.filter(id => id !== role.id))
                            } else {
                              field.onChange([...currentRoles, role.id])
                            }
                          }}
                        >
                          <div className="flex items-center justify-center w-5 h-5">
                            {field.value?.includes(role.id) ? (
                              <Check className="w-4 h-4 text-amber-600" />
                            ) : (
                              <div className="w-4 h-4 border border-slate-300 rounded" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{role.name}</div>
                            {role.description && (
                              <div className="text-xs text-slate-600">{role.description}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setUserDialog({ open: false, user: null })}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {userDialog.user ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {userDialog.user ? 'Update' : 'Create'} User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, role: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.role?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialog({ open: false, role: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRole}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Role
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserDialog.open} onOpenChange={(open) => setDeleteUserDialog({ open, user: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteUserDialog.user?.email}"? This will permanently remove the user account and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteUserDialog({ open: false, user: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 