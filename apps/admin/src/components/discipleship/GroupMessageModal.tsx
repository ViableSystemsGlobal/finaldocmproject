import { useState, useEffect } from 'react';
import { Loader2, Mail, MessageSquare, Send } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { fetchDisciples } from '@/services/discipleshipGroups';

// Mock function for sending messages
// In a real implementation, you would import this from a communications service
const sendGroupMessage = async (recipients: string[], message: { subject?: string, body: string, channel: string }) => {
  console.log('Sending message to recipients:', recipients);
  console.log('Message:', message);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return success
  return { success: true, error: null };
};

interface GroupMessageModalProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupMessageModal({
  groupId,
  groupName,
  isOpen,
  onClose
}: GroupMessageModalProps) {
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }
  }, [isOpen, groupId]);

  // Handle send message
  const handleSendMessage = async () => {
    try {
      // Validate
      if (!messageBody.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a message'
        });
        return;
      }
      
      if (channel === 'email' && !subject.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a subject for the email'
        });
        return;
      }
      
      if (recipients.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No recipients found in this group'
        });
        return;
      }

      setIsSubmitting(true);

      // Send message
      const messageData = {
        body: messageBody,
        channel,
        ...(channel === 'email' ? { subject } : {})
      };
      
      const { success, error } = await sendGroupMessage(recipients, messageData);
      
      if (!success || error) throw error;
      
      toast({
        title: 'Success',
        description: 'Message sent successfully'
      });
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setChannel('email');
    setSubject('');
    setMessageBody('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Message to {groupName}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading group members...</span>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Tabs defaultValue="email" value={channel} onValueChange={setChannel}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    placeholder="Enter subject..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                rows={6}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
            </div>

            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                This message will be sent to {recipients.length} members in the group.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={isSubmitting || isLoading || recipients.length === 0}
          >
            {isSubmitting ? (
              <div>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </div>
            ) : (
              <div>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 