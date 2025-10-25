'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Loader2, 
  Users,
  Smartphone,
  Bell
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { 
  sendGroupMessage, 
  sendGroupMessageDirect,
  fetchMessageTemplates,
  processTemplate,
  MessageChannel,
  MessageTemplate,
  GroupMessageRequest 
} from '@/services/messages'

interface EnhancedGroupMessageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupName: string
  recipientIds: string[]
  onSuccess?: () => void
}

export function EnhancedGroupMessageModal({
  open,
  onOpenChange,
  groupId,
  groupName,
  recipientIds,
  onSuccess
}: EnhancedGroupMessageModalProps) {
  // State
  const [channel, setChannel] = useState<MessageChannel>('email')
  const [templateId, setTemplateId] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [sending, setSending] = useState(false)

  // Load templates when channel changes
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const { data, error } = await fetchMessageTemplates(channel, 'group')
        if (error) throw error
        setTemplates(data || [])
      } catch (err) {
        console.error('Error loading templates:', err)
        setTemplates([])
      } finally {
        setLoadingTemplates(false)
      }
    }

    if (open) {
      loadTemplates()
    }
  }, [channel, open])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setChannel('email')
      setTemplateId('')
      setSubject('')
      setContent('')
    } else {
      // Set default subject for emails
      if (channel === 'email' && !subject) {
        setSubject(`Message from ${groupName}`)
      }
    }
  }, [open, groupName, channel, subject])

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setContent(template.content)
      if (template.subject && channel === 'email') {
        setSubject(processTemplate(template.subject, { group_name: groupName }))
      }
    }
    setTemplateId(templateId)
  }

  // Handle channel change
  const handleChannelChange = (newChannel: MessageChannel) => {
    setChannel(newChannel)
    setTemplateId('')
    setContent('')
    
    // Set default subject for email
    if (newChannel === 'email' && !subject) {
      setSubject(`Message from ${groupName}`)
    }
  }

  // Handle send message
  const handleSendMessage = async () => {
    try {
      // Validation
      if (!content.trim()) {
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
          description: 'No recipients selected',
          variant: 'destructive'
        })
        return
      }

      setSending(true)

      const request: GroupMessageRequest = {
        groupId,
        channel,
        content,
        subject: channel === 'email' ? subject : undefined,
        recipientIds
      }

      // Try database function first, fall back to direct if needed
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
        setContent('')
        setSubject('')
        setTemplateId('')
        onOpenChange(false)
        
        if (onSuccess) onSuccess()
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
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Message to {groupName}
          </DialogTitle>
          <DialogDescription>
            Compose and send a message to {recipientIds.length} group members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel Selection */}
          <div className="space-y-2">
            <Label htmlFor="channel">Message Channel</Label>
            <Select value={channel} onValueChange={handleChannelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="sms" disabled>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS (Coming Soon)
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp" disabled>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    WhatsApp (Coming Soon)
                  </div>
                </SelectItem>
                <SelectItem value="push" disabled>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Push Notification (Coming Soon)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Message Template (Optional)</Label>
            <Select value={templateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or start from scratch" />
              </SelectTrigger>
              <SelectContent>
                {loadingTemplates ? (
                  <SelectItem value="" disabled>
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading templates...
                    </div>
                  </SelectItem>
                ) : templates.length > 0 ? (
                  templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No templates available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Subject (Email only) */}
          {channel === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message Content *</Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Use variables like {'{'}first_name{'}'}, {'{'}group_name{'}'}, {'{'}meeting_date{'}'} for personalization
            </p>
          </div>

          {/* Recipients Info */}
          <div className="rounded-lg border p-3 bg-muted/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>This message will be sent to {recipientIds.length} members in {groupName}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={!content || (channel === 'email' && !subject) || sending}
            className="rounded-xl"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 