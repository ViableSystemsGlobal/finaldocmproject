'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Settings, 
  Loader2, 
  Send,
  MessageSquare,
  Mail,
  Key,
  Zap,
  Shield,
  DollarSign,
  TrendingUp,
  FileText,
  TestTube,
  Webhook,
  Users,
  AlertTriangle,
  CheckCircle,
  Copy,
  Edit,
  Plus,
  Phone,
  Globe,
  Activity,
  BellRing,
  Server,
  Monitor,
  ArrowLeft
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { 
  getCommsMetrics,
  GlobalCommsMetrics
} from '@/services/comms/campaigns'
import { 
  loadCommunicationSettings,
  saveCommunicationSettings,
  saveSMSSettings,
  saveEmailSettings,
  saveWhatsAppSettings,
  savePushSettings,
  sendTestMessage,
  testChannelConnection,
  CommunicationSettings,
  SMSSettings,
  EmailSettings,
  WhatsAppSettings,
  PushSettings,
  TestMessageParams
} from '@/services/comms/settings'
import { 
  sendSMS,
  CreateSMSParams
} from '@/services/sms'

// Type definitions
type TestFormData = {
  to: string;
  subject: string;
  message: string;
}

export default function CommunicationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState<GlobalCommsMetrics>({
    total_campaigns: 0,
    active_campaigns: 0,
    scheduled_campaigns: 0,
    completed_campaigns: 0,
    total_templates: 0,
    email_templates: 0,
    sms_templates: 0,
    whatsapp_templates: 0,
    push_templates: 0
  })
  const [settings, setSettings] = useState<CommunicationSettings | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Edit mode state
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  
  // Test dialog state
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [testChannel, setTestChannel] = useState<'sms' | 'email' | 'whatsapp' | 'push'>('sms')
  const [testFormData, setTestFormData] = useState<TestFormData>({
    to: '',
    subject: '',
    message: 'This is a test message from your church communication system.',
  })
  const [sending, setSending] = useState(false)

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      // Load communication metrics
      const { data: metricsData, error: metricsError } = await getCommsMetrics()
      if (metricsData) {
        setMetrics(metricsData)
      }

      // Load communication settings
      const { data: settingsData, error: settingsError } = await loadCommunicationSettings()
      if (settingsError) {
        console.error('Error loading settings:', settingsError)
        throw new Error(settingsError)
      }
      if (settingsData) {
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Failed to load communication settings data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load communication settings data.'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle start editing channel
  const handleEditChannel = (channel: string) => {
    if (!settings) return
    
    let channelSettings: any = {}
    switch (channel) {
      case 'sms':
        channelSettings = settings.sms
        break
      case 'email':
        channelSettings = settings.email
        break
      case 'whatsapp':
        channelSettings = settings.whatsapp
        break
      case 'push':
        channelSettings = settings.push
        break
    }
    
    setEditFormData(channelSettings)
    setEditingChannel(channel)
  }

  // Handle send test message
  const handleSendTest = async () => {
    if (!testFormData.to || !testFormData.message) return
    
    setSending(true)
    try {
      const params: TestMessageParams = {
        channel: testChannel,
        to: testFormData.to,
        subject: testFormData.subject,
        message: testFormData.message
      }
      
      const result = await sendTestMessage(params)
      if (!result.success) throw new Error(result.error || 'Send failed')
      
      toast({
        title: 'Test Message Sent',
        description: `Test ${testChannel} message sent successfully to ${testFormData.to}.`
      })
      
      setShowTestDialog(false)
      setTestFormData({
        to: '',
        subject: '',
        message: 'This is a test message from your church communication system.',
      })
    } catch (error) {
      console.error('Failed to send test message:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send test message. Please check your settings.'
      })
    } finally {
      setSending(false)
    }
  }

  // Handle save channel settings
  const handleSaveChannel = async (channel: string) => {
    if (!editFormData) return
    
    setSaving(true)
    try {
      let result: { success: boolean, error?: string } = { success: false, error: 'Unknown error' }
      
      switch (channel) {
        case 'sms':
          result = await saveSMSSettings(editFormData)
          break
        case 'email':
          result = await saveEmailSettings(editFormData)
          break
        case 'whatsapp':
          result = await saveWhatsAppSettings(editFormData)
          break
        case 'push':
          result = await savePushSettings(editFormData)
          break
      }
      
      if (!result.success) throw new Error(result.error || 'Save failed')
      
      toast({
        title: 'Settings Saved',
        description: `${channel.toUpperCase()} settings have been saved successfully.`
      })
      
      // Reload settings
      await loadData()
      setEditingChannel(null)
      setEditFormData({})
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save settings. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Communication Settings</h2>
          <p className="text-slate-600">Configuring communication channels...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            >
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl">
                  <Settings className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Communication Settings
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Configure all communication channels and settings
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => {
                  setTestChannel('sms')
                  setShowTestDialog(true)
                }}
                className="rounded-xl px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test Messages
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="push">Push</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Channel Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <div className="text-right">
                      <p className="text-green-100 text-sm font-medium">SMS Templates</p>
                      <p className="text-3xl font-bold">{metrics.sms_templates}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-200" />
                    <span className="text-green-100 text-sm font-medium">Active & configured</span>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <Mail className="h-8 w-8" />
                    </div>
                    <div className="text-right">
                      <p className="text-blue-100 text-sm font-medium">Email Templates</p>
                      <p className="text-3xl font-bold">{metrics.email_templates}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-200" />
                    <span className="text-blue-100 text-sm font-medium">Active & configured</span>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <MessageSquare className="h-8 w-8" />
                    </div>
                    <div className="text-right">
                      <p className="text-purple-100 text-sm font-medium">WhatsApp</p>
                      <p className="text-3xl font-bold">0</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-purple-200" />
                    <span className="text-purple-100 text-sm font-medium">Setup required</span>
                  </div>
                </div>
              </div>

              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                      <BellRing className="h-8 w-8" />
                    </div>
                    <div className="text-right">
                      <p className="text-amber-100 text-sm font-medium">Push Notifications</p>
                      <p className="text-3xl font-bold">0</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-200" />
                    <span className="text-amber-100 text-sm font-medium">Setup required</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common communication settings and actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
                    <Link href="/comms/templates">
                      <FileText className="h-6 w-6 text-purple-500" />
                      <span className="font-medium">Manage Templates</span>
                      <span className="text-xs text-muted-foreground">Create & edit templates</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" asChild>
                    <Link href="/comms/campaigns">
                      <Send className="h-6 w-6 text-blue-500" />
                      <span className="font-medium">View Campaigns</span>
                      <span className="text-xs text-muted-foreground">Manage campaigns</span>
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setShowTestDialog(true)}
                  >
                    <TestTube className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Test Messages</span>
                    <span className="text-xs text-muted-foreground">Send test messages</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                    <Monitor className="h-6 w-6 text-slate-500" />
                    <span className="font-medium">View Logs</span>
                    <span className="text-xs text-muted-foreground">System activity logs</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* SMS Provider Configuration */}
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-orange-500" />
                        SMS Provider
                      </CardTitle>
                      <CardDescription>Configure your SMS service provider settings</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditChannel('sms')} className="text-slate-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Provider:</span>
                    <span className="text-sm text-slate-800 capitalize">{settings?.sms?.provider || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Sender ID:</span>
                    <span className="text-sm text-slate-800">{settings?.sms?.sender_id || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Test Mode:</span>
                    <Badge variant={settings?.sms?.test_mode ? 'secondary' : 'default'}>
                      {settings?.sms?.test_mode ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* SMS Limits */}
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        Sending Limits
                      </CardTitle>
                      <CardDescription>Manage daily and monthly sending limits</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditChannel('sms')} className="text-slate-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Daily Limit:</span>
                    <span className="text-sm text-slate-800">{settings?.sms?.daily_limit || 0} messages</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Monthly Limit:</span>
                    <span className="text-sm text-slate-800">{settings?.sms?.monthly_limit || 0} messages</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Cost per SMS:</span>
                    <span className="text-sm text-slate-800">${settings?.sms?.cost_per_sms || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Email Provider Configuration */}
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-blue-500" />
                        Email Provider
                      </CardTitle>
                      <CardDescription>Configure your email service provider settings</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditChannel('email')} className="text-slate-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Provider:</span>
                    <span className="text-sm text-slate-800 capitalize">{settings?.email?.provider || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">From Name:</span>
                    <span className="text-sm text-slate-800">{settings?.email?.from_name || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">From Email:</span>
                    <span className="text-sm text-slate-800">{settings?.email?.from_email || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Test Mode:</span>
                    <Badge variant={settings?.email?.test_mode ? 'secondary' : 'default'}>
                      {settings?.email?.test_mode ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Email Limits */}
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-500" />
                        Sending Limits
                      </CardTitle>
                      <CardDescription>Manage daily and monthly sending limits</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditChannel('email')} className="text-slate-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Daily Limit:</span>
                    <span className="text-sm text-slate-800">{settings?.email?.daily_limit || 0} emails</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">Monthly Limit:</span>
                    <span className="text-sm text-slate-800">{settings?.email?.monthly_limit || 0} emails</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-slate-600">SMTP Host:</span>
                    <span className="text-sm text-slate-800">{settings?.email?.smtp_host || 'Not configured'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  WhatsApp Business
                </CardTitle>
                <CardDescription>Configure WhatsApp Business API settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Setup Required</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Configure your WhatsApp Business API to enable WhatsApp messaging.
                      </p>
                      <Button size="sm" className="mt-3" onClick={() => handleEditChannel('whatsapp')}>
                        Configure WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Push Tab */}
          <TabsContent value="push" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-purple-500" />
                  Push Notifications
                </CardTitle>
                <CardDescription>Configure push notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Setup Required</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Configure Firebase Cloud Messaging to enable push notifications.
                      </p>
                      <Button size="sm" className="mt-3" onClick={() => handleEditChannel('push')}>
                        Configure Firebase
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Message Dialog */}
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Send Test Message</DialogTitle>
              <DialogDescription className="text-slate-600">
                Send a test message to verify your configuration is working correctly.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Channel
                </label>
                <Select value={testChannel} onValueChange={(value: any) => setTestChannel(value)}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">
                      <div className="flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp" disabled>
                      <div className="flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        WhatsApp (Not configured)
                      </div>
                    </SelectItem>
                    <SelectItem value="push" disabled>
                      <div className="flex items-center">
                        <BellRing className="mr-2 h-4 w-4" />
                        Push (Not configured)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  {testChannel === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <Input
                  type={testChannel === 'email' ? 'email' : 'tel'}
                  placeholder={testChannel === 'email' ? 'user@example.com' : '+1234567890'}
                  value={testFormData.to}
                  onChange={(e) => setTestFormData((prev: TestFormData) => ({ ...prev, to: e.target.value }))}
                  className="h-12 border-2 border-slate-200 rounded-xl"
                />
              </div>
              
              {testChannel === 'email' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Subject
                  </label>
                  <Input
                    type="text"
                    placeholder="Test Email Subject"
                    value={testFormData.subject}
                    onChange={(e) => setTestFormData((prev: TestFormData) => ({ ...prev, subject: e.target.value }))}
                    className="h-12 border-2 border-slate-200 rounded-xl"
                  />
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Message
                </label>
                <Textarea
                  placeholder="Enter your test message..."
                  value={testFormData.message}
                  onChange={(e) => setTestFormData((prev: TestFormData) => ({ ...prev, message: e.target.value }))}
                  className="border-2 border-slate-200 rounded-xl"
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowTestDialog(false)}
                disabled={sending}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendTest}
                disabled={sending || !testFormData.to || !testFormData.message}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Settings Dialog */}
        <Dialog open={editingChannel !== null} onOpenChange={(open) => !open && setEditingChannel(null)}>
          <DialogContent className="bg-white/95 backdrop-blur-lg border border-white/20 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                Edit {editingChannel?.toUpperCase()} Settings
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Configure your {editingChannel} communication settings.
              </DialogDescription>
            </DialogHeader>
            
            {editingChannel === 'sms' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Provider
                  </label>
                  <Select 
                    value={editFormData.provider || 'twilio'} 
                    onValueChange={(value) => setEditFormData((prev: any) => ({ ...prev, provider: value }))}
                  >
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="aws-sns">AWS SNS</SelectItem>
                      <SelectItem value="messagebird">MessageBird</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Sender ID
                  </label>
                  <Input
                    type="text"
                    placeholder="CHURCH"
                    value={editFormData.sender_id || ''}
                    onChange={(e) => setEditFormData((prev: any) => ({ ...prev, sender_id: e.target.value }))}
                    className="h-12 border-2 border-slate-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Daily Limit
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={editFormData.daily_limit || ''}
                    onChange={(e) => setEditFormData((prev: any) => ({ ...prev, daily_limit: parseInt(e.target.value) || 0 }))}
                    className="h-12 border-2 border-slate-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Monthly Limit
                  </label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={editFormData.monthly_limit || ''}
                    onChange={(e) => setEditFormData((prev: any) => ({ ...prev, monthly_limit: parseInt(e.target.value) || 0 }))}
                    className="h-12 border-2 border-slate-200 rounded-xl"
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Test Mode</p>
                    <p className="text-sm text-slate-600">Enable for testing without sending real messages</p>
                  </div>
                  <Switch 
                    checked={editFormData.test_mode || false}
                    onCheckedChange={(checked) => setEditFormData((prev: any) => ({ ...prev, test_mode: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Auto Opt-out</p>
                    <p className="text-sm text-slate-600">Automatically handle STOP messages</p>
                  </div>
                  <Switch 
                    checked={editFormData.opt_out_enabled || false}
                    onCheckedChange={(checked) => setEditFormData((prev: any) => ({ ...prev, opt_out_enabled: checked }))}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingChannel(null)}
                disabled={saving}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => editingChannel && handleSaveChannel(editingChannel)}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 