'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  BellRing, 
  Send,
  Loader2,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'
import { createTemplate, CommsTemplate, CreateTemplateParams } from '@/services/comms/templates'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Template name must be at least 2 characters.',
  }),
  channel: z.enum(['email', 'sms', 'whatsapp', 'push'], {
    required_error: 'Please select a channel.',
  }),
  subject: z.string().optional(),
  body: z.string().min(1, {
    message: 'Template body is required.',
  }),
  variables_schema: z.array(z.any()).optional(),
})

type FormData = z.infer<typeof formSchema>

export default function NewTemplatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      channel: 'email',
      subject: '',
      body: '',
      variables_schema: [],
    },
  })
  
  const channel = form.watch('channel')
  
  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    
    try {
      const templateData: CreateTemplateParams = {
        name: data.name,
        channel: data.channel,
        body: data.body,
        subject: data.subject,
        variables_schema: data.variables_schema || [],
      }
      
      const { data: result, error } = await createTemplate(templateData)
      
      if (error) {
        throw error
      }
      
      toast({
        title: 'Template created',
        description: `Template "${data.name}" has been created successfully.`,
      })
      
      router.push('/comms/templates')
    } catch (error) {
      console.error('Failed to create template:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create template. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-5 w-5" />
      case 'sms': return <MessageSquare className="h-5 w-5" />
      case 'whatsapp': return <MessageSquare className="h-5 w-5" />
      case 'push': return <BellRing className="h-5 w-5" />
      default: return <Mail className="h-5 w-5" />
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className={`relative bg-gradient-to-r ${getChannelGradient(channel)} p-3 rounded-2xl`}>
                  {getChannelIcon(channel)}
                  <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Create New Template
                </h1>
                <p className="text-lg text-slate-600">
                  Build a new communication template
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Template Form */}
        <div className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden">
          <div className={`bg-gradient-to-r ${getChannelGradient(channel)} px-8 py-6`}>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                {getChannelIcon(channel)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Template Details</h3>
                <p className="text-white/80">Configure your communication template</p>
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
                      <FormItem>
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
                  
                  <FormField
                    control={form.control}
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Communication Channel</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white/80 transition-all">
                              <SelectValue placeholder="Select channel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-500" />
                                Email
                              </div>
                            </SelectItem>
                            <SelectItem value="sms">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-green-500" />
                                SMS
                              </div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-emerald-500" />
                                WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="push">
                              <div className="flex items-center gap-2">
                                <BellRing className="h-4 w-4 text-purple-500" />
                                Push Notification
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-slate-600">
                          Choose the communication channel for this template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {channel === 'email' && (
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">Email Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="E.g., Welcome to our church!"
                            className="rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white/80 transition-all"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-slate-600">
                          The subject line for your email template
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
                            channel === 'email' 
                              ? 'Enter HTML or Markdown content...' 
                              : 'Enter your message...'
                          }
                          className="min-h-[300px] rounded-xl border-2 border-slate-200 bg-white/50 focus:bg-white/80 transition-all resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-slate-600">
                        {channel === 'email' 
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
          <div className={`bg-gradient-to-r ${getChannelGradient(channel)} px-8 py-6`}>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => router.push('/comms/templates')}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Template
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