'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Share2, 
  Globe, 
  Eye, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Calendar,
  Filter,
  Download,
  Target,
  Activity,
  Zap,
  PieChart,
  LineChart,
  MousePointer,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { getDateRange, exportToCSV, formatDisplayDate, getPeriodDisplayName, formatPercentage } from '@/lib/utils'

// Placeholder data for development
const PLACEHOLDER_DATA = {
  summary: {
    totalEmails: 14823,
    emailOpenRate: 32.7,
    totalSms: 5428,
    smsResponseRate: 21.3,
    socialMediaEngagement: 8.6,
    websiteVisits: 3245,
    averageClickRate: 4.2
  },
  emailCampaigns: [
    { id: 1, name: 'Easter Service Invitation', sentDate: '2025-04-12', sent: 1245, opened: 642, clicked: 328, openRate: 51.6, clickRate: 26.3 },
    { id: 2, name: 'Weekly Newsletter - Apr 5', sentDate: '2025-04-05', sent: 1238, opened: 527, clicked: 183, openRate: 42.6, clickRate: 14.8 },
    { id: 3, name: 'Special Event Announcement', sentDate: '2025-03-28', sent: 1242, opened: 581, clicked: 247, openRate: 46.8, clickRate: 19.9 },
    { id: 4, name: 'Weekly Newsletter - Mar 29', sentDate: '2025-03-29', sent: 1236, opened: 498, clicked: 156, openRate: 40.3, clickRate: 12.6 },
    { id: 5, name: 'Ministry Updates', sentDate: '2025-03-22', sent: 1240, opened: 532, clicked: 198, openRate: 42.9, clickRate: 16.0 },
  ],
  smsMessages: [
    { id: 1, name: 'Service Reminder', sentDate: '2025-04-13', sent: 842, delivered: 836, responded: 216, deliveryRate: 99.3, responseRate: 25.6 },
    { id: 2, name: 'Prayer Request', sentDate: '2025-04-08', sent: 458, delivered: 452, responded: 112, deliveryRate: 98.7, responseRate: 24.5 },
    { id: 3, name: 'Weather Alert', sentDate: '2025-04-02', sent: 856, delivered: 848, responded: 324, deliveryRate: 99.1, responseRate: 37.9 },
    { id: 4, name: 'Event Reminder', sentDate: '2025-03-25', sent: 632, delivered: 625, responded: 98, deliveryRate: 98.9, responseRate: 15.5 },
    { id: 5, name: 'Volunteer Confirmation', sentDate: '2025-03-18', sent: 124, delivered: 123, responded: 96, deliveryRate: 99.2, responseRate: 77.4 },
  ],
  socialMedia: {
    platforms: [
      { name: 'Facebook', followers: 2450, engagement: 3.8, growth: 2.4 },
      { name: 'Instagram', followers: 1875, engagement: 5.2, growth: 4.1 },
      { name: 'Twitter', followers: 1240, engagement: 2.1, growth: 1.8 },
      { name: 'YouTube', followers: 860, engagement: 12.5, growth: 5.6 },
    ],
    topPosts: [
      { platform: 'Instagram', date: '2025-04-10', content: 'Easter Service Announcement', engagement: 245, reach: 1240 },
      { platform: 'Facebook', date: '2025-04-05', content: 'Worship Team Rehearsal', engagement: 186, reach: 1560 },
      { platform: 'YouTube', date: '2025-03-29', content: 'Pastor\'s Weekly Message', engagement: 324, reach: 980 },
      { platform: 'Instagram', date: '2025-03-22', content: 'Youth Group Event', engagement: 198, reach: 1120 },
    ]
  },
  websiteAnalytics: {
    pageViews: [
      { page: 'Home', views: 1248, avgTime: 2.4, bounceRate: 35.6 },
      { page: 'Service Times', views: 865, avgTime: 1.8, bounceRate: 28.3 },
      { page: 'About Us', views: 542, avgTime: 3.1, bounceRate: 42.1 },
      { page: 'Events', views: 738, avgTime: 2.7, bounceRate: 31.5 },
      { page: 'Sermons', views: 926, avgTime: 8.4, bounceRate: 22.7 },
    ],
    traffic: {
      sources: [
        { source: 'Direct', percentage: 42.3 },
        { source: 'Social Media', percentage: 28.7 },
        { source: 'Search Engines', percentage: 21.5 },
        { source: 'Email', percentage: 7.5 },
      ],
      devices: [
        { device: 'Mobile', percentage: 68.4 },
        { device: 'Desktop', percentage: 25.3 },
        { device: 'Tablet', percentage: 6.3 },
      ]
    }
  }
};

