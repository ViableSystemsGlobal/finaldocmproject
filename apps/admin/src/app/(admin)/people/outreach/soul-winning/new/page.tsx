'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { createSoul } from '@/services/soulWinning'
import { supabase } from '@/lib/supabase'

export default function NewSoulPage() {
  const router = useRouter()
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedStatus, setSavedStatus] = useState(false)
  const [inviterType, setInviterType] = useState('')
  const [inviterName, setInviterName] = useState('')
  const [notes, setNotes] = useState('')
  const [isContactsLoading, setIsContactsLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [inviterContactId, setInviterContactId] = useState('')
  
  // Form for new contact
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [activeTab, setActiveTab] = useState('existing')
  
  // Load contacts
  const loadContacts = async () => {
    try {
      setIsContactsLoading(true)
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .order('last_name')
      
      if (error) throw error
      
      setContacts(data || [])
    } catch (err) {
      console.error('Error loading contacts:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contacts'
      })
    } finally {
      setIsContactsLoading(false)
    }
  }
  
  // Load contacts on mount
  useEffect(() => {
    loadContacts()
  }, [])
  
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      let contactId = selectedContactId
      
      // If creating a new contact, do that first
      if (activeTab === 'new') {
        if (!firstName || !lastName) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'First and last name are required'
          })
          return
        }
        
        // Create contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email || null,
            phone: phone || null,
            lifecycle: 'prospect', // New contacts from soul winning are prospects
            tenant_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Default tenant ID
          })
          .select()
        
        if (contactError) {
          console.error('Error creating contact:', contactError);
          console.error('Error code:', contactError.code);
          console.error('Error details:', contactError.details);
          throw contactError;
        }
        
        contactId = newContact?.[0]?.id
        
        if (!contactId) {
          throw new Error('Failed to create contact')
        }
      } else if (!contactId) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select a contact'
        })
        return
      }
      
      // Create soul winning record
      const { error } = await createSoul({
        contact_id: contactId,
        saved: savedStatus,
        inviter_type: inviterType,
        inviter_contact_id: inviterContactId || undefined,
        inviter_name: inviterName || undefined,
        notes: notes || undefined
      })
      
      if (error) {
        console.error('Error creating soul winning record:', error);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Soul winning record created successfully'
      })
      
      // Navigate back to soul winning list
      router.push('/people/outreach/soul-winning')
      router.refresh()
    } catch (err) {
      console.error('Error creating soul winning record:', err)
      
      // Create a more specific error message
      let errorMessage = 'Failed to create soul winning record';
      
      if (err instanceof Error) {
        if (err.message.includes('tenant_id')) {
          errorMessage = 'Failed to create contact: Missing tenant ID';
        } else if (err.message.includes('violates unique constraint')) {
          errorMessage = 'This email or phone may already exist in the system';
        } else if (err.message) {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      // Check for Supabase PostgreSQL error format
      const pgError = err as any;
      if (pgError.code === '23502' && pgError.message?.includes('tenant_id')) {
        errorMessage = 'Failed to create contact: Missing tenant ID';
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link href="/people/outreach/soul-winning">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Soul Winning Record</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create Soul Winning Record</CardTitle>
          <CardDescription>
            Record information about a new visitor or salvation decision
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isContactsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading contacts...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="existing" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Existing Contact</TabsTrigger>
                  <TabsTrigger value="new">New Contact</TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Select Contact</Label>
                    <Select 
                      onValueChange={setSelectedContactId}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="contact">
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
                    <p className="text-sm text-muted-foreground">
                      The person who is being recorded for soul winning
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="new" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input 
                        id="first_name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input 
                        id="last_name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)} 
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-2 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="saved" 
                    checked={savedStatus}
                    onCheckedChange={(checked: boolean) => setSavedStatus(checked)}
                    disabled={isSubmitting}
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
                  onValueChange={setInviterType}
                  disabled={isSubmitting}
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
                <p className="text-sm text-muted-foreground">
                  How did this person hear about or get invited to the church
                </p>
              </div>
              
              {inviterType === 'Friend' || inviterType === 'Church Member' || inviterType === 'Family' ? (
                <div className="space-y-2">
                  <Label htmlFor="inviter_contact">Who invited them? (Optional)</Label>
                  <Select 
                    onValueChange={setInviterContactId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="inviter_contact">
                      <SelectValue placeholder="Select inviter (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
                    disabled={isSubmitting}
                    placeholder="Name of person or event that invited them"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Any additional information or context"
                  className="resize-none h-24"
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/people/outreach/soul-winning')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Record
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 