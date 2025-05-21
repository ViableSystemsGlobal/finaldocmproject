'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  BellRing, 
  Send,
  Loader2
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

export default function NewTemplatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      channel: 'email',
      subject: '',
      body: '',
      variables_schema: [],
    },
  })
  
  const { watch } = form
  const channel = watch('channel')
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    
    // Prepare the data
    const templateData: CreateTemplateParams = {
      name: values.name,
      channel: values.channel,
      body: values.body,
      variables_schema: values.variables_schema,
    }
    
    // Add subject only for email and push
    if (values.channel === 'email' || values.channel === 'push') {
      templateData.subject = values.subject
    }
    
    try {
      const { data, error } = await createTemplate(templateData)
      
      if (error) throw error
      
      toast({
        title: 'Template created',
        description: 'Your template has been created successfully.',
      })
      
      // Redirect to templates list
      router.push('/comms/templates')
    } catch (error) {
      console.error('Error creating template:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create template. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getChannelIcon = () => {
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>
            Create a communication template for use in your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="template-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Welcome Email" {...field} />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Channel</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a channel" />
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
                      Select the communication channel for this template
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Subject (only for email and push) */}
              {(channel === 'email' || channel === 'push') && (
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Line</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter subject line" {...field} />
                      </FormControl>
                      <FormDescription>
                        {channel === 'email' ? 'Subject line for your email' : 'Title for your push notification'}
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
                    <FormLabel>Template Body</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={
                          channel === 'email' 
                            ? 'Enter HTML or Markdown content...' 
                            : 'Enter your message...'
                        }
                        className="min-h-[200px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {channel === 'email' 
                        ? 'Supports HTML and Markdown. Use {{ variable }} for dynamic content.' 
                        : 'Use {{ variable }} for dynamic content.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* TODO: Add variable schema editor */}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/comms/templates')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="template-form"
            disabled={isSubmitting}
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
        </CardFooter>
      </Card>
    </div>
  )
} 