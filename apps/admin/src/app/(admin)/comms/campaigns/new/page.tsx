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
  Search,
  Plus,
  Send,
  Sparkles
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
  createCommsCampaign, 
  CreateCampaignParams 
} from '@/services/comms/campaigns'
import { 
  fetchTemplates, 
  CommsTemplate,
  fetchTemplatesByChannel
} from '@/services/comms/templates'
import { fetchContacts } from '@/services/contacts'
import { 
  createCommsRecipients,
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
  const [activeTab, setActiveTab] = useState('0')

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Enable validation on change
    defaultValues: {
      name: '',
      channel: 'email',
      template_id: '',
    },
  })

  const { watch, setValue } = form
  const selectedChannel = watch('channel')
  const selectedTemplateId = watch('template_id')

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('🚀 onSubmit called with data:', data)
    console.log('📧 Selected contacts:', selectedContacts.size)
    console.log('📊 Form values:', form.getValues())
    
    // For push notifications, we don't need contact selection (targets all mobile app users)
    if (data.channel !== 'push' && selectedContacts.size === 0) {
      console.log('❌ No recipients selected')
      toast({
        variant: 'destructive',
        title: 'No recipients selected',
        description: 'Please select at least one recipient for your campaign.'
      })
      setActiveTab('1') // Switch to recipients tab
      return
    }

    console.log('✅ Validation passed, creating campaign...')
    setCreatingCampaign(true)

    try {
      console.log('📡 Calling createCommsCampaign with:', {
        name: data.name,
        channel: data.channel,
        template_id: data.template_id,
        scheduled_at: data.scheduled_at ? data.scheduled_at.toISOString() : null
      })
      
      // Create campaign
      const { data: newCampaign, error: campaignError } = await createCommsCampaign({
        name: data.name,
        channel: data.channel,
        template_id: data.template_id,
        scheduled_at: data.scheduled_at ? data.scheduled_at.toISOString() : null
      })
      
      console.log('📡 createCommsCampaign result:', { newCampaign, campaignError })
      
      if (campaignError) {
        console.error('❌ Campaign creation error:', campaignError);
        throw campaignError;
      }
      
      if (!newCampaign) {
        console.error('❌ No campaign returned')
        throw new Error('Failed to create campaign')
      }

      console.log('✅ Campaign created successfully:', newCampaign)

      // For push notifications, skip recipient creation (handled by dispatch function)
      if (data.channel === 'push') {
        console.log('📱 Push notification campaign - skipping recipient creation')
        
        toast({
          title: 'Push Campaign created',
          description: `"${data.name}" has been created and will target all mobile app users.`
        })

        console.log('🔄 Redirecting to campaign details page...')
        router.push(`/comms/campaigns/${newCampaign.id}`)
        return
      }

      // For other channels, prepare recipients from selected contacts
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
          campaign_id: newCampaign.id,
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

      console.log('📝 Prepared recipients:', recipients.length, recipients)

      if (recipients.length === 0) {
        console.error('❌ No valid recipients found')
        throw new Error('No valid recipients found')
      }

      console.log('📡 Adding recipients to campaign...')
      // Add recipients to campaign
      const { error: recipientsError } = await createCommsRecipients(recipients)
      
      console.log('📡 createCommsRecipients result:', { recipientsError })
      
      if (recipientsError) throw recipientsError

      console.log('✅ Campaign and recipients created successfully!')
      
      toast({
        title: 'Campaign created',
        description: `"${data.name}" has been created with ${recipients.length} recipients.`
      })

      console.log('🔄 Redirecting to campaign details page...')
      // Redirect to campaign details page
      router.push(`/comms/campaigns/${newCampaign.id}`)
    } catch (error) {
      console.error('💥 Failed to create campaign:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create campaign. Please try again.'
      })
    } finally {
      console.log('🏁 Setting creatingCampaign to false')
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
    // No automatic form submission after contact selection
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
        if (contactHasRequiredField(contact, selectedChannel)) {
          newSelectedContacts.add(contact.id)
        }
      })
      setSelectedContacts(newSelectedContacts)
    }
    // No automatic form submission after bulk selection
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
  
  // Test button for debugging (temporary)
  const DebugButton = () => (
    <Button 
      type="button"
      onClick={() => {
        console.log('=== DEBUG BUTTON CLICKED ===')
        console.log('Current tab:', activeTab)
        console.log('Form values:', form.getValues())
        console.log('Selected contacts:', selectedContacts.size)
        console.log('Form validity:', form.formState.isValid)
        console.log('Form errors:', form.formState.errors)
        
        // Try manual submission
        if (form.formState.isValid && selectedContacts.size > 0) {
          console.log('Attempting manual submission...')
          onSubmit(form.getValues())
        } else {
          console.log('Cannot submit - form invalid or no contacts selected')
        }
      }}
      className="bg-red-500 hover:bg-red-600 text-white mb-4"
    >
      🐛 DEBUG: Test Form Submit
    </Button>
  )

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
      
      // Do not automatically create a campaign when template is selected
      // Only create when user explicitly submits the form
    } else {
      setSelectedTemplate(null)
    }
  }, [selectedTemplateId, templates])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/comms/campaigns">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-2xl">
                  <Send className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Create New Campaign
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  Create and send communications to your congregation
                </p>
              </div>
            </div>
          </div>
        </div>
      
        <Form {...form}>
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Campaign Setup</h2>
                    <p className="text-slate-300">Configure your campaign settings and recipients</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100/50 p-1 rounded-xl">
                    <TabsTrigger value="0" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${parseInt(activeTab) >= 0 ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                          1
                        </div>
                        <span>Campaign Details</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="1" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${parseInt(activeTab) >= 1 ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                          2
                        </div>
                        <span>Recipients</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger value="2" className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${parseInt(activeTab) >= 2 ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                          3
                        </div>
                        <span>Preview</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Campaign Details Tab */}
                  <TabsContent value="0">
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold text-slate-700">Campaign Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter campaign name" 
                                  {...field} 
                                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                              </FormControl>
                              <FormDescription className="text-slate-500">
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
                              <FormLabel className="text-base font-semibold text-slate-700">Channel</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500">
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
                              <FormDescription className="text-slate-500">
                                Select the communication channel for this campaign
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="template_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-slate-700">Template</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500">
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
                            <FormDescription className="text-slate-500">
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
                            <FormLabel className="text-base font-semibold text-slate-700">Schedule (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 hover:bg-white/80 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                              <PopoverContent className="w-auto p-0">
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
                            <FormDescription className="text-slate-500">
                              Schedule when to send the campaign (leave empty to send immediately)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-6 border-t border-slate-200">
                        <Button variant="outline" type="button" asChild className="rounded-xl px-8 py-3">
                          <Link href="/comms/campaigns">Cancel</Link>
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab('1')}
                          className="rounded-xl px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                        >
                          Next: Select Recipients
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Recipients Tab */}
                  <TabsContent value="1">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-blue-800">
                            {selectedChannel === 'push' ? 'Push Notification Recipients' : 'Select Recipients'}
                          </h3>
                          <p className="text-blue-600">
                            {selectedChannel === 'push' 
                              ? 'This campaign will target all mobile app users with push notifications enabled'
                              : 'Choose who will receive this campaign'
                            }
                          </p>
                        </div>
                      </div>

                      {selectedChannel === 'push' ? (
                        // Push notification info
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <BellRing className="h-6 w-6 text-purple-600" />
                              <h4 className="text-lg font-semibold text-purple-800">Mobile App Users</h4>
                            </div>
                            <p className="text-purple-700 mb-4">
                              Push notifications are automatically sent to all users who have:
                            </p>
                            <ul className="space-y-2 text-purple-700">
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                Downloaded and logged into the mobile app
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                Enabled push notifications in their device settings
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-600" />
                                Have notification preferences enabled for this type of message
                              </li>
                            </ul>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800">Automatic Targeting</span>
                            </div>
                            <p className="text-blue-700 text-sm">
                              You don't need to select individual recipients for push notifications. 
                              The system will automatically determine which users should receive the notification 
                              based on their app usage and notification preferences.
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Regular contact selection
                        <>
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search contacts..."
                                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-indigo-500 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                            <Button 
                              variant="outline" 
                              onClick={toggleSelectAll}
                              className="h-12 px-6 rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80"
                            >
                              {selectedContacts.size === filteredContacts.length ? 'Deselect All' : 'Select All'}
                            </Button>
                          </div>
                          
                          <div className="border-2 border-slate-200 rounded-xl bg-white/50 overflow-hidden">
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
                                  <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
                                    <TableRow>
                                      <TableHead className="w-[50px] py-4 font-bold text-slate-700"></TableHead>
                                      <TableHead className="py-4 font-bold text-slate-700">Name</TableHead>
                                      <TableHead className="py-4 font-bold text-slate-700">Email</TableHead>
                                      <TableHead className="py-4 font-bold text-slate-700">Phone</TableHead>
                                      <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {filteredContacts.map((contact) => {
                                      const isSelected = selectedContacts.has(contact.id);
                                      const hasRequiredField = contactHasRequiredField(contact, selectedChannel);
                                      
                                      return (
                                        <TableRow 
                                          key={contact.id}
                                          onClick={(e) => {
                                            // Prevent default behavior that might trigger form submission
                                            e.preventDefault();
                                            if (hasRequiredField) {
                                              toggleContact(contact.id);
                                            }
                                          }}
                                          className={`${hasRequiredField ? "cursor-pointer hover:bg-slate-50/80" : ""} transition-colors`}
                                        >
                                          <TableCell className="py-4">
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className={`h-7 w-7 ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'bg-background'}`}
                                              onClick={(e) => {
                                                // Stop event propagation to prevent double toggling
                                                e.stopPropagation();
                                                if (hasRequiredField) {
                                                  toggleContact(contact.id);
                                                }
                                              }}
                                              disabled={!hasRequiredField}
                                              type="button"
                                            >
                                              {isSelected && <Check className="h-4 w-4 text-white" />}
                                            </Button>
                                          </TableCell>
                                          <TableCell className="py-4 font-semibold text-slate-800">
                                            {contact.first_name} {contact.last_name}
                                          </TableCell>
                                          <TableCell className="py-4">
                                            {contact.email || (
                                              <span className="text-muted-foreground italic">No email</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="py-4">
                                            {contact.phone || (
                                              <span className="text-muted-foreground italic">No phone</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="py-4">
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
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-semibold text-slate-700">
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
                          </div>
                        </>
                      )}

                      <div className="flex justify-between pt-6 border-t border-slate-200">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={() => setActiveTab('0')}
                          className="rounded-xl px-8 py-3"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab('2')}
                          className="rounded-xl px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                        >
                          Next: Preview
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Preview Tab */}
                  <TabsContent value="2">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-purple-800">Preview Campaign</h3>
                          <p className="text-purple-600">Review your campaign before sending</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-slate-800 mb-4">Campaign Details</h3>
                          <dl className="space-y-4">
                            <div className="flex justify-between">
                              <dt className="font-medium text-slate-600">Name:</dt>
                              <dd className="text-slate-800 font-semibold">{form.getValues().name}</dd>
                            </div>
                            
                            <div className="flex justify-between">
                              <dt className="font-medium text-slate-600">Channel:</dt>
                              <dd className="flex items-center text-slate-800 font-semibold">
                                {getChannelIcon(form.getValues().channel)}
                                <span className="ml-1 capitalize">{form.getValues().channel}</span>
                              </dd>
                            </div>
                            
                            <div className="flex justify-between">
                              <dt className="font-medium text-slate-600">Template:</dt>
                              <dd className="text-slate-800 font-semibold">{selectedTemplate?.name || 'No template selected'}</dd>
                            </div>
                            
                            <div className="flex justify-between">
                              <dt className="font-medium text-slate-600">Schedule:</dt>
                              <dd className="text-slate-800 font-semibold">
                                {form.getValues().scheduled_at 
                                  ? format(form.getValues().scheduled_at as Date, "PPP 'at' p")
                                  : 'Send immediately'}
                              </dd>
                            </div>
                            
                            <div className="flex justify-between">
                              <dt className="font-medium text-slate-600">Recipients:</dt>
                              <dd className="text-slate-800 font-semibold">
                                {selectedChannel === 'push' 
                                  ? 'All mobile app users' 
                                  : `${selectedContacts.size} contacts`
                                }
                              </dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex space-x-2 mb-4">
                            <Button 
                              variant={previewMode === 'template' ? 'default' : 'outline'} 
                              size="sm"
                              onClick={() => setPreviewMode('template')}
                              className="rounded-lg"
                            >
                              Template Preview
                            </Button>
                            <Button 
                              variant={previewMode === 'recipients' ? 'default' : 'outline'} 
                              size="sm"
                              onClick={() => setPreviewMode('recipients')}
                              className="rounded-lg"
                            >
                              Recipients
                            </Button>
                          </div>
                          
                          {previewMode === 'template' ? (
                            <div className="border-2 border-slate-200 rounded-xl p-4 h-[300px] overflow-auto bg-white/50">
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
                            <div className="border-2 border-slate-200 rounded-xl p-4 h-[300px] overflow-auto bg-white/50">
                              {selectedChannel === 'push' ? (
                                <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
                                  <BellRing className="h-12 w-12 text-purple-500" />
                                  <div>
                                    <p className="font-medium text-slate-800 mb-2">Mobile App Users</p>
                                    <p className="text-sm text-muted-foreground">
                                      This push notification will be sent to all users who have the mobile app installed 
                                      and have enabled push notifications.
                                    </p>
                                  </div>
                                </div>
                              ) : selectedContacts.size === 0 ? (
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
                      
                      {selectedContacts.size === 0 && selectedChannel !== 'push' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800">No recipients selected</p>
                            <p className="text-sm text-amber-700">
                              You need to select at least one recipient before creating the campaign.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-6 border-t border-slate-200">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={() => setActiveTab('1')}
                          className="rounded-xl px-8 py-3"
                        >
                          Back
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            disabled={creatingCampaign}
                            onClick={async () => {
                              console.log('🔘 Create Campaign button clicked!')
                              
                              // For non-push campaigns, check if contacts are selected first
                              if (selectedChannel !== 'push' && selectedContacts.size === 0) {
                                console.log('❌ No contacts selected for non-push campaign')
                                toast({
                                  variant: 'destructive',
                                  title: 'No recipients selected',
                                  description: 'Please select at least one recipient for your campaign.'
                                })
                                return
                              }
                              
                              // Use handleSubmit to properly validate and submit
                              form.handleSubmit(onSubmit, (errors) => {
                                console.log('❌ Form validation failed:', errors)
                                
                                // Get specific error messages
                                const errorMessages = []
                                if (errors.name) {
                                  errorMessages.push(`Campaign name: ${errors.name.message}`)
                                }
                                if (errors.template_id) {
                                  errorMessages.push(`Template: ${errors.template_id.message}`)
                                }
                                
                                const description = errorMessages.length > 0 
                                  ? errorMessages.join('. ') 
                                  : 'Please check all required fields are filled correctly.'
                                
                                toast({
                                  variant: 'destructive',
                                  title: 'Form validation failed',
                                  description: description
                                })
                                
                                // Focus on first error field
                                if (errors.name) {
                                  setActiveTab('0') // Go to first tab
                                }
                              })()
                            }}
                            className="rounded-xl px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                          >
                            {creatingCampaign ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Campaign...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Create Campaign
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
        </Form>
      </div>
    </div>
  )
} 