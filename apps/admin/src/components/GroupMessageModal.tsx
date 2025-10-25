'use client'

import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Send, X, Loader2 } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

type MessageChannel = 'email' | 'sms' | 'whatsapp' | 'push'

type MessageTemplate = {
  id: string
  name: string
  content: string
  channel: MessageChannel
  type: string
}

type GroupMessageModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName?: string
  recipientIds?: string[]
  onSuccess?: () => void | Promise<void>
}

export function GroupMessageModal({
  open,
  onOpenChange,
  groupId,
  groupName = 'Group',
  recipientIds = [],
  onSuccess
}: GroupMessageModalProps) {
  // State
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [channel, setChannel] = useState<MessageChannel>('email')
  const [templateId, setTemplateId] = useState('')
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [previewContent, setPreviewContent] = useState('')
  
  // Load templates for selected channel
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true)
        
        // Try to fetch templates from comms schema
        const { data, error } = await supabase
          .from('comms.templates')
          .select('*')
          .eq('channel', channel)
          .eq('type', 'group')
          .order('name')
        
        if (error) {
          throw error
        }
        
        setTemplates(data || [])
      } catch (err) {
        console.error('Error loading templates:', err)
        
        // Fallback - mock templates in case the comms schema doesn't exist yet
        const mockTemplates: MessageTemplate[] = [
          {
            id: 'template1',
            name: 'Meeting Reminder',
            content: 'Hi {{first_name}}, this is a reminder about our upcoming {{group_name}} meeting.',
            channel,
            type: 'group'
          },
          {
            id: 'template2',
            name: 'Event Announcement',
            content: 'Hello {{first_name}}, please join us for a special event with the {{group_name}} group.',
            channel,
            type: 'group'
          }
        ]
        
        setTemplates(mockTemplates)
      } finally {
        setLoading(false)
      }
    }
    
    loadTemplates()
  }, [channel])
  
  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      // Reset form state when modal closes
      setChannel('email')
      setTemplateId('')
      setMessage('')
      setSubject('')
      setPreviewContent('')
      setLoading(false)
      setSendingMessage(false)
    }
  }, [open])
  
  // Update template content when selected
  useEffect(() => {
    if (templateId) {
      const selected = templates.find(t => t.id === templateId)
      if (selected) {
        let content = selected.content
        
        // Replace basic tokens
        content = content.replace(/{{group_name}}/g, groupName)
        
        setMessage(content)
        setPreviewContent(content)
        
        // Set default subject for email templates
        if (channel === 'email' && !subject) {
          setSubject(`Message from ${groupName}`)
        }
      }
    }
  }, [templateId, groupName, templates, channel, subject])
  
  // Handle changes
  const handleChannelChange = (value: MessageChannel) => {
    setChannel(value)
    setTemplateId('') // Reset template when channel changes
    // Set default subject for emails
    if (value === 'email' && !subject) {
      setSubject(`Message from ${groupName}`)
    }
  }
  
  const handleTemplateChange = (value: string) => {
    setTemplateId(value)
  }
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setPreviewContent(e.target.value)
  }
  
  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubject(e.target.value)
  }
  
  // Handle send message (using same approach as discipleship groups)
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      })
      return
    }
    
    if (channel === 'email' && !subject.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject for the email',
        variant: 'destructive'
      })
      return
    }
    
    if (recipientIds.length === 0) {
      toast({
        title: 'Error',
        description: 'No recipients found in this group',
        variant: 'destructive'
      })
      return
    }
    
    setSendingMessage(true)
    
    try {
      // Use the same approach as discipleship groups - import the working message service
      const { sendGroupMessage, sendGroupMessageDirect } = await import('@/services/messages')
      
      const request = {
        groupId,
        channel,
        content: message,
        subject: channel === 'email' ? subject : undefined,
        recipientIds
      }

      // Try database function first, fall back to direct if needed (same as discipleship)
      let result = await sendGroupMessage(request)
      
      if (!result.success && channel === 'email') {
        console.log('Database function failed, trying direct approach...')
        result = await sendGroupMessageDirect(request)
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Message sent to ${result.successfulSends} recipients${result.errors > 0 ? ` (${result.errors} errors)` : ''}`
        })
        
        // Clear form and close modal
        setMessage('')
        setSubject('')
        setTemplateId('')
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        throw new Error(result.error || 'Failed to send message')
      }

    } catch (err) {
      console.error('Error sending message:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message',
        variant: 'destructive'
      })
    } finally {
      setSendingMessage(false)
    }
  }
  
  // Render component
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Message to {groupName}</DialogTitle>
          <DialogDescription>
            Compose a message to send to {recipientIds.length} group members
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel">Message Channel</Label>
            <select
              id="channel"
              value={channel}
              onChange={(e) => handleChannelChange(e.target.value as MessageChannel)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="email">📧 Email</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Message Template</Label>
            <select
              id="template"
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select template</option>
              {loading ? (
                <option disabled>Loading templates...</option>
              ) : templates.length > 0 ? (
                templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))
              ) : (
                <option disabled>No templates available</option>
              )}
            </select>
          </div>
          
          {channel === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                type="text"
                id="subject"
                placeholder="Enter email subject"
                value={subject}
                onChange={handleSubjectChange}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              className="min-h-[120px]"
              value={message}
              onChange={handleMessageChange}
            />
            <p className="text-sm text-muted-foreground">
              This message will be sent to {recipientIds.length} recipients.
            </p>
          </div>
          
          {previewContent && (
            <div className="space-y-2 pt-2">
              <Label>Token Preview</Label>
              <div className="rounded-md border p-4 text-sm bg-muted">
                <p>{previewContent}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Tokens like {'{{'}'first_name'{'}}'}' will be replaced with recipient-specific information.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={sendingMessage}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSendMessage}
            disabled={sendingMessage || !message.trim() || recipientIds.length === 0}
          >
            {sendingMessage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 