'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Mail, 
  MessageCircle, 
  Bell,
  Edit, 
  ArrowLeft,
  Loader2,
  Save,
  RotateCcw
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  fetchCommsDefaults, 
  updateCommsDefault,
  type CommsDefault 
} from '@/services/settings'

const templateSchema = z.object({
  subject: z.string().optional(),
  body: z.string().min(1, 'Template body is required'),
})

type TemplateFormData = z.infer<typeof templateSchema>

const channelIcons = {
  email: Mail,
  sms: MessageCircle,
  whatsapp: MessageSquare,
  push: Bell,
}

const channelColors = {
  email: 'from-blue-500 to-indigo-600',
  sms: 'from-green-500 to-emerald-600',
  whatsapp: 'from-emerald-500 to-teal-600',
  push: 'from-purple-500 to-violet-600',
}

const defaultTemplates = {
  welcome_member: {
    email: {
      subject: 'Welcome to {{ church_name }}!',
      body: 'Dear {{ first_name }},\n\nWelcome to our church family! We are excited to have you join us.\n\nBlessings,\n{{ church_name }} Team'
    },
    sms: {
      body: 'Welcome {{ first_name }}! Thanks for joining {{ church_name }}. We\'re excited to have you in our church family!'
    }
  },
  birthday_reminder: {
    email: {
      subject: 'Happy Birthday {{ first_name }}!',
      body: 'Happy Birthday {{ first_name }}!\n\nWishing you a wonderful day filled with God\'s blessings.\n\nBlessings,\n{{ church_name }}'
    },
    sms: {
      body: 'Happy Birthday {{ first_name }}! 🎉 Wishing you God\'s blessings on your special day!'
    }
  },
  follow_up_visitor: {
    email: {
      subject: 'Thank you for visiting {{ church_name }}',
      body: 'Hi {{ first_name }},\n\nThank you for visiting us! We hope you felt welcomed and would love to see you again.\n\nBlessings,\n{{ church_name }}'
    },
    sms: {
      body: 'Hi {{ first_name }}, thanks for visiting {{ church_name }}! We hope to see you again soon.'
    }
  },
  event_reminder: {
    email: {
      subject: 'Reminder: {{ event_name }}',
      body: 'Hi {{ first_name }},\n\nThis is a reminder about {{ event_name }} tomorrow at {{ event_time }}.\n\nSee you there!\n{{ church_name }}'
    },
    sms: {
      body: 'Hi {{ first_name }}, reminder about {{ event_name }} tomorrow at {{ event_time }}. See you there!'
    }
  }
}

export default function CommsDefaultsPage() {
  const [templates, setTemplates] = useState<CommsDefault[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    template: CommsDefault | null
  }>({ open: false, template: null })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      subject: '',
      body: '',
    },
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      setIsLoading(true)
      const { success, data, error } = await fetchCommsDefaults()
      
      if (success && data) {
        setTemplates(data)
      } else {
        console.error('Error loading communication templates:', error)
        toast({
          title: 'Error',
          description: 'Failed to load communication templates. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  function openEditDialog(template: CommsDefault) {
    form.reset({
      subject: template.subject || '',
      body: template.body || '',
    })
    setEditDialog({ open: true, template })
  }

  async function onSubmit(data: TemplateFormData) {
    if (!editDialog.template) return

    try {
      setIsSubmitting(true)
      
      const { success, error } = await updateCommsDefault(editDialog.template.id, {
        subject: data.subject,
        body: data.body,
      })
      
      if (success) {
        toast({
          title: 'Template updated',
          description: `The ${editDialog.template.template_name} template has been updated successfully.`,
        })
        setEditDialog({ open: false, template: null })
        loadTemplates()
      } else {
        console.error('Error updating template:', error)
        toast({
          title: 'Error',
          description: 'Failed to update template. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetToDefault() {
    if (!editDialog.template) return

    const templateName = editDialog.template.template_name as keyof typeof defaultTemplates
    const channel = editDialog.template.channel as keyof typeof channelIcons
    const templateGroup = defaultTemplates[templateName]
    const defaultTemplate = templateGroup && templateGroup[channel as keyof typeof templateGroup]

    if (defaultTemplate) {
      form.reset({
        subject: (defaultTemplate as any).subject || '',
        body: (defaultTemplate as any).body || '',
      })
    }
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.template_name]) {
      acc[template.template_name] = []
    }
    acc[template.template_name].push(template)
    return acc
  }, {} as Record<string, CommsDefault[]>)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading templates...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/90 via-cyan-600/90 to-blue-700/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center space-x-4 mb-6">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="text-white hover:text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Link>
            </Button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Communication Templates
              </h1>
              <p className="text-xl text-teal-100 mt-2">
                Manage default email and SMS templates
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-teal-100">
            <span>• Email Templates</span>
            <span>• SMS Templates</span>
            <span>• Variable Support</span>
            <span>• Default Content</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {Object.entries(groupedTemplates).map(([templateName, templateChannels]) => (
            <Card key={templateName} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-2 capitalize">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  <span>{templateName.replace(/_/g, ' ')}</span>
                </CardTitle>
                <CardDescription>
                  Templates for different communication channels
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/50">
                      <TableHead>Channel</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Content Preview</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateChannels.map((template) => {
                      const Icon = channelIcons[template.channel as keyof typeof channelIcons]
                      const colorClass = channelColors[template.channel as keyof typeof channelColors]
                      
                      return (
                        <TableRow key={template.id} className="border-slate-200/50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 bg-gradient-to-br ${colorClass} rounded-lg`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 capitalize">
                                  {template.channel}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-600 max-w-xs truncate">
                              {template.subject || 'No subject'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-600 max-w-xs truncate">
                              {template.body?.substring(0, 50)}...
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.is_active ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(template)}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, template: null })}>
        <DialogContent className="bg-white/95 backdrop-blur-sm max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <span>Edit Template</span>
            </DialogTitle>
            <DialogDescription>
              {editDialog.template && (
                <>
                  Editing {editDialog.template.template_name.replace(/_/g, ' ')} template for {editDialog.template.channel}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {editDialog.template?.channel === 'email' && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Email subject..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Template body..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use variables like {'{{ first_name }}'}, {'{{ church_name }}'}, {'{{ event_name }}'}, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-2">Available Variables:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <div>• {'{{ first_name }}'} - Recipient's first name</div>
                  <div>• {'{{ last_name }}'} - Recipient's last name</div>
                  <div>• {'{{ email }}'} - Recipient's email</div>
                  <div>• {'{{ church_name }}'} - Your church name</div>
                  <div>• {'{{ event_name }}'} - Event name</div>
                  <div>• {'{{ event_time }}'} - Event time</div>
                </div>
              </div>

              <DialogFooter className="flex justify-between">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={resetToDefault}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to Default</span>
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setEditDialog({ open: false, template: null })}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 