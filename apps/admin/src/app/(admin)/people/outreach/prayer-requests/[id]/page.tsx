'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, CheckCircle, CalendarIcon, Clock, Users, FileText, User, Heart, Edit, AlertTriangle, Target, MessageSquare } from 'lucide-react'
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
import { useContacts } from '@/hooks/useContacts'
import { useUsers } from '@/hooks/useUsers'
import { useNextParams } from '@/lib/nextParams'
import { 
  PrayerRequest, 
  fetchPrayerRequest, 
  updatePrayerRequest, 
  markPrayerRequestAnswered 
} from '@/services/prayerRequests'

export default function PrayerRequestDetailPage({ params }: { params: { id: string } }) {
  // Safe way to handle params that works with both current and future Next.js
  const unwrappedParams = useNextParams(params)
  const id = unwrappedParams.id as string
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  
  // State
  const [prayerRequest, setPrayerRequest] = useState<PrayerRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [answering, setAnswering] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactId, setContactId] = useState('')
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [responseNotes, setResponseNotes] = useState('')
  
  // Use the custom hooks
  const { contacts, isLoading: isContactsLoading } = useContacts()
  const { users, isLoading: isUsersLoading } = useUsers()
  
  // Status options
  const statusOptions = [
    { value: 'new', label: 'New', color: 'bg-blue-500' },
    { value: 'in-prayer', label: 'In Prayer', color: 'bg-yellow-500' },
    { value: 'answered', label: 'Answered', color: 'bg-green-500' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-500' }
  ]

  // Fetch prayer request data
  useEffect(() => {
    async function loadPrayerRequest() {
      try {
        setLoading(true)
        const { data, error } = await fetchPrayerRequest(id)
        
        if (error) throw error
        
        setPrayerRequest(data)
        
        // Set form fields
        if (data) {
          setTitle(data.title || '')
          setDescription(data.description || '')
          setContactId(data.contact_id || '')
          setStatus(data.status || 'new')
          setAssignedTo(data.assigned_to || 'none')
          setResponseNotes(data.response_notes || '')
        }
      } catch (err) {
        console.error('Error loading prayer request:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load prayer request details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadPrayerRequest()
  }, [id])
  
  // Handle save
  const handleSave = async () => {
    if (!prayerRequest) return
    
    try {
      setSaving(true)
      
      const { error } = await updatePrayerRequest(id, {
        title,
        description,
        contact_id: contactId || undefined,
        status,
        assigned_to: assignedTo === 'none' ? undefined : assignedTo || undefined,
        response_notes: responseNotes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Prayer request updated successfully'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchPrayerRequest(id)
      if (refreshedData) setPrayerRequest(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/prayer-requests/${id}`)
    } catch (err) {
      console.error('Error updating prayer request:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update prayer request'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Handle marking as answered
  const handleMarkAnswered = async () => {
    if (!prayerRequest) return
    
    try {
      setAnswering(true)
      
      const { error } = await markPrayerRequestAnswered(id, responseNotes)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Prayer request marked as answered'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchPrayerRequest(id)
      if (refreshedData) setPrayerRequest(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/prayer-requests/${id}`)
    } catch (err) {
      console.error('Error marking prayer request as answered:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark prayer request as answered'
      })
    } finally {
      setAnswering(false)
    }
  }
  
  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    if (!statusOption) return null
    
    return (
      <Badge className={`${statusOption.color} text-white text-lg px-4 py-2`}>
        {statusOption.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading prayer request details...</p>
        </div>
      </div>
    )
  }

  if (!prayerRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Prayer request not found</h2>
          <p className="text-slate-600 mb-6">The prayer request you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/people/outreach/prayer-requests">Back to Prayer Requests</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
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
              <Link href="/people/outreach/prayer-requests">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Prayer Request' : 'Prayer Request Details'}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {prayerRequest.title} • {prayerRequest.contacts ? 
                    `${prayerRequest.contacts.first_name} ${prayerRequest.contacts.last_name}` : 
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
                <Link href={`/people/outreach/prayer-requests/${id}?mode=edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Request
                </Link>
              </Button>
            </div>
          )}
        </div>

        {isEditMode ? (
          /* Edit Mode */
          <div className="space-y-8">
            {/* Request Details Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Request Details</h2>
                    <p className="text-blue-100">Update the prayer request information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  {/* Title */}
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-base font-semibold text-slate-700">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={saving}
                      placeholder="Brief title for the prayer request"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-base font-semibold text-slate-700">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={saving}
                      placeholder="Describe the prayer need in detail..."
                      className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Assignment Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Status & Assignment</h2>
                    <p className="text-purple-100">Update prayer status and assignment</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Assigned To */}
                  <div className="space-y-3">
                    <Label htmlFor="assigned_to" className="text-base font-semibold text-slate-700">
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
                        <SelectItem value="none">Not assigned</SelectItem>
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

            {/* Response Notes Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Response Notes</h2>
                    <p className="text-emerald-100">Document prayer answers and responses</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-3">
                  <Label htmlFor="response_notes" className="text-base font-semibold text-slate-700">
                    Response Notes
                  </Label>
                  <Textarea
                    id="response_notes"
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    disabled={saving}
                    placeholder="Document how this prayer was answered or any responses..."
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/people/outreach/prayer-requests/${id}`)}
                disabled={saving}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg"
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
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Prayer Request Overview</h2>
                    <p className="text-slate-300">Complete details about this prayer request</p>
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
                              {prayerRequest.contacts ? 
                                `${prayerRequest.contacts.first_name} ${prayerRequest.contacts.last_name}` : 
                                'Unknown Contact'
                              }
                            </p>
                            {prayerRequest.contacts?.email && (
                              <p className="text-slate-600">{prayerRequest.contacts.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        Status
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        {getStatusBadge(prayerRequest.status)}
                      </div>
                    </div>
                  </div>

                  {/* Request Title */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Request Title
                      </h3>
                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                        <p className="text-slate-800 font-semibold text-lg">
                          {prayerRequest.title}
                        </p>
                      </div>
                    </div>

                    {/* Submitted Date */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-orange-600" />
                        Submitted Date
                      </h3>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                        <p className="text-slate-800 font-semibold text-lg">
                          {new Date(prayerRequest.submitted_at).toLocaleDateString('en-US', {
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

                {/* Description */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-600" />
                    Prayer Request Description
                  </h3>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                      {prayerRequest.description}
                    </p>
                  </div>
                </div>

                {/* Assignment */}
                {prayerRequest.assigned_to && prayerRequest.user && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Assigned To
                    </h3>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                      <p className="text-slate-800 font-semibold">
                        {prayerRequest.user.raw_user_meta_data?.name || 
                          prayerRequest.user.email ||
                          `${prayerRequest.user.raw_user_meta_data?.first_name || ''} ${prayerRequest.user.raw_user_meta_data?.last_name || ''}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Response Notes */}
                {prayerRequest.response_notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                      Response Notes
                    </h3>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {prayerRequest.response_notes}
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