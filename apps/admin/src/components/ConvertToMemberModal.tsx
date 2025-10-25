'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Loader2, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { convertToMember } from '@/services/visitors'

// Format function for date display
const format = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

interface ConvertToMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  contactName: string
  onSuccess?: () => void
}

export function ConvertToMemberModal({ 
  open, 
  onOpenChange, 
  contactId,
  contactName,
  onSuccess
}: ConvertToMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [joinedDate, setJoinedDate] = useState<Date>(new Date())
  
  const handleConvert = async () => {
    if (!joinedDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a joined date'
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const result = await convertToMember(contactId, joinedDate.toISOString())
      
      // The convertToMember function throws on error, so if we get here it succeeded
      
      toast({
        title: '🎉 Success!',
        description: `${contactName} has been converted to a member`
      })
      
      // Close the modal and trigger success callback
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error converting to member:', error)
      
      // Check for specific error types
      const errorMessage = error instanceof Error && error.message.includes('already a member')
        ? `${contactName} is already a member of the church.`
        : 'Failed to convert visitor to member. Please try again.'
      
      toast({
        variant: 'destructive',
        title: 'Conversion Failed',
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Convert to Member</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Welcome {contactName} to the church family
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Membership Date
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Select the date when {contactName} officially joined as a member
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 rounded-xl border-2 hover:border-purple-300 transition-colors",
                      !joinedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-purple-500" />
                    {joinedDate ? (
                      <span className="text-slate-800 font-medium">
                        {format(joinedDate)}
                      </span>
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-2 rounded-xl shadow-xl bg-white/95 backdrop-blur-xl">
                  <Calendar
                    mode="single"
                    selected={joinedDate}
                    onSelectDate={(date) => setJoinedDate(date)}
                    initialFocus
                    disableFutureDates={true}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl border-2 font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleConvert}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Member
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 