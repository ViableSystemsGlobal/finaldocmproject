'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Smartphone, Send, Users, Bell, CheckCircle, AlertCircle } from 'lucide-react'

interface MobileUser {
  id: string
  auth_user_id: string
  contact_id: string
  push_token: string | null
  platform: string
  notification_preferences: any
  last_active: string
  contact?: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function PushNotificationsPage() {
  const [mobileUsers, setMobileUsers] = useState<MobileUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [notificationType, setNotificationType] = useState('general')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [sendToAll, setSendToAll] = useState(true)

  useEffect(() => {
    loadMobileUsers()
  }, [])

  const loadMobileUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mobile-users')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load mobile users')
      }

      // Transform the data to match the expected interface
      const transformedUsers = (result.data || []).map((user: any) => ({
        ...user,
        push_token: user.push_tokens?.[0] || null, // Use first push token for compatibility
        contact: user.contact_id ? {
          first_name: user.full_name?.split(' ')[0] || '',
          last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
          email: user.display_email || ''
        } : null
      }))

      setMobileUsers(transformedUsers)
    } catch (error) {
      console.error('Error loading mobile users:', error)
      setMessage({ type: 'error', text: 'Failed to load mobile users' })
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Title and message are required' })
      return
    }

    try {
      setSending(true)
      setMessage({ type: '', text: '' })

      const userIds = sendToAll 
        ? mobileUsers.filter(user => user.push_token).map(user => user.auth_user_id)
        : selectedUsers

      if (userIds.length === 0) {
        setMessage({ type: 'error', text: 'No users selected or no users with push tokens' })
        return
      }

      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          title: title.trim(),
          body: body.trim(),
          type: notificationType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Notification sent to ${result.sentCount} users successfully!` 
        })
        setTitle('')
        setBody('')
        setSelectedUsers([])
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send notification' })
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      setMessage({ type: 'error', text: 'An error occurred while sending the notification' })
    } finally {
      setSending(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      setSending(true)
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [mobileUsers[0]?.auth_user_id], // Send to first user
          title: 'Test Notification',
          body: 'This is a test notification from the admin panel',
          type: 'general',
        }),
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'Test notification sent!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send test notification' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test notification' })
    } finally {
      setSending(false)
    }
  }

  const usersWithTokens = mobileUsers.filter(user => user.push_token)
  const usersWithoutTokens = mobileUsers.filter(user => !user.push_token)

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
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Push Notifications
              </h1>
              <p className="text-gray-600 mt-2">
                Send push notifications to mobile app users
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="backdrop-blur-sm bg-white/50 border border-white/30 rounded-xl px-4 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-800">{usersWithTokens.length}</span>
                  <span className="text-gray-600 text-sm">Active Devices</span>
                </div>
              </div>
              <Button 
                onClick={handleTestNotification} 
                variant="outline" 
                disabled={sending || usersWithTokens.length === 0}
                className="bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 hover:from-green-500/20 hover:to-green-600/20 border-green-200/50 backdrop-blur-sm shadow-lg"
              >
                <Send className="mr-2 h-4 w-4" />
                Send Test
              </Button>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message.text && (
          <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl p-4 shadow-xl">
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="bg-transparent border-none">
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription className="text-gray-800 font-medium">{message.text}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content */}
        <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl shadow-xl">
          <Tabs defaultValue="send" className="p-6">
            <TabsList className="bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg">
              <TabsTrigger value="send" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-md">
                Send Notification
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-md">
                Mobile Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="send" className="mt-6">
              <div className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg">
                    <Send className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Send Push Notification
                    </h3>
                    <p className="text-gray-600">
                      Send a push notification to mobile app users
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-gray-700 font-medium">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Notification title"
                        maxLength={50}
                        className="bg-white/50 border-white/30 backdrop-blur-sm shadow-sm"
                      />
                      <p className="text-sm text-gray-500">
                        {title.length}/50 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-gray-700 font-medium">Type</Label>
                      <Select value={notificationType} onValueChange={setNotificationType}>
                        <SelectTrigger className="bg-white/50 border-white/30 backdrop-blur-sm shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="sermon">Sermon</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="prayer">Prayer Request</SelectItem>
                          <SelectItem value="group">Group</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body" className="text-gray-700 font-medium">Message</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Notification message"
                      rows={4}
                      maxLength={200}
                      className="bg-white/50 border-white/30 backdrop-blur-sm shadow-sm"
                    />
                    <p className="text-sm text-gray-500">
                      {body.length}/200 characters
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg">
                      <input
                        type="checkbox"
                        id="sendToAll"
                        checked={sendToAll}
                        onChange={(e) => setSendToAll(e.target.checked)}
                        className="rounded h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <Label htmlFor="sendToAll" className="text-gray-700 font-medium">
                        Send to all users with push tokens
                      </Label>
                    </div>

                    {!sendToAll && (
                      <div className="space-y-3">
                        <Label className="text-gray-700 font-medium">Select Users</Label>
                        <div className="max-h-48 overflow-y-auto bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg p-4 space-y-2">
                          {usersWithTokens.map((user) => (
                            <div key={user.id} className="flex items-center space-x-3 p-2 bg-white/40 rounded-lg">
                              <input
                                type="checkbox"
                                id={user.id}
                                checked={selectedUsers.includes(user.auth_user_id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.auth_user_id])
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.auth_user_id))
                                  }
                                }}
                                className="rounded h-4 w-4 text-blue-600 border-gray-300"
                              />
                              <Label htmlFor={user.id} className="text-sm text-gray-700 flex-1">
                                {user.contact?.first_name} {user.contact?.last_name} ({user.contact?.email})
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleSendNotification} 
                    disabled={sending || !title.trim() || !body.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg h-12 text-lg"
                  >
                    {sending ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Devices Card */}
                <div className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
                  <div className="p-6 border-b border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg">
                        <Bell className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Active Devices</h3>
                        <p className="text-gray-600 text-sm">Users with push notification tokens</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading...</span>
                      </div>
                    ) : usersWithTokens.length === 0 ? (
                      <div className="text-center py-8">
                        <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No active devices</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {usersWithTokens.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {user.contact?.first_name} {user.contact?.last_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {user.contact?.email}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-green-100/80 text-green-800 border-green-200/50">
                              {user.platform}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inactive Devices Card */}
                <div className="bg-white/30 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg">
                  <div className="p-6 border-b border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Inactive Devices</h3>
                        <p className="text-gray-600 text-sm">Users without push notification tokens</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading...</span>
                      </div>
                    ) : usersWithoutTokens.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-500">All users have active devices</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {usersWithoutTokens.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {user.contact?.first_name} {user.contact?.last_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {user.contact?.email}
                              </p>
                            </div>
                            <Badge variant="secondary" className="bg-gray-100/80 text-gray-700 border-gray-200/50">
                              No Token
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 