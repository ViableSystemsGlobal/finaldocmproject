'use client'

import React, { useState } from 'react'
import { Calendar as CalendarIcon, Loader2, Users, Clock, FileText, User } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { createFollowUp } from '@/services/followUps'
import { useUsers } from '@/hooks/useUsers'
import { usePermissions } from '@/hooks/usePermissions'

// Sample format function (replace with date-fns or similar if available)
const format = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

interface FollowUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  contactName?: string
}

type FollowUpFormData = {
  type: string
  notes: string
  scheduled_date: Date | null
  assigned_to?: string
}

export function FollowUpModal({ 
  open, 
  onOpenChange, 
  contactId,
  contactName = 'Member'
}: FollowUpModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date())
  
  // Hooks
  const { users } = useUsers()
  const { userPermissions } = usePermissions()
  
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FollowUpFormData>({
    defaultValues: {
      type: 'call',
      notes: '',
      scheduled_date: new Date(),
    }
  })
  
  const onSubmit = async (data: FollowUpFormData) => {
    setIsSubmitting(true)
    
    try {
      if (!scheduledDate) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select a date for the follow-up'
        })
        return
      }

      // Create follow-up using the actual service
      const { error } = await createFollowUp({
        contact_id: contactId,
        type: data.type,
        status: 'pending', // New follow-up is always pending
        assigned_to: data.assigned_to === 'unassigned' ? undefined : data.assigned_to || undefined,
        next_action_date: scheduledDate.toISOString().split('T')[0], // Convert to date string
        notes: data.notes || undefined
      })

      if (error) {
        console.error('Error creating follow-up:', error)
        throw error
      }
      
      toast({
        title: 'Success',
        description: 'Follow-up created successfully'
      })
      
      // Reset form and close dialog
      reset()
      setScheduledDate(null)
      onOpenChange(false)
      
      // Parent component should handle data refresh
    } catch (error) {
      console.error('Error creating follow-up:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create follow-up. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20">
        <DialogHeader className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-xl"></div>
          <div className="relative bg-white rounded-xl p-6 -m-6 mb-0">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  Schedule Follow-Up
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Create a follow-up task for {contactName}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
          {/* Follow-up Type Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Follow-Up Details</h3>
                  <p className="text-blue-100 text-sm">Choose the type and timing</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="type" className="text-base font-semibold text-slate-700">
                  Follow-Up Type
                </Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder="Select follow-up type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">📞 Phone Call</SelectItem>
                        <SelectItem value="visit">🏠 Home Visit</SelectItem>
                        <SelectItem value="message">💬 Message/Text</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="meeting">🤝 In-person Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="scheduled_date" className="text-base font-semibold text-slate-700">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Scheduled Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate) : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-2 rounded-xl shadow-xl bg-white">
                    <Calendar
                      mode="single"
                      selected={scheduledDate || undefined}
                      onSelect={(date) => setScheduledDate(date || null)}
                    />
                  </PopoverContent>
                </Popover>
                {errors.scheduled_date && (
                  <p className="text-sm text-red-500">{errors.scheduled_date.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes and Assignment Card */}
          <div className="bg-white/70 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Additional Information</h3>
                  <p className="text-purple-100 text-sm">Notes and assignment</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                  Notes <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  {...register('notes', { required: 'Notes are required' })}
                  placeholder="Details about this follow-up..."
                  className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                />
                {errors.notes && (
                  <p className="text-sm text-red-500">{errors.notes.message}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="assigned_to" className="text-base font-semibold text-slate-700">
                  <User className="h-4 w-4 inline mr-2" />
                  Assigned To
                </Label>
                <Controller
                  name="assigned_to"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Select team member (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users
                          .filter(user => userPermissions.permissions.includes('followups:view:all') || 
                                         userPermissions.permissions.includes('followups:view:assigned') || 
                                         userPermissions.permissions.includes('followups:view:department'))
                          .map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-sm text-slate-500">Optional: Assign this follow-up to a specific team member</p>
              </div>
            </div>
          </div>
        </form>
        
        <DialogFooter className="pt-6 border-t border-slate-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit(onSubmit)}
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
                <Users className="mr-2 h-4 w-4" />
                Create Follow-Up
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 