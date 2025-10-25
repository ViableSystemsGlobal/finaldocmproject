'use client';

import { useState } from 'react';
import { X, Mail, Check, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Type definitions
interface EmailRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  routeUrl: string;
  eventName: string;
  destinationName?: string;
  availableDrivers?: {id: string; name: string; email: string}[];
}

export function EmailRouteDialog({ 
  isOpen, 
  onClose, 
  routeUrl, 
  eventName,
  destinationName = "the event",
  availableDrivers = []
}: EmailRouteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailType, setEmailType] = useState<'driver' | 'custom'>('driver');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [recipientEmails, setRecipientEmails] = useState<string[]>(['']);
  const [includeMap, setIncludeMap] = useState(true);
  const [customMessage, setCustomMessage] = useState(
    `Here's the route for the transportation to ${eventName}. You can open it in Google Maps.`
  );

  // Handle adding a new email field
  const handleAddEmail = () => {
    setRecipientEmails([...recipientEmails, '']);
  };

  // Handle removing an email field
  const handleRemoveEmail = (index: number) => {
    const updatedEmails = [...recipientEmails];
    updatedEmails.splice(index, 1);
    setRecipientEmails(updatedEmails);
  };

  // Handle updating an email
  const handleEmailChange = (index: number, value: string) => {
    const updatedEmails = [...recipientEmails];
    updatedEmails[index] = value;
    setRecipientEmails(updatedEmails);
  };

  // Helper function to validate emails
  const validateEmails = (emails: string[]): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(email => email.trim() === '' || emailRegex.test(email));
  };

  // Handle sending the email route
  const handleSendEmail = async () => {
    try {
      setIsLoading(true);

      // Validate based on email type
      if (emailType === 'driver' && !selectedDriverId) {
        toast({
          title: 'No driver selected',
          description: 'Please select a driver to send the route.',
          variant: 'destructive'
        });
        return;
      }

      if (emailType === 'custom') {
        // Filter out empty emails and validate format
        const emails = recipientEmails.filter(email => email.trim() !== '');
        
        if (emails.length === 0) {
          toast({
            title: 'No recipient emails',
            description: 'Please add at least one recipient email address.',
            variant: 'destructive'
          });
          return;
        }

        if (!validateEmails(emails)) {
          toast({
            title: 'Invalid email format',
            description: 'One or more email addresses are invalid.',
            variant: 'destructive'
          });
          return;
        }
      }

      // Prepare email data
      const emailData = {
        recipients: emailType === 'driver' 
          ? [selectedDriverId] 
          : recipientEmails.filter(email => email.trim() !== ''),
        email_type: emailType,
        route_url: routeUrl,
        event_name: eventName,
        destination_name: destinationName,
        include_map: includeMap,
        custom_message: customMessage,
      };

      // Send the email
      const response = await fetch('/api/events/send-route-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      // Show success
      setSuccess(true);
      toast({
        title: 'Route sent',
        description: 'The route has been sent successfully via email.'
      });

      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
        // Reset the form
        setSuccess(false);
        setEmailType('driver');
        setSelectedDriverId('');
        setRecipientEmails(['']);
        setIncludeMap(true);
        setCustomMessage(`Here's the route for the transportation to ${eventName}. You can open it in Google Maps.`);
      }, 1500);
    } catch (error) {
      console.error('Error sending route email:', error);
      toast({
        title: 'Failed to send email',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Route via Email</DialogTitle>
          <DialogDescription>
            Share the transportation route via email with drivers or other recipients.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Email type selection */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={emailType === 'driver' ? 'default' : 'outline'}
              onClick={() => setEmailType('driver')}
              className="justify-start"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send to Driver
            </Button>
            <Button
              type="button"
              variant={emailType === 'custom' ? 'default' : 'outline'}
              onClick={() => setEmailType('custom')}
              className="justify-start"
            >
              <Mail className="mr-2 h-4 w-4" />
              Custom Recipients
            </Button>
          </div>

          {/* Driver selection */}
          {emailType === 'driver' && (
            <div className="space-y-2">
              <Label htmlFor="driver-select">Select Driver</Label>
              {availableDrivers.length > 0 ? (
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger id="driver-select">
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name} ({driver.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground p-2 border rounded-md">
                  No drivers available. Please add drivers first.
                </div>
              )}
            </div>
          )}

          {/* Custom recipients */}
          {emailType === 'custom' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Recipient Email Addresses</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddEmail}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Email
                </Button>
              </div>
              
              {recipientEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder="email@example.com"
                  />
                  {recipientEmails.length > 1 && (
                    <Button 
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEmail(index)}
                      className="h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Message options */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Message</Label>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Include map option */}
          <div className="flex items-center justify-between">
            <Label htmlFor="include-map" className="cursor-pointer">
              Include static map preview
            </Label>
            <Switch 
              id="include-map" 
              checked={includeMap} 
              onCheckedChange={setIncludeMap} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={isLoading || success}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSendEmail}
            disabled={isLoading || success}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {success && <Check className="mr-2 h-4 w-4" />}
            {isLoading ? 'Sending...' : success ? 'Sent!' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 