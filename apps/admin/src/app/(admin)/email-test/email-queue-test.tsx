'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { testEmailQueue, enqueueEmailDirect } from '@/services/emailService';

export default function EmailQueueTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const runTests = async () => {
    setLoading(true);
    setStatus('idle');
    setTestResults(null);
    
    try {
      // Run the test
      const result = await testEmailQueue();
      setTestResults(result);
      setStatus(result.success ? 'success' : 'error');
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };
  
  const sendDirectTest = async () => {
    setLoading(true);
    setStatus('idle');
    setTestResults(null);
    
    try {
      // Send a test email directly
      const result = await enqueueEmailDirect(
        'test@example.com',
        {
          subject: 'Test Email from Direct Method',
          body: '<p>This is a test email sent using the direct method.</p>'
        }
      );
      setTestResults(result);
      setStatus(result.success ? 'success' : 'error');
    } catch (error) {
      setTestResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Queue Diagnostics</CardTitle>
        <CardDescription>
          Test the email queue system and diagnose potential issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'success' && (
          <div className="bg-green-50 rounded-md text-green-800 border border-green-200 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h4 className="font-medium">Success</h4>
            </div>
            <p className="mt-1 text-sm">
              The test was successful. The email queue is working properly.
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="bg-red-50 rounded-md text-red-800 border border-red-200 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h4 className="font-medium">Error</h4>
            </div>
            <p className="mt-1 text-sm">
              The test failed. Please check the results below for details.
            </p>
          </div>
        )}
        
        {testResults && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Test Results</h3>
            <div className="bg-muted rounded-md p-4 overflow-auto max-h-96 font-mono text-xs whitespace-pre">
              {JSON.stringify(testResults, null, 2)}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={runTests} disabled={loading} variant="outline">
          {loading ? 'Running Test...' : 'Run Basic Test'}
        </Button>
        <Button onClick={sendDirectTest} disabled={loading}>
          {loading ? 'Sending...' : 'Send Test Email (Direct)'}
        </Button>
      </CardFooter>
    </Card>
  );
} 