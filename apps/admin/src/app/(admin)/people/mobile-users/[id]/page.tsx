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
  const { id } = useNextParams(params)
  
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
        console.error('Error loading mobile app user:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load mobile app user details'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-4">
            <Link href="/people/mobile-users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Mobile App User' : 'Mobile App User Details'}
          </h1>
        </div>
        
        {!isEditMode && appUser && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/people/mobile-users/${id}?edit=true`)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
              onClick={openPushDialog}
            >
              <Bell className="mr-2 h-4 w-4" />
              Send Push Notification
            </Button>
            <Button
              variant="outline"
              className="bg-red-50 text-red-700 hover:bg-red-100"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading mobile app user...</span>
        </div>
      ) : appUser ? (
        isEditMode ? (
          // Edit Form
          <Card>
            <CardHeader>
              <CardTitle>Edit Mobile App User</CardTitle>
              <CardDescription>
                Update information about this mobile app user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={setStatus}
                    disabled={saving}
                  >
                    <SelectTrigger>
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
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Devices</h3>
                  <p className="text-sm text-muted-foreground">
                    This user has {devices.length} registered device(s)
                  </p>
                  
                  {devices.map((device, index) => (
                    <div key={device.device_id} className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor={`device-name-${index}`}>Device Name</Label>
                        <Input
                          id={`device-name-${index}`}
                          value={device.device_name}
                          onChange={(e) => updateDevice(index, 'device_name', e.target.value)}
                          disabled={saving}
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
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`os-version-${index}`}>OS Version</Label>
                          <Input
                            id={`os-version-${index}`}
                            value={device.os_version}
                            onChange={(e) => updateDevice(index, 'os_version', e.target.value)}
                            disabled={saving}
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
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/people/mobile-users/${id}`)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
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
            </CardContent>
          </Card>
        ) : (
          // View Mode
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="devices">Devices ({appUser.devices?.length || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>User Information</span>
                    {getStatusBadge(appUser.status)}
                  </CardTitle>
                  <CardDescription>
                    Registered on {formatDate(appUser.registered_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                    <p className="font-medium">
                      {appUser.contacts 
                        ? `${appUser.contacts.first_name || ''} ${appUser.contacts.last_name || ''}`.trim() || 'Unnamed Contact'
                        : 'No Contact Linked'
                      }
                    </p>
                    {appUser.contacts?.email && (
                      <p className="text-sm">{appUser.contacts.email}</p>
                    )}
                    {appUser.contacts?.phone && (
                      <p className="text-sm">{appUser.contacts.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">Last Active</h3>
                    <p>{formatDate(appUser.last_active)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">App Usage</h3>
                    <p>
                      {appUser.devices && appUser.devices.length > 0 
                        ? `Used on ${appUser.devices.length} device(s)` 
                        : 'No usage data available'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="devices" className="space-y-4">
              {appUser.devices && appUser.devices.length > 0 ? (
                appUser.devices.map((device, index) => (
                  <Card key={device.device_id || index}>
                    <CardHeader>
                      <CardTitle>{device.device_name || `Device ${index + 1}`}</CardTitle>
                      <CardDescription>
                        {device.platform} {device.os_version}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">App Version</h3>
                        <p>{device.app_version || 'Unknown'}</p>
                      </div>
                      
                      {device.last_used && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Last Used</h3>
                          <p>{formatDate(device.last_used)}</p>
                        </div>
                      )}
                      
                      {device.push_token && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Push Notification</h3>
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Enabled</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <h3 className="text-lg font-medium">No devices found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    This user has not registered any devices yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">Mobile app user not found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The mobile app user you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/people/mobile-users">
              Back to Mobile App Users
            </Link>
          </Button>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Mobile App User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this mobile app user? This will revoke their app access. This action cannot be undone.
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
              onClick={confirmDelete}
              disabled={isDeleting}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Push Notification</DialogTitle>
            <DialogDescription>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPushDialog(false)}
              disabled={isSendingPush}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendPush}
              disabled={isSendingPush}
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