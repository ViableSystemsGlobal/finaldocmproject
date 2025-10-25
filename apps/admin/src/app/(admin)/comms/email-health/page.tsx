'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Mail, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings,
  TrendingUp,
  Clock,
  Users,
  Zap,
  Shield,
  Server,
  Monitor,
  BarChart3
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface EmailHealthData {
  timestamp: string;
  systemHealth: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    canSend: boolean;
    reason: string;
  };
  accounts: {
    total: number;
    healthy: number;
    unhealthy: number;
    details: Array<{
      email: string;
      isHealthy: boolean;
      successRate: number;
      totalSent: number;
      totalFailed: number;
      hourlyCount: number;
      hourlyLimit: number;
      utilizationPercent: number;
      lastUsed: string;
      lastFailure?: string;
      failureCount: number;
    }>;
  };
  statistics: {
    hourlyCapacity: number;
    currentUtilization: number;
    totalSent: number;
    totalFailed: number;
    successRate: number;
  };
  queue?: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
    total: number;
  };
  recentErrors?: Array<{
    timestamp: string;
    error: string;
    account: string;
    retryable: boolean;
  }>;
}

export default function EmailHealthPage() {
  const [healthData, setHealthData] = useState<EmailHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/email/health?includeQueue=true&includeErrors=true');
      const result = await response.json();
      
      if (result.success) {
        setHealthData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch health data');
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email health data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const performHealthAction = async (action: string, account?: string) => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/email/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, account })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        });
        await fetchHealthData();
      } else {
        throw new Error(result.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing health action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform health action',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading email health data...</p>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Health Data</h3>
          <p className="text-gray-600 mb-4">There was an error loading the email system health data.</p>
          <Button onClick={fetchHealthData} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'excellent': return 'from-green-500 to-emerald-600';
      case 'good': return 'from-blue-500 to-blue-600';
      case 'warning': return 'from-yellow-500 to-orange-500';
      case 'critical': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Email System Health
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Monitor and manage your email sending infrastructure with real-time health metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs bg-white/50 backdrop-blur-sm">
                Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}
              </Badge>
              <Button
                onClick={() => fetchHealthData()}
                disabled={refreshing}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="mb-8">
          <div className={`group cursor-pointer`}>
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getStatusGradient(healthData.systemHealth.status)} p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    {healthData.systemHealth.status === 'excellent' && <CheckCircle className="h-12 w-12" />}
                    {healthData.systemHealth.status === 'good' && <CheckCircle className="h-12 w-12" />}
                    {healthData.systemHealth.status === 'warning' && <AlertTriangle className="h-12 w-12" />}
                    {healthData.systemHealth.status === 'critical' && <AlertTriangle className="h-12 w-12" />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold capitalize mb-2">{healthData.systemHealth.status}</h2>
                    <p className="text-lg opacity-90">System Health Score: {healthData.systemHealth.score}%</p>
                    <p className="text-sm opacity-75 mt-1">{healthData.systemHealth.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold mb-2">{healthData.systemHealth.score}%</div>
                  <div className="text-lg opacity-90">Health Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm font-medium">Healthy Accounts</p>
                  <p className="text-3xl font-bold">{healthData.accounts.healthy}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-200" />
                <span className="text-green-100 text-sm font-medium">of {healthData.accounts.total} total</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Zap className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Hourly Capacity</p>
                  <p className="text-3xl font-bold">{healthData.statistics.hourlyCapacity.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">emails/hour</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Success Rate</p>
                  <p className="text-3xl font-bold">{healthData.statistics.successRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">overall performance</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Emails Sent</p>
                  <p className="text-3xl font-bold">{healthData.statistics.totalSent.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">total delivered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Server className="h-5 w-5" />
              </div>
              Email System Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="accounts" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="accounts">Account Details</TabsTrigger>
                <TabsTrigger value="queue">Email Queue</TabsTrigger>
                <TabsTrigger value="errors">Recent Errors</TabsTrigger>
                <TabsTrigger value="actions">System Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="space-y-4">
                <div className="space-y-4">
                  {healthData.accounts.details.map((account, index) => (
                    <div key={account.email} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${account.isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium text-slate-800">{account.email}</p>
                          <p className="text-sm text-slate-600">
                            {account.totalSent} sent, {account.totalFailed} failed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">{account.successRate.toFixed(1)}%</p>
                          <p className="text-xs text-slate-500">success rate</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-800">{account.hourlyCount}/{account.hourlyLimit}</p>
                          <p className="text-xs text-slate-500">hourly usage</p>
                        </div>
                        <Badge variant={account.isHealthy ? "default" : "destructive"}>
                          {account.isHealthy ? 'Healthy' : 'Unhealthy'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="queue" className="space-y-4">
                {healthData.queue ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                      <div className="text-3xl font-bold text-yellow-600 mb-2">{healthData.queue.pending}</div>
                      <div className="text-sm font-medium text-yellow-800">Pending</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{healthData.queue.sending}</div>
                      <div className="text-sm font-medium text-blue-800">Sending</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-2">{healthData.queue.sent}</div>
                      <div className="text-sm font-medium text-green-800">Sent</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                      <div className="text-3xl font-bold text-red-600 mb-2">{healthData.queue.failed}</div>
                      <div className="text-sm font-medium text-red-800">Failed</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                      <div className="text-3xl font-bold text-gray-600 mb-2">{healthData.queue.total}</div>
                      <div className="text-sm font-medium text-gray-800">Total</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">Queue statistics not available</p>
                )}
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                {healthData.recentErrors && healthData.recentErrors.length > 0 ? (
                  <div className="space-y-3">
                    {healthData.recentErrors.map((error, index) => (
                      <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-red-800">{error.error}</p>
                            <p className="text-sm text-red-600">Account: {error.account}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-red-500 mb-2">
                              {new Date(error.timestamp).toLocaleString()}
                            </p>
                            <Badge variant={error.retryable ? "outline" : "destructive"}>
                              {error.retryable ? 'Retryable' : 'Critical'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">No recent errors</p>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => performHealthAction('healthCheck')}
                    disabled={refreshing}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white h-12"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Run Health Check
                  </Button>
                  <Button
                    onClick={() => performHealthAction('resetAllAccounts')}
                    disabled={refreshing}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-12"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset All Accounts
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800">Quick Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => window.open('/settings/email-system', '_blank')}
                      className="justify-start bg-white/50 hover:bg-white/80 border-2"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Email Settings
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open('/email-test', '_blank')}
                      className="justify-start bg-white/50 hover:bg-white/80 border-2"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Test Email System
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 