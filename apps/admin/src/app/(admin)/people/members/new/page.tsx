'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Search, X, Check, Loader2, Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { createMembers, createMember, getContactsNotMembers } from '@/services/members'
import { 
  fetchCustomFields, 
  saveCustomFieldValues,
  type CustomField 
} from '@/services/settings'
import { CustomFieldInput } from '@/components/ui/custom-fields'
import type { Contact } from '@/lib/supabase'

export default function NewMemberPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [joinedAt, setJoinedAt] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false)
  
  const [showContactSearch, setShowContactSearch] = useState(false)

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data, error } = await getContactsNotMembers()
        if (error) {
          console.error('Error loading contacts:', error)
          toast({
            title: "Error",
            description: "Failed to load available contacts",
            variant: "destructive",
          })
        } else {
          setContacts((data || []) as Contact[])
        }
      } catch (error) {
        console.error('Error loading contacts:', error)
        toast({
          title: "Error",
          description: "Failed to load available contacts",
          variant: "destructive",
        })
      }
    }

    const loadCustomFields = async () => {
      try {
        setCustomFieldsLoading(true)
        const { success, data, error } = await fetchCustomFields('members')
        
        if (success && data) {
          const visibleFields = data.filter(field => field.visible)
          setCustomFields(visibleFields)
        } else {
          console.error('Error loading custom fields:', error)
        }
      } catch (error) {
        console.error('Error loading custom fields:', error)
      } finally {
        setCustomFieldsLoading(false)
      }
    }

    loadContacts()
    loadCustomFields()
  }, [])

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase()
    return (
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query)
    )
  })

  const handleContactToggle = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id)
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id)
      } else {
        return [...prev, contact]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts)
    }
  }

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(prev => prev.filter(c => c.id !== contactId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedContacts.length === 0) {
      toast({
        title: "Contacts Required",
        description: "Please select at least one contact to add as members",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const memberData = selectedContacts.map(contact => ({
        contact_id: contact.id,
        joined_at: joinedAt,
        notes: notes || undefined,
      }))

      const result = await createMembers(memberData)

      // Save custom field values for successfully created members
      if (result.successful.length > 0 && Object.keys(customFieldValues).length > 0) {
        for (const successfulMember of result.successful) {
          try {
            await saveCustomFieldValues('members', successfulMember.contact_id, customFieldValues)
          } catch (customFieldError) {
            console.warn('Failed to save custom fields for member:', successfulMember.contact_id, customFieldError)
          }
        }
      }

      // Trigger welcome workflows for successfully created members
      if (result.successful.length > 0) {
        for (const successfulMember of result.successful) {
          try {
            console.log('Triggering welcome workflow for:', successfulMember.contact_id)
            
            const workflowResponse = await fetch('/api/trigger-workflow', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'new_member',
                contactId: successfulMember.contact_id
              }),
            })

            const workflowResult = await workflowResponse.json()
            
            if (workflowResult.success) {
              console.log('Welcome workflow triggered successfully for:', successfulMember.contact_id)
            } else {
              console.warn('Failed to trigger welcome workflow for:', successfulMember.contact_id, workflowResult.error)
            }
          } catch (workflowError) {
            console.warn('Error triggering welcome workflow for:', successfulMember.contact_id, workflowError)
            // Don't fail the whole process if workflow trigger fails
          }
        }

        const message = result.failed.length > 0 
          ? `${result.successful.length} members added successfully, ${result.failed.length} failed`
          : `${result.successful.length} member${result.successful.length > 1 ? 's' : ''} added successfully`
        
        toast({
          title: "Success",
          description: `${message}. Welcome emails will be sent automatically.`,
        })
      }

      if (result.failed.length > 0) {
        console.error('Failed member creations:', result.failed)
        toast({
          title: "Some Members Failed",
          description: `${result.failed.length} member${result.failed.length > 1 ? 's' : ''} could not be added`,
          variant: "destructive",
        })
      }

      if (result.successful.length > 0) {
        router.push('/people/members')
      }
    } catch (error) {
      console.error('Error creating members:', error)
      toast({
        title: "Error",
        description: "Failed to create members",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-2xl">
                <UserPlus className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200" style={{ color: 'rgb(15, 23, 42)' }}>Add New Members</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2" style={{ color: 'rgb(15, 23, 42)' }}>Convert existing contacts to members - select multiple contacts at once</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200" style={{ color: 'rgb(15, 23, 42)' }}>Select Contacts</h3>
                <div className="flex items-center gap-3">
                  {selectedContacts.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>
                      <Users className="h-4 w-4" />
                      {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm" className="border-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50 rounded-xl">
                    <Link href="/people/contacts/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Contact
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Selected Contacts Display */}
              {selectedContacts.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h4 className="font-medium text-slate-800 mb-3" style={{ color: 'rgb(15, 23, 42)' }}>Selected Contacts:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedContacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
                              {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                            </div>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>
                              {contact.first_name} {contact.last_name}
                            </p>
                            <p className="text-xs text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>{contact.email}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveContact(contact.id)}
                          className="text-slate-500 hover:text-slate-700 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Search */}
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactSearch(!showContactSearch)}
                  className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors"
                >
                  <Search className="mr-2 h-4 w-4" />
                  {showContactSearch ? 'Hide Contact Search' : 'Search and Select Contacts'}
                </Button>

                {showContactSearch && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                    <div className="mb-4">
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 text-slate-900 dark:text-slate-100"
                        style={{ color: 'rgb(15, 23, 42)' }}
                      />
                    </div>

                    {filteredContacts.length > 0 && (
                      <div className="mb-4 flex justify-between items-center">
                        <span className="text-sm text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>
                          {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''} found
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                          className="h-8"
                        >
                          {selectedContacts.length === filteredContacts.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                    )}
                    
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => {
                          const isSelected = selectedContacts.some(c => c.id === contact.id)
                          return (
                            <div
                              key={contact.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-emerald-100 border border-emerald-300' 
                                  : 'bg-white hover:bg-slate-50'
                              }`}
                              onClick={() => handleContactToggle(contact)}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-emerald-500 border-emerald-500' 
                                  : 'border-slate-300'
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <Avatar className="h-10 w-10">
                                <div className="h-full w-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                                  {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
                                </div>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-slate-800 dark:text-slate-200" style={{ color: 'rgb(15, 23, 42)' }}>
                                  {contact.first_name} {contact.last_name}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400" style={{ color: 'rgb(15, 23, 42)' }}>{contact.email}</p>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8">
                          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-slate-500" />
                          </div>
                          <p className="text-slate-600 font-medium mb-2" style={{ color: 'rgb(15, 23, 42)' }}>
                            {searchQuery ? 'No contacts found matching your search' : 'No available contacts found'}
                          </p>
                          {!searchQuery && (
                            <p className="text-sm text-slate-500" style={{ color: 'rgb(15, 23, 42)' }}>
                              All contacts may already be members. Create new contacts first if needed.
                            </p>
                          )}
                          {!searchQuery && (
                            <Button asChild className="mt-4" variant="outline">
                              <Link href="/people/contacts/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Contact
                              </Link>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Member Details */}
            <div className="space-y-6 border-t border-slate-200 pt-8">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200" style={{ color: 'rgb(15, 23, 42)' }}>Member Details</h3>
              <p className="text-sm text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>These details will be applied to all selected contacts</p>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="joined_at" className="text-slate-700 dark:text-slate-300 font-medium">Joined Date</Label>
                  <Input
                    id="joined_at"
                    type="date"
                    value={joinedAt}
                    onChange={(e) => setJoinedAt(e.target.value)}
                    className="h-12 border-2 border-slate-200 rounded-xl focus:border-emerald-500 transition-colors text-slate-900 dark:text-slate-100"
                    style={{ color: 'rgb(15, 23, 42)' }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 font-medium">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about these members..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] border-2 border-slate-200 rounded-xl focus:border-emerald-500 transition-colors resize-none text-slate-900 dark:text-slate-100"
                  style={{ color: 'rgb(15, 23, 42)' }}
                />
              </div>
              
              {/* Custom Fields Section */}
              {customFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-md font-semibold text-slate-800" style={{ color: 'rgb(15, 23, 42)' }}>Additional Information</h4>
                  <p className="text-sm text-slate-600" style={{ color: 'rgb(15, 23, 42)' }}>These fields will be applied to all selected members</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {customFields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-slate-700 font-medium">
                          {field.field_label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <CustomFieldInput
                          field={field}
                          value={customFieldValues[field.field_name] || ''}
                          onChange={(value) => setCustomFieldValues(prev => ({
                            ...prev,
                            [field.field_name]: value
                          }))}
                          disabled={loading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/people/members')}
                className="rounded-xl px-6 h-12"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || selectedContacts.length === 0}
                className="rounded-xl px-6 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding {selectedContacts.length} Member{selectedContacts.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add {selectedContacts.length} Member{selectedContacts.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 