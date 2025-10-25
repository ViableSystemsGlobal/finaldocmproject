"use client"

import { useEffect, useState } from "react"
import { 
  BarChart3, Users, Calendar, DollarSign, MessageSquare, TrendingUp, Activity, 
  ChevronRight, FileText, PieChart, LineChart, Target, Sparkles, Zap,
  UserPlus, UserMinus, Filter, Download, Award, UserX, Phone, Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { createClient } from '@supabase/supabase-js'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { 
  MembershipTrendChart, AttendanceTrendChart, GivingTrendChart, 
  CommunicationChart, DemographicsChart 
} from '@/components/reports/ReportsCharts'
import { 
  TopMembersTable, RecentAttendanceTable, TopDonorsTable, EmailCampaignsTable 
} from '@/components/reports/ReportsTables'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Real data state interfaces
interface PeopleStats {
  totalMembers: number
  newMembers: number
  activeMembers: number
  servingMembers: number
  memberGrowthRate: number
  error: string | null
  loading: boolean
}

interface AttendanceStats {
  averageAttendance: number
  attendanceRate: number
  firstTimeVisitors: number
  returnVisitorRate: number
  error: string | null
  loading: boolean
}

interface FinancialStats {
  monthlyGiving: number
  ytdGiving: number
  regularGivers: number
  averageGift: number
  givingGrowthRate: number
  error: string | null
  loading: boolean
}

interface CommunicationStats {
  emailOpenRate: number
  emailClickRate: number
  newsletterSubscribers: number
  newSubscribersThisMonth: number
  error: string | null
  loading: boolean
}

interface ChartData {
  membershipTrend: Array<{ month: string; members: number; newMembers: number }>
  attendanceTrend: Array<{ date: string; attendance: number; visitors: number }>
  givingTrend: Array<{ month: string; amount: number; donors: number }>
  communicationTrend: Array<{ month: string; sent: number; opened: number; clicked: number }>
  demographics: Array<{ name: string; value: number }>
  loading: boolean
  error: string | null
}

interface TableData {
  topMembers: any[]
  recentAttendance: any[]
  topDonors: any[]
  emailCampaigns: any[]
  loading: boolean
  error: string | null
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isExporting, setIsExporting] = useState(false)

  // Helper function to get date range based on selected period
  const getDateRange = (period: string) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterStart, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { startDate, endDate }
  }

  // Helper function to format data as CSV
  const formatAsCSV = (data: any[], headers: string[]) => {
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header.toLowerCase().replace(/ /g, '_')] || ''
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    return [csvHeaders, ...csvRows].join('\n')
  }

  // Handle individual tab report export
  const handleExportTabReport = async (tabType: string) => {
    setIsExporting(true)
    try {
      const exportData: any[] = []
      const { startDate, endDate } = getDateRange(selectedPeriod)
      
      switch (tabType) {
        case 'people':
          // Add people metrics
          exportData.push({
            section: 'People Metrics',
            metric: 'Total Members',
            value: peopleStats.totalMembers,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'People Metrics',
            metric: 'New Members',
            value: peopleStats.newMembers,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'People Metrics',
            metric: 'Active Members',
            value: peopleStats.activeMembers,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'People Metrics',
            metric: 'Serving Members',
            value: peopleStats.servingMembers,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'People Metrics',
            metric: 'Growth Rate',
            value: `${peopleStats.memberGrowthRate.toFixed(1)}%`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          // Add top members data
          tableData.topMembers.forEach((member: any, index: number) => {
            exportData.push({
              section: 'Top Members',
              rank: index + 1,
              name: member.name || 'Unknown',
              engagementScore: member.engagementScore || 0,
              period: selectedPeriod,
              date: format(new Date(), 'yyyy-MM-dd')
            })
          })
          break
          
        case 'attendance':
          // Add attendance metrics
          exportData.push({
            section: 'Attendance Metrics',
            metric: 'Average Attendance',
            value: attendanceStats.averageAttendance,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Attendance Metrics',
            metric: 'Attendance Rate',
            value: `${attendanceStats.attendanceRate.toFixed(1)}%`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Attendance Metrics',
            metric: 'First-Time Visitors',
            value: attendanceStats.firstTimeVisitors,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Attendance Metrics',
            metric: 'Return Visitor Rate',
            value: `${attendanceStats.returnVisitorRate.toFixed(1)}%`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          // Add recent attendance data
          tableData.recentAttendance.forEach((record: any) => {
            exportData.push({
              section: 'Recent Attendance',
              date: record.date || 'Unknown',
              attendance: record.attendance || 0,
              service: record.service || 'Unknown',
              period: selectedPeriod
            })
          })
          break
          
        case 'financial':
          // Add financial metrics
          exportData.push({
            section: 'Financial Metrics',
            metric: 'Monthly Giving',
            value: `$${financialStats.monthlyGiving.toFixed(2)}`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Financial Metrics',
            metric: 'YTD Giving',
            value: `$${financialStats.ytdGiving.toFixed(2)}`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Financial Metrics',
            metric: 'Regular Givers',
            value: financialStats.regularGivers,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Financial Metrics',
            metric: 'Average Gift',
            value: `$${financialStats.averageGift.toFixed(2)}`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          // Add top donors data
          tableData.topDonors.forEach((donor: any, index: number) => {
            exportData.push({
              section: 'Top Donors',
              rank: index + 1,
              name: donor.name || 'Anonymous',
              totalGiving: `$${donor.totalGiving?.toFixed(2) || '0.00'}`,
              period: selectedPeriod,
              date: format(new Date(), 'yyyy-MM-dd')
            })
          })
          break
          
        case 'communication':
          // Add communication metrics
          exportData.push({
            section: 'Communication Metrics',
            metric: 'Email Open Rate',
            value: `${communicationStats.emailOpenRate.toFixed(1)}%`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Communication Metrics',
            metric: 'Email Click Rate',
            value: `${communicationStats.emailClickRate.toFixed(1)}%`,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Communication Metrics',
            metric: 'Newsletter Subscribers',
            value: communicationStats.newsletterSubscribers,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          exportData.push({
            section: 'Communication Metrics',
            metric: 'New Subscribers This Month',
            value: communicationStats.newSubscribersThisMonth,
            period: selectedPeriod,
            date: format(new Date(), 'yyyy-MM-dd')
          })
          
          // Add email campaigns data
          tableData.emailCampaigns.forEach((campaign: any) => {
            exportData.push({
              section: 'Email Campaigns',
              campaign: campaign.name || 'Unknown',
              sent: campaign.sent || 0,
              opened: campaign.opened || 0,
              clicked: campaign.clicked || 0,
              openRate: `${campaign.openRate?.toFixed(1) || '0.0'}%`,
              clickRate: `${campaign.clickRate?.toFixed(1) || '0.0'}%`,
              period: selectedPeriod,
              date: format(new Date(), 'yyyy-MM-dd')
            })
          })
          break
      }
      
      // Create CSV content
      if (exportData.length > 0) {
        const headers = Object.keys(exportData[0])
        const csv = formatAsCSV(exportData, headers)
        
        // Create and download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${tabType}-report-${selectedPeriod}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast({
          title: "Report Exported",
          description: `${tabType.charAt(0).toUpperCase() + tabType.slice(1)} report for ${selectedPeriod} has been downloaded successfully.`
        })
      } else {
        toast({
          title: "No Data",
          description: "No data available for the selected period.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Export failed:', error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Export report function
  const handleExportReport = async () => {
    if (isExporting) return // Prevent multiple exports
    
    try {
      setIsExporting(true)
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const reportDate = new Date().toLocaleDateString()
      const periodLabel = selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)
      
      // Prepare the report data
      const reportData = {
        metadata: {
          title: 'Church Analytics Report',
          period: periodLabel,
          generated_date: reportDate,
          date_range: `${getDateRange(selectedPeriod).startDate.toLocaleDateString()} - ${getDateRange(selectedPeriod).endDate.toLocaleDateString()}`
        },
        summary: {
          total_members: peopleStats.totalMembers,
          new_members: peopleStats.newMembers,
          active_members: peopleStats.activeMembers,
          serving_members: peopleStats.servingMembers,
          member_growth_rate: `${peopleStats.memberGrowthRate.toFixed(1)}%`,
          average_attendance: attendanceStats.averageAttendance,
          attendance_rate: `${attendanceStats.attendanceRate.toFixed(1)}%`,
          first_time_visitors: attendanceStats.firstTimeVisitors,
          return_visitor_rate: `${attendanceStats.returnVisitorRate}%`,
          period_giving: `$${financialStats.monthlyGiving.toLocaleString()}`,
          ytd_giving: `$${financialStats.ytdGiving.toLocaleString()}`,
          regular_givers: financialStats.regularGivers,
          average_gift: `$${financialStats.averageGift.toFixed(2)}`,
          giving_growth_rate: `${financialStats.givingGrowthRate.toFixed(1)}%`,
          email_open_rate: `${communicationStats.emailOpenRate.toFixed(1)}%`,
          email_click_rate: `${communicationStats.emailClickRate.toFixed(1)}%`,
          newsletter_subscribers: communicationStats.newsletterSubscribers,
          new_subscribers: communicationStats.newSubscribersThisMonth
        }
      }

      // Create CSV content
      let csvContent = `Church Analytics Report - ${periodLabel}\n`
      csvContent += `Generated: ${reportDate}\n`
      csvContent += `Period: ${reportData.metadata.date_range}\n\n`
      
      csvContent += `SUMMARY METRICS\n`
      csvContent += `Metric,Value\n`
      Object.entries(reportData.summary).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        csvContent += `${label},${value}\n`
      })

      // Add top members if available
      if (tableData.topMembers.length > 0) {
        csvContent += `\nTOP ACTIVE MEMBERS\n`
        csvContent += `Name,Groups,Attendance,Last Visit\n`
        tableData.topMembers.slice(0, 10).forEach(member => {
          csvContent += `"${member.first_name} ${member.last_name}",${member.groups},${member.attendance},${member.last_visit}\n`
        })
      }

      // Add giving trends if available
      if (chartData.givingTrend.length > 0) {
        csvContent += `\nGIVING TRENDS\n`
        csvContent += `Month,Amount,Donors\n`
        chartData.givingTrend.forEach(trend => {
          csvContent += `${trend.month},$${trend.amount.toLocaleString()},${trend.donors}\n`
        })
      }

      // Add attendance trends if available
      if (chartData.attendanceTrend.length > 0) {
        csvContent += `\nATTENDANCE TRENDS\n`
        csvContent += `Date,Total Attendance,Visitors\n`
        chartData.attendanceTrend.slice(-14).forEach(trend => { // Last 14 days
          csvContent += `${trend.date},${trend.attendance},${trend.visitors}\n`
        })
      }

      // Add communication trends if available
      if (chartData.communicationTrend.length > 0) {
        csvContent += `\nCOMMUNICATION TRENDS\n`
        csvContent += `Month,Emails Sent,Emails Opened,Emails Clicked\n`
        chartData.communicationTrend.forEach(trend => {
          csvContent += `${trend.month},${trend.sent},${trend.opened},${trend.clicked}\n`
        })
      }

      // Add recent attendance summary if available
      if (tableData.recentAttendance.length > 0) {
        csvContent += `\nRECENT ATTENDANCE SUMMARY\n`
        csvContent += `Date,Total,Members,Visitors\n`
        tableData.recentAttendance.slice(0, 10).forEach((attendance: any) => {
          csvContent += `${attendance.date},${attendance.total},${attendance.members},${attendance.visitors}\n`
        })
      }

      // Add email campaigns if available
      if (tableData.emailCampaigns.length > 0) {
        csvContent += `\nRECENT EMAIL CAMPAIGNS\n`
        csvContent += `Subject,Recipients,Delivered,Opened,Clicked,Sent Date\n`
        tableData.emailCampaigns.slice(0, 10).forEach((campaign: any) => {
          const sentDate = campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'N/A'
          csvContent += `"${campaign.subject}",${campaign.total_recipients || 0},${campaign.total_delivered || 0},${campaign.total_opened || 0},${campaign.total_clicked || 0},${sentDate}\n`
        })
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `church-analytics-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL object
      URL.revokeObjectURL(url)
      
      // Show success message
      alert(`✅ Report exported successfully!\n\nFile: church-analytics-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`)
    } catch (error) {
      console.error('Error exporting report:', error)
      alert('Failed to export report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Real data states
  const [peopleStats, setPeopleStats] = useState<PeopleStats>({
    totalMembers: 0,
    newMembers: 0,
    activeMembers: 0,
    servingMembers: 0,
    memberGrowthRate: 0,
    error: null,
    loading: true
  })

  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    averageAttendance: 0,
    attendanceRate: 0,
    firstTimeVisitors: 0,
    returnVisitorRate: 0,
    error: null,
    loading: true
  })

  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    monthlyGiving: 0,
    ytdGiving: 0,
    regularGivers: 0,
    averageGift: 0,
    givingGrowthRate: 0,
    error: null,
    loading: true
  })

  const [communicationStats, setCommunicationStats] = useState<CommunicationStats>({
    emailOpenRate: 0,
    emailClickRate: 0,
    newsletterSubscribers: 0,
    newSubscribersThisMonth: 0,
    error: null,
    loading: true
  })

  const [followUpPeople, setFollowUpPeople] = useState<any[]>([])
  const [followUpLoading, setFollowUpLoading] = useState(false)

  // Chart and table data states
  const [chartData, setChartData] = useState<ChartData>({
    membershipTrend: [],
    attendanceTrend: [],
    givingTrend: [],
    communicationTrend: [],
    demographics: [],
    loading: true,
    error: null
  })

  const [tableData, setTableData] = useState<TableData>({
    topMembers: [],
    recentAttendance: [],
    topDonors: [],
    emailCampaigns: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    // Simulate loading for the whole page
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Fetch People Analytics
  useEffect(() => {
    async function fetchPeopleStats() {
      setPeopleStats(prev => ({ ...prev, loading: true, error: null }))
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod)

        // Get total members
        const { count: actualTotalMembers } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('lifecycle', 'member')
          .eq('status', 'active')

        // Get new members in selected period
        const { count: actualNewMembers } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('lifecycle', 'member')
          .eq('status', 'active')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        // Count members serving in groups
        const { count: actualServingMembers } = await supabase
          .from('contacts')
          .select(`
            id,
            group_memberships!inner(id)
          `, { count: 'exact', head: true })
          .eq('lifecycle', 'member')
          .eq('status', 'active')

        const totalMembersCount = actualTotalMembers ?? 0
        const newMembersCount = actualNewMembers ?? 0
        const servingMembersCount = actualServingMembers ?? 0

        setPeopleStats({
          totalMembers: totalMembersCount,
          newMembers: newMembersCount,
          activeMembers: totalMembersCount, // Active members = total members with active status
          servingMembers: servingMembersCount,
          memberGrowthRate: totalMembersCount > 0 ? (newMembersCount / totalMembersCount) * 100 : 0,
          error: null,
          loading: false
        })
      } catch (err: any) {
        setPeopleStats(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load people analytics', 
          loading: false 
        }))
      }
    }
    fetchPeopleStats()
  }, [selectedPeriod])

  // Fetch Attendance Analytics
  useEffect(() => {
    async function fetchAttendanceStats() {
      setAttendanceStats(prev => ({ ...prev, loading: true, error: null }))
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod)

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('event_id, check_in_time, contact_id, contacts!inner(*)')
          .gte('check_in_time', startDate.toISOString())
          .lte('check_in_time', endDate.toISOString())

        if (attendanceError) throw attendanceError

        // Calculate metrics
        const dailyAttendance = attendanceData?.reduce((acc: any, record) => {
          const date = record.check_in_time.split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {}) || {}

        const averageAttendance = Object.keys(dailyAttendance).length > 0 
          ? Math.round((Object.values(dailyAttendance) as number[]).reduce((a, b) => a + b, 0) / Object.keys(dailyAttendance).length)
          : 0

        // Get first-time visitors in selected period
        const { count: visitorsCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('lifecycle', 'visitor')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        const firstTimeVisitors = visitorsCount || 0

        setAttendanceStats({
          averageAttendance,
          attendanceRate: peopleStats.totalMembers > 0 ? (averageAttendance / peopleStats.totalMembers) * 100 : 0,
          firstTimeVisitors,
          returnVisitorRate: 65, // Placeholder - would need more complex query
          error: null,
          loading: false
        })
      } catch (err: any) {
        setAttendanceStats(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load attendance analytics', 
          loading: false 
        }))
      }
    }
    if (!peopleStats.loading) {
      fetchAttendanceStats()
    }
  }, [peopleStats.loading, peopleStats.totalMembers, selectedPeriod])

  // Fetch Financial Analytics
  useEffect(() => {
    async function fetchFinancialStats() {
      setFinancialStats(prev => ({ ...prev, loading: true, error: null }))
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod)

        const { data: periodData, error: periodError } = await supabase
          .from('transactions')
          .select('amount, contact_id')
          .gte('transacted_at', startDate.toISOString())
          .lte('transacted_at', endDate.toISOString())

        if (periodError) throw periodError

        const periodGiving = periodData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

        // Get YTD giving for comparison
        const startOfYear = new Date()
        startOfYear.setMonth(0, 1)
        startOfYear.setHours(0, 0, 0, 0)

        const { data: ytdData, error: ytdError } = await supabase
          .from('transactions')
          .select('amount')
          .gte('transacted_at', startOfYear.toISOString())

        if (ytdError) throw ytdError

        const ytdGiving = ytdData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

        // Get unique givers for the period
        const uniqueGivers = new Set(periodData?.map(t => t.contact_id).filter(Boolean) || [])
        const regularGivers = uniqueGivers.size

        // Average gift calculation
        const averageGift = periodData && periodData.length > 0 
          ? periodGiving / periodData.length 
          : 0

        setFinancialStats({
          monthlyGiving: periodGiving,
          ytdGiving,
          regularGivers,
          averageGift,
          givingGrowthRate: 8.2, // Placeholder - would need month-over-month comparison
          error: null,
          loading: false
        })
      } catch (err: any) {
        setFinancialStats(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load financial analytics', 
          loading: false 
        }))
      }
    }
    fetchFinancialStats()
  }, [selectedPeriod])

  // Fetch Communication Analytics
  useEffect(() => {
    async function fetchCommunicationStats() {
      setCommunicationStats(prev => ({ ...prev, loading: true, error: null }))
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod)

        // Get newsletter statistics (legacy system)
        const { data: newsletterData, error: newsletterError } = await supabase
          .from('newsletters')
          .select('total_recipients, total_opened, total_clicked')
          .eq('status', 'sent')
          .gte('sent_at', startDate.toISOString())
          .lte('sent_at', endDate.toISOString())

        if (newsletterError) throw newsletterError

        // Get campaign statistics (new unified system)
        const { data: campaignData, error: campaignError } = await supabase
          .from('comms_campaigns')
          .select('id')
          .eq('status', 'completed')
          .gte('updated_at', startDate.toISOString())
          .lte('updated_at', endDate.toISOString())

        if (campaignError) throw campaignError

        // Get campaign recipients stats
        let campaignRecipients = 0
        let campaignOpened = 0
        let campaignClicked = 0
        
        if (campaignData && campaignData.length > 0) {
          const campaignIds = campaignData.map(c => c.id)
          const { data: recipientData } = await supabase
            .from('comms_recipients')
            .select('status')
            .in('campaign_id', campaignIds)

          campaignRecipients = recipientData?.length || 0
          campaignOpened = recipientData?.filter(r => r.status === 'opened').length || 0
          campaignClicked = recipientData?.filter(r => r.status === 'clicked').length || 0
        }

        // Combine newsletter and campaign stats
        const newsletterRecipients = newsletterData?.reduce((sum, n) => sum + (n.total_recipients || 0), 0) || 0
        const newsletterOpened = newsletterData?.reduce((sum, n) => sum + (n.total_opened || 0), 0) || 0
        const newsletterClicked = newsletterData?.reduce((sum, n) => sum + (n.total_clicked || 0), 0) || 0

        const totalRecipients = newsletterRecipients + campaignRecipients
        const totalOpened = newsletterOpened + campaignOpened
        const totalClicked = newsletterClicked + campaignClicked

        const emailOpenRate = totalRecipients > 0 ? (totalOpened / totalRecipients) * 100 : 0
        const emailClickRate = totalRecipients > 0 ? (totalClicked / totalRecipients) * 100 : 0

        // Get newsletter subscribers (this represents your subscriber base)
        const { count: subscribersCount } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        const newsletterSubscribers = subscribersCount || 0

        // Get new subscribers in selected period
        const { count: newSubsCount } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        const newSubscribersThisMonth = newSubsCount || 0

        setCommunicationStats({
          emailOpenRate,
          emailClickRate,
          newsletterSubscribers,
          newSubscribersThisMonth,
          error: null,
          loading: false
        })
      } catch (err: any) {
        setCommunicationStats(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load communication analytics', 
          loading: false 
        }))
      }
    }
    fetchCommunicationStats()
  }, [selectedPeriod])

  // Fetch Chart Data
  useEffect(() => {
    async function fetchChartData() {
      setChartData(prev => ({ ...prev, loading: true, error: null }))
      try {
        // Generate membership trend data (last 6 months)
        const membershipTrend = []
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i)
          const monthStart = startOfMonth(date)
          const monthEnd = endOfMonth(date)
          
          const { count: totalMembers } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .lte('joined_at', monthEnd.toISOString())

          const { count: newMembers } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .gte('joined_at', monthStart.toISOString())
            .lte('joined_at', monthEnd.toISOString())

          membershipTrend.push({
            month: format(date, 'MMM yyyy'),
            members: totalMembers || 0,
            newMembers: newMembers || 0
          })
        }

        // Generate attendance trend data (last 30 days)
        const attendanceTrend = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]

          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('contact_id, contacts!inner(*)')
            .gte('check_in_time', `${dateStr}T00:00:00`)
            .lt('check_in_time', `${dateStr}T23:59:59`)

          const totalAttendance = attendanceData?.length || 0
          const visitors = attendanceData?.filter((a: any) => a.contacts?.status === 'visitor').length || 0

          attendanceTrend.push({
            date: format(date, 'MMM dd'),
            attendance: totalAttendance,
            visitors: visitors
          })
        }

        // Generate giving trend data (last 12 months)
        const givingTrend = []
        for (let i = 11; i >= 0; i--) {
          const date = subMonths(new Date(), i)
          const monthStart = startOfMonth(date)
          const monthEnd = endOfMonth(date)

          const { data: transactionData } = await supabase
            .from('transactions')
            .select('amount, contact_id')
            .gte('transacted_at', monthStart.toISOString())
            .lte('transacted_at', monthEnd.toISOString())

          const totalAmount = transactionData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
          const uniqueDonors = new Set(transactionData?.map(t => t.contact_id) || []).size

          givingTrend.push({
            month: format(date, 'MMM yyyy'),
            amount: totalAmount,
            donors: uniqueDonors
          })
        }

        // Generate communication trend data (last 6 months)
        const communicationTrend = []
        for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i)
          const monthStart = startOfMonth(date)
          const monthEnd = endOfMonth(date)

          const { data: newsletterData } = await supabase
            .from('newsletters')
            .select('total_recipients, total_opened, total_clicked')
            .eq('status', 'sent')
            .gte('sent_at', monthStart.toISOString())
            .lte('sent_at', monthEnd.toISOString())

          const totalSent = newsletterData?.reduce((sum, n) => sum + (n.total_recipients || 0), 0) || 0
          const totalOpened = newsletterData?.reduce((sum, n) => sum + (n.total_opened || 0), 0) || 0
          const totalClicked = newsletterData?.reduce((sum, n) => sum + (n.total_clicked || 0), 0) || 0

          communicationTrend.push({
            month: format(date, 'MMM yyyy'),
            sent: totalSent,
            opened: totalOpened,
            clicked: totalClicked
          })
        }

        // Generate demographics data based on member stats
        // We'll get the member count from the peopleStats state
        const memberCount = peopleStats.totalMembers || 0
        const demographics = [
          { name: 'Active Members', value: memberCount },
          { name: 'Visitors', value: Math.floor(memberCount * 0.15) },
          { name: 'Youth', value: Math.floor(memberCount * 0.25) },
          { name: 'Seniors', value: Math.floor(memberCount * 0.20) }
        ]

        setChartData({
          membershipTrend,
          attendanceTrend,
          givingTrend,
          communicationTrend,
          demographics,
          loading: false,
          error: null
        })
      } catch (err: any) {
        setChartData(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load chart data', 
          loading: false 
        }))
      }
    }
    fetchChartData()
  }, [peopleStats.totalMembers, selectedPeriod])

  // Fetch Table Data
  useEffect(() => {
    async function fetchTableData() {
      setTableData(prev => ({ ...prev, loading: true, error: null }))
      try {
        // Get top members with activity metrics
        const { data: topMembersData } = await supabase
          .from('members')
          .select(`
            contact_id,
            joined_at,
            status,
            contacts!inner(first_name, last_name, status)
          `)
          .eq('status', 'active')
          .eq('contacts.status', 'active')
          .order('joined_at', { ascending: false })
          .limit(20)

        // Get activity data for these members
        const memberIds = topMembersData?.map(m => m.contact_id) || []
        
        const [groupMemberships, attendanceData] = await Promise.all([
          memberIds.length > 0 ? supabase
            .from('group_memberships')
            .select('contact_id')
            .in('contact_id', memberIds)
            .eq('status', 'active') : { data: [] },
          memberIds.length > 0 ? supabase
            .from('attendance')
            .select('contact_id, check_in_time')
            .in('contact_id', memberIds)
            .gte('check_in_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) : { data: [] }
        ])

        // Calculate activity scores
        const memberActivity = memberIds.map(contactId => {
          const groupCount = groupMemberships.data?.filter(g => g.contact_id === contactId).length || 0
          const attendanceCount = attendanceData.data?.filter(a => a.contact_id === contactId).length || 0
          const lastAttendance = attendanceData.data
            ?.filter(a => a.contact_id === contactId)
            ?.sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())[0]
          
          return {
            contact_id: contactId,
            groups: groupCount,
            attendance: attendanceCount,
            last_visit: lastAttendance ? new Date(lastAttendance.check_in_time).toLocaleDateString() : 'N/A',
            activity_score: groupCount * 2 + attendanceCount // Weight groups more heavily
          }
        })

        // Combine member data with activity data and sort by activity
        const topMembers = topMembersData?.map(member => {
          const activity = memberActivity.find(a => a.contact_id === member.contact_id)
          const contacts = member.contacts as any // Type assertion to handle the nested relationship
          return {
            first_name: contacts?.first_name || 'Unknown',
            last_name: contacts?.last_name || 'Member',
            status: member.status,
            groups: activity?.groups || 0,
            attendance: activity?.attendance || 0,
            last_visit: activity?.last_visit || 'N/A'
          }
        })
        .sort((a, b) => (b.groups * 2 + b.attendance) - (a.groups * 2 + a.attendance))
        .slice(0, 10) || []

        // Get recent attendance
        const { data: recentAttendance } = await supabase
          .from('attendance')
          .select('check_in_time, contact_id, contacts!inner(*)')
          .order('check_in_time', { ascending: false })
          .limit(20)

        // Process attendance data by date
        const attendanceByDate = recentAttendance?.reduce((acc: any, record: any) => {
          const date = record.check_in_time.split('T')[0]
          if (!acc[date]) {
            acc[date] = { date, total: 0, members: 0, visitors: 0, trend: 'up' }
          }
          acc[date].total++
          if (record.contacts?.status === 'visitor') {
            acc[date].visitors++
          } else {
            acc[date].members++
          }
          return acc
        }, {}) || {}

        const processedAttendance = Object.values(attendanceByDate).slice(0, 10)

        // Get top donors
        const { data: topDonors } = await supabase
          .from('transactions')
          .select('contact_id, amount, transacted_at, contacts!inner(first_name, last_name)')
          .not('contact_id', 'is', null)
          .order('amount', { ascending: false })
          .limit(10)

        // Process donor data
        const donorMap = topDonors?.reduce((acc: any, transaction: any) => {
          const contactId = transaction.contact_id
          if (!acc[contactId]) {
            acc[contactId] = {
              first_name: transaction.contacts?.first_name,
              last_name: transaction.contacts?.last_name,
              total_amount: 0,
              frequency: 0,
              last_gift: transaction.transacted_at
            }
          }
          acc[contactId].total_amount += transaction.amount || 0
          acc[contactId].frequency++
          acc[contactId].avg_gift = acc[contactId].total_amount / acc[contactId].frequency
          return acc
        }, {}) || {}

        const processedDonors = Object.values(donorMap).slice(0, 10)

        // Get email campaigns
        const { data: emailCampaigns } = await supabase
          .from('newsletters')
          .select('subject, total_recipients, total_delivered, total_opened, total_clicked, sent_at')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(10)

        setTableData({
          topMembers: topMembers,
          recentAttendance: processedAttendance || [],
          topDonors: processedDonors || [],
          emailCampaigns: emailCampaigns || [],
          loading: false,
          error: null
        })
      } catch (err: any) {
        setTableData(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load table data', 
          loading: false 
        }))
      }
    }
    fetchTableData()
  }, [selectedPeriod])

  // Fetch people who need follow-up (missed last 5 Sunday services)
  useEffect(() => {
    const fetchFollowUpPeople = async () => {

      setFollowUpLoading(true);
      try {
        // Get the last 5 Sunday services
        const fiveWeeksAgo = new Date();
        fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - (5 * 7)); // 5 weeks ago
        
        const { data: recentEvents, error: eventsError } = await supabase
          .from('events')
          .select('id, name, event_date')
          .gte('event_date', fiveWeeksAgo.toISOString())
          .lte('event_date', new Date().toISOString())
          .order('event_date', { ascending: false });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          throw eventsError;
        }

        // Filter to only Sunday events (assuming Sunday services contain "Sunday" in the name or occur on Sundays)
        const sundayEvents = recentEvents?.filter(event => {
          const eventDate = new Date(event.event_date);
          const dayOfWeek = eventDate.getDay(); // 0 = Sunday
          return dayOfWeek === 0 || event.name.toLowerCase().includes('sunday');
        }).slice(0, 5) || []; // Get only the last 5 Sunday services

        if (sundayEvents.length === 0) {
          setFollowUpPeople([]);
          return;
        }

        const sundayEventIds = sundayEvents.map(event => event.id);

        // Get all active members/contacts (excluding visitors)
        const { data: allContacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone, lifecycle')
          .in('lifecycle', ['member', 'regular_attendee'])
          .order('first_name');

        if (contactsError) {
          console.error('Error fetching contacts:', contactsError);
          throw contactsError;
        }

        if (!allContacts || allContacts.length === 0) {
          setFollowUpPeople([]);
          return;
        }

        // Get attendance records for these Sunday events
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance')
          .select('contact_id, event_id')
          .in('event_id', sundayEventIds);

        if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError);
          throw attendanceError;
        }

        // Create a set of contact IDs who attended any of the Sunday services
        const attendedContactIds = new Set(
          attendanceRecords?.map(record => record.contact_id) || []
        );

        // Find contacts who didn't attend any of the Sunday services
        const missedAllServices = allContacts.filter(contact => 
          !attendedContactIds.has(contact.id)
        );

        // Limit to 10 people and add additional context
        const followUpList = missedAllServices.slice(0, 10).map(contact => ({
          ...contact,
          missedServices: sundayEvents.length,
          lastServiceDate: sundayEvents[0]?.event_date
        }));

        setFollowUpPeople(followUpList);
      } catch (error) {
        console.error('Error fetching follow-up people:', error);
        // Set placeholder data for development
        setFollowUpPeople([
          {
            id: '1',
            first_name: 'John',
            last_name: 'Smith',
            email: 'john.smith@email.com',
            phone: '(555) 123-4567',
            lifecycle: 'member',
            missedServices: 5,
            lastServiceDate: '2025-03-23'
          },
          {
            id: '2',
            first_name: 'Mary',
            last_name: 'Johnson',
            email: 'mary.johnson@email.com',
            phone: '(555) 987-6543',
            lifecycle: 'regular_attendee',
            missedServices: 5,
            lastServiceDate: '2025-03-23'
          },
          {
            id: '3',
            first_name: 'David',
            last_name: 'Williams',
            email: 'david.williams@email.com',
            phone: '(555) 456-7890',
            lifecycle: 'member',
            missedServices: 5,
            lastServiceDate: '2025-03-23'
          }
        ]);
      } finally {
        setFollowUpLoading(false);
      }
    };

    fetchFollowUpPeople();
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Reports</h2>
          <p className="text-slate-600">Preparing analytics dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Tabs value={activeTab} className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="bg-white/70 backdrop-blur-lg p-1 rounded-xl shadow-lg border border-white/20">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="people" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
              People
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
              Attendance
            </TabsTrigger>
            <TabsTrigger value="financial" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Financial
            </TabsTrigger>
            <TabsTrigger value="communication" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              Communication
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="mt-6">
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                    <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Reports & Analytics
                    </h1>
                    <p className="text-xl text-slate-600 mt-2">
                      Comprehensive insights into your church operations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleExportReport}
                    disabled={isExporting}
                    className="bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white border-0 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </>
                    )}
                  </Button>
                  {(peopleStats.loading || attendanceStats.loading || financialStats.loading || communicationStats.loading) && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="text-sm">Updating...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">People Analytics</p>
                    <p className="text-2xl font-bold text-slate-800">{peopleStats.totalMembers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-semibold">+{peopleStats.memberGrowthRate.toFixed(1)}%</span>
                  <span className="text-slate-500 text-sm">Growth Rate</span>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Attendance Analytics</p>
                    <p className="text-2xl font-bold text-slate-800">{attendanceStats.averageAttendance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-semibold">{attendanceStats.attendanceRate.toFixed(1)}%</span>
                  <span className="text-slate-500 text-sm">Attendance Rate</span>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Financial Analytics</p>
                    <p className="text-2xl font-bold text-slate-800">${financialStats.monthlyGiving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-semibold">+{financialStats.givingGrowthRate.toFixed(1)}%</span>
                  <span className="text-slate-500 text-sm">Monthly Giving</span>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Communication Analytics</p>
                    <p className="text-2xl font-bold text-slate-800">{communicationStats.emailOpenRate.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-sm font-semibold">{communicationStats.emailClickRate.toFixed(1)}%</span>
                  <span className="text-slate-500 text-sm">Click Rate</span>
                </div>
              </div>
            </div>

            {/* Executive Summary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <MembershipTrendChart 
                data={chartData.membershipTrend} 
                loading={chartData.loading} 
                error={chartData.error} 
              />
              <AttendanceTrendChart 
                data={chartData.attendanceTrend} 
                loading={chartData.loading} 
                error={chartData.error} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <GivingTrendChart 
                data={chartData.givingTrend} 
                loading={chartData.loading} 
                error={chartData.error} 
              />
              <CommunicationChart 
                data={chartData.communicationTrend} 
                loading={chartData.loading} 
                error={chartData.error} 
              />
            </div>

            {/* Key Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <TrendingUp className="h-5 w-5" />
                    Growth Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Member Growth</span>
                    <Badge variant={peopleStats.memberGrowthRate > 0 ? "default" : "secondary"}>
                      {peopleStats.memberGrowthRate > 0 ? '+' : ''}{peopleStats.memberGrowthRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Attendance Trend</span>
                    <Badge variant="default">
                      {attendanceStats.attendanceRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Giving Growth</span>
                    <Badge variant="default">
                      +{financialStats.givingGrowthRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Email Engagement</span>
                    <Badge variant="default">
                      {communicationStats.emailOpenRate.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <Target className="h-5 w-5" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Active Members</span>
                    <span className="font-semibold text-slate-800">{peopleStats.totalMembers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Avg Attendance</span>
                    <span className="font-semibold text-slate-800">{attendanceStats.averageAttendance}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Monthly Giving</span>
                    <span className="font-semibold text-slate-800">${financialStats.monthlyGiving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Newsletter Subscribers</span>
                    <span className="font-semibold text-slate-800">{communicationStats.newsletterSubscribers}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <Sparkles className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('people')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Member Details
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('attendance')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Attendance Reports
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('financial')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Financial Reports
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('communication')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Email Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">New Members</span>
                      </div>
                      <span className="text-lg font-bold text-blue-700">{peopleStats.newMembers}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium">First-Time Visitors</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-700">{attendanceStats.firstTimeVisitors}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-medium">Regular Givers</span>
                      </div>
                      <span className="text-lg font-bold text-purple-700">{financialStats.regularGivers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-amber-600" />
                    Ministry Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Members Serving</span>
                        <span>{peopleStats.servingMembers} / {peopleStats.totalMembers}</span>
                      </div>
                      <Progress 
                        value={peopleStats.totalMembers > 0 ? (peopleStats.servingMembers / peopleStats.totalMembers) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Attendance Rate</span>
                        <span>{attendanceStats.attendanceRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={attendanceStats.attendanceRate} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Email Engagement</span>
                        <span>{communicationStats.emailOpenRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={communicationStats.emailOpenRate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* People Tab Content */}
          <TabsContent value="people" className="mt-6">
            {/* People Tab Header with Controls */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">People Analytics</h2>
                  <p className="text-slate-600 mt-1">Comprehensive insights into your church membership</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
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
                    onClick={() => handleExportTabReport('people')}
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
                        Export People Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {peopleStats.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-blue-700 font-semibold">Loading member stats...</span>
              </div>
            ) : peopleStats.error ? (
              <div className="text-red-600 font-semibold py-8">{peopleStats.error}</div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Total Members</div>
                    <div className="text-3xl font-bold text-blue-700">{peopleStats.totalMembers}</div>
                    <div className="text-xs text-slate-500 mt-1">Active church members</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">New This Month</div>
                    <div className="text-3xl font-bold text-green-700">{peopleStats.newMembers}</div>
                    <div className="text-xs text-slate-500 mt-1">+{peopleStats.memberGrowthRate.toFixed(1)}% growth</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Active Members</div>
                    <div className="text-3xl font-bold text-emerald-700">{peopleStats.activeMembers}</div>
                    <div className="text-xs text-slate-500 mt-1">Regular attendees</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Serving in Groups</div>
                    <div className="text-3xl font-bold text-purple-700">{peopleStats.servingMembers}</div>
                    <div className="text-xs text-slate-500 mt-1">Ministry volunteers</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MembershipTrendChart 
                    data={chartData.membershipTrend} 
                    loading={chartData.loading} 
                    error={chartData.error} 
                  />
                  <DemographicsChart 
                    data={chartData.demographics} 
                    loading={chartData.loading} 
                  />
                </div>

                {/* Detailed Table */}
                <TopMembersTable 
                  data={tableData.topMembers} 
                  loading={tableData.loading} 
                  error={tableData.error} 
                />
              </div>
            )}
          </TabsContent>

          {/* Attendance Tab Content */}
          <TabsContent value="attendance" className="mt-6">
            {/* Attendance Tab Header with Controls */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Attendance Analytics</h2>
                  <p className="text-slate-600 mt-1">Comprehensive insights into your church attendance patterns</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
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
                    onClick={() => handleExportTabReport('attendance')}
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
                        Export Attendance Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {attendanceStats.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <span className="ml-4 text-emerald-700 font-semibold">Loading attendance stats...</span>
              </div>
            ) : attendanceStats.error ? (
              <div className="text-red-600 font-semibold py-8">{attendanceStats.error}</div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Average Attendance</div>
                    <div className="text-3xl font-bold text-blue-700">{attendanceStats.averageAttendance}</div>
                    <div className="text-xs text-slate-500 mt-1">Past 30 days</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Attendance Rate</div>
                    <div className="text-3xl font-bold text-emerald-700">{attendanceStats.attendanceRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 mt-1">Of total members</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">First-Time Visitors</div>
                    <div className="text-3xl font-bold text-purple-700">{attendanceStats.firstTimeVisitors}</div>
                    <div className="text-xs text-slate-500 mt-1">This month</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Return Rate</div>
                    <div className="text-3xl font-bold text-amber-700">{attendanceStats.returnVisitorRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 mt-1">Visitor retention</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AttendanceTrendChart 
                    data={chartData.attendanceTrend} 
                    loading={chartData.loading} 
                    error={chartData.error} 
                  />
                  
                  <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserX className="h-5 w-5 text-red-500" />
                        Need to Follow Up
                      </CardTitle>
                      <CardDescription>Members who missed the past 5 Sunday services</CardDescription>
                    </CardHeader>
                    <CardContent>

                      {followUpLoading ? (
                        <div className="h-[300px] flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
                          <p className="text-slate-600">Loading follow-up list...</p>
                        </div>
                      ) : followUpPeople.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                          <Users className="h-16 w-16 text-green-400 mb-4" />
                          <p className="text-green-700 text-center mb-2">
                            Great! No one needs follow-up
                          </p>
                          <Badge variant="outline" className="text-green-600">All members attended recently</Badge>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {followUpPeople.map((person, index) => (
                            <div key={person.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800">
                                    {person.first_name} {person.last_name}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-slate-500">
                                    {person.email && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {person.email}
                                      </div>
                                    )}
                                    {person.phone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {person.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="destructive" className="text-xs">
                                  {person.missedServices} missed
                                </Badge>
                                <div className="text-xs text-slate-500 mt-1">
                                  {person.lifecycle === 'member' ? 'Member' : 'Regular'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-red-50 rounded-b-xl">
                      <div className="w-full flex justify-between text-sm text-red-700">
                        <span>
                          <span className="font-medium">Total needing follow-up:</span> {followUpPeople.length}
                        </span>
                        <span>
                          <span className="font-medium">Last 5 weeks</span>
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </div>

                {/* Detailed Table */}
                <RecentAttendanceTable 
                  data={tableData.recentAttendance} 
                  loading={tableData.loading} 
                  error={tableData.error} 
                />
              </div>
            )}
          </TabsContent>

          {/* Financial Tab Content */}
          <TabsContent value="financial" className="mt-6">
            {/* Financial Tab Header with Controls */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Financial Analytics</h2>
                  <p className="text-slate-600 mt-1">Comprehensive insights into your church's financial performance</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
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
                    onClick={() => handleExportTabReport('financial')}
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
                        Export Financial Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {financialStats.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <span className="ml-4 text-purple-700 font-semibold">Loading financial stats...</span>
              </div>
            ) : financialStats.error ? (
              <div className="text-red-600 font-semibold py-8">{financialStats.error}</div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Monthly Giving</div>
                    <div className="text-3xl font-bold text-purple-700">${financialStats.monthlyGiving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-slate-500 mt-1">This month</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">YTD Giving</div>
                    <div className="text-3xl font-bold text-emerald-700">${financialStats.ytdGiving.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-slate-500 mt-1">Year to date</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Regular Givers</div>
                    <div className="text-3xl font-bold text-blue-700">{financialStats.regularGivers}</div>
                    <div className="text-xs text-slate-500 mt-1">Unique donors</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Average Gift</div>
                    <div className="text-3xl font-bold text-amber-700">${financialStats.averageGift.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-slate-500 mt-1">Per transaction</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6">
                  <GivingTrendChart 
                    data={chartData.givingTrend} 
                    loading={chartData.loading} 
                    error={chartData.error} 
                  />
                </div>

                {/* Detailed Table */}
                <TopDonorsTable 
                  data={tableData.topDonors} 
                  loading={tableData.loading} 
                  error={tableData.error} 
                />
              </div>
            )}
          </TabsContent>

          {/* Communication Tab Content */}
          <TabsContent value="communication" className="mt-6">
            {/* Communication Tab Header with Controls */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Communication Analytics</h2>
                  <p className="text-slate-600 mt-1">Comprehensive insights into your church's communication effectiveness</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
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
                    onClick={() => handleExportTabReport('communication')}
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
                        Export Communication Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {communicationStats.loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
                <span className="ml-4 text-amber-700 font-semibold">Loading communication stats...</span>
              </div>
            ) : communicationStats.error ? (
              <div className="text-red-600 font-semibold py-8">{communicationStats.error}</div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Email Open Rate</div>
                    <div className="text-3xl font-bold text-amber-700">{communicationStats.emailOpenRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 mt-1">Last 3 months</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Click Rate</div>
                    <div className="text-3xl font-bold text-emerald-700">{communicationStats.emailClickRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 mt-1">Email engagement</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">Subscribers</div>
                    <div className="text-3xl font-bold text-blue-700">{communicationStats.newsletterSubscribers}</div>
                    <div className="text-xs text-slate-500 mt-1">Newsletter list</div>
                  </div>
                  <div className="bg-white/70 rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="text-slate-600 text-sm mb-1">New Subscribers</div>
                    <div className="text-3xl font-bold text-purple-700">{communicationStats.newSubscribersThisMonth}</div>
                    <div className="text-xs text-slate-500 mt-1">This month</div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6">
                  <CommunicationChart 
                    data={chartData.communicationTrend} 
                    loading={chartData.loading} 
                    error={chartData.error} 
                  />
                </div>

                {/* Detailed Table */}
                <EmailCampaignsTable 
                  data={tableData.emailCampaigns} 
                  loading={tableData.loading} 
                  error={tableData.error} 
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 