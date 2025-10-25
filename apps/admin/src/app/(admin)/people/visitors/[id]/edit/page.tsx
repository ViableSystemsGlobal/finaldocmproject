'use client'

import { useEffect, useState } from 'react'
import { useNextParams } from '@/lib/nextParams'
import { fetchVisitor, updateVisitor } from '@/services/visitors'
import { Loader2, UserCog, ArrowLeft } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'

type Visitor = {
  contact_id: string;
  first_visit: string;
  saved: boolean;
  notes?: string;
  contacts?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image?: string;
  };
};

export default function EditVisitorPage() {
  const router = useRouter()
  const params = useParams();
  const { id } = useNextParams(params);
  const [visitor, setVisitor] = useState<Visitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    firstVisit: '',
    saved: false,
    notes: ''
  })

  useEffect(() => {
    const loadVisitor = async () => {
      try {
        const { data, error } = await fetchVisitor(id as string)
        if (error) throw error
        
        const visitorData = data as unknown as Visitor
        setVisitor(visitorData)
        
        // Initialize form data
        setFormData({
          firstVisit: visitorData.first_visit.split('T')[0], // YYYY-MM-DD format for date input
          saved: visitorData.saved,
          notes: visitorData.notes || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visitor')
      } finally {
        setLoading(false)
      }
    }

    loadVisitor()
  }, [id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, saved: checked })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { error } = await updateVisitor(id as string, {
        first_visit: new Date(formData.firstVisit).toISOString(),
        saved: formData.saved,
        notes: formData.notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Visitor updated successfully'
      })
      
      // Navigate back to view page
      router.push(`/people/visitors/${id}`)
      
    } catch (err) {
      console.error('Failed to update visitor:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update visitor'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Visitor</h2>
          <p className="text-slate-600">Retrieving visitor information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-red-500 text-lg font-semibold">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
            <div className="text-slate-600 text-lg">Visitor not found</div>
          </div>
        </div>
      </div>
    )
  }

  const visitorName = visitor.contacts 
    ? `${visitor.contacts.first_name} ${visitor.contacts.last_name}`
    : 'Unknown Visitor'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push(`/people/visitors/${id}`)}
              className="hover:bg-white/50 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Visitor
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                <UserCog className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Edit Visitor
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Update information for {visitorName}
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>
                Visitor Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstVisit" className="text-slate-700" style={{ color: 'rgb(15, 23, 42)' }}>
                    First Visit Date
                  </Label>
                  <Input
                    id="firstVisit"
                    name="firstVisit"
                    type="date"
                    value={formData.firstVisit}
                    onChange={handleInputChange}
                    required
                    style={{ color: 'rgb(15, 23, 42)' }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-700" style={{ color: 'rgb(15, 23, 42)' }}>
                    Salvation Status
                  </Label>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg bg-white/50">
                    <Switch 
                      id="saved" 
                      checked={formData.saved}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="saved" className="text-sm font-medium cursor-pointer" style={{ color: 'rgb(15, 23, 42)' }}>
                      {formData.saved ? 'Saved' : 'Not saved'}
                    </Label>
                  </div>
                  <p className="text-sm text-slate-500" style={{ color: 'rgb(15, 23, 42)' }}>
                    Mark whether this visitor has accepted Jesus as their savior.
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-slate-700" style={{ color: 'rgb(15, 23, 42)' }}>
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any additional information about this visitor..."
                style={{ color: 'rgb(15, 23, 42)' }}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(`/people/visitors/${id}`)}
                disabled={isSubmitting}
                className="rounded-xl px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Visitor'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 