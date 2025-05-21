'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart,
  Mail, 
  MessageSquare, 
  BellRing,
  Loader2 
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { MetricCard } from '@/components/MetricCard'
import { getCommsMetrics, GlobalCommsMetrics } from '@/services/comms/campaigns'

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<GlobalCommsMetrics>({
    total_campaigns: 0,
    active_campaigns: 0,
    scheduled_campaigns: 0,
    completed_campaigns: 0,
    total_templates: 0,
    email_templates: 0,
    sms_templates: 0,
    whatsapp_templates: 0,
    push_templates: 0
  })
  const [loading, setLoading] = useState(true)
  
  // Load metrics
  useEffect(() => {
    async function loadMetrics() {
      setLoading(true)
      try {
        const { data, error } = await getCommsMetrics()
        
        if (error) throw error
        if (data) {
          setMetrics(data)
        }
      } catch (error) {
        console.error('Failed to load communication metrics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMetrics()
  }, [])
  
  // Calculate engagement metrics (placeholder for demo)
  const engagementMetrics = {
    emailDeliveryRate: 96.5,
    emailOpenRate: 28.7,
    emailClickRate: 12.3,
    smsDeliveryRate: 97.8,
    whatsappDeliveryRate: 98.2,
    pushClickRate: 15.4
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-300px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Communication Analytics</CardTitle>
          <CardDescription>
            Overview of your communication channels and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="push">Push</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Total Templates"
                  value={metrics.total_templates}
                  icon={<BarChart className="h-6 w-6" />}
                  formatter="number"
                />
                <MetricCard
                  title="Total Campaigns"
                  value={metrics.total_campaigns}
                  icon={<Mail className="h-6 w-6" />}
                  formatter="number"
                />
                <MetricCard
                  title="Active Campaigns"
                  value={metrics.active_campaigns}
                  icon={<MessageSquare className="h-6 w-6" />}
                  formatter="number"
                />
                <MetricCard
                  title="Completed Campaigns"
                  value={metrics.completed_campaigns}
                  icon={<BellRing className="h-6 w-6" />}
                  formatter="number"
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Channel Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.email_templates} / {metrics.sms_templates} / {metrics.whatsapp_templates} / {metrics.push_templates}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email / SMS / WhatsApp / Push
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Email Tab */}
            <TabsContent value="email" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Email Templates"
                  value={metrics.email_templates}
                  icon={<Mail className="h-6 w-6" />}
                  formatter="number"
                />
                <MetricCard
                  title="Delivery Rate"
                  value={engagementMetrics.emailDeliveryRate}
                  icon={<Mail className="h-6 w-6" />}
                  formatter="percentage"
                />
                <MetricCard
                  title="Open Rate"
                  value={engagementMetrics.emailOpenRate}
                  icon={<Mail className="h-6 w-6" />}
                  formatter="percentage"
                />
                <MetricCard
                  title="Click Rate"
                  value={engagementMetrics.emailClickRate}
                  icon={<Mail className="h-6 w-6" />}
                  formatter="percentage"
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Popular Email Templates</CardTitle>
                  <CardDescription>
                    Templates with the highest engagement rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Connect to the analytics service to view popular templates.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* SMS Tab */}
            <TabsContent value="sms" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                  title="SMS Templates"
                  value={metrics.sms_templates}
                  icon={<MessageSquare className="h-6 w-6" />}
                  formatter="number"
                />
                <MetricCard
                  title="Delivery Rate"
                  value={engagementMetrics.smsDeliveryRate}
                  icon={<MessageSquare className="h-6 w-6" />}
                  formatter="percentage"
                />
                <MetricCard
                  title="WhatsApp Delivery Rate"
                  value={engagementMetrics.whatsappDeliveryRate}
                  icon={<MessageSquare className="h-6 w-6" />}
                  formatter="percentage"
                />
              </div>
            </TabsContent>
            
            {/* Push Tab */}
            <TabsContent value="push" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                  title="Push Templates"
                  value={metrics.push_templates}
                  icon={<BellRing className="h-6 w-6" />}
                  formatter="number"
                />
                <MetricCard
                  title="Click Rate"
                  value={engagementMetrics.pushClickRate}
                  icon={<BellRing className="h-6 w-6" />}
                  formatter="percentage"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>This is a basic analytics dashboard. Connect to analytics services for detailed insights.</p>
      </div>
    </div>
  )
} 