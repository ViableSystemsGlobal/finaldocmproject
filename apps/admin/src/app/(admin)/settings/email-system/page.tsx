'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Mail, 
  AlertTriangle, 
  CheckCircle,
  Save,
  TestTube,
  Shield,
  Activity
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface EmailSettings {
  test_mode: boolean;
  provider: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
  reply_to?: string;
}

export default function EmailSystemSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/communications');
      const result = await response.json();
      
      if (result.success && result.data?.email) {
        setSettings(result.data.email);
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/settings/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: settings })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Settings Saved',
          description: 'Email system settings have been updated successfully'
        });
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailSystem = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/email/test-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings?.from_email || 'admin@docmchurch.org',
          subject: 'Email System Test',
          html: '<p>This is a test email to verify your email system is working correctly.</p>'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Test Email Sent',
          description: 'Check your inbox to verify the email system is working'
        });
      } else {
        throw new Error(result.error || 'Test email failed');
      }
    } catch (error) {
      console.error('Error testing email system:', error);
      toast({
        title: 'Test Failed',
        description: 'Email system test failed. Check your settings.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading email settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email System Settings</h1>
            <p className="mt-2 text-gray-600">
              Configure your email system settings and manage production vs test mode
            </p>
          </div>
        </div>
      </div>

      {/* Test Mode Warning */}
      {settings?.test_mode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <TestTube className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Test Mode Active</h3>
                <p className="text-sm text-yellow-700">
                  Emails are being simulated and not actually sent. Turn off test mode for production use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Production Mode Notice */}
      {settings?.test_mode === false && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Production Mode Active</h3>
                <p className="text-sm text-green-700">
                  Emails are being sent to real recipients. Your bulk email system is fully operational.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Test Mode</Label>
                <p className="text-sm text-gray-600">
                  When enabled, emails are simulated and not actually sent
                </p>
              </div>
              <Switch
                checked={settings?.test_mode || false}
                onCheckedChange={(checked) => 
                  setSettings(prev => prev ? { ...prev, test_mode: checked } : null)
                }
              />
            </div>

            <Separator />

            {/* SMTP Settings */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="provider">Email Provider</Label>
                <Input
                  id="provider"
                  value={settings?.provider || ''}
                  onChange={(e) => 
                    setSettings(prev => prev ? { ...prev, provider: e.target.value } : null)
                  }
                  placeholder="e.g., Hostinger, Gmail, SendGrid"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings?.smtp_host || ''}
                    onChange={(e) => 
                      setSettings(prev => prev ? { ...prev, smtp_host: e.target.value } : null)
                    }
                    placeholder="smtp.hostinger.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings?.smtp_port || 465}
                    onChange={(e) => 
                      setSettings(prev => prev ? { ...prev, smtp_port: parseInt(e.target.value) } : null)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings?.smtp_secure || false}
                  onCheckedChange={(checked) => 
                    setSettings(prev => prev ? { ...prev, smtp_secure: checked } : null)
                  }
                />
                <Label>Use SSL/TLS (Secure Connection)</Label>
              </div>

              <div>
                <Label htmlFor="from_email">From Email Address</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={settings?.from_email || ''}
                  onChange={(e) => 
                    setSettings(prev => prev ? { ...prev, from_email: e.target.value } : null)
                  }
                  placeholder="noreply@yourchurch.com"
                />
              </div>

              <div>
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={settings?.from_name || ''}
                  onChange={(e) => 
                    setSettings(prev => prev ? { ...prev, from_name: e.target.value } : null)
                  }
                  placeholder="Your Church Name"
                />
              </div>

              <div>
                <Label htmlFor="reply_to">Reply-To Email (Optional)</Label>
                <Input
                  id="reply_to"
                  type="email"
                  value={settings?.reply_to || ''}
                  onChange={(e) => 
                    setSettings(prev => prev ? { ...prev, reply_to: e.target.value } : null)
                  }
                  placeholder="info@yourchurch.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status & Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Status & Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                <Badge variant={settings?.test_mode ? "outline" : "default"}>
                  {settings?.test_mode ? 'Test Mode' : 'Production'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Email Provider</span>
                <span className="text-sm text-gray-600">{settings?.provider || 'Not configured'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">SMTP Host</span>
                <span className="text-sm text-gray-600">{settings?.smtp_host || 'Not configured'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">From Address</span>
                <span className="text-sm text-gray-600">{settings?.from_email || 'Not configured'}</span>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={testEmailSystem}
                disabled={testing || !settings?.from_email}
                variant="outline"
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test Email System'}
              </Button>

              <Button
                onClick={saveSettings}
                disabled={saving || !settings}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/comms/email-health', '_blank')}
                  className="w-full justify-start"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Email Health Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Email System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Your Bulk Email System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <div className="text-sm text-gray-600">Email Accounts</div>
              <div className="text-xs text-gray-500">Hostinger SMTP</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">4,500</div>
              <div className="text-sm text-gray-600">Emails/Hour</div>
              <div className="text-xs text-gray-500">Total Capacity</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">Advanced</div>
              <div className="text-sm text-gray-600">Load Balancing</div>
              <div className="text-xs text-gray-500">Round-robin Distribution</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Enterprise-Grade Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 12 Hostinger email accounts with specialized roles</li>
              <li>• Intelligent load balancing and round-robin distribution</li>
              <li>• Account health monitoring and automatic failover</li>
              <li>• Rate limiting (500 emails/hour per account)</li>
              <li>• Real-time analytics and error tracking</li>
              <li>• Automatic retry logic with exponential backoff</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 