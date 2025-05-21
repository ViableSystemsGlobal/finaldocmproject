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
}

export function GroupMessageModal({
  open,
  onOpenChange,
  groupId,
  groupName = 'Group',
  recipientIds = []
}: GroupMessageModalProps) {
  // State
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [channel, setChannel] = useState<MessageChannel>('email')
  const [templateId, setTemplateId] = useState<string>('')
  const [message, setMessage] = useState('')
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
      }
    }
  }, [templateId, groupName, templates])
  
  // Handle changes
  const handleChannelChange = (value: MessageChannel) => {
    setChannel(value)
    setTemplateId('') // Reset template when channel changes
  }
  
  const handleTemplateChange = (value: string) => {
    setTemplateId(value)
  }
  
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setPreviewContent(e.target.value)
  }
  
  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
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
    
    setSendingMessage(true)
    
    try {
      // Try to use the comms system
      const { error } = await supabase
        .from('comms.messages')
        .insert({
          channel,
          content: message,
          group_id: groupId,
          recipient_ids: recipientIds,
          status: 'pending',
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        
      if (error) {
        // If the comms schema doesn't exist, use RPC function instead
        const { error: rpcError } = await supabase
          .rpc('send_group_message', {
            p_channel: channel,
            p_content: message,
            p_group_id: groupId,
            p_recipient_ids: recipientIds
          })
          
        if (rpcError) throw rpcError
      }
      
      toast({
        title: 'Success',
        description: 'Message has been queued for sending'
      })
      
      // Close the modal
      onOpenChange(false)
    } catch (err) {
      console.error('Error sending message:', err)
      toast({
        title: 'Error',
        description: 'Failed to send message. Check console for details.',
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
            <Select
              value={channel}
              onValueChange={(value) => handleChannelChange(value as MessageChannel)}
            >
              <SelectTrigger id="channel">
                <SelectValue placeholder="Select channel" />
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
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Push Notification</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="template">Message Template</Label>
            <Select
              value={templateId}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading templates...</span>
                  </div>
                ) : templates.length > 0 ? (
                  templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-2 px-2 text-sm text-gray-500">
                    No templates available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
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