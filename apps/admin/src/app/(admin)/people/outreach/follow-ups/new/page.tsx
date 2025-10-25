'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarIcon, Loader2, Users, FileText, Clock, UserCheck } from 'lucide-react'
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
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createFollowUp } from '@/services/followUps'
import { supabase } from '@/lib/supabase'
import { useUsers } from '@/hooks/useUsers'
import { useContacts } from '@/hooks/useContacts'

export default function NewFollowUpPage() {
  const router = useRouter()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactId, setContactId] = useState('')
  const [followUpType, setFollowUpType] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('none')
  const [notes, setNotes] = useState('')
  
  // Use the custom hooks for users and contacts
  const { users, isLoading: isUsersLoading, error: usersError } = useUsers()
  const { contacts, isLoading: isContactsLoading, error: contactsError } = useContacts()
  
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
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!contactId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Contact is required'
      })
      return
    }
    
    if (!followUpType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Follow-up type is required'
      })
      return
    }
    
    if (!nextActionDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Next action date is required'
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Create follow-up
      const { error } = await createFollowUp({
        contact_id: contactId,
        type: followUpType,
        status: 'pending', // New follow-up is always pending
        assigned_to: assignedTo === 'none' ? undefined : assignedTo || undefined,
        next_action_date: nextActionDate,
        notes: notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Follow-up created successfully',
      })
      
      // Navigate back to follow-ups list
      router.push('/people/outreach/follow-ups')
      router.refresh()
    } catch (err) {
      console.error('Error creating follow-up:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create follow-up',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Loading state
  const isLoading = isContactsLoading || isUsersLoading

  // Show errors if any
  useEffect(() => {
    if (usersError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users. ' + usersError.message
      })
    }
    
    if (contactsError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contacts. ' + contactsError.message
      })
    }
  }, [usersError, contactsError])

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
                  New Follow-Up
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Schedule a follow-up action for a contact
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-lg text-slate-600">Loading contacts and users...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Selection Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Contact Information</h2>
                    <p className="text-blue-100">Select the person and follow-up type</p>
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
                    <Select 
                      onValueChange={setContactId}
                      disabled={isSubmitting}
                    >
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
                    <p className="text-sm text-slate-500">
                      The person you want to follow up with
                    </p>
                  </div>
                  
                  {/* Follow-up Type */}
                  <div className="space-y-3">
                    <Label htmlFor="type" className="text-base font-semibold text-slate-700">
                      Follow-Up Type <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={setFollowUpType}
                      disabled={isSubmitting}
                    >
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
                    <p className="text-sm text-slate-500">
                      The type of follow-up
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule and Assignment Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Schedule & Assignment</h2>
                    <p className="text-purple-100">When and who will handle this follow-up</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Follow-up Date */}
                  <div className="space-y-3">
                    <Label htmlFor="next_action_date" className="text-base font-semibold text-slate-700">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Follow-Up Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="next_action_date"
                      type="date"
                      value={nextActionDate}
                      onChange={(e) => setNextActionDate(e.target.value)}
                      disabled={isSubmitting}
                      required
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <p className="text-sm text-slate-500">
                      When this follow-up should happen
                    </p>
                  </div>
                  
                  {/* Assignment */}
                  <div className="space-y-3">
                    <Label htmlFor="assigned_to" className="text-base font-semibold text-slate-700">
                      <Users className="h-4 w-4 inline mr-2" />
                      Assign To
                    </Label>
                    <Select 
                      onValueChange={setAssignedTo}
                      disabled={isSubmitting}
                      defaultValue="none"
                    >
                      <SelectTrigger 
                        id="assigned_to"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select a user (optional)" />
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
                    <p className="text-sm text-slate-500">
                      Who is responsible for this follow-up (optional)
                    </p>
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
                    <h2 className="text-2xl font-bold text-white">Additional Details</h2>
                    <p className="text-emerald-100">Context and notes for this follow-up</p>
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
                    disabled={isSubmitting}
                    placeholder="Add any additional notes here..."
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-sm text-slate-500">
                    Any context or details about this follow-up (optional)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/people/outreach/follow-ups')}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Follow-Up...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Create Follow-Up
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
} 