'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, CalendarIcon, UserCheck, UserPlus, UserCog } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { 
  SoulWinning,
  fetchSoul, 
  updateSoul, 
  convertSoulToVisitor, 
  convertSoulToMember 
} from '@/services/soulWinning'
import { useContacts } from '@/hooks/useContacts'
import { useNextParams } from '@/lib/nextParams'

export default function SoulDetailPage({ params }: { params: { id: string } }) {
  // Safe way to handle params that works with both current and future Next.js
  const { id } = useNextParams(params)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === 'true'
  
  // States
  const [soul, setSoul] = useState<SoulWinning | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertingTo, setConvertingTo] = useState<'visitor' | 'member' | null>(null)
  
  // Form states
  const [saved, setSaved] = useState(false)
  const [inviterType, setInviterType] = useState('')
  const [inviterContactId, setInviterContactId] = useState('')
  const [inviterName, setInviterName] = useState('')
  const [notes, setNotes] = useState('')
  
  // Get contacts
  const { contacts, isLoading: contactsLoading } = useContacts()
  
  // Inviter types
  const inviterTypes = [
    'Friend',
    'Family',
    'Church Member',
    'Pastor/Staff',
    'Event',
    'Social Media',
    'Website',
    'Sign/Building',
    'Other'
  ]

  // Fetch soul winning data
  useEffect(() => {
    async function loadSoul() {
      try {
        setLoading(true)
        const { data, error } = await fetchSoul(id)
        
        if (error) throw error
        
        setSoul(data)
        
        // Set form fields
        if (data) {
          setSaved(data.saved)
          setInviterType(data.inviter_type)
          setInviterContactId(data.inviter_contact_id || '')
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
    
    loadSoul()
  }, [id])
  
  // Handle save
  const handleSave = async () => {
    if (!soul) return
    
    try {
      setSaving(true)
      
      const { error } = await updateSoul(id, {
        saved,
        inviter_type: inviterType,
        inviter_contact_id: inviterContactId || undefined,
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
      if (refreshedData) setSoul(refreshedData)
      
      // Exit edit mode
      router.push(`/people/outreach/soul-winning/${id}`)
    } catch (err) {
      console.error('Error updating soul winning:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update soul winning record'
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Handle conversion
  const handleConvert = async (convertTo: 'visitor' | 'member') => {
    try {
      setConverting(true)
      setConvertingTo(convertTo)
      
      let result;
      if (convertTo === 'visitor') {
        result = await convertSoulToVisitor(id)
      } else {
        result = await convertSoulToMember(id)
      }
      
      if (result.error) throw result.error
      
      toast({
        title: 'Success',
        description: `Contact successfully converted to ${convertTo}`
      })
      
      // Refresh data
      const { data: refreshedData } = await fetchSoul(id)
      if (refreshedData) setSoul(refreshedData)
    } catch (err) {
      console.error(`Error converting to ${convertTo}:`, err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to convert to ${convertTo}`
      })
    } finally {
      setConverting(false)
      setConvertingTo(null)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Get contact name
  const getContactName = (id: string) => {
    const contact = contacts.find(c => c.id === id)
    return contact 
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() 
      : 'Unknown Contact'
  }
  
  const isLoading = loading || contactsLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-4">
            <Link href="/people/outreach/soul-winning">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Soul Winning Record' : 'Soul Winning Record'}
          </h1>
        </div>
        
        {!isEditMode && soul && !soul.converted_to && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/people/outreach/soul-winning/${id}?edit=true`)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100"
              onClick={() => handleConvert('visitor')}
              disabled={converting}
            >
              {converting && convertingTo === 'visitor' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCog className="mr-2 h-4 w-4" />
              )}
              Convert to Visitor
            </Button>
            <Button
              variant="outline"
              className="bg-purple-50 text-purple-700 hover:bg-purple-100"
              onClick={() => handleConvert('member')}
              disabled={converting}
            >
              {converting && convertingTo === 'member' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              Convert to Member
            </Button>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading soul winning record...</span>
        </div>
      ) : soul ? (
        isEditMode ? (
          // Edit Form
          <Card>
            <CardHeader>
              <CardTitle>Edit Soul Winning Record</CardTitle>
              <CardDescription>
                Update information about this soul winning record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <div className="font-medium">
                    {soul.contacts ? `${soul.contacts.first_name || ''} ${soul.contacts.last_name || ''}`.trim() : 'Unknown'}
                    {soul.contacts?.email && ` - ${soul.contacts.email}`}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="saved" 
                      checked={saved}
                      onCheckedChange={(checked: boolean) => setSaved(checked)}
                      disabled={saving}
                    />
                    <Label htmlFor="saved" className="font-medium">
                      Made salvation decision
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground pl-6">
                    Check this if the person made a decision to accept Christ
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inviter_type">How did they come to church?</Label>
                  <Select 
                    value={inviterType}
                    onValueChange={setInviterType}
                    disabled={saving}
                  >
                    <SelectTrigger id="inviter_type">
                      <SelectValue placeholder="Select inviter type" />
                    </SelectTrigger>
                    <SelectContent>
                      {inviterTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {inviterType === 'Friend' || inviterType === 'Church Member' || inviterType === 'Family' ? (
                  <div className="space-y-2">
                    <Label htmlFor="inviter_contact">Who invited them? (Optional)</Label>
                    <Select 
                      value={inviterContactId}
                      onValueChange={setInviterContactId}
                      disabled={saving}
                    >
                      <SelectTrigger id="inviter_contact">
                        <SelectValue placeholder="Select inviter (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {`${contact.first_name || ''} ${contact.last_name || ''}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="inviter_name">Inviter/Source Name (Optional)</Label>
                    <Input 
                      id="inviter_name"
                      value={inviterName}
                      onChange={(e) => setInviterName(e.target.value)}
                      disabled={saving}
                      placeholder="Name of person or event that invited them"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={saving}
                    placeholder="Any additional notes or context"
                    className="resize-none h-24"
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/people/outreach/soul-winning/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
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
            </CardFooter>
          </Card>
        ) : (
          // View Mode
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Soul Winning Details</span>
                {soul.converted_to && (
                  <Badge 
                    className={
                      soul.converted_to === 'visitor'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' 
                        : 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                    }
                  >
                    Converted to {soul.converted_to}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Recorded on {formatDate(soul.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                <p className="font-medium">
                  {soul.contacts ? `${soul.contacts.first_name || ''} ${soul.contacts.last_name || ''}`.trim() : 'Unknown'}
                </p>
                {soul.contacts?.email && (
                  <p className="text-sm">{soul.contacts.email}</p>
                )}
                {soul.contacts?.phone && (
                  <p className="text-sm">{soul.contacts.phone}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">Salvation Status</h3>
                <Badge 
                  variant={soul.saved ? 'default' : 'secondary'}
                  className={
                    soul.saved 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                  }
                >
                  {soul.saved ? 'Saved' : 'Not Saved'}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-muted-foreground">How They Came to Church</h3>
                <p>{soul.inviter_type}</p>
              </div>
              
              {soul.inviter_contact_id ? (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Invited By</h3>
                  <p>{soul.inviter_contact ? `${soul.inviter_contact.first_name || ''} ${soul.inviter_contact.last_name || ''}`.trim() : 'Unknown Contact'}</p>
                </div>
              ) : soul.inviter_name ? (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Inviter/Source</h3>
                  <p>{soul.inviter_name}</p>
                </div>
              ) : null}
              
              {soul.notes && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="whitespace-pre-wrap">{soul.notes}</p>
                </div>
              )}
              
              {soul.converted_to && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground">Conversion Details</h3>
                  <p>Converted to {soul.converted_to} on {soul.converted_at ? formatDate(soul.converted_at) : 'unknown date'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">Record not found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The soul winning record you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild className="mt-4">
            <Link href="/people/outreach/soul-winning">
              Back to Soul Winning
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
} 