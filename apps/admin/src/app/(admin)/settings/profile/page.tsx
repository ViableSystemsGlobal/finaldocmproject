'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Shield,
  Eye,
  EyeOff,
  Save,
  Upload,
  UserCircle,
  Key,
  Settings,
  Bell,
  Palette
} from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  department: string | null
  job_title: string | null
  employee_id: string | null
  user_type: string
  app_access: string[]
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

interface ProfileFormData {
  first_name: string
  last_name: string
  phone: string
  department: string
  job_title: string
  employee_id: string
}

interface PasswordFormData {
  current_password: string
  new_password: string
  confirm_password: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  follow_up_reminders: boolean
  event_notifications: boolean
  giving_receipts: boolean
}

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const router = useRouter()
  const supabase = createClient()

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    job_title: '',
    employee_id: ''
  })

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    follow_up_reminders: true,
    event_notifications: true,
    giving_receipts: true
  })

  const departments = [
    { value: 'administration', label: 'Administration' },
    { value: 'pastoral', label: 'Pastoral' },
    { value: 'worship', label: 'Worship & Music' },
    { value: 'youth', label: 'Youth Ministry' },
    { value: 'children', label: 'Children\'s Ministry' },
    { value: 'outreach', label: 'Outreach & Missions' },
    { value: 'finance', label: 'Finance' },
    { value: 'facilities', label: 'Facilities' },
    { value: 'media', label: 'Media & Communications' },
    { value: 'other', label: 'Other' }
  ]

  const loadUserProfile = useCallback(async () => {
    try {
      console.log('Loading user profile...')
      setLoading(true)
      
      // Wait for auth state to be ready
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw sessionError
      }
      
      if (!session?.user) {
        // Only redirect if we're sure there's no session
        console.log('No session found, redirecting to login')
        router.push('/login')
        return
      }

      console.log('Session found for user:', session.user.email)
      const user = session.user
      setUser(user)

      // Load user profile
      console.log('Fetching user profile from database...')
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading user profile:', error)
        
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating default profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              user_type: 'admin_staff',
              app_access: ['admin'],
              is_active: true
            })
            .select()
            .single()
          
          if (createError) {
            console.error('Error creating user profile:', createError)
            throw createError
          }
          
          console.log('Created new user profile:', newProfile)
          setProfile(newProfile)
          setProfileForm({
            first_name: newProfile.first_name || '',
            last_name: newProfile.last_name || '',
            phone: newProfile.phone || '',
            department: newProfile.department || '',
            job_title: newProfile.job_title || '',
            employee_id: newProfile.employee_id || ''
          })
        } else {
          throw error
        }
      } else {
        console.log('User profile loaded successfully:', userProfile)
        setProfile(userProfile)
        setProfileForm({
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone: userProfile.phone || '',
          department: userProfile.department || '',
          job_title: userProfile.job_title || '',
          employee_id: userProfile.employee_id || ''
        })
      }

    } catch (error) {
      console.error('Error in loadUserProfile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile information",
        variant: "destructive"
      })
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }, [router]) // Removed supabase from dependencies

  useEffect(() => {
    console.log('Profile page useEffect triggered')
    loadUserProfile()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login')
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, reloading profile')
        loadUserProfile()
      }
    })

    return () => {
      console.log('Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(profileForm)
        .eq('user_id', profile.user_id)

      if (error) throw error

      // Update local state
      setProfile(prev => prev ? { ...prev, ...profileForm } : null)

      toast({
        title: "Success",
        description: "Profile updated successfully"
      })

    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }

    if (passwordForm.new_password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      })
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      })

      if (error) throw error

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })

      toast({
        title: "Success",
        description: "Password changed successfully"
      })

    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const getUserDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    return user?.email || 'User'
  }

  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getUserTypeLabel = () => {
    switch (profile?.user_type) {
      case 'admin_staff':
        return 'Administrator'
      case 'staff':
        return 'Staff Member'
      case 'volunteer':
        return 'Volunteer'
      case 'mobile_user':
        return 'Mobile User'
      default:
        return 'User'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-slate-600">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account information and preferences</p>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
              {getUserInitials()}
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{getUserDisplayName()}</h2>
              <p className="text-slate-600">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {getUserTypeLabel()}
                </Badge>
                {profile?.is_verified && (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        {[
          { id: 'profile', label: 'Profile Info', icon: User },
          { id: 'security', label: 'Security', icon: Key },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'preferences', label: 'Preferences', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-slate-50"
              />
              <p className="text-sm text-slate-500 mt-1">
                Contact your administrator to change your email address
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={profileForm.employee_id}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, employee_id: e.target.value }))}
                  placeholder="Enter your employee ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={profileForm.department} onValueChange={(value) => setProfileForm(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={profileForm.job_title}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="Enter your job title"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleChangePassword}
                    disabled={changingPassword || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {changingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-slate-500">Receive notifications via email</p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={notifications.email_notifications}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push_notifications">Push Notifications</Label>
                  <p className="text-sm text-slate-500">Receive push notifications in your browser</p>
                </div>
                <Switch
                  id="push_notifications"
                  checked={notifications.push_notifications}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="follow_up_reminders">Follow-up Reminders</Label>
                  <p className="text-sm text-slate-500">Get reminded about pending follow-ups</p>
                </div>
                <Switch
                  id="follow_up_reminders"
                  checked={notifications.follow_up_reminders}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, follow_up_reminders: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="event_notifications">Event Notifications</Label>
                  <p className="text-sm text-slate-500">Get notified about upcoming events</p>
                </div>
                <Switch
                  id="event_notifications"
                  checked={notifications.event_notifications}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, event_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="giving_receipts">Giving Receipts</Label>
                  <p className="text-sm text-slate-500">Receive email receipts for donations</p>
                </div>
                <Switch
                  id="giving_receipts"
                  checked={notifications.giving_receipts}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, giving_receipts: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-12">
              <Palette className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Preferences Coming Soon</h3>
              <p className="text-slate-600">
                Theme settings, language preferences, and other customization options will be available here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 