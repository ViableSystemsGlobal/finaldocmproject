'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Send, Play, MailCheck, AlertTriangle, Clock, Loader2, Eye, BarChart3, Users, Mail as MailIcon, Calendar, CheckCircle, XCircle, BellRing, Smartphone } from 'lucide-react';
import React from 'react';
import PreviewLink from '@/components/email/PreviewLink';
import Link from 'next/link';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

// Services and types
import { 
  Campaign,
  fetchCampaign, 
  deleteCampaign, 
  sendCampaignNow,
  getCommsMetrics,
  GlobalCommsMetrics,
  getCampaignMetrics,
  CampaignMetrics,
  fetchCampaignRecipients,
  dispatchCampaign,
  getCampaignEmailStats,
  getCampaignEmailItems,
  getCampaignStats,
  getCampaignItems
} from '@/services/comms/campaigns'
import { useNextParams } from '@/lib/nextParams';
import { DispatchModal } from '@/components/campaigns/DispatchModal';

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  // Use the useNextParams utility to safely handle params
  const paramsResult = useNextParams(params);
  
  // Extract campaignId properly based on the return type
  const campaignId = typeof paramsResult === 'string' ? paramsResult : paramsResult?.id || '';
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  
  // Fetch campaign data
  const { 
    data: campaignData, 
    isLoading: isLoadingCampaign,
    refetch: refetchCampaign
  } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaign(campaignId),
  });
  
  const campaign = campaignData?.data;
  
  // Determine if this is a push notification campaign
  const isPushCampaign = campaign?.channel === 'push';
  
  // Fetch recipients
  const { 
    data: recipientsData, 
    isLoading: isLoadingRecipients,
    refetch: refetchRecipients
  } = useQuery({
    queryKey: ['campaign-recipients', campaignId],
    queryFn: () => fetchCampaignRecipients(campaignId),
    enabled: !!campaignId,
  });
  
  const recipients = recipientsData?.data || [];
  
  // Fetch email queue stats
  const { 
    data: campaignStatsData, 
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: () => getCampaignStats(campaignId),
    enabled: !!campaignId,
    refetchInterval: campaign?.status === 'sending' ? 5000 : false,
  });
  
  const campaignStats = campaignStatsData?.stats || { pending: 0, sent: 0, failed: 0, total: 0 };
  
  // Fetch campaign queue items
  const { 
    data: queueItemsData, 
    isLoading: isLoadingQueue,
    refetch: refetchQueue
  } = useQuery({
    queryKey: ['campaign-queue-items', campaignId, activeTab],
    queryFn: () => getCampaignItems(
      campaignId, 
      activeTab === 'pending' ? 'pending' : 
      activeTab === 'sent' ? 'sent' : 
      activeTab === 'failed' ? 'failed' : undefined
    ),
    enabled: !!campaignId && ['all', 'pending', 'sent', 'failed'].includes(activeTab),
  });
  
  const queueItems = queueItemsData?.data || [];
  
  // Calculate progress percentage
  const progressPercentage = campaignStats.total > 0 
    ? Math.round((campaignStats.sent / campaignStats.total) * 100) 
    : 0;
  
  // Dispatch campaign mutation
  const { mutate: dispatchMutation, isPending: isDispatching } = useMutation({
    mutationFn: () => dispatchCampaign(campaignId),
    onSuccess: () => {
      toast({
        title: 'Campaign dispatched',
        description: `The ${isPushCampaign ? 'push notification' : 'campaign'} is now being sent to recipients.`,
      });
      refetchCampaign();
      refetchStats();
      refetchQueue();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to dispatch campaign',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Handle dispatch button click - now opens modal
  const handleDispatch = () => {
    setDispatchModalOpen(true);
  };
  
  // Refresh data at regular intervals when sending
  useEffect(() => {
    if (campaign?.status === 'sending') {
      const interval = setInterval(() => {
        refetchCampaign();
        refetchStats();
        refetchQueue();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [campaign?.status, refetchCampaign, refetchStats, refetchQueue]);
  
  // Update the send mutation but simplify it
  const sendMutation = useMutation({
    mutationFn: async () => {
      return await sendCampaignNow(campaignId);
    },
    onSuccess: () => {
      toast({
        title: 'Campaign Sent',
        description: 'Campaign has been sent successfully. Check the console for test email preview links.'
      });
      refetchCampaign();
    },
    onError: (error) => {
      console.error('Error sending campaign:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send campaign. Please try again.'
      });
    }
  });
  
  if (isLoadingCampaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Campaign</h2>
          <p className="text-slate-600">Fetching campaign details...</p>
        </div>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Send className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Campaign Not Found</h2>
          <p className="text-slate-600 mb-6">The campaign you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push('/comms/campaigns')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              asChild
              className="p-2 hover:bg-white/80 rounded-xl"
            >
              <Link href="/comms/campaigns">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className={`relative bg-gradient-to-r ${isPushCampaign ? 'from-purple-500 to-pink-500' : 'from-indigo-500 to-purple-500'} p-3 rounded-2xl`}>
                  {isPushCampaign ? (
                    <BellRing className="h-6 w-6 text-white" />
                  ) : (
                    <Send className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    {campaign.name}
                  </h1>
                  <StatusBadge status={campaign.status} />
                </div>
                <p className="text-lg text-slate-600 mt-1">
                  {isPushCampaign 
                    ? (campaign.template?.subject || 'No title') 
                    : (campaign.template?.subject || 'No subject')
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {['draft', 'scheduled'].includes(campaign.status) && (
              <Button 
                onClick={handleDispatch}
                disabled={isDispatching || (!isPushCampaign && recipients.length === 0)}
                className={`bg-gradient-to-r ${isPushCampaign ? 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' : 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700'} text-white rounded-xl`}
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    {isPushCampaign ? (
                      <BellRing className="mr-2 h-4 w-4" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Dispatch Now
                  </>
                )}
              </Button>
            )}
            {campaign.status === 'sending' && (
              <Button variant="outline" disabled className="rounded-xl">
                <Play className="mr-2 h-4 w-4" />
                Sending...
              </Button>
            )}
          </div>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Recipients"
            value={campaignStats.total || recipients.length || 0}
            icon={isPushCampaign ? <Smartphone className="h-6 w-6" /> : <Users className="h-6 w-6" />}
            description={isPushCampaign ? "Mobile app users targeted" : "Total contacts targeted"}
            className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200"
            iconBg="from-blue-500 to-indigo-500"
          />
          <MetricCard
            title="Pending"
            value={campaignStats.pending}
            icon={<Clock className="h-6 w-6" />}
            description={isPushCampaign ? "Push notifications waiting to be sent" : "Emails waiting to be sent"}
            className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200"
            iconBg="from-amber-500 to-orange-500"
          />
          <MetricCard
            title="Sent"
            value={campaignStats.sent}
            icon={isPushCampaign ? <BellRing className="h-6 w-6" /> : <MailCheck className="h-6 w-6" />}
            description="Successfully delivered"
            className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200"
            iconBg="from-green-500 to-emerald-500"
          />
          <MetricCard
            title="Failed"
            value={campaignStats.failed}
            icon={<AlertTriangle className="h-6 w-6" />}
            description="Failed to deliver"
            className="bg-gradient-to-br from-red-50 to-pink-100 border-red-200"
            iconBg="from-red-500 to-pink-500"
          />
        </div>
        
        {/* Progress Card */}
        {campaignStats.total > 0 && (
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Delivery Progress</h2>
                  <p className="text-slate-300">
                    {progressPercentage}% complete ({campaignStats.sent} of {campaignStats.total})
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <Progress value={progressPercentage} className="h-3 bg-slate-200" />
            </div>
          </div>
        )}
        
        <Separator className="my-8 bg-slate-300" />
        
        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Campaign Details</h2>
                <p className="text-slate-300">View campaign information and delivery status</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-8 bg-slate-100/50 p-1 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg">
                  {isPushCampaign ? 'All Push' : 'All Emails'}
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
                <TabsTrigger value="sent" className="rounded-lg">Sent</TabsTrigger>
                <TabsTrigger value="failed" className="rounded-lg">Failed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Campaign Info */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Campaign Timeline</p>
                        <p className="text-lg font-semibold text-blue-800">
                          Created: {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-blue-600">
                          {campaign.scheduled_at 
                            ? `Scheduled: ${new Date(campaign.scheduled_at).toLocaleString()}`
                            : 'Send immediately'
                          }
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-4 p-4 bg-gradient-to-r ${isPushCampaign ? 'from-purple-50 to-pink-50 border-purple-200' : 'from-purple-50 to-pink-50 border-purple-200'} rounded-xl border`}>
                      <div className={`bg-gradient-to-r ${isPushCampaign ? 'from-purple-500 to-pink-500' : 'from-purple-500 to-pink-500'} p-3 rounded-xl`}>
                        {isPushCampaign ? (
                          <BellRing className="h-6 w-6 text-white" />
                        ) : (
                          <MailIcon className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">
                          {isPushCampaign ? 'Push Notification Title' : 'Email Subject'}
                        </p>
                        <p className="text-lg font-semibold text-purple-800">
                          {isPushCampaign 
                            ? (campaign.template?.subject || 'No title')
                            : (campaign.template?.subject || 'No subject')
                          }
                        </p>
                        <p className="text-sm text-purple-600">Ready to send</p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Recipients */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Campaign Status</p>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={campaign.status} />
                          <span className="text-lg font-semibold text-green-800 capitalize">{campaign.status}</span>
                        </div>
                        <p className="text-sm text-green-600">Last updated: {new Date(campaign.updated_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-3 rounded-xl">
                        {isPushCampaign ? (
                          <Smartphone className="h-6 w-6 text-white" />
                        ) : (
                          <Users className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600">
                          {isPushCampaign ? 'Mobile App Users' : 'Recipients'}
                        </p>
                        <p className="text-2xl font-bold text-orange-800">{recipients.length}</p>
                        <p className="text-sm text-orange-600">
                          {isPushCampaign ? 'Total mobile app users targeted' : 'Total recipients selected'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Content Preview */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">
                    {isPushCampaign ? 'Push Notification Preview' : 'Email Preview'}
                  </h4>
                  <div className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm">
                    {isPushCampaign ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                            <BellRing className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">Push Notification</p>
                            <p className="text-sm text-slate-600">Mobile App Notification</p>
                          </div>
                        </div>
                        <div className="mb-4 pb-4 border-b border-slate-200">
                          <strong className="text-slate-700">Title:</strong> 
                          <span className="ml-2 text-slate-800">{campaign.template?.subject || 'No title'}</span>
                        </div>
                        <div>
                          <strong className="text-slate-700">Message:</strong>
                          <div 
                            className="mt-2 prose prose-sm dark:prose-invert max-w-none text-slate-700" 
                            dangerouslySetInnerHTML={{ __html: campaign.template?.body || 'No message content' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4 pb-4 border-b border-slate-200">
                          <strong className="text-slate-700">Subject:</strong> 
                          <span className="ml-2 text-slate-800">{campaign.template?.subject || 'No subject'}</span>
                        </div>
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none text-slate-700" 
                          dangerouslySetInnerHTML={{ __html: campaign.template?.body || '' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recipients Summary */}
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-4">
                    {isPushCampaign ? 'Mobile App Users Summary' : 'Recipients Summary'}
                  </h4>
                  {isLoadingRecipients ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    </div>
                  ) : recipients.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-indigo-600">
                        {isPushCampaign 
                          ? 'No mobile app users will receive this push notification yet. Recipients will be added when the campaign is dispatched.'
                          : 'No recipients added to this campaign yet.'
                        }
                      </p>
                      {!isPushCampaign && (
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => router.push(`/comms/campaigns/${campaignId}/recipients`)}
                        >
                          Add Recipients
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
                          <TableRow>
                            <TableHead className="py-4 font-bold text-indigo-700">
                              {isPushCampaign ? 'User' : 'Email'}
                            </TableHead>
                            <TableHead className="py-4 font-bold text-indigo-700">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recipients.slice(0, 10).map((recipient) => (
                            <TableRow key={recipient.id} className="hover:bg-indigo-50/50 transition-colors">
                              <TableCell className="py-3 font-medium text-slate-800">
                                {isPushCampaign ? (recipient.user_id || 'Mobile User') : recipient.to_address}
                              </TableCell>
                              <TableCell className="py-3">
                                <StatusBadge status={recipient.status} size="sm" />
                              </TableCell>
                            </TableRow>
                          ))}
                          {recipients.length > 10 && (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4">
                                <Button 
                                  variant="link" 
                                  onClick={() => router.push(`/comms/campaigns/${campaignId}/recipients`)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  View all {recipients.length} {isPushCampaign ? 'users' : 'recipients'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="all">
                <EmailQueueTable
                  items={queueItems}
                  isLoading={isLoadingQueue}
                  filter="all"
                  isPushCampaign={isPushCampaign}
                />
              </TabsContent>
              
              <TabsContent value="pending">
                <EmailQueueTable
                  items={queueItems}
                  isLoading={isLoadingQueue}
                  filter="pending"
                  isPushCampaign={isPushCampaign}
                />
              </TabsContent>
              
              <TabsContent value="sent">
                <EmailQueueTable
                  items={queueItems}
                  isLoading={isLoadingQueue}
                  filter="sent"
                  isPushCampaign={isPushCampaign}
                />
              </TabsContent>
              
              <TabsContent value="failed">
                <EmailQueueTable
                  items={queueItems}
                  isLoading={isLoadingQueue}
                  filter="failed"
                  isPushCampaign={isPushCampaign}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Show the PreviewLink component if there's a URL */}
        {previewUrl && <PreviewLink url={previewUrl} />}
        
        {/* Dispatch Modal */}
        <DispatchModal
          open={dispatchModalOpen}
          onOpenChange={setDispatchModalOpen}
          campaign={{
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            channel: campaign.channel || 'email' // Use actual channel from campaign
          }}
          recipients={recipients}
          onSuccess={() => {
            refetchCampaign();
            refetchStats();
            refetchQueue();
          }}
        />
      </div>
    </div>
  );
}

// Helper components

interface MetricCardProps {
  title: string;
  value: number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  iconBg?: string;
}

function MetricCard({ title, value, icon, description, className = '', iconBg = '' }: MetricCardProps) {
  return (
    <div className={`p-6 rounded-2xl shadow-lg border ${className}`}>
      <div className="flex items-center gap-4">
        <div className={`bg-gradient-to-r ${iconBg} p-3 rounded-xl shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, size = 'default' }: { status: string; size?: 'default' | 'sm' }) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let colorClass = '';
  
  switch (status) {
    case 'draft':
      variant = 'outline';
      colorClass = 'border-slate-300 text-slate-600 bg-slate-50';
      break;
    case 'scheduled':
      variant = 'secondary';
      colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'sending':
      variant = 'secondary';
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case 'completed':
      variant = 'default';
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      break;
    case 'failed':
      variant = 'destructive';
      colorClass = 'bg-red-100 text-red-800 border-red-200';
      break;
    case 'pending':
      variant = 'outline';
      colorClass = 'border-amber-300 text-amber-700 bg-amber-50';
      break;
    case 'sent':
      variant = 'default';
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      break;
  }
  
  return (
    <Badge 
      variant={variant} 
      className={`${size === 'sm' ? 'text-xs py-0' : ''} ${colorClass} font-semibold`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function EmailQueueTable({ 
  items, 
  isLoading, 
  filter, 
  isPushCampaign 
}: { 
  items: any[]; 
  isLoading: boolean; 
  filter: 'all' | 'pending' | 'sent' | 'failed'; 
  isPushCampaign: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  
  if (items.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
        <p className="text-slate-600">
          No {filter !== 'all' ? filter : ''} {isPushCampaign ? 'push notifications' : 'recipients'} found.
        </p>
      </div>
    );
  }
  
  return (
    <div className="border-2 border-slate-200 rounded-xl bg-white/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
          <TableRow>
            <TableHead className="py-4 font-bold text-slate-700">
              {isPushCampaign ? 'User' : 'Email'}
            </TableHead>
            <TableHead className="py-4 font-bold text-slate-700">
              {isPushCampaign ? 'Device' : 'Contact'}
            </TableHead>
            <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
            <TableHead className="py-4 font-bold text-slate-700">Added</TableHead>
            <TableHead className="py-4 font-bold text-slate-700">
              {isPushCampaign ? 'Sent At' : 'Sent At'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <TableCell className="font-medium py-4 text-slate-800">
                {isPushCampaign ? (item.user_id || 'Mobile User') : item.to_address}
              </TableCell>
              <TableCell className="py-4 text-slate-600">
                {isPushCampaign ? (
                  item.push_token ? 'Mobile Device' : 'Unknown Device'
                ) : (
                  item.contact ? 
                    `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim() || 'Unknown' 
                    : 'Unknown'
                )}
              </TableCell>
              <TableCell className="py-4">
                <StatusBadge status={item.status} size="sm" />
              </TableCell>
              <TableCell className="py-4 text-slate-600">
                {new Date(item.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="py-4 text-slate-600">
                {item.sent_at ? new Date(item.sent_at).toLocaleString() : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 