export default function CommunicationReportsPage() {
  const [data, setData] = useState(PLACEHOLDER_DATA);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [availableYears, setAvailableYears] = useState([2025, 2024, 2023]);
  const [isExporting, setIsExporting] = useState(false);
  
  useEffect(() => {
    const fetchCommunicationData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(PLACEHOLDER_DATA);
      } catch (error) {
        console.error('Error fetching communication data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunicationData();
  }, [selectedPeriod, selectedPlatform]);
  
  const handleDownloadReport = async () => {
    setIsExporting(true)
    try {
      // Prepare export data
      const exportData = []
      
      // Add summary metrics
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Email Open Rate',
        value: `${data.summary.emailOpenRate.toFixed(1)}%`,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Total SMS Sent',
        value: data.summary.totalSms.toLocaleString(),
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'SMS Response Rate',
        value: `${data.summary.smsResponseRate.toFixed(1)}%`,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Website Visits',
        value: data.summary.websiteVisits.toLocaleString(),
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Total Emails',
        value: data.summary.totalEmails.toLocaleString(),
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      // Add email campaigns data
      data.emailCampaigns.forEach(campaign => {
        exportData.push({
          section: 'Email Campaigns',
          metric: campaign.name,
          sent: campaign.sent.toLocaleString(),
          opened: campaign.opened.toLocaleString(),
          clicked: campaign.clicked.toLocaleString(),
          openRate: `${campaign.openRate.toFixed(1)}%`,
          clickRate: `${campaign.clickRate.toFixed(1)}%`,
          date: formatDisplayDate(new Date(campaign.sentDate)),
          period: getPeriodDisplayName(selectedPeriod)
        })
      })
      
      // Add social media platforms data
      data.socialMedia.platforms.forEach(platform => {
        exportData.push({
          section: 'Social Media',
          metric: platform.name,
          followers: platform.followers.toLocaleString(),
          engagement: `${platform.engagement}%`,
          growth: `${platform.growth}%`,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Add website analytics data
      data.websiteAnalytics.pageViews.forEach(page => {
        exportData.push({
          section: 'Website Analytics',
          metric: page.page,
          views: page.views.toLocaleString(),
          avgTime: `${page.avgTime} seconds`,
          bounceRate: `${page.bounceRate.toFixed(1)}%`,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Generate filename
      const filename = `communication-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
      
      // Export to CSV
      exportToCSV(filename, exportData)
      
      toast({
        title: 'Report Exported',
        description: `Communication report for ${getPeriodDisplayName(selectedPeriod)} has been downloaded successfully.`
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the report. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsExporting(false)
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Communication Reports</h2>
          <p className="text-slate-600">Analyzing communication data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-2xl">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Communication Reports
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track engagement across all communication channels
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[180px] bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px] bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleDownloadReport}
                variant="outline"
                className="bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl px-6"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600 mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Communication Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Email Performance</p>
                  <p className="text-3xl font-bold">{data.summary.emailOpenRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Open rate improvement</span>
              </div>
            </div>
          </div>
      
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">SMS Delivered</p>
                  <p className="text-3xl font-bold">{data.summary.totalSms.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">{data.summary.smsResponseRate.toFixed(1)}% response rate</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Share2 className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Social Reach</p>
                  <p className="text-3xl font-bold">{data.socialMedia.platforms.reduce((total, platform) => total + platform.engagement, 0).toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">+{data.socialMedia.platforms.reduce((total, platform) => total + platform.growth, 0).toFixed(1)}% growth</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Eye className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Website Visits</p>
                  <p className="text-3xl font-bold">{data.summary.websiteVisits.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Monthly page views</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="email" className="rounded-lg">Email</TabsTrigger>
            <TabsTrigger value="sms" className="rounded-lg">SMS</TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg">Social Media</TabsTrigger>
            <TabsTrigger value="website" className="rounded-lg">Website</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Channel Performance
                  </CardTitle>
                  <CardDescription>Communication effectiveness by channel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { channel: 'Email', rate: data.summary.emailOpenRate, metric: 'Open Rate', color: 'bg-blue-500' },
                      { channel: 'SMS', rate: data.summary.smsResponseRate, metric: 'Response Rate', color: 'bg-green-500' },
                      { channel: 'Social Media', rate: data.summary.socialMediaEngagement, metric: 'Engagement', color: 'bg-purple-500' },
                      { channel: 'Website', rate: data.summary.averageClickRate, metric: 'Click Rate', color: 'bg-orange-500' },
                    ].map((item) => (
                      <div key={item.channel} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{item.channel}</span>
                          <span className="text-sm text-slate-500">{item.rate}% {item.metric}</span>
                        </div>
                        <Progress value={item.rate} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Recent Campaign Performance
                  </CardTitle>
                  <CardDescription>Latest communication campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.emailCampaigns.slice(0, 4).map((campaign, index) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-blue-500' : 
                            index === 1 ? 'bg-purple-500' : 
                            index === 2 ? 'bg-green-500' : 'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{campaign.name}</div>
                            <div className="text-sm text-slate-600">{new Date(campaign.sentDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-800">{campaign.openRate}%</div>
                          <div className="text-xs text-slate-500">open rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Communication Goals & Metrics
                </CardTitle>
                <CardDescription>Key performance indicators and targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Email Subscribers', current: 2485, target: 3000, unit: '' },
                    { label: 'SMS Subscribers', current: 1847, target: 2500, unit: '' },
                    { label: 'Social Followers', current: 6425, target: 8000, unit: '' },
                    { label: 'Website Traffic', current: 3245, target: 4000, unit: '/month' }
                  ].map((goal) => (
                    <div key={goal.label} className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-800 mb-1">{goal.current.toLocaleString()}</div>
                      <div className="text-sm font-medium text-slate-600 mb-2">{goal.label}</div>
                      <Progress value={(goal.current / goal.target) * 100} className="h-2 mb-2" />
                      <div className="text-xs text-slate-500">
                        {((goal.current / goal.target) * 100).toFixed(1)}% of {goal.target.toLocaleString()}{goal.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-500" />
                    Email Performance
                  </CardTitle>
                  <CardDescription>Key email marketing metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { metric: 'Total Emails Sent', value: data.summary.totalEmails.toLocaleString(), change: '+12%' },
                    { metric: 'Average Open Rate', value: `${data.summary.emailOpenRate}%`, change: '+2.8%' },
                    { metric: 'Average Click Rate', value: `${data.summary.averageClickRate}%`, change: '+1.4%' },
                    { metric: 'Unsubscribe Rate', value: '0.8%', change: '-0.2%' }
                  ].map((item) => (
                    <div key={item.metric} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">{item.metric}</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{item.value}</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {item.change}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    Email Engagement Trends
                  </CardTitle>
                  <CardDescription>Open and click trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                    <LineChart className="h-12 w-12 text-purple-400 mb-4" />
                    <p className="text-purple-700 text-center">Email engagement chart would display here</p>
                  </div>
                </CardContent>
                <CardFooter className="bg-purple-50 rounded-b-xl">
                  <div className="text-sm text-purple-700">
                    <span className="font-medium">Best Day:</span> Tuesday (45% open rate)
                  </div>
                </CardFooter>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle>Recent Email Campaigns</CardTitle>
                <CardDescription>Performance of recent email campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Open Rate</TableHead>
                      <TableHead>Click Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.emailCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{new Date(campaign.sentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={campaign.openRate > 40 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {campaign.openRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={campaign.clickRate > 15 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {campaign.clickRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    SMS Performance
                  </CardTitle>
                  <CardDescription>Key SMS marketing metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { metric: 'Total SMS Sent', value: data.summary.totalSms.toLocaleString(), change: '+8%' },
                    { metric: 'Delivery Rate', value: '98.9%', change: '+0.3%' },
                    { metric: 'Response Rate', value: `${data.summary.smsResponseRate}%`, change: '+1.5%' },
                    { metric: 'Opt-out Rate', value: '0.4%', change: '-0.1%' }
                  ].map((item) => (
                    <div key={item.metric} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">{item.metric}</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{item.value}</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {item.change}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    SMS Response Patterns
                  </CardTitle>
                  <CardDescription>When people respond to SMS messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                    <BarChart3 className="h-12 w-12 text-yellow-400 mb-4" />
                    <p className="text-yellow-700 text-center">SMS response timing chart would display here</p>
                  </div>
                </CardContent>
                <CardFooter className="bg-yellow-50 rounded-b-xl">
                  <div className="text-sm text-yellow-700">
                    <span className="font-medium">Peak Response:</span> Within 15 minutes (68%)
                  </div>
                </CardFooter>
              </Card>
            </div>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle>Recent SMS Campaigns</CardTitle>
                <CardDescription>Performance of recent SMS messages</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Sent Date</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Delivery Rate</TableHead>
                      <TableHead>Response Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.smsMessages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium">{message.name}</TableCell>
                        <TableCell>{new Date(message.sentDate).toLocaleDateString()}</TableCell>
                        <TableCell>{message.sent.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            {message.deliveryRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={message.responseRate > 20 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {message.responseRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-purple-500" />
                    Platform Performance
                  </CardTitle>
                  <CardDescription>Social media engagement by platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.socialMedia.platforms.map((platform, index) => (
                    <div key={platform.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                          platform.name === 'Facebook' ? 'bg-blue-600' : 
                          platform.name === 'Instagram' ? 'bg-pink-500' : 
                          platform.name === 'Twitter' ? 'bg-sky-500' : 'bg-red-600'
                        }`}>
                          {platform.name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{platform.name}</div>
                          <div className="text-sm text-slate-600">{platform.followers.toLocaleString()} followers</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800">{platform.engagement}%</div>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          +{platform.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Top Performing Posts
                  </CardTitle>
                  <CardDescription>Most engaging social media content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.socialMedia.topPosts.map((post, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{post.platform}</Badge>
                        <span className="text-xs text-slate-500">{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                      <div className="font-medium text-slate-800 mb-2">{post.content}</div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>{post.engagement} engagements</span>
                        <span>{post.reach.toLocaleString()} reach</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Website Tab */}
          <TabsContent value="website" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-orange-500" />
                    Top Pages
                  </CardTitle>
                  <CardDescription>Most visited pages on your website</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.websiteAnalytics.pageViews.map((page, index) => (
                    <div key={page.page} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{page.page}</span>
                        <span className="text-sm text-slate-500">{page.views.toLocaleString()} views</span>
                      </div>
                      <Progress value={(page.views / 1500) * 100} className="h-3" />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Avg. time: {page.avgTime}min</span>
                        <span>Bounce: {page.bounceRate}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-blue-500" />
                    Traffic Sources
                  </CardTitle>
                  <CardDescription>How visitors find your website</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.websiteAnalytics.traffic.sources.map((source) => (
                      <div key={source.source} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{source.source}</span>
                          <span className="text-sm text-slate-500">{source.percentage}%</span>
                        </div>
                        <Progress value={source.percentage} className="h-3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-blue-50 rounded-b-xl">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">Device Split:</span> {data.websiteAnalytics.traffic.devices[0].percentage}% Mobile, {data.websiteAnalytics.traffic.devices[1].percentage}% Desktop
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 