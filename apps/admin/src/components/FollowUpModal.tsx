'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FollowUpFormData>({
    defaultValues: {
      type: 'call',
      notes: '',
      scheduled_date: new Date(),
    }
  })
  
  const onSubmit = async (data: FollowUpFormData) => {
    setIsSubmitting(true)
    
    try {
      // TODO: Replace with actual API call to save follow-up
      console.log('Creating follow-up with data:', { 
        ...data, 
        contact_id: contactId,
        scheduled_date: scheduledDate?.toISOString()
      })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Success',
        description: 'Follow-up created successfully'
      })
      
      // Reset form and close dialog
      reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating follow-up:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create follow-up'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-Up</DialogTitle>
          <DialogDescription>
            Create a follow-up task for {contactName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                defaultValue="call"
                onValueChange={(value) => register('type').onChange({ target: { value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select follow-up type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="visit">Home Visit</SelectItem>
                  <SelectItem value="message">Message/Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">In-person Meeting</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">When</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-2 rounded-lg shadow-lg bg-white">
                  <Calendar
                    mode="single"
                    selected={scheduledDate || undefined}
                    onSelectDate={setScheduledDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.scheduled_date && (
                <p className="text-sm text-red-500">{errors.scheduled_date.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                {...register('notes', { required: 'Notes are required' })}
                placeholder="Details about this follow-up..."
                className="min-h-[100px]"
              />
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input
                {...register('assigned_to')}
                placeholder="Leave blank to assign to yourself"
              />
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
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Create Follow-Up'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 