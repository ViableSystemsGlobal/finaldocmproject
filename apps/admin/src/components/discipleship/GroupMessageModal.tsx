import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Mail, 
  MessageSquare, 
  Send, 
  Users,
  Smartphone,
  Bell
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { fetchDisciples } from '@/services/discipleshipGroups';
import { 
  sendGroupMessage, 
  sendGroupMessageDirect,
  fetchMessageTemplates,
  processTemplate,
  type MessageChannel,
  type MessageTemplate,
  type GroupMessageRequest 
} from '@/services/messages';

interface GroupMessageModalProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
  initialContent?: string;
}

export function GroupMessageModal({
  groupId,
  groupName,
  isOpen,
  onClose,
  initialSubject,
  initialContent
}: GroupMessageModalProps) {
  // State
  const [channel, setChannel] = useState<MessageChannel>('email');
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState(initialSubject || '');
  const [content, setContent] = useState(initialContent || '');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset all state when modal closes to prevent conflicts
  const handleClose = () => {
    setChannel('email');
    setTemplateId('');
    setSubject(initialSubject || '');
    setContent(initialContent || '');
    setTemplates([]);
    setLoadingTemplates(false);
    setSending(false);
    setRecipients([]);
    setIsLoading(false);
    onClose();
  };

  // Load templates when channel changes
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const { data, error } = await fetchMessageTemplates(channel, 'group');
        if (error) throw error;
        setTemplates(data || []);
      } catch (err) {
        console.error('Error loading templates:', err);
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (isOpen) {
      loadTemplates();
    }
  }, [channel, isOpen]);

  // Load disciples when the modal opens
  const loadDisciples = async () => {
    if (!groupId || !isOpen) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await fetchDisciples(groupId);
      
      if (error) throw error;
      
      // Extract contact IDs
      if (data) {
        const contactIds = data.map(disciple => disciple.contact_id);
        setRecipients(contactIds);
      }
    } catch (err) {
      console.error('Error loading disciples:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load group members'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Called when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDisciples();
      // Set default subject for emails (only if no initial subject provided)
      if (channel === 'email' && !subject && !initialSubject) {
        setSubject(`Message from ${groupName}`);
      }
    } else {
      // Reset form when modal closes
      setChannel('email');
      setTemplateId('');
      setSubject(initialSubject || '');
      setContent(initialContent || '');
    }
  }, [isOpen, groupId, groupName, channel, subject, initialSubject, initialContent]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
      if (template.subject && channel === 'email') {
        setSubject(processTemplate(template.subject, { group_name: groupName }));
      }
    }
    setTemplateId(templateId);
  };

  // Handle channel change
  const handleChannelChange = (newChannel: MessageChannel) => {
    setChannel(newChannel);
    setTemplateId('');
    setContent(initialContent || '');
    
    // Set default subject for email (only if no initial subject provided)
    if (newChannel === 'email' && !initialSubject) {
      setSubject(`Message from ${groupName}`);
    } else if (newChannel !== 'email') {
      setSubject('');
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    try {
      // Validation
      if (!content.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a message',
          variant: 'destructive'
        });
        return;
      }

      if (channel === 'email' && !subject.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a subject for the email',
          variant: 'destructive'
        });
        return;
      }

      if (recipients.length === 0) {
        toast({
          title: 'Error',
          description: 'No recipients found in this group',
          variant: 'destructive'
        });
        return;
      }

      setSending(true);

      const request: GroupMessageRequest = {
        groupId,
        channel,
        content,
        subject: channel === 'email' ? subject : undefined,
        recipientIds: recipients
      };

      // Try database function first, fall back to direct if needed
      let result = await sendGroupMessage(request);
      
      if (!result.success && channel === 'email') {
        console.log('Database function failed, trying direct approach...');
        result = await sendGroupMessageDirect(request);
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: `Message sent to ${result.successfulSends} recipients${result.errors > 0 ? ` (${result.errors} errors)` : ''}`
        });
        
        // Clear form and close modal
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to send message');
      }

    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-[600px]" 
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Message to {groupName}
          </DialogTitle>
          <DialogDescription>
            Compose and send a message to {recipients.length} disciples
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading group members...</span>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Channel Selection */}
            <div className="space-y-2">
              <Label htmlFor="channel">Message Channel</Label>
              <select
                id="channel"
                value={channel}
                onChange={(e) => handleChannelChange(e.target.value as MessageChannel)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="email">📧 Email</option>
                <option value="sms" disabled>📱 SMS (Coming Soon)</option>
                <option value="whatsapp" disabled>💬 WhatsApp (Coming Soon)</option>
                <option value="push" disabled>🔔 Push Notification (Coming Soon)</option>
              </select>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Message Template (Optional)</Label>
              <select
                id="template"
                value={templateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Choose a template or start from scratch</option>
                {loadingTemplates ? (
                  <option value="" disabled>Loading templates...</option>
                ) : templates.length > 0 ? (
                  templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No templates available</option>
                )}
              </select>
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
                Use variables like {'{'}first_name{'}'}, {'{'}last_name{'}'}, {'{'}full_name{'}'}, {'{'}group_name{'}'} or {'{'}{'{'} first_name {'}'}{'}'}, {'{'}{'{'} group_name {'}'}{'}'}  for personalization
              </p>
            </div>

            {/* Recipients Info */}
            <div className="rounded-lg border p-3 bg-muted/20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>This message will be sent to {recipients.length} disciples in {groupName}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleClose();
            }}
            disabled={sending}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={!content || (channel === 'email' && !subject) || sending || isLoading || recipients.length === 0}
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
  );
} 