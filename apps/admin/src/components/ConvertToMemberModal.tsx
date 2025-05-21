'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
      const { error } = await convertToMember(contactId, joinedDate.toISOString())
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: `${contactName} has been converted to a member`
      })
      
      // Close the modal and trigger success callback
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error converting to member:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to convert visitor to member'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convert to Member</DialogTitle>
          <DialogDescription>
            Set the joined date for {contactName} to convert them from a visitor to a member.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Joined Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !joinedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {joinedDate ? format(joinedDate) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 border-2 rounded-lg shadow-lg bg-white">
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
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleConvert}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert to Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 