'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  Calendar,
  Heart,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchGlobalSettings,
  saveGlobalSettings,
  fetchNotificationTypes,
  fetchNotificationTypeSettings,
  saveNotificationTypeSetting,
  getDefaultGlobalSettings,
  testNotification,
  type GlobalNotificationSettings,
  type NotificationType,
  type NotificationTypeSetting,
  type NotificationMethod
} from '@/services/notifications'

// Notification types - fallback if database isn't available
const fallbackNotificationTypes = [
  {
    id: 'member_joined',
    name: 'Member Joined',
    description: 'When a new member joins the church',
    category: 'membership' as const,
    icon: UserPlus,
    defaultEnabled: { email: true, sms: false, push: true, inApp: true }
  },
  {
    id: 'visitor_first_time',
    name: 'First-Time Visitor',
    description: 'When someone visits for the first time',
    category: 'visitors' as const,
    icon: Users,
    defaultEnabled: { email: true, sms: false, push: true, inApp: true }
  },
  {
    id: 'event_reminder',
    name: 'Event Reminders',
    description: 'Reminders for upcoming events',
    category: 'events' as const,
    icon: Calendar,
    defaultEnabled: { email: true, sms: true, push: true, inApp: true }
  },
  {
    id: 'donation_received',
    name: 'Donation Received',
    description: 'When a donation is processed',
    category: 'giving' as const,
    icon: Heart,
    defaultEnabled: { email: true, sms: false, push: false, inApp: true }
  },
  {
    id: 'prayer_request',
    name: 'Prayer Request',
    description: 'New prayer request submitted',
    category: 'pastoral' as const,
    icon: Heart,
    defaultEnabled: { email: true, sms: false, push: true, inApp: true }
  },
  {
    id: 'follow_up_due',
    name: 'Follow-up Due',
    description: 'When a follow-up task becomes due',
    category: 'pastoral' as const,
    icon: Clock,
    defaultEnabled: { email: true, sms: false, push: true, inApp: true }
  },
  {
    id: 'follow_up_assigned',
    name: 'Follow-up Assigned',
    description: 'When a follow-up task is assigned to you',
    category: 'pastoral' as const,
    icon: UserPlus,
    defaultEnabled: { email: true, sms: false, push: true, inApp: true }
  },
  {
    id: 'prayer_assigned',
    name: 'Prayer Assigned',
    description: 'When a prayer request is assigned to you',
    category: 'pastoral' as const,
    icon: Heart,
    defaultEnabled: { email: true, sms: false, push: true, inApp: true }
  },
  {
    id: 'group_leader_assigned',
    name: 'Group Leader Assigned',
    description: 'When you are assigned as a group leader',
    category: 'leadership' as const,
    icon: Users,
    defaultEnabled: { email: true, sms: false, push: true, inApp: true }
  },
  {
    id: 'system_maintenance',
    name: 'System Maintenance',
    description: 'System maintenance notifications',
    category: 'system' as const,
    icon: Settings,
    defaultEnabled: { email: true, sms: false, push: false, inApp: true }
  },
  {
    id: 'security_alert',
    name: 'Security Alerts',
    description: 'Security-related notifications',
    category: 'system' as const,
    icon: AlertTriangle,
    defaultEnabled: { email: true, sms: true, push: true, inApp: true }
  }
]

// Notification categories
const categories = [
  { id: 'membership', name: 'Membership', color: 'bg-blue-100 text-blue-800' },
  { id: 'visitors', name: 'Visitors', color: 'bg-green-100 text-green-800' },
  { id: 'events', name: 'Events', color: 'bg-purple-100 text-purple-800' },
  { id: 'giving', name: 'Giving', color: 'bg-pink-100 text-pink-800' },
  { id: 'pastoral', name: 'Pastoral Care', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'leadership', name: 'Leadership', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'system', name: 'System', color: 'bg-gray-100 text-gray-800' }
]

// User roles
const userRoles = [
  { id: 'admin', name: 'Administrator' },
  { id: 'pastor', name: 'Pastor' },
  { id: 'staff', name: 'Staff' },
  { id: 'volunteer', name: 'Volunteer' },
  { id: 'member', name: 'Member' }
]

