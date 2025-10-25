'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  BellRing, 
  Save,
  Loader2,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'
import { 
  CommsTemplate, 
  fetchTemplate, 
  updateTemplate,
  UpdateTemplateParams
} from '@/services/comms/templates'
import { useNextParams } from '@/lib/nextParams'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Template name must be at least 2 characters.',
  }),
  subject: z.string().optional(),
  body: z.string().min(1, {
    message: 'Template body is required.',
  }),
  variables_schema: z.array(z.any()).optional(),
})

type FormData = z.infer<typeof formSchema>

type Params = {
  params: {
    id: string
  }
}

export default function EditTemplatePage({ params }: Params) {
  const router = useRouter()
  const { id } = useNextParams(params)
  
  const [template, setTemplate] = useState<CommsTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      subject: '',
      body: '',
      variables_schema: [],
    },
  })
  
  // Load template data
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        const { data, error } = await fetchTemplate(id)
        
        if (error) throw error
        if (!data) throw new Error('Template not found')
        
        setTemplate(data)
        
        // Update form with template data
        form.reset({
          name: data.name,
          subject: data.subject || '',
          body: data.body,
          variables_schema: data.variables_schema || [],
        })
      } catch (error) {
        console.error('Failed to load template:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load template. Please try again.'
        })
        router.push('/comms/templates')
      } finally {
        setLoading(false)
      }
    }
    
    loadTemplate()
  }, [id, router, form])
  
  async function onSubmit(data: FormData) {
    if (!template) return
    
    setIsSubmitting(true)
    
    try {
      const updateData: UpdateTemplateParams = {
        name: data.name,
        body: data.body,
        variables_schema: data.variables_schema || [],
      }
      
      // Only include subject if it's an email or push template
      if (template.channel === 'email' || template.channel === 'push') {
        updateData.subject = data.subject
      }
      
      const { data: result, error } = await updateTemplate(template.id, updateData)
      
      if (error) {
        throw error
      }
      
      toast({
        title: 'Template updated',
        description: `Template "${data.name}" has been updated successfully.`,
      })
      
      router.push(`/comms/templates/${template.id}`)
    } catch (error) {
      console.error('Failed to update template:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update template. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-6 w-6" />
      case 'sms': return <MessageSquare className="h-6 w-6" />
      case 'whatsapp': return <MessageSquare className="h-6 w-6" />
      case 'push': return <BellRing className="h-6 w-6" />
      default: return <Mail className="h-6 w-6" />
    }
  }

  const getChannelGradient = (channel: string) => {
    switch (channel) {
      case 'email': return 'from-blue-500 to-blue-600'
      case 'sms': return 'from-green-500 to-green-600'
      case 'whatsapp': return 'from-emerald-500 to-emerald-600'
      case 'push': return 'from-purple-500 to-purple-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Template</h2>
          <p className="text-slate-600">Fetching template details...</p>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto">
            <MessageSquare className="h-10 w-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Template Not Found</h2>
          <p className="text-slate-600 mb-6">The template you're trying to edit doesn't exist.</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/comms/templates')}
            className="rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push(`/comms/templates/${template.id}`)}
              className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className={`relative bg-gradient-to-r ${getChannelGradient(template.channel)} p-3 rounded-2xl`}>
                  {getChannelIcon(template.channel)}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Edit Template
                </h1>
                <p className="text-lg text-slate-600">
                  Update "{template.name}"
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Template Form */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${getChannelGradient(template.channel)} px-8 py-6`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                {getChannelIcon(template.channel)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Template Editor</h3>
                <p className="text-white/80">Make changes to your {template.channel} template</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <Form {...form}>
              <form id="template-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-slate-700 font-semibold">Template Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., Welcome Email" 
                            className="rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white/80 transition-all"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-slate-600">
                          A descriptive name for this template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Channel Display (Read-only) */}
                  <div className="md:col-span-2">
                    <label className="text-slate-700 font-semibold text-sm">Communication Channel</label>
                    <div className="mt-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(template.channel)}
                        <span className="font-medium text-slate-800">{template.channel.toUpperCase()}</span>
                        <span className="text-slate-500 text-sm ml-2">(Cannot be changed)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {(template.channel === 'email' || template.channel === 'push') && (
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">
                          {template.channel === 'email' ? 'Email Subject' : 'Push Notification Title'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={
                              template.channel === 'email' 
                                ? "E.g., Welcome to our church!" 
                                : "E.g., New event notification"
                            }
                            className="rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white/80 transition-all"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-slate-600">
                          {template.channel === 'email' 
                            ? 'The subject line for your email template'
                            : 'The title for your push notification'
                          }
                        </FormDescription>
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
                      <FormLabel className="text-slate-700 font-semibold">Template Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={
                            template.channel === 'email' 
                              ? 'Enter HTML or Markdown content...' 
                              : 'Enter your message...'
                          }
                          className="min-h-[300px] rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white/80 transition-all resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-slate-600">
                        {template.channel === 'email' 
                          ? 'Supports HTML and Markdown. Use {{ variable }} for dynamic content.' 
                          : 'Use {{ variable }} for dynamic content.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Variable Tips */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-5 w-5 text-slate-600" />
                    <h4 className="font-semibold text-slate-800">Dynamic Variables</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                    <div>
                      <strong>Common variables:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>• <code className="bg-slate-200 px-1 rounded">{'{{ first_name }}'}</code> - Recipient's first name</li>
                        <li>• <code className="bg-slate-200 px-1 rounded">{'{{ last_name }}'}</code> - Recipient's last name</li>
                        <li>• <code className="bg-slate-200 px-1 rounded">{'{{ email }}'}</code> - Recipient's email</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Custom variables:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>• <code className="bg-slate-200 px-1 rounded">{'{{ event_name }}'}</code> - Event name</li>
                        <li>• <code className="bg-slate-200 px-1 rounded">{'{{ church_name }}'}</code> - Church name</li>
                        <li>• <code className="bg-slate-200 px-1 rounded">{'{{ date }}'}</code> - Current date</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
          
          {/* Footer Actions */}
          <div className={`bg-gradient-to-r ${getChannelGradient(template.channel)} px-8 py-6`}>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/comms/templates/${template.id}`)}
                disabled={isSubmitting}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="template-form"
                disabled={isSubmitting}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl font-semibold px-8"
              >
                {isSubmitting ? (
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
        </div>
      </div>
    </div>
  )
} 