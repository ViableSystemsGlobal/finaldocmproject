'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, CheckCircle, CalendarIcon, Clock, Users, FileText, User, UserCheck, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { fetchFollowUp, updateFollowUp, markFollowUpComplete, FollowUp } from '@/services/followUps'
import { useUsers } from '@/hooks/useUsers'
import { useContacts } from '@/hooks/useContacts'
import { useNextParams } from '@/lib/nextParams'

export default function FollowUpDetailPage({ params }: { params: { id: string } }) {
  // Safe way to handle params that works with both current and future Next.js
  const unwrappedParams = useNextParams(params)
  const id = unwrappedParams.id as string
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  
  // State
  const [followUp, setFollowUp] = useState<FollowUp | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [contactId, setContactId] = useState('')
  const [followUpType, setFollowUpType] = useState('')
  const [status, setStatus] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  
  // Use the custom hooks
  const { users, isLoading: isUsersLoading } = useUsers()
  const { contacts, isLoading: isContactsLoading } = useContacts()
  
  // Follow-up types
  const followUpTypes = [
    'First-time visitor',
    'Salvation follow-up',
    'Discipleship',
    'Prayer request',
    'Membership',
    'Absent member',
    'Other'
  ]

  // Fetch follow-up data
  useEffect(() => {
    async function loadFollowUp() {
      try {
        setLoading(true)
        const { data, error } = await fetchFollowUp(id)
        
        if (error) throw error
        
        setFollowUp(data)
        
        // Set form fields
        if (data) {
          setContactId(data.contact_id)
          setFollowUpType(data.type)
          setStatus(data.status)
          setNextActionDate(data.next_action_date)
          setAssignedTo(data.assigned_to || 'none')
          setNotes(data.notes || '')
        }
      } catch (err) {
        console.error('Error loading follow-up:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load follow-up details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadFollowUp()
  }, [id])
  
  // Handle save
  const handleSave = async () => {
    if (!followUp) return
    
    try {
      setSaving(true)
      
      const { error } = await updateFollowUp(id, {
        contact_id: contactId,
        type: followUpType,
        status,
        next_action_date: nextActionDate,
        assigned_to: assignedTo === 'none' ? undefined : assignedTo || undefined,
        notes: notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Follow-up updated successfully'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchFollowUp(id)
      if (refreshedData) setFollowUp(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/follow-ups/${id}`)
    } catch (err) {
      console.error('Error updating follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update follow-up'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Handle mark as complete
  const handleMarkComplete = async () => {
    if (!followUp) return
    
    try {
      setSaving(true)
      
      const { error } = await markFollowUpComplete(id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Follow-up marked as complete'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchFollowUp(id)
      if (refreshedData) setFollowUp(refreshedData)
      
    } catch (err) {
      console.error('Error marking follow-up complete:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark follow-up as complete'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading follow-up details...</p>
        </div>
      </div>
    )
  }

  if (!followUp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <UserCheck className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Follow-up not found</h2>
          <p className="text-slate-600 mb-6">The follow-up you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/people/outreach/follow-ups">Back to Follow-ups</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              asChild
              className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl"
            >
              <Link href="/people/outreach/follow-ups">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 p-4 rounded-2xl">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Follow-Up' : 'Follow-Up Details'}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {followUp.type} for {followUp.contacts ? 
                    `${followUp.contacts.first_name} ${followUp.contacts.last_name}` : 
                    'Unknown Contact'
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {!isEditMode && (
            <div className="flex gap-3 flex-wrap">
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg"
              >
                <Link href={`/people/outreach/follow-ups/${id}?mode=edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Follow-Up
                </Link>
              </Button>
              
              {followUp.status === 'pending' && (
                <Button 
                  onClick={handleMarkComplete}
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking Complete...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {isEditMode ? (
          /* Edit Mode */
          <div className="space-y-8">
            {/* Contact Information Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Contact & Type</h2>
                    <p className="text-blue-100">Update contact information and follow-up type</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="contact" className="text-base font-semibold text-slate-700">
                      Contact <span className="text-red-500">*</span>
                    </Label>
                    <Select value={contactId} onValueChange={setContactId} disabled={saving}>
                      <SelectTrigger 
                        id="contact"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {`${contact.first_name || ''} ${contact.last_name || ''}`}
                            {contact.email && ` - ${contact.email}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Follow-up Type */}
                  <div className="space-y-3">
                    <Label htmlFor="type" className="text-base font-semibold text-slate-700">
                      Follow-Up Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={followUpType} onValueChange={setFollowUpType} disabled={saving}>
                      <SelectTrigger 
                        id="type"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {followUpTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule & Status Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Schedule & Status</h2>
                    <p className="text-purple-100">Update timing and assignment</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Follow-up Date */}
                  <div className="space-y-3">
                    <Label htmlFor="next_action_date" className="text-base font-semibold text-slate-700">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Follow-Up Date
                    </Label>
                    <Input
                      id="next_action_date"
                      type="date"
                      value={nextActionDate}
                      onChange={(e) => setNextActionDate(e.target.value)}
                      disabled={saving}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  {/* Status */}
                  <div className="space-y-3">
                    <Label htmlFor="status" className="text-base font-semibold text-slate-700">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus} disabled={saving}>
                      <SelectTrigger 
                        id="status"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Assignment */}
                  <div className="space-y-3">
                    <Label htmlFor="assigned_to" className="text-base font-semibold text-slate-700">
                      <User className="h-4 w-4 inline mr-2" />
                      Assigned To
                    </Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo} disabled={saving}>
                      <SelectTrigger 
                        id="assigned_to"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not Assigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Notes & Details</h2>
                    <p className="text-emerald-100">Add context and details about this follow-up</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={saving}
                    placeholder="Add notes about this follow-up..."
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/people/outreach/follow-ups/${id}`)}
                disabled={saving}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg"
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
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-8">
            {/* Overview Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Follow-Up Overview</h2>
                    <p className="text-slate-300">Complete details about this follow-up</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Contact Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Contact Information
                      </h3>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-lg">
                              {followUp.contacts ? 
                                `${followUp.contacts.first_name} ${followUp.contacts.last_name}` : 
                                'Unknown Contact'
                              }
                            </p>
                            {followUp.contacts?.email && (
                              <p className="text-slate-600">{followUp.contacts.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Follow-up Type */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Follow-Up Type
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                          {followUp.type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Status and Timing */}
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        Status
                      </h3>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                        <Badge 
                          className={`text-white text-lg px-4 py-2 ${
                            followUp.status === 'completed' 
                              ? 'bg-emerald-500' 
                              : followUp.status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        >
                          {followUp.status.charAt(0).toUpperCase() + followUp.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-orange-600" />
                        Due Date
                      </h3>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                        <p className="text-slate-800 font-semibold text-lg">
                          {new Date(followUp.next_action_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                {followUp.assigned_to && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-indigo-600" />
                      Assigned To
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                      <p className="text-slate-800 font-semibold">
                        {users.find(u => u.id === followUp.assigned_to)?.name || 
                         users.find(u => u.id === followUp.assigned_to)?.email || 
                         'Unknown User'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {followUp.notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-600" />
                      Notes
                    </h3>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {followUp.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 