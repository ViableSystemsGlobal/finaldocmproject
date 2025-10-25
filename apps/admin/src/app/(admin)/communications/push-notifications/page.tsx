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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Push Notifications</h1>
          <p className="text-muted-foreground">
            Send push notifications to mobile app users
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            {usersWithTokens.length} Active Devices
          </Badge>
          <Button 
            onClick={handleTestNotification} 
            variant="outline" 
            disabled={sending || usersWithTokens.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Test
          </Button>
        </div>
      </div>

      {message.text && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="users">Mobile Users</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Push Notification
              </CardTitle>
              <CardDescription>
                Send a push notification to mobile app users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Notification title"
                    maxLength={50}
                  />
                  <p className="text-sm text-muted-foreground">
                    {title.length}/50 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
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
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notification message"
                  rows={4}
                  maxLength={200}
                />
                <p className="text-sm text-muted-foreground">
                  {body.length}/200 characters
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendToAll"
                    checked={sendToAll}
                    onChange={(e) => setSendToAll(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="sendToAll">Send to all users with push tokens</Label>
                </div>

                {!sendToAll && (
                  <div className="space-y-2">
                    <Label>Select Users</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                      {usersWithTokens.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
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
                            className="rounded"
                          />
                          <Label htmlFor={user.id} className="text-sm">
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
                className="w-full"
              >
                {sending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-500" />
                  Active Devices
                </CardTitle>
                <CardDescription>
                  Users with push notification tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : usersWithTokens.length === 0 ? (
                  <p className="text-muted-foreground">No active devices</p>
                ) : (
                  <div className="space-y-2">
                    {usersWithTokens.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">
                            {user.contact?.first_name} {user.contact?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.contact?.email}
                          </p>
                        </div>
                        <Badge variant="outline">{user.platform}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Inactive Devices
                </CardTitle>
                <CardDescription>
                  Users without push notification tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : usersWithoutTokens.length === 0 ? (
                  <p className="text-muted-foreground">All users have active devices</p>
                ) : (
                  <div className="space-y-2">
                    {usersWithoutTokens.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">
                            {user.contact?.first_name} {user.contact?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.contact?.email}
                          </p>
                        </div>
                        <Badge variant="secondary">No Token</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 