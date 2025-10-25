'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Smartphone, 
  Bell, 
  Trash2,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
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
  TabsTrigger,
} from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useNextParams } from '@/lib/nextParams'
import { 
  MobileAppUser, 
  fetchAppUser, 
  updateAppUser, 
  deleteAppUser,
  sendPushNotification
} from '@/services/mobileAppUsers'

export default function AppUserDetailPage({ params }: { params: { id: string } }) {
  // Safe way to handle params that works with both current and future Next.js
  const unwrappedParams = useNextParams(params)
  const id = typeof unwrappedParams === 'string' ? unwrappedParams : unwrappedParams?.id as string
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  
  // States
  const [appUser, setAppUser] = useState<MobileAppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPushDialog, setShowPushDialog] = useState(false)
  const [isSendingPush, setIsSendingPush] = useState(false)
  
  // Form states
  const [status, setStatus] = useState('')
  const [devices, setDevices] = useState<MobileAppUser['devices']>([])
  
  // Push notification states
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Fetch app user data
  useEffect(() => {
    async function loadAppUser() {
      try {
        setLoading(true)
        const { data, error } = await fetchAppUser(id)
        
        if (error) throw error
        
        setAppUser(data as unknown as MobileAppUser)
        
        // Set form fields
        if (data) {
          setStatus(data.status || '')
          setDevices(data.devices || [])
        }
      } catch (err) {
        console.error('Error loading mobile app user:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          details: err
        })
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to load mobile app user details: ${err instanceof Error ? err.message : 'Unknown error'}`
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadAppUser()
  }, [id])
  
  // Handle save
  const handleSave = async () => {
    if (!appUser) return
    
    try {
      setSaving(true)
      
      const { error } = await updateAppUser(id, {
        status,
        devices
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Mobile app user updated successfully'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchAppUser(id)
      if (refreshedData) setAppUser(refreshedData as unknown as MobileAppUser)
      
      // Exit edit mode
      router.push(`/people/mobile-users/${id}`)
    } catch (err) {
      console.error('Error updating mobile app user:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update mobile app user'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Handle delete
  const confirmDelete = async () => {
    try {
      setIsDeleting(true)
      
      const { error } = await deleteAppUser(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Mobile app user deleted successfully'
      })
      
      // Navigate back to list
      router.push('/people/mobile-users')
    } catch (err) {
      console.error('Error deleting mobile app user:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete mobile app user'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  // Handle sending push notification
  const handleSendPush = async () => {
    if (!appUser) return
    
    if (!pushTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Push notification title is required'
      })
      return
    }
    
    if (!pushBody.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Push notification body is required'
      })
      return
    }
    
    try {
      setIsSendingPush(true)
      
      const result = await sendPushNotification(id, pushTitle, pushBody)
      
      if (!result.success) throw new Error(result.message || 'Failed to send push notification')
      
      toast({
        title: 'Success',
        description: 'Push notification sent successfully'
      })
      
      // Close dialog and reset form
      setShowPushDialog(false)
      setPushTitle('')
      setPushBody('')
    } catch (err) {
      console.error('Error sending push notification:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send push notification'
      })
    } finally {
      setIsSendingPush(false)
    }
  }
  
  // Update device field
  const updateDevice = (index: number, field: string, value: string) => {
    const newDevices = [...devices]
    newDevices[index] = {
      ...newDevices[index],
      [field]: value
    }
    setDevices(newDevices)
  }
  
  // Handle push notification dialog open
  const openPushDialog = () => {
    setPushTitle('') 
    setPushBody('')
    setShowPushDialog(true)
  }
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                asChild 
                className="h-10 w-10 rounded-xl bg-white/50 hover:bg-white/70 border border-white/30 shadow-lg backdrop-blur-sm"
              >
                <Link href="/people/mobile-users">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Mobile App User' : 'Mobile App User Details'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {appUser?.contacts 
                    ? `${appUser.contacts.first_name || ''} ${appUser.contacts.last_name || ''}`.trim() || 'Unnamed User'
                    : 'Loading user information...'
                  }
                </p>
              </div>
            </div>
            
            {!isEditMode && appUser && (
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/people/mobile-users/${id}?edit=true`)}
                  className="bg-white/60 hover:bg-white/80 border-white/30 backdrop-blur-sm shadow-lg"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 hover:from-blue-500/20 hover:to-blue-600/20 border-blue-200/50 backdrop-blur-sm shadow-lg"
                  onClick={openPushDialog}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Send Push Notification
                </Button>
                <Button
                  variant="outline"
                  className="bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-700 hover:from-red-500/20 hover:to-red-600/20 border-red-200/50 backdrop-blur-sm shadow-lg"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        {loading ? (
          <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl p-12 shadow-xl">
            <div className="flex justify-center items-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">Loading mobile app user...</p>
                <p className="text-gray-500 mt-2">Please wait while we fetch the user details</p>
              </div>
            </div>
          </div>
        ) : appUser ? (
          isEditMode ? (
            // Edit Form
            <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl shadow-xl">
              <div className="p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Edit Mobile App User
                </h2>
                <p className="text-gray-600 mt-2">
                  Update information about this mobile app user
                </p>
              </div>
              <div className="p-6">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                      disabled={saving}
                    >
                      <SelectTrigger className="bg-white/50 border-white/30 backdrop-blur-sm">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Controls whether this user can use the mobile app. Inactive users cannot log in.
                    </p>
                  </div>
                  
                  <Separator className="bg-white/30" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">Devices</h3>
                    <p className="text-sm text-muted-foreground">
                      This user has {devices.length} registered device(s)
                    </p>
                    
                    {devices.map((device, index) => (
                      <div key={device.device_id} className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl p-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`device-name-${index}`}>Device Name</Label>
                          <Input
                            id={`device-name-${index}`}
                            value={device.device_name}
                            onChange={(e) => updateDevice(index, 'device_name', e.target.value)}
                            disabled={saving}
                            className="bg-white/50 border-white/30 backdrop-blur-sm"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`platform-${index}`}>Platform</Label>
                            <Input
                              id={`platform-${index}`}
                              value={device.platform}
                              onChange={(e) => updateDevice(index, 'platform', e.target.value)}
                              disabled={saving}
                              className="bg-white/50 border-white/30 backdrop-blur-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`os-version-${index}`}>OS Version</Label>
                            <Input
                              id={`os-version-${index}`}
                              value={device.os_version}
                              onChange={(e) => updateDevice(index, 'os_version', e.target.value)}
                              disabled={saving}
                              className="bg-white/50 border-white/30 backdrop-blur-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`app-version-${index}`}>App Version</Label>
                          <Input
                            id={`app-version-${index}`}
                            value={device.app_version}
                            onChange={(e) => updateDevice(index, 'app_version', e.target.value)}
                            disabled={saving}
                            className="bg-white/50 border-white/30 backdrop-blur-sm"
                          />
                        </div>
                        
                        {device.last_used && (
                          <div className="text-sm text-muted-foreground">
                            Last used: {formatDate(device.last_used)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-6 border-t border-white/20">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/people/mobile-users/${id}`)}
                      disabled={saving}
                      className="bg-white/60 hover:bg-white/80 border-white/30 backdrop-blur-sm shadow-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl shadow-xl">
              <Tabs defaultValue="overview" className="p-6">
                <TabsList className="bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-md">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="devices" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-md">
                    Devices ({appUser.devices?.length || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="mt-6">
                  <div className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        User Information
                      </h3>
                      {getStatusBadge(appUser.status)}
                    </div>
                    <p className="text-gray-600 mb-6">
                      Registered on {formatDate(appUser.registered_at)}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact</h4>
                        <div className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-4">
                          <p className="font-medium text-gray-900">
                            {appUser.contacts 
                              ? `${appUser.contacts.first_name || ''} ${appUser.contacts.last_name || ''}`.trim() || 'Unnamed Contact'
                              : 'No Contact Linked'
                            }
                          </p>
                          {appUser.contacts?.email && (
                            <p className="text-sm text-gray-600 mt-1">{appUser.contacts.email}</p>
                          )}
                          {appUser.contacts?.phone && (
                            <p className="text-sm text-gray-600">{appUser.contacts.phone}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Active</h4>
                        <div className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-4">
                          <p className="font-medium text-gray-900">{formatDate(appUser.last_active)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">App Usage</h4>
                        <div className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-4">
                          <p className="font-medium text-gray-900">
                            {appUser.devices && appUser.devices.length > 0 
                              ? `Used on ${appUser.devices.length} device(s)` 
                              : 'No usage data available'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="devices" className="mt-6 space-y-4">
                  {appUser.devices && appUser.devices.length > 0 ? (
                    appUser.devices.map((device, index) => (
                      <div key={device.device_id || index} className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {device.device_name || `Device ${index + 1}`}
                            </h4>
                            <p className="text-gray-600">
                              {device.platform} {device.os_version}
                            </p>
                          </div>
                          {device.push_token && (
                            <Badge variant="outline" className="bg-green-100/80 text-green-800 border-green-200/50 backdrop-blur-sm">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Push Enabled
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <h5 className="text-sm font-medium text-gray-500">App Version</h5>
                            <p className="text-gray-900">{device.app_version || 'Unknown'}</p>
                          </div>
                          
                          {device.last_used && (
                            <div className="space-y-1">
                              <h5 className="text-sm font-medium text-gray-500">Last Used</h5>
                              <p className="text-gray-900">{formatDate(device.last_used)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl p-12 text-center">
                      <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
                      <p className="text-gray-600">
                        This user has not registered any devices yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )
        ) : (
          <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl p-12 shadow-xl text-center">
            <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile app user not found</h3>
            <p className="text-gray-600 mb-6">
              The mobile app user you're looking for doesn't exist or has been deleted.
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
              <Link href="/people/mobile-users">
                Back to Mobile App Users
              </Link>
            </Button>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Delete Mobile App User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this mobile app user? This will revoke their app access. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="bg-white/60 hover:bg-white/80 border-white/30 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Push Notification Dialog */}
      <Dialog open={showPushDialog} onOpenChange={setShowPushDialog}>
        <DialogContent className="backdrop-blur-xl bg-white/90 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Send Push Notification</DialogTitle>
            <DialogDescription className="text-gray-600">
              Send a push notification to this user's device(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="push-title">Title</Label>
              <Input
                id="push-title"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Notification Title"
                disabled={isSendingPush}
                className="bg-white/50 border-white/30 backdrop-blur-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="push-body">Message</Label>
              <Textarea
                id="push-body"
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                placeholder="Notification message..."
                rows={4}
                disabled={isSendingPush}
                className="bg-white/50 border-white/30 backdrop-blur-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPushDialog(false)}
              disabled={isSendingPush}
              className="bg-white/60 hover:bg-white/80 border-white/30 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPush}
              disabled={isSendingPush}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {isSendingPush ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </div>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 