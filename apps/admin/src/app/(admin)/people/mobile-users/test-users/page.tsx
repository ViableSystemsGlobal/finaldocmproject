'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Smartphone, Users, Plus, Trash2 } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'

export default function TestUsersPage() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])

  const createTestUsers = async () => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      
      // Create test contacts first
      const testContacts = [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: `john.doe.test.${timestamp}@example.com`,
          phone: `+1234567${timestamp.toString().slice(-3)}1`,
          tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: `jane.smith.test.${timestamp}@example.com`,
          phone: `+1234567${timestamp.toString().slice(-3)}2`,
          tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        },
        {
          first_name: 'Bob',
          last_name: 'Johnson',
          email: `bob.johnson.test.${timestamp}@example.com`,
          phone: `+1234567${timestamp.toString().slice(-3)}3`,
          tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        }
      ]

      console.log('Creating test contacts...')
      const { data: contacts, error: contactsError } = await supabaseAdmin
        .from('contacts')
        .insert(testContacts)
        .select('id, first_name, last_name, email')

      if (contactsError) {
        throw new Error(`Failed to create contacts: ${contactsError.message}`)
      }

      // Create mobile app users with push tokens
      const testMobileUsers = contacts.map((contact, index) => ({
        contact_id: contact.id,
        auth_user_id: `test-user-${timestamp}-${index}`,
        status: 'active',
        devices: [
          {
            device_id: `test-device-${timestamp}-${index}`,
            push_token: `test-push-token-${timestamp}-${index}`,
            platform: 'ios',
            app_version: '1.0.0',
            last_active: new Date().toISOString()
          }
        ],
        notification_preferences: {
          push_enabled: true,
          email_enabled: true,
          sms_enabled: false,
          categories: {
            announcements: true,
            events: true,
            prayer_requests: true,
            giving: false
          }
        }
      }))

      console.log('Creating test mobile app users...')
      const { data: mobileUsers, error: mobileUsersError } = await supabaseAdmin
        .from('mobile_app_users')
        .insert(testMobileUsers)
        .select('*')

      if (mobileUsersError) {
        throw new Error(`Failed to create mobile app users: ${mobileUsersError.message}`)
      }

      // Simple display - just show the basic info
      const displayUsers = mobileUsers.map((user, index) => ({
        ...user,
        contact: contacts[index] // We know the order matches
      }))

      setUsers(displayUsers)
      
      toast({
        title: 'Success!',
        description: `Created ${mobileUsers.length} test mobile app users with push tokens`,
      })

    } catch (error) {
      console.error('Error creating test users:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create test users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadExistingTestUsers = async () => {
    try {
      console.log('Loading existing test users...')
      
      // First, let's test if we can access the table at all
      console.log('Testing table access...')
      const { data: testData, error: testError } = await supabaseAdmin
        .from('mobile_app_users')
        .select('id')
        .limit(1)

      console.log('Table access test:', { data: testData, error: testError })

      if (testError) {
        console.error('Cannot access mobile_app_users table:', testError)
        return
      }

      // Now try the actual query
      const { data: existingUsers, error } = await supabaseAdmin
        .from('mobile_app_users')
        .select('*')
        .like('auth_user_id', 'test-user-%')

      console.log('Query result:', { data: existingUsers, error })

      if (error) {
        console.error('Error loading test users:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return
      }

      console.log('Found existing users:', existingUsers?.length || 0)
      setUsers(existingUsers || [])
      
    } catch (error) {
      console.error('Error loading existing test users:', error)
      console.error('Caught error details:', JSON.stringify(error, null, 2))
    }
  }

  // Load existing test users on component mount
  // useEffect(() => {
  //   loadExistingTestUsers()
  // }, [])

  const clearTestUsers = async () => {
    setLoading(true)
    try {
      console.log('Clearing test users...')
      
      // Delete test mobile app users (those with test auth_user_ids)
      const { error: mobileUsersError } = await supabaseAdmin
        .from('mobile_app_users')
        .delete()
        .like('auth_user_id', 'test-user-%')

      if (mobileUsersError) {
        console.warn('Warning deleting mobile users:', mobileUsersError.message)
      }

      // Delete test contacts (those with test emails)
      const { error: contactsError } = await supabaseAdmin
        .from('contacts')
        .delete()
        .like('email', '%.test.%@example.com')

      if (contactsError) {
        console.warn('Warning deleting contacts:', contactsError.message)
      }

      setUsers([])
      
      toast({
        title: 'Success!',
        description: 'Test users cleared successfully',
      })

    } catch (error) {
      console.error('Error clearing test users:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clear test users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Test Mobile App Users
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Create test users for push notification testing
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Create Test Users
              </CardTitle>
              <CardDescription>
                This will create 3 test mobile app users with push tokens for testing push notifications.
                Each user will have a contact record and an active device with a push token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={createTestUsers} 
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Plus className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Test Users
                    </>
                  )}
                </Button>

                <Button 
                  onClick={loadExistingTestUsers} 
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Users className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Load Existing
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={clearTestUsers} 
                  disabled={loading}
                  variant="destructive"
                >
                  {loading ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Test Users
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Show created users */}
          {users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Created Test Users</CardTitle>
                <CardDescription>
                  These users can now receive push notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          Test User {index + 1} (ID: {user.auth_user_id})
                        </div>
                        <div className="text-sm text-slate-600">
                          Contact ID: {user.contact_id} • {user.devices?.length || 0} device(s) • Push tokens: {user.devices?.filter((d: any) => d.push_token).length || 0}
                        </div>
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {user.status || 'Active'}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                <p className="mb-2">After creating test users:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go back to your push notification campaign</li>
                  <li>Click "Dispatch Now" to send the campaign</li>
                  <li>You should now see the test users as recipients</li>
                  <li>Check the campaign details page to see delivery status</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 