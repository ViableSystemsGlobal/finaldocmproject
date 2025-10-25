'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { AddressAutocomplete } from '@/components/transport/AddressAutocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ContactFormProps {
  contact?: Contact
  onSubmit: (data: Partial<Contact>) => Promise<void>
  submitLabel?: string
}

export function ContactForm({
  contact,
  onSubmit,
  submitLabel = 'Save Contact',
}: ContactFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<Partial<Contact>>({
    first_name: contact?.first_name || '',
    last_name: contact?.last_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    location: contact?.location || '',
    occupation: contact?.occupation || '',
    lifecycle: contact?.lifecycle || 'soul',
  })

  // Handle date of birth separately as a Date object
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    contact?.date_of_birth ? new Date(contact.date_of_birth) : undefined
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const submitData = {
        ...formData,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
      }
      
      console.log('Submitting form data:', submitData);
      await onSubmit(submitData)
      router.push('/people/contacts')
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save contact';
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 text-sm text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="font-medium">Error saving contact:</p>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200" style={{ color: 'rgb(15, 23, 42)' }}>Basic Information</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-slate-700 dark:text-slate-300 font-medium">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-slate-900 dark:text-slate-100"
                style={{ color: 'rgb(15, 23, 42)' }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-slate-700 dark:text-slate-300 font-medium">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-slate-900 dark:text-slate-100"
                style={{ color: 'rgb(15, 23, 42)' }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-slate-900 dark:text-slate-100"
                style={{ color: 'rgb(15, 23, 42)' }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-slate-900 dark:text-slate-100"
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifecycle" className="text-slate-700 dark:text-slate-300 font-medium">Lifecycle Stage</Label>
              <Select
                value={formData.lifecycle || 'soul'}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, lifecycle: value })
                }
              >
                <SelectTrigger className="h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 text-slate-900 dark:text-slate-100" style={{ color: 'rgb(15, 23, 42)' }}>
                  <SelectValue placeholder="Select lifecycle stage" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                  <SelectItem value="soul" className="text-slate-900 dark:text-slate-100">Soul</SelectItem>
                  <SelectItem value="contact" className="text-slate-900 dark:text-slate-100">Contact</SelectItem>
                  <SelectItem value="visitor" className="text-slate-900 dark:text-slate-100">Visitor</SelectItem>
                  <SelectItem value="member" className="text-slate-900 dark:text-slate-100">Member</SelectItem>
                  <SelectItem value="inactive" className="text-slate-900 dark:text-slate-100">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-4 border-t border-slate-200 dark:border-slate-600 pt-8">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200" style={{ color: 'rgb(15, 23, 42)' }}>Additional Details</h3>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="text-slate-700 dark:text-slate-300 font-medium">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors text-slate-900 dark:text-slate-100",
                      !dateOfBirth && "text-slate-500 dark:text-slate-400"
                    )}
                    style={{ color: 'rgb(15, 23, 42)' }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span style={{ color: 'rgb(15, 23, 42)' }}>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-2 rounded-lg shadow-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
                  <CalendarComponent
                    mode="single"
                    selected={dateOfBirth}
                    onSelectDate={setDateOfBirth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-700 dark:text-slate-300 font-medium">Location</Label>
              <AddressAutocomplete
                value={formData.location || ''}
                onChange={(value: string) =>
                  setFormData({ ...formData, location: value })
                }
                placeholder="City, State/Country"
                className="h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-slate-900 dark:text-slate-100"
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>

            {/* Occupation */}
            <div className="space-y-2">
              <Label htmlFor="occupation" className="text-slate-700 dark:text-slate-300 font-medium">Occupation</Label>
              <Input
                id="occupation"
                placeholder="Job title or profession"
                value={formData.occupation || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                className="h-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 transition-colors text-slate-900 dark:text-slate-100"
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-600">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/people/contacts')}
            className="rounded-xl px-6 h-12 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="rounded-xl px-6 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 