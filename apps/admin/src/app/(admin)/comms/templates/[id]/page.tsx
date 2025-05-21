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
  Trash2
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { 
  CommsTemplate, 
  fetchTemplate, 
  updateTemplate, 
  deleteTemplate 
} from '@/services/comms/templates'

type Params = {
  params: {
    id: string
  }
}

export default function TemplateDetailPage({ params }: Params) {
  const router = useRouter()
  const { id } = params
  
  const [template, setTemplate] = useState<CommsTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<string>('email')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  
  // Load template data
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        const { data, error } = await fetchTemplate(id)
        
        if (error) throw error
        if (!data) throw new Error('Template not found')
        
        setTemplate(data)
        setName(data.name)
        setChannel(data.channel)
        setSubject(data.subject || '')
        setBody(data.body)
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
  }, [id, router])
  
  const handleSave = async () => {
    if (!template) return
    
    setIsSaving(true)
    
    try {
      const { data, error } = await updateTemplate(id, {
        name,
        channel: channel as any, // Cast to match the expected type
        subject: channel === 'email' || channel === 'push' ? subject : undefined,
        body,
      })
      
      if (error) throw error
      
      setTemplate(data)
      
      toast({
        title: 'Template updated',
        description: 'Your template has been updated successfully.'
      })
    } catch (error) {
      console.error('Failed to update template:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update template. Please try again.'
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  const confirmDelete = async () => {
    setIsDeleting(true)
    
    try {
      const { success, error } = await deleteTemplate(id)
      
      if (!success) throw error
      
      toast({
        title: 'Template deleted',
        description: 'The template has been deleted successfully.'
      })
      
      router.push('/comms/templates')
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete template. Please try again.'
      })
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <p className="text-lg text-muted-foreground">Template not found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push('/comms/templates')}
        >
          Back to Templates
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={() => router.push('/comms/templates')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          className="mb-4"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Template</CardTitle>
          <CardDescription>
            Update your {channel} template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Template Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
              />
              <p className="text-xs text-muted-foreground">
                A descriptive name for this template
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="channel" className="text-sm font-medium">
                Channel
              </label>
              <Select
                value={channel}
                onValueChange={setChannel}
                disabled // Prevent changing the channel after creation
              >
                <SelectTrigger id="channel">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
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
              <p className="text-xs text-muted-foreground">
                Channel cannot be changed after creation
              </p>
            </div>
            
            {/* Subject (only for email and push) */}
            {(channel === 'email' || channel === 'push') && (
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject Line
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject line"
                />
                <p className="text-xs text-muted-foreground">
                  {channel === 'email' ? 'Subject line for your email' : 'Title for your push notification'}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="body" className="text-sm font-medium">
                Template Body
              </label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  channel === 'email' 
                    ? 'Enter HTML or Markdown content...' 
                    : 'Enter your message...'
                }
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {channel === 'email' 
                  ? 'Supports HTML and Markdown. Use {{ variable }} for dynamic content.' 
                  : 'Use {{ variable }} for dynamic content.'}
              </p>
            </div>
            
            {/* TODO: Add variable schema editor */}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/comms/templates')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 