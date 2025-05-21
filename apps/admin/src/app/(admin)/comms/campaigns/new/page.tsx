'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  X,
  Check,
  Users,
  Mail,
  MessageSquare,
  BellRing,
  Info,
  AlertTriangle,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { 
  createCampaign, 
  CreateCampaignParams 
} from '@/services/comms/campaigns'
import { 
  fetchTemplates, 
  CommsTemplate,
  fetchTemplatesByChannel
} from '@/services/comms/templates'
import { fetchContacts } from '@/services/contacts'
import { 
  createRecipientsBatch,
  CreateRecipientParams
} from '@/services/comms/recipients'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// Define the form schema using Zod
const formSchema = z.object({
  name: z.string().min(3, { message: 'Campaign name must be at least 3 characters' }),
  channel: z.enum(['email', 'sms', 'whatsapp', 'push']),
  template_id: z.string().min(1, { message: 'Please select a template' }),
  scheduled_at: z.date().optional(),
});

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [templates, setTemplates] = useState<CommsTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<CommsTemplate | null>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [contactsLoading, setContactsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredContacts, setFilteredContacts] = useState<any[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [previewMode, setPreviewMode] = useState<'template' | 'recipients'>('template')
  const [activeTabIndex, setActiveTabIndex] = useState(0)

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      channel: 'email',
      template_id: '',
    },
  })

  const { watch, setValue } = form
  const selectedChannel = watch('channel')
  const selectedTemplateId = watch('template_id')

  // Load templates and contacts
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load templates for the selected channel
        const { data, error } = await fetchTemplatesByChannel(selectedChannel)
        if (error) throw error
        setTemplates(data || [])
      } catch (error) {
        console.error('Failed to load templates:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load templates. Please try again.'
        })
      } finally {
        setTemplatesLoading(false)
        setLoading(false)
      }
    }

    loadData()
  }, [selectedChannel])

  // Load contacts
  useEffect(() => {
    async function loadContacts() {
      setContactsLoading(true)
      try {
        const { data, error } = await fetchContacts()
        if (error) throw error
        setContacts(data || [])
        setFilteredContacts(data || [])
      } catch (error) {
        console.error('Failed to load contacts:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load contacts. Please try again.'
        })
      } finally {
        setContactsLoading(false)
      }
    }

    loadContacts()
  }, [])

  // Filter contacts when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = contacts.filter(contact => 
      (contact.first_name?.toLowerCase() || '').includes(query) ||
      (contact.last_name?.toLowerCase() || '').includes(query) ||
      (contact.email?.toLowerCase() || '').includes(query) ||
      (contact.phone?.toLowerCase() || '').includes(query)
    )
    
    setFilteredContacts(filtered)
  }, [searchQuery, contacts])

  // Update selected template when template_id changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId) || null
      setSelectedTemplate(template)
    } else {
      setSelectedTemplate(null)
    }
  }, [selectedTemplateId, templates])

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (selectedContacts.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No recipients selected',
        description: 'Please select at least one recipient for your campaign.'
      })
      setActiveTabIndex(1) // Switch to recipients tab
      return
    }

    setCreatingCampaign(true)

    try {
      // Prepare campaign data
      const campaignData: CreateCampaignParams = {
        name: data.name,
        channel: data.channel,
        template_id: data.template_id,
      }

      if (data.scheduled_at) {
        campaignData.scheduled_at = data.scheduled_at.toISOString()
      }

      // Create campaign
      const { data: campaign, error } = await createCampaign(campaignData)
      
      if (error) throw error
      
      if (!campaign) {
        throw new Error('Failed to create campaign')
      }

      // Prepare recipients
      const recipients: CreateRecipientParams[] = Array.from(selectedContacts).map(contactId => {
        const contact = contacts.find(c => c.id === contactId)
        const address = data.channel === 'email' 
          ? contact?.email 
          : contact?.phone
        
        if (!address) {
          console.warn(`Contact ${contactId} doesn't have ${data.channel === 'email' ? 'an email' : 'a phone number'}`)
          return null
        }

        return {
          campaign_id: campaign.id,
          contact_id: contactId,
          to_address: address,
          variables: {
            first_name: contact?.first_name || '',
            last_name: contact?.last_name || '',
            full_name: `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim(),
            email: contact?.email || '',
            phone: contact?.phone || '',
          }
        }
      }).filter(Boolean) as CreateRecipientParams[]

      if (recipients.length === 0) {
        throw new Error('No valid recipients found')
      }

      // Add recipients to campaign
      const { error: recipientsError } = await createRecipientsBatch(recipients)
      
      if (recipientsError) throw recipientsError

      toast({
        title: 'Campaign created',
        description: `"${data.name}" has been created with ${recipients.length} recipients.`
      })

      // Redirect to campaign details page
      router.push(`/comms/campaigns/${campaign.id}`)
    } catch (error) {
      console.error('Failed to create campaign:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create campaign. Please try again.'
      })
    } finally {
      setCreatingCampaign(false)
    }
  }

  // Toggle contact selection
  const toggleContact = (contactId: string) => {
    const newSelectedContacts = new Set(selectedContacts)
    
    if (newSelectedContacts.has(contactId)) {
      newSelectedContacts.delete(contactId)
    } else {
      newSelectedContacts.add(contactId)
    }
    
    setSelectedContacts(newSelectedContacts)
  }

  // Select/deselect all filtered contacts
  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      // Deselect all currently filtered contacts
      const newSelectedContacts = new Set(selectedContacts)
      filteredContacts.forEach(contact => {
        newSelectedContacts.delete(contact.id)
      })
      setSelectedContacts(newSelectedContacts)
    } else {
      // Select all currently filtered contacts
      const newSelectedContacts = new Set(selectedContacts)
      filteredContacts.forEach(contact => {
        newSelectedContacts.add(contact.id)
      })
      setSelectedContacts(newSelectedContacts)
    }
  }

  // Helper to get channel icon
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'push':
        return <BellRing className="h-4 w-4" />
      default:
        return null
    }
  }

  // Check if contact has required field based on channel
  const contactHasRequiredField = (contact: any, channel: string) => {
    if (channel === 'email') {
      return !!contact.email
    } else {
      return !!contact.phone
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/comms/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Create New Campaign</h2>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTabIndex.toString()} onValueChange={(v) => setActiveTabIndex(parseInt(v))}>
            <TabsList className="mb-4">
              <TabsTrigger value="0">Campaign Details</TabsTrigger>
              <TabsTrigger value="1">Recipients</TabsTrigger>
              <TabsTrigger value="2">Preview</TabsTrigger>
            </TabsList>
            
            {/* Campaign Details Tab */}
            <TabsContent value="0">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Information</CardTitle>
                  <CardDescription>
                    Enter the basic information for your new campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your campaign a descriptive name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">
                              <div className="flex items-center">
                                <Mail className="mr-2 h-4 w-4" />
                                <span>Email</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="sms">
                              <div className="flex items-center">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>SMS</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                <span>WhatsApp</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="push">
                              <div className="flex items-center">
                                <BellRing className="mr-2 h-4 w-4" />
                                <span>Push Notification</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the communication channel for this campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templatesLoading ? (
                              <div className="flex justify-center items-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            ) : templates.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                <p>No templates found for {selectedChannel}</p>
                                <Button 
                                  variant="link" 
                                  asChild 
                                  className="p-0 h-auto mt-1"
                                >
                                  <Link href="/comms/templates/new">
                                    Create a template
                                  </Link>
                                </Button>
                              </div>
                            ) : (
                              templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the template to use for this campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="scheduled_at"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Schedule (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP 'at' p")
                                ) : (
                                  <span>Send immediately</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <Button 
                                variant="ghost" 
                                className="text-destructive" 
                                onClick={() => field.onChange(undefined)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Clear
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Schedule when to send the campaign (leave empty to send immediately)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/comms/campaigns">Cancel</Link>
                  </Button>
                  <Button type="button" onClick={() => setActiveTabIndex(1)}>
                    Next: Select Recipients
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Recipients Tab */}
            <TabsContent value="1">
              <Card>
                <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                  <CardDescription>
                    Choose who will receive this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={toggleSelectAll}
                    >
                      {selectedContacts.size === filteredContacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  
                  <div className="border rounded-md">
                    {contactsLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No contacts match your search</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]"></TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredContacts.map((contact) => {
                              const isSelected = selectedContacts.has(contact.id);
                              const hasRequiredField = contactHasRequiredField(contact, selectedChannel);
                              
                              return (
                                <TableRow key={contact.id}>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={`h-7 w-7 ${isSelected ? 'bg-primary' : 'bg-background'}`}
                                      onClick={() => hasRequiredField && toggleContact(contact.id)}
                                      disabled={!hasRequiredField}
                                    >
                                      {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    {contact.first_name} {contact.last_name}
                                  </TableCell>
                                  <TableCell>
                                    {contact.email || (
                                      <span className="text-muted-foreground italic">No email</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {contact.phone || (
                                      <span className="text-muted-foreground italic">No phone</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {hasRequiredField ? (
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Valid
                                      </Badge>
                                    ) : (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="outline" className="border-destructive text-destructive">
                                              Missing data
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>
                                              {selectedChannel === 'email' 
                                                ? 'Contact has no email address' 
                                                : 'Contact has no phone number'}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm">
                      {selectedContacts.size} contacts selected
                    </div>
                    {selectedChannel === 'email' && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Only contacts with email addresses can be selected
                      </div>
                    )}
                    {(selectedChannel === 'sms' || selectedChannel === 'whatsapp') && (
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Only contacts with phone numbers can be selected
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => setActiveTabIndex(0)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setActiveTabIndex(2)}>
                    Next: Preview
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Preview Tab */}
            <TabsContent value="2">
              <Card>
                <CardHeader>
                  <CardTitle>Preview Campaign</CardTitle>
                  <CardDescription>
                    Review your campaign before sending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Campaign Details</h3>
                      <dl className="grid grid-cols-[1fr_2fr] gap-2 text-sm">
                        <dt className="font-medium text-muted-foreground">Name:</dt>
                        <dd>{form.getValues().name}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Channel:</dt>
                        <dd className="flex items-center">
                          {getChannelIcon(form.getValues().channel)}
                          <span className="ml-1 capitalize">{form.getValues().channel}</span>
                        </dd>
                        
                        <dt className="font-medium text-muted-foreground">Template:</dt>
                        <dd>{selectedTemplate?.name || 'No template selected'}</dd>
                        
                        <dt className="font-medium text-muted-foreground">Schedule:</dt>
                        <dd>
                          {form.getValues().scheduled_at 
                            ? format(form.getValues().scheduled_at, "PPP 'at' p")
                            : 'Send immediately'}
                        </dd>
                        
                        <dt className="font-medium text-muted-foreground">Recipients:</dt>
                        <dd>{selectedContacts.size} contacts</dd>
                      </dl>
                    </div>
                    
                    <div>
                      <div className="flex space-x-2 mb-2">
                        <Button 
                          variant={previewMode === 'template' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setPreviewMode('template')}
                        >
                          Template Preview
                        </Button>
                        <Button 
                          variant={previewMode === 'recipients' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setPreviewMode('recipients')}
                        >
                          Recipients
                        </Button>
                      </div>
                      
                      {previewMode === 'template' ? (
                        <div className="border rounded-md p-4 h-[300px] overflow-auto">
                          {!selectedTemplate ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              No template selected
                            </div>
                          ) : (
                            <div>
                              {selectedTemplate.subject && (
                                <div className="mb-2 pb-2 border-b">
                                  <p className="font-medium text-sm">Subject:</p>
                                  <p>{selectedTemplate.subject}</p>
                                </div>
                              )}
                              <div className="whitespace-pre-wrap">
                                {selectedTemplate.body}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 h-[300px] overflow-auto">
                          {selectedContacts.size === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              No recipients selected
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="font-medium text-sm mb-2">Selected recipients:</p>
                              {Array.from(selectedContacts).slice(0, 30).map(contactId => {
                                const contact = contacts.find(c => c.id === contactId)
                                return (
                                  <div key={contactId} className="text-sm py-1 border-b">
                                    <p>
                                      {contact?.first_name} {contact?.last_name}
                                      {contact?.email && (
                                        <span className="text-muted-foreground ml-2">
                                          {contact.email}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )
                              })}
                              {selectedContacts.size > 30 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  ... and {selectedContacts.size - 30} more
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedContacts.size === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">No recipients selected</p>
                        <p className="text-sm text-amber-700">
                          You need to select at least one recipient before creating the campaign.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" type="button" onClick={() => setActiveTabIndex(1)}>
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={creatingCampaign || selectedContacts.size === 0}
                  >
                    {creatingCampaign ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Campaign...
                      </>
                    ) : 'Create Campaign'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  )
} 