// Function to get icon for notification type
const getNotificationIcon = (typeId: string) => {
  const iconMap: Record<string, any> = {
    'member_joined': UserPlus,
    'visitor_first_time': Users,
    'event_reminder': Calendar,
    'donation_received': Heart,
    'prayer_request': Heart,
    'follow_up_due': Clock,
    'follow_up_assigned': UserPlus,
    'prayer_assigned': Heart,
    'group_leader_assigned': Users,
    'system_maintenance': Settings,
    'security_alert': AlertTriangle
  }
  return iconMap[typeId] || Bell
}

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewMode, setPreviewMode] = useState(false)
  const [databaseError, setDatabaseError] = useState<string | null>(null)

  // Notification settings state
  const [globalSettings, setGlobalSettings] = useState<GlobalNotificationSettings>(getDefaultGlobalSettings())
  const [notificationTypes, setNotificationTypes] = useState<any[]>([])
  const [notificationSettings, setNotificationSettings] = useState<Record<string, any>>({})
  const [roleSettings, setRoleSettings] = useState<Record<string, any>>({})

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setDatabaseError(null)
      try {
        // Try to load from database first
        const { data: globalData, error: globalError } = await fetchGlobalSettings()
        if (globalData) {
          setGlobalSettings(globalData)
        } else if (globalError) {
          console.warn('Could not load global settings, using defaults:', globalError)
          if (globalError.includes('Database tables not found')) {
            setDatabaseError(globalError)
          }
        }

        // Try to load notification types
        const { data: typesData, error: typesError } = await fetchNotificationTypes()
        if (typesData && typesData.length > 0) {
          setNotificationTypes(typesData)
        } else {
          console.warn('Could not load notification types, using fallback:', typesError)
          setNotificationTypes(fallbackNotificationTypes)
        }

        // Try to load notification type settings
        const { data: settingsData, error: settingsError } = await fetchNotificationTypeSettings()
        if (settingsData) {
          // Convert to local format
          const settingsMap: Record<string, any> = {}
          settingsData.forEach(setting => {
            if (!settingsMap[setting.notificationTypeId]) {
              settingsMap[setting.notificationTypeId] = {}
            }
            settingsMap[setting.notificationTypeId][setting.method] = {
              enabled: setting.enabled,
              roles: setting.roles
            }
          })
          setNotificationSettings(settingsMap)
        } else {
          console.warn('Could not load notification type settings, using defaults:', settingsError)
          // Initialize with defaults
          const initialSettings: Record<string, any> = {}
          fallbackNotificationTypes.forEach(type => {
            initialSettings[type.id] = {
              email: { enabled: type.defaultEnabled.email, roles: ['admin', 'pastor'] },
              sms: { enabled: type.defaultEnabled.sms, roles: ['admin'] },
              push: { enabled: type.defaultEnabled.push, roles: ['admin', 'pastor', 'staff'] },
              in_app: { enabled: type.defaultEnabled.inApp, roles: ['admin', 'pastor', 'staff'] }
            }
          })
          setNotificationSettings(initialSettings)
        }
      } catch (error) {
        console.error('Error loading notification settings:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load notification settings. Using defaults.'
        })
        
        // Use fallback data
        setNotificationTypes(fallbackNotificationTypes)
        const initialSettings: Record<string, any> = {}
        fallbackNotificationTypes.forEach(type => {
          initialSettings[type.id] = {
            email: { enabled: type.defaultEnabled.email, roles: ['admin', 'pastor'] },
            sms: { enabled: type.defaultEnabled.sms, roles: ['admin'] },
            push: { enabled: type.defaultEnabled.push, roles: ['admin', 'pastor', 'staff'] },
            in_app: { enabled: type.defaultEnabled.inApp, roles: ['admin', 'pastor', 'staff'] }
          }
        })
        setNotificationSettings(initialSettings)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Save settings
  const handleSave = async () => {
    setSaving(true)
    try {
      // Save global settings
      const { success: globalSuccess, error: globalError } = await saveGlobalSettings(globalSettings)
      if (!globalSuccess) {
        throw new Error(globalError || 'Failed to save global settings')
      }

      // Save notification type settings
      for (const [typeId, methods] of Object.entries(notificationSettings)) {
        for (const [method, config] of Object.entries(methods as Record<string, { enabled: boolean; roles: string[] }>)) {
          const setting = {
            notificationTypeId: typeId,
            method: method as NotificationMethod,
            enabled: config.enabled,
            roles: config.roles || []
          }
          
          const { success, error } = await saveNotificationTypeSetting(setting)
          if (!success) {
            console.warn(`Failed to save setting for ${typeId}:${method}:`, error)
          }
        }
      }
      
      toast({
        title: 'Settings saved',
        description: 'Notification settings have been updated successfully.'
      })
    } catch (error) {
      console.error('Failed to save notification settings:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save notification settings. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  // Update notification setting
  const updateNotificationSetting = (typeId: string, method: string, field: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        [method]: {
          ...prev[typeId]?.[method],
          [field]: value
        }
      }
    }))
  }

  // Toggle role for notification type
  const toggleRole = (typeId: string, method: string, roleId: string) => {
    const currentRoles = notificationSettings[typeId]?.[method]?.roles || []
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter((r: string) => r !== roleId)
      : [...currentRoles, roleId]
    
    updateNotificationSetting(typeId, method, 'roles', newRoles)
  }

  // Test notification
  const handleTestNotification = async (method: NotificationMethod) => {
    try {
      const { success, error } = await testNotification(method, 'test@example.com')
      if (success) {
        toast({
          title: 'Test notification sent',
          description: `${method} test notification has been sent successfully.`
        })
      } else {
        throw new Error(error)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Test failed',
        description: `Failed to send ${method} test notification.`
      })
    }
  }

  // Filter notifications by category
  const filteredNotifications = selectedCategory === 'all' 
    ? notificationTypes 
    : notificationTypes.filter(type => type.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-yellow-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/settings">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-yellow-500 to-amber-600 p-3 rounded-2xl">
                  <Bell className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Notification Settings
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Configure system notifications and alerts for your team
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
              className="bg-white/80 hover:bg-white"
              disabled={loading}
            >
              {previewMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-700 hover:to-amber-800 text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Database Error Banner */}
        {databaseError && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800">Database Setup Required</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  {databaseError}
                </p>
                <p className="text-yellow-600 text-xs mt-2">
                  To enable full functionality, start Docker Desktop and run: <code className="bg-yellow-100 px-1 rounded">npx supabase start</code> then <code className="bg-yellow-100 px-1 rounded">npx supabase db push</code>
                </p>
                <p className="text-yellow-600 text-xs mt-1">
                  Settings will work in offline mode with local storage until the database is configured.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          // Loading state
          <Card className="bg-white/80 backdrop-blur-lg border border-white/20">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading notification settings...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Main Content
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-600 to-amber-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Notification Configuration</h2>
                  <p className="text-yellow-100">Manage how and when your team receives notifications</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100/50 p-1 rounded-xl">
                  <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
                  <TabsTrigger value="types" className="rounded-lg">Notification Types</TabsTrigger>
                  <TabsTrigger value="roles" className="rounded-lg">Role Settings</TabsTrigger>
                  <TabsTrigger value="advanced" className="rounded-lg">Advanced</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general">
                  <div className="space-y-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Global Notification Settings</CardTitle>
                        <CardDescription>
                          Configure system-wide notification preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Mail className="h-5 w-5 text-blue-500" />
                              <div>
                                <label className="text-sm font-medium">Email Notifications</label>
                                <p className="text-sm text-muted-foreground">Send notifications via email</p>
                              </div>
                            </div>
                            <Switch
                              checked={globalSettings.emailEnabled}
                              onCheckedChange={(checked) => 
                                setGlobalSettings(prev => ({ ...prev, emailEnabled: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <MessageSquare className="h-5 w-5 text-green-500" />
                              <div>
                                <label className="text-sm font-medium">SMS Notifications</label>
                                <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                              </div>
                            </div>
                            <Switch
                              checked={globalSettings.smsEnabled}
                              onCheckedChange={(checked) => 
                                setGlobalSettings(prev => ({ ...prev, smsEnabled: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Smartphone className="h-5 w-5 text-purple-500" />
                              <div>
                                <label className="text-sm font-medium">Push Notifications</label>
                                <p className="text-sm text-muted-foreground">Send push notifications to mobile devices</p>
                              </div>
                            </div>
                            <Switch
                              checked={globalSettings.pushEnabled}
                              onCheckedChange={(checked) => 
                                setGlobalSettings(prev => ({ ...prev, pushEnabled: checked }))
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Bell className="h-5 w-5 text-orange-500" />
                              <div>
                                <label className="text-sm font-medium">In-App Notifications</label>
                                <p className="text-sm text-muted-foreground">Show notifications within the app</p>
                              </div>
                            </div>
                            <Switch
                              checked={globalSettings.inAppEnabled}
                              onCheckedChange={(checked) => 
                                setGlobalSettings(prev => ({ ...prev, inAppEnabled: checked }))
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quiet Hours</CardTitle>
                        <CardDescription>
                          Set times when notifications should be paused
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Enable Quiet Hours</label>
                            <p className="text-sm text-muted-foreground">Pause non-urgent notifications during these hours</p>
                          </div>
                          <Switch
                            checked={globalSettings.quietHoursEnabled}
                            onCheckedChange={(checked) => 
                              setGlobalSettings(prev => ({ ...prev, quietHoursEnabled: checked }))
                            }
                          />
                        </div>

                        {globalSettings.quietHoursEnabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="startTime">Start Time</Label>
                              <Input
                                id="startTime"
                                type="time"
                                value={globalSettings.quietHoursStart}
                                onChange={(e) => 
                                  setGlobalSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="endTime">End Time</Label>
                              <Input
                                id="endTime"
                                type="time"
                                value={globalSettings.quietHoursEnd}
                                onChange={(e) => 
                                  setGlobalSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Notification Types */}
                <TabsContent value="types">
                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div className="flex items-center gap-3 mb-6">
                      <Label>Filter by category:</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notification Types */}
                    <div className="space-y-4">
                      {filteredNotifications.map(type => {
                        const Icon = getNotificationIcon(type.id)
                        const category = categories.find(c => c.id === type.category)
                        const settings = notificationSettings[type.id] || {}

                        return (
                          <Card key={type.id}>
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5 text-slate-600" />
                                  <div>
                                    <CardTitle className="text-lg">{type.name}</CardTitle>
                                    <CardDescription>{type.description}</CardDescription>
                                  </div>
                                </div>
                                <Badge className={category?.color || 'bg-gray-100 text-gray-800'}>
                                  {category?.name || type.category}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-4 gap-4">
                                {/* Email */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-blue-500" />
                                      <span className="text-sm font-medium">Email</span>
                                    </div>
                                    <Switch
                                      checked={settings.email?.enabled || false}
                                      onCheckedChange={(checked) => 
                                        updateNotificationSetting(type.id, 'email', 'enabled', checked)
                                      }
                                    />
                                  </div>
                                  {settings.email?.enabled && (
                                    <div className="space-y-1">
                                      {userRoles.map(role => (
                                        <label key={role.id} className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={settings.email?.roles?.includes(role.id) || false}
                                            onChange={() => toggleRole(type.id, 'email', role.id)}
                                            className="rounded"
                                          />
                                          {role.name}
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* SMS */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="h-4 w-4 text-green-500" />
                                      <span className="text-sm font-medium">SMS</span>
                                    </div>
                                    <Switch
                                      checked={settings.sms?.enabled || false}
                                      onCheckedChange={(checked) => 
                                        updateNotificationSetting(type.id, 'sms', 'enabled', checked)
                                      }
                                    />
                                  </div>
                                  {settings.sms?.enabled && (
                                    <div className="space-y-1">
                                      {userRoles.map(role => (
                                        <label key={role.id} className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={settings.sms?.roles?.includes(role.id) || false}
                                            onChange={() => toggleRole(type.id, 'sms', role.id)}
                                            className="rounded"
                                          />
                                          {role.name}
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Push */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Smartphone className="h-4 w-4 text-purple-500" />
                                      <span className="text-sm font-medium">Push</span>
                                    </div>
                                    <Switch
                                      checked={settings.push?.enabled || false}
                                      onCheckedChange={(checked) => 
                                        updateNotificationSetting(type.id, 'push', 'enabled', checked)
                                      }
                                    />
                                  </div>
                                  {settings.push?.enabled && (
                                    <div className="space-y-1">
                                      {userRoles.map(role => (
                                        <label key={role.id} className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={settings.push?.roles?.includes(role.id) || false}
                                            onChange={() => toggleRole(type.id, 'push', role.id)}
                                            className="rounded"
                                          />
                                          {role.name}
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* In-App */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Bell className="h-4 w-4 text-orange-500" />
                                      <span className="text-sm font-medium">In-App</span>
                                    </div>
                                    <Switch
                                      checked={settings.in_app?.enabled || false}
                                      onCheckedChange={(checked) => 
                                        updateNotificationSetting(type.id, 'in_app', 'enabled', checked)
                                      }
                                    />
                                  </div>
                                  {settings.in_app?.enabled && (
                                    <div className="space-y-1">
                                      {userRoles.map(role => (
                                        <label key={role.id} className="flex items-center gap-2 text-xs">
                                          <input
                                            type="checkbox"
                                            checked={settings.in_app?.roles?.includes(role.id) || false}
                                            onChange={() => toggleRole(type.id, 'in_app', role.id)}
                                            className="rounded"
                                          />
                                          {role.name}
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </TabsContent>

                {/* Role Settings */}
                <TabsContent value="roles">
                  <Card>
                    <CardHeader>
                      <CardTitle>Role-based Notification Preferences</CardTitle>
                      <CardDescription>
                        Configure default notification preferences for each user role
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {userRoles.map(role => (
                          <div key={role.id} className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-4">{role.name} Defaults</h3>
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center">
                                <Mail className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                <Switch defaultChecked={true} />
                                <p className="text-xs mt-1">Email</p>
                              </div>
                              <div className="text-center">
                                <MessageSquare className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                <Switch defaultChecked={role.id === 'admin'} />
                                <p className="text-xs mt-1">SMS</p>
                              </div>
                              <div className="text-center">
                                <Smartphone className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                                <Switch defaultChecked={true} />
                                <p className="text-xs mt-1">Push</p>
                              </div>
                              <div className="text-center">
                                <Bell className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                <Switch defaultChecked={true} />
                                <p className="text-xs mt-1">In-App</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Settings */}
                <TabsContent value="advanced">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Digest Mode</CardTitle>
                        <CardDescription>
                          Bundle non-urgent notifications into periodic digests
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium">Enable Digest Mode</label>
                            <p className="text-sm text-muted-foreground">Group notifications into scheduled summaries</p>
                          </div>
                          <Switch
                            checked={globalSettings.digestModeEnabled}
                            onCheckedChange={(checked) => 
                              setGlobalSettings(prev => ({ ...prev, digestModeEnabled: checked }))
                            }
                          />
                        </div>

                        {globalSettings.digestModeEnabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Frequency</Label>
                              <Select 
                                value={globalSettings.digestFrequency}
                                onValueChange={(value) => 
                                  setGlobalSettings(prev => ({ ...prev, digestFrequency: value as any }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Time</Label>
                              <Input
                                type="time"
                                value={globalSettings.digestTime}
                                onChange={(e) => 
                                  setGlobalSettings(prev => ({ ...prev, digestTime: e.target.value }))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>System Health Notifications</CardTitle>
                        <CardDescription>
                          Configure alerts for system status and performance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="text-sm">System Errors</span>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                              <Info className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">Performance Alerts</span>
                            </div>
                            <Switch defaultChecked />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Backup Confirmations</span>
                            </div>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Test Notifications</CardTitle>
                        <CardDescription>
                          Send test notifications to verify your settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleTestNotification('email')}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Test Email
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleTestNotification('sms')}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Test SMS
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleTestNotification('push')}
                          >
                            <Smartphone className="mr-2 h-4 w-4" />
                            Test Push
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleTestNotification('in_app')}
                          >
                            <Bell className="mr-2 h-4 w-4" />
                            Test In-App
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 