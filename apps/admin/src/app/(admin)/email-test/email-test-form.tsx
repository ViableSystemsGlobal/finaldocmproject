'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmailTestForm() {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('Test Email from DOCM Church');
  const [emailType, setEmailType] = useState('system');
  const [htmlContent, setHtmlContent] = useState(`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">DOCM Church Email Test</h2>
      <p style="font-size: 16px; line-height: 1.5; color: #444;">
        This is a test email from the DOCM Church Management System.
      </p>
      <p style="font-size: 16px; line-height: 1.5; color: #444;">
        If you're receiving this email, it means the Hostinger email configuration is working correctly.
      </p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>This is an automated test email from the DOCM Church Management System.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      </div>
    </div>
  `);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Direct send using API route
  const sendTestEmail = async () => {
    if (!toEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: toEmail,
          subject: subject,
          html: htmlContent,
          emailType: emailType
        }),
      });
      
      const result = await response.json();
      setResult(result);
      
      if (result.success) {
        toast({
          title: 'Email Sent Successfully',
          description: `Email has been sent to ${toEmail} using ${result.sender}`,
        });
      } else {
        toast({
          title: 'Email Sending Failed',
          description: result.error || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Test direct email function instead of using the queue
  const sendDirectTestEmail = async () => {
    if (!toEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      setResult(null);
      
      // Import dynamically to avoid server component issues
      const emailService = await import('@/services/emailService');
      
      const result = await emailService.enqueueEmailDirect(toEmail, {
        subject: subject,
        body: htmlContent
      }, {
        emailType: emailType as any
      });
      
      setResult(result);
      
      if (result.success) {
        toast({
          title: 'Email Sent Successfully',
          description: `Email has been queued for ${toEmail} using simplified direct method`,
        });
      } else {
        toast({
          title: 'Email Sending Failed',
          description: result.error || 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending direct test email:', error);
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Send a test email using direct API or simplified direct method.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Recipient Email
            </label>
            <Input
              placeholder="recipient@example.com"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Subject
            </label>
            <Input
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Sender Account Type
            </label>
            <Select 
              value={emailType} 
              onValueChange={setEmailType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="bulk">Bulk (Round-Robin)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              HTML Content
            </label>
            <Textarea
              placeholder="HTML content for the email"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={5}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button onClick={sendTestEmail} disabled={loading} variant="default">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send via API
              </>
            )}
          </Button>
          <Button onClick={sendDirectTestEmail} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send via Direct Method'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>
            The response from the email operation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="bg-muted rounded-md p-4">
              <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              No email has been sent yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 