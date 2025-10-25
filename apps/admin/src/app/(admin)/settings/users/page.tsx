'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Shield, ShieldCheck, UserCheck, UserX, Users, Smartphone, Monitor } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import {
  UserType,
  AppAccess,
  EnhancedAdminUser,
  fetchEnhancedUsers,
  fetchAdminUsers,
  fetchMobileUsers,
  createMobileUser,
  createAdminUser,
  grantAdminAccess,
  revokeAdminAccess,
  linkUserToMember,
  toggleUserStatus,
} from '@/services/user-management'
import { fetchRoles, type Role } from '@/services/settings'

// User type configurations
const userTypeConfig = {
  mobile_user: {
    label: 'Mobile User',
    color: 'bg-blue-100 text-blue-800',
    icon: Smartphone,
    description: 'Users who access the mobile app'
  },
  admin_staff: {
    label: 'Admin Staff',
    color: 'bg-purple-100 text-purple-800',
    icon: Shield,
    description: 'Staff members with admin system access'
  },
  hybrid: {
    label: 'Hybrid User',
    color: 'bg-green-100 text-green-800',
    icon: Monitor,
    description: 'Users with both mobile and admin access'
  }
}

// Department options
const departments = [
  { value: 'pastoral_care', label: 'Pastoral Care', color: '#8B5CF6' },
  { value: 'outreach', label: 'Outreach', color: '#10B981' },
  { value: 'follow_up_team', label: 'Follow-up Team', color: '#F59E0B' },
  { value: 'prayer_team', label: 'Prayer Team', color: '#EF4444' },
  { value: 'youth_ministry', label: 'Youth Ministry', color: '#3B82F6' },
  { value: 'worship_team', label: 'Worship Team', color: '#EC4899' },
  { value: 'children_ministry', label: 'Children Ministry', color: '#F97316' },
  { value: 'discipleship', label: 'Discipleship', color: '#84CC16' },
  { value: 'communications', label: 'Communications', color: '#06B6D4' },
  { value: 'finance', label: 'Finance', color: '#8B5CF6' },
  { value: 'events', label: 'Events', color: '#F59E0B' },
  { value: 'administration', label: 'Administration', color: '#6B7280' },
]

export default function UsersPage() {
  const [users, setUsers] = useState<EnhancedAdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EnhancedAdminUser | null>(null)
  const [createUserType, setCreateUserType] = useState<'mobile' | 'admin'>('admin')

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    job_title: '',
    employee_id: '',
    member_id: '',
    role_ids: [] as string[],
    notes: ''
  })

  // Load data
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [activeTab])

  const loadUsers = async () => {
    setLoading(true)
    try {
      let result
      switch (activeTab) {
        case 'admin':
          result = await fetchAdminUsers()
          break
        case 'mobile':
          result = await fetchMobileUsers()
          break
        default:
          result = await fetchEnhancedUsers()
      }

      if (result.success) {
        setUsers(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const result = await fetchRoles()
      if (result.success) {
        setRoles(result.data || [])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = selectedDepartment === 'all' || user.profile?.department === selectedDepartment

    return matchesSearch && matchesDepartment
  })

  // Handle form submission
  const handleCreateUser = async () => {
    try {
      let result
      
      if (createUserType === 'mobile') {
        result = await createMobileUser({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          member_id: formData.member_id || undefined
        })
      } else {
        result = await createAdminUser({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          department: formData.department,
          job_title: formData.job_title,
          employee_id: formData.employee_id || undefined,
          role_ids: formData.role_ids
        })
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `${createUserType === 'mobile' ? 'Mobile user' : 'Admin user'} created successfully`,
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Handle granting admin access to mobile user
  const handleGrantAdminAccess = async (user: EnhancedAdminUser) => {
    try {
      const result = await grantAdminAccess(user.id, {
        department: formData.department,
        job_title: formData.job_title,
        employee_id: formData.employee_id || undefined,
        role_ids: formData.role_ids
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Admin access granted successfully",
        })
        setIsEditDialogOpen(false)
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to grant admin access",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error granting admin access:', error)
    }
  }

  // Handle revoking admin access
  const handleRevokeAdminAccess = async (userId: string) => {
    try {
      const result = await revokeAdminAccess(userId)

      if (result.success) {
        toast({
          title: "Success",
          description: "Admin access revoked successfully",
        })
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to revoke admin access",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error revoking admin access:', error)
    }
  }

  // Handle toggle user status
  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const result = await toggleUserStatus(userId, !isActive)

      if (result.success) {
        toast({
          title: "Success",
          description: `User ${!isActive ? 'activated' : 'deactivated'} successfully`,
        })
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: "Failed to update user status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      department: '',
      job_title: '',
      employee_id: '',
      member_id: '',
      role_ids: [],
      notes: ''
    })
  }

  const startEditUser = (user: EnhancedAdminUser) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      first_name: user.profile?.first_name || '',
      last_name: user.profile?.last_name || '',
      phone: user.profile?.phone || '',
      department: user.profile?.department || '',
      job_title: user.profile?.job_title || '',
      employee_id: user.profile?.employee_id || '',
      member_id: user.profile?.member_id || '',
      role_ids: user.roles?.map(r => r.id) || [],
      notes: user.profile?.notes || ''
    })
    setIsEditDialogOpen(true)
  }

  // Get user type badge
  const getUserTypeBadge = (user: EnhancedAdminUser) => {
    const config = userTypeConfig[user.user_type]
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  // Get app access badges
  const getAppAccessBadges = (appAccess: AppAccess[]) => {
    return appAccess.map(access => (
      <Badge key={access} variant="outline" className="text-xs">
        {access === 'mobile' ? (
          <>
            <Smartphone className="w-3 h-3 mr-1" />
            Mobile
          </>
        ) : (
          <>
            <Monitor className="w-3 h-3 mr-1" />
            Admin
          </>
        )}
      </Badge>
    ))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage mobile users and admin staff</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* User Type Selection */}
              <div>
                <Label>User Type</Label>
                <Tabs value={createUserType} onValueChange={(value) => setCreateUserType(value as 'mobile' | 'admin')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="mobile">Mobile User</TabsTrigger>
                    <TabsTrigger value="admin">Admin Staff</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Mobile User Specific Fields */}
              {createUserType === 'mobile' && (
                <div>
                  <Label htmlFor="member_id">Link to Member (Optional)</Label>
                  <Input
                    id="member_id"
                    placeholder="Member ID or reference"
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                  />
                </div>
              )}

              {/* Admin Staff Specific Fields */}
              {createUserType === 'admin' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select 
                        value={formData.department} 
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.value} value={dept.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: dept.color }}
                                />
                                {dept.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input
                      id="employee_id"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    />
                  </div>

                  {/* Role Assignment */}
                  <div>
                    <Label>Roles</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={role.id}
                            checked={formData.role_ids.includes(role.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  role_ids: [...formData.role_ids, role.id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  role_ids: formData.role_ids.filter(id => id !== role.id)
                                })
                              }
                            }}
                          />
                          <Label htmlFor={role.id} className="text-sm">
                            {role.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Staff</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.app_access.includes('admin')).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.user_type === 'mobile_user').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="admin">Admin Staff</TabsTrigger>
                <TabsTrigger value="mobile">Mobile Users</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: dept.color }}
                        />
                        {dept.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Users Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      {user.profile?.employee_id && (
                        <div className="text-xs text-muted-foreground">
                          ID: {user.profile.employee_id}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getUserTypeBadge(user)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {getAppAccessBadges(user.app_access)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.profile?.department && (
                      <Badge variant="outline">
                        {departments.find(d => d.value === user.profile?.department)?.label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.slice(0, 2).map((role) => (
                        <Badge key={role.id} variant="secondary" className="text-xs">
                          {role.name}
                        </Badge>
                      ))}
                      {user.roles && user.roles.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{user.roles.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {user.user_type === 'mobile_user' && !user.app_access.includes('admin') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditUser(user)}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {user.app_access.includes('admin') && user.user_type === 'hybrid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeAdminAccess(user.id)}
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id, user.is_active || false)}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser?.user_type === 'mobile_user' && !editingUser.app_access.includes('admin')
                ? 'Grant Admin Access'
                : 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser?.user_type === 'mobile_user' && !editingUser.app_access.includes('admin')
                ? 'Grant admin system access to this mobile user'
                : 'Update user information and permissions'}
            </DialogDescription>
          </DialogHeader>

          {/* Edit form would go here - similar to create form */}
          <div className="space-y-4">
            <p>Edit form content would go here...</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingUser?.user_type === 'mobile_user' && !editingUser.app_access.includes('admin')) {
                handleGrantAdminAccess(editingUser)
              } else {
                // Handle regular user update
              }
            }}>
              {editingUser?.user_type === 'mobile_user' && !editingUser.app_access.includes('admin')
                ? 'Grant Access'
                : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 