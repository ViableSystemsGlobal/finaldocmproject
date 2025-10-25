'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, CheckCircle, CalendarIcon, Clock, Users, FileText, User, Heart, Edit, MapPin, UserCheck } from 'lucide-react'
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
import { fetchSoul, updateSoul, SoulWinning } from '@/services/soulWinning'
import { useUsers } from '@/hooks/useUsers'
import { useContacts } from '@/hooks/useContacts'
import { useNextParams } from '@/lib/nextParams'

export default function SoulWinningDetailPage({ params }: { params: { id: string } }) {
  // Safe way to handle params that works with both current and future Next.js
  const unwrappedParams = useNextParams(params)
  const id = unwrappedParams.id as string
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  
  // State
  const [soulWinning, setSoulWinning] = useState<SoulWinning | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [saved, setSaved] = useState(false)
  const [inviterType, setInviterType] = useState('')
  const [inviterContactId, setInviterContactId] = useState('')
  const [inviterName, setInviterName] = useState('')
  const [notes, setNotes] = useState('')
  
  // Use the custom hooks
  const { users, isLoading: isUsersLoading } = useUsers()
  const { contacts, isLoading: isContactsLoading } = useContacts()
  
  // Soul winning types
  const soulWinningTypes = [
    'Salvation',
    'Rededication', 
    'Baptism commitment',
    'Church membership',
    'Prayer for healing',
    'Other'
  ]

  // Fetch soul winning data
  useEffect(() => {
    async function loadSoulWinning() {
      try {
        setLoading(true)
        const { data, error } = await fetchSoul(id)
        
        if (error) throw error
        
        setSoulWinning(data)
        
        // Set form fields
        if (data) {
          setSaved(data.saved || false)
          setInviterType(data.inviter_type || '')
          setInviterContactId(data.inviter_contact_id || 'none')
          setInviterName(data.inviter_name || '')
          setNotes(data.notes || '')
        }
      } catch (err) {
        console.error('Error loading soul winning record:', err)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load soul winning details'
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadSoulWinning()
  }, [id])
  
  // Handle save
  const handleSave = async () => {
    if (!soulWinning) return
    
    try {
      setSaving(true)
      
      const { error } = await updateSoul(id, {
        saved,
        inviter_type: inviterType,
        inviter_contact_id: inviterContactId === 'none' ? undefined : inviterContactId || undefined,
        inviter_name: inviterName || undefined,
        notes: notes || undefined
      })
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Soul winning record updated successfully'
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchSoul(id)
      if (refreshedData) setSoulWinning(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/soul-winning/${id}`)
    } catch (err) {
      console.error('Error updating soul winning record:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update soul winning record'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading soul winning details...</p>
        </div>
      </div>
    )
  }

  if (!soulWinning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Soul winning record not found</h2>
          <p className="text-slate-600 mb-6">The record you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/people/outreach/soul-winning">Back to Soul Winning</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100">
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
              <Link href="/people/outreach/soul-winning">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-red-500 to-rose-500 p-4 rounded-2xl">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Soul Winning Record' : 'Soul Winning Details'}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {soulWinning.inviter_type} for {soulWinning.contacts ? 
                    `${soulWinning.contacts.first_name} ${soulWinning.contacts.last_name}` : 
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
                <Link href={`/people/outreach/soul-winning/${id}?mode=edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Record
                </Link>
              </Button>
            </div>
          )}
        </div>

        {isEditMode ? (
          /* Edit Mode */
          <div className="space-y-8">
            {/* Decision Details Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Decision Details</h2>
                    <p className="text-blue-100">Update the spiritual decision information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Salvation Status */}
                  <div className="space-y-3">
                    <Label htmlFor="saved" className="text-base font-semibold text-slate-700">
                      Salvation Decision
                    </Label>
                    <Select value={saved ? 'true' : 'false'} onValueChange={(value) => setSaved(value === 'true')} disabled={saving}>
                      <SelectTrigger 
                        id="saved"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select salvation status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">✓ Made salvation decision</SelectItem>
                        <SelectItem value="false">Other decision/encounter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Decision Type */}
                  <div className="space-y-3">
                    <Label htmlFor="inviter_type" className="text-base font-semibold text-slate-700">
                      Decision Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={inviterType} onValueChange={setInviterType} disabled={saving}>
                      <SelectTrigger 
                        id="inviter_type"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select decision type" />
                      </SelectTrigger>
                      <SelectContent>
                        {soulWinningTypes.map((type) => (
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

            {/* Witness & Location Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Witness & Location</h2>
                    <p className="text-purple-100">Update witness and location information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Witness */}
                  <div className="space-y-3">
                    <Label htmlFor="inviter_contact_id" className="text-base font-semibold text-slate-700">
                      <UserCheck className="h-4 w-4 inline mr-2" />
                      Witnessed By
                    </Label>
                    <Select value={inviterContactId} onValueChange={setInviterContactId} disabled={saving}>
                      <SelectTrigger 
                        id="inviter_contact_id"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select witness" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific witness</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {`${contact.first_name || ''} ${contact.last_name || ''}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Location/Name */}
                  <div className="space-y-3">
                    <Label htmlFor="inviter_name" className="text-base font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Location/Details
                    </Label>
                    <Input
                      id="inviter_name"
                      value={inviterName}
                      onChange={(e) => setInviterName(e.target.value)}
                      disabled={saving}
                      placeholder="Location or additional details..."
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                    />
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
                    <p className="text-emerald-100">Add context and details about this encounter</p>
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
                    placeholder="Add notes about this soul winning encounter..."
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/people/outreach/soul-winning/${id}`)}
                disabled={saving}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-lg"
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
                    <h2 className="text-2xl font-bold text-white">Soul Winning Overview</h2>
                    <p className="text-slate-300">Complete details about this encounter</p>
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
                              {soulWinning.contacts ? 
                                `${soulWinning.contacts.first_name} ${soulWinning.contacts.last_name}` : 
                                'Unknown Contact'
                              }
                            </p>
                            {soulWinning.contacts?.email && (
                              <p className="text-slate-600">{soulWinning.contacts.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decision Type */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Decision Type
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                          {soulWinning.inviter_type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Salvation Status */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-600" />
                        Salvation Status
                      </h3>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                        <Badge 
                          className={`text-white text-lg px-4 py-2 ${
                            soulWinning.saved ? 'bg-red-500' : 'bg-slate-500'
                          }`}
                        >
                          {soulWinning.saved ? '✓ Salvation Decision' : 'Other Decision'}
                        </Badge>
                      </div>
                    </div>

                    {/* Date Created */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-orange-600" />
                        Record Date
                      </h3>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                        <p className="text-slate-800 font-semibold text-lg">
                          {new Date(soulWinning.created_at).toLocaleDateString('en-US', {
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

                {/* Witness */}
                {soulWinning.inviter_contact_id && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                      Witnessed By
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                      <p className="text-slate-800 font-semibold">
                        {soulWinning.inviter_contact ? 
                          `${soulWinning.inviter_contact.first_name} ${soulWinning.inviter_contact.last_name}` : 
                          'Unknown Contact'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location/Details */}
                {soulWinning.inviter_name && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      Location/Details
                    </h3>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                      <p className="text-slate-700 leading-relaxed">
                        {soulWinning.inviter_name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {soulWinning.notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-600" />
                      Notes
                    </h3>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {soulWinning.notes}
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