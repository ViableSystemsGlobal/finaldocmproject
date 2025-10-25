'use client'

import { useState, useEffect, ReactNode } from 'react'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  PieChart, 
  BarChart,
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  Activity,
  Target,
  Award,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetricCard } from '@/components/MetricCard'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { safeFormatDate, getDateRange, exportToCSV, formatDisplayDate, getPeriodDisplayName } from '@/lib/utils'
import { 
  fetchMembers, 
  getMembersCount,
  getNewMembersThisMonth,
  getMembersServing 
} from '@/services/members'
import { 
  getAttendanceMetrics, 
  fetchAttendanceEvents 
} from '@/services/attendance'
import { supabase } from '@/lib/supabase'

// Debugging component to check render environment
const RenderInfo = () => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  return (
    <div style={{ display: 'none' }}>
      Rendering on: {isClient ? 'client' : 'server'}
    </div>
  )
}

// Client-only wrapper component
const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  return isClient ? children : null
}

export default function PeopleReportsPage() {
  const [data, setData] = useState<{
    totalMembers: number
    activeMembers: number
    newMembersThisYear: number
    membershipGrowthRate: number
    ageGroups: Array<{ name: string; count: number; percentage: number }>
    genderDistribution: { male: number; female: number }
    attendanceTrends: Array<{ month: string; count: number }>
    contactStatus: Array<{ status: string; count: number; percentage: number }>
    topMinistries: Array<{ name: string; members: number; growth: number }>
  }>({
    totalMembers: 0,
    activeMembers: 0,
    newMembersThisYear: 0,
    membershipGrowthRate: 0,
    ageGroups: [],
    genderDistribution: { male: 0, female: 0 },
    attendanceTrends: [],
    contactStatus: [],
    topMinistries: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isExporting, setIsExporting] = useState(false)
  
  // Pre-computed values for consistent rendering
  const [calculatedValues, setCalculatedValues] = useState({
    activeMembersPercentage: 0,
    malePercentage: 0,
    femalePercentage: 0,
    averageAttendance: 0,
    peakMonth: ''
  })
  
  // Generate years list in a deterministic way
  const availableYears = [2025, 2024, 2023, 2022, 2021]
  
  // Fetch real data from Supabase on client side only
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch real data from database
        const [
          membersResponse, 
          membersCountResponse, 
          newMembersResponse,
          contactsResponse
        ] = await Promise.all([
          fetchMembers(),
          getMembersCount(),
          getNewMembersThisMonth(),
          supabase.from('contacts').select('*').limit(1000)
        ])
        
        if (membersResponse.error || !membersResponse.data) {
          console.error('Error fetching members:', membersResponse.error)
          throw new Error('Failed to fetch members data')
        }
        
        // Process real member data
        const members = membersResponse.data
        const totalMembers = membersCountResponse.count || 0
        const newMembers = newMembersResponse.count || 0
        const activeMembers = members.length
        
        // Calculate real demographics from contacts
        const contacts = contactsResponse.data || []
        const ageGroups = calculateAgeGroups(contacts)
        const genderDistribution = calculateGenderDistribution(contacts)
        const contactStatus = calculateContactStatus(contacts)
        
        // Calculate growth rate
        const lastYearMembers = await getLastYearMembersCount()
        const growthRate = lastYearMembers > 0 ? 
          ((totalMembers - lastYearMembers) / lastYearMembers) * 100 : 0
        
        const attendanceTrends = await calculateAttendanceTrends(selectedYear)
        const topMinistries = await calculateTopMinistries()
        
        setData({
          totalMembers,
          activeMembers,
          newMembersThisYear: newMembers,
          membershipGrowthRate: growthRate,
          ageGroups,
          genderDistribution,
          attendanceTrends,
          contactStatus,
          topMinistries
        })
        
        // Calculate derived values
        setCalculatedValues({
          activeMembersPercentage: Math.round((activeMembers / totalMembers) * 100) || 0,
          malePercentage: Math.round((genderDistribution.male / totalMembers) * 100) || 0,
          femalePercentage: Math.round((genderDistribution.female / totalMembers) * 100) || 0,
          averageAttendance: Math.round(attendanceTrends.reduce((acc, cur) => acc + cur.count, 0) / 12) || 0,
          peakMonth: attendanceTrends.reduce((max, cur) => max.count > cur.count ? max : cur, { month: '', count: 0 }).month
        })
        
      } catch (error) {
        console.error('Error fetching people reports data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load reports data. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [selectedYear, selectedPeriod])
  
  // Helper functions for calculations
  const calculateAgeGroups = (contacts: any[]) => {
    const groups = { '0-12': 0, '13-18': 0, '19-25': 0, '26-40': 0, '41-55': 0, '56+': 0 }
    
    contacts.forEach(contact => {
      if (contact.date_of_birth) {
        const age = new Date().getFullYear() - new Date(contact.date_of_birth).getFullYear()
        if (age <= 12) groups['0-12']++
        else if (age <= 18) groups['13-18']++
        else if (age <= 25) groups['19-25']++
        else if (age <= 40) groups['26-40']++
        else if (age <= 55) groups['41-55']++
        else groups['56+']++
      }
    })
    
    const total = Object.values(groups).reduce((sum, count) => sum + count, 0)
    return Object.entries(groups).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
  }

  const calculateGenderDistribution = (contacts: any[]) => {
    const male = contacts.filter(c => c.gender === 'male').length
    const female = contacts.filter(c => c.gender === 'female').length
    return { male, female }
  }

  const calculateContactStatus = (contacts: any[]) => {
    const statusCounts = contacts.reduce((acc, contact) => {
      const status = contact.lifecycle || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    const total = contacts.length
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0
    }))
  }

  const getLastYearMembersCount = async () => {
    const lastYear = selectedYear - 1
    const { count } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .lte('joined_at', `${lastYear}-12-31`)
    return count || 0
  }

  const calculateAttendanceTrends = async (year: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const trends = []
    
    for (let i = 0; i < 12; i++) {
      const startDate = new Date(year, i, 1)
      const endDate = new Date(year, i + 1, 0)
      
      const { count } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', startDate.toISOString())
        .lte('check_in_time', endDate.toISOString())
      
      trends.push({ month: months[i], count: count || 0 })
    }
    
    return trends
  }

  const calculateTopMinistries = async () => {
    // This would need to be implemented based on your groups/ministries structure
    const { data: groups } = await supabase
      .from('groups')
      .select('name, member_count')
      .order('member_count', { ascending: false })
      .limit(5)
    
    return groups?.map(group => ({
      name: group.name,
      members: group.member_count || 0,
      growth: Math.random() * 20 - 10 // Placeholder - implement real growth calculation
    })) || []
  }
  
  // Handle report download
  const handleDownloadReport = async () => {
    setIsExporting(true)
    try {
      // Prepare export data
      const exportData = []
      
      // Add summary metrics
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Total Members',
        value: data.totalMembers,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Active Members',
        value: data.activeMembers,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'New Members',
        value: data.newMembersThisYear,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Growth Rate',
        value: `${data.membershipGrowthRate.toFixed(1)}%`,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      // Add age group data
      data.ageGroups.forEach(group => {
        exportData.push({
          section: 'Age Groups',
          metric: group.name,
          value: group.count,
          percentage: `${group.percentage}%`,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Add gender distribution
      exportData.push({
        section: 'Gender Distribution',
        metric: 'Male',
        value: data.genderDistribution.male,
        percentage: `${calculatedValues.malePercentage}%`,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Gender Distribution',
        metric: 'Female',
        value: data.genderDistribution.female,
        percentage: `${calculatedValues.femalePercentage}%`,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      // Add contact status data
      data.contactStatus.forEach(status => {
        exportData.push({
          section: 'Contact Status',
          metric: status.status,
          value: status.count,
          percentage: `${status.percentage}%`,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Add top ministries data
      data.topMinistries.forEach(ministry => {
        exportData.push({
          section: 'Top Ministries',
          metric: ministry.name,
          value: ministry.members,
          growth: `${ministry.growth.toFixed(1)}%`,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Add attendance trends
      data.attendanceTrends.forEach(trend => {
        exportData.push({
          section: 'Attendance Trends',
          metric: trend.month,
          value: trend.count,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Generate filename
      const filename = `people-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
      
      // Export to CSV
      exportToCSV(filename, exportData)
      
      toast({
        title: 'Report Exported',
        description: `People report for ${getPeriodDisplayName(selectedPeriod)} has been downloaded successfully.`
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
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading People Reports</h2>
          <p className="text-slate-600">Analyzing membership data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  People Reports
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Comprehensive insights into your church membership
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

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Members</p>
                  <p className="text-3xl font-bold">{data.totalMembers.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Registered church members</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Active Members</p>
                  <p className="text-3xl font-bold">{data.activeMembers.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">{calculatedValues.activeMembersPercentage}% of total</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserPlus className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">New Members</p>
                  <p className="text-3xl font-bold">{data.newMembersThisYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">New this year</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Growth Rate</p>
                  <p className="text-3xl font-bold">{data.membershipGrowthRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Annual growth rate</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="demographics" className="space-y-8">
          <TabsList className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl p-1">
            <TabsTrigger value="demographics" className="rounded-lg">Demographics</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg">Attendance</TabsTrigger>
            <TabsTrigger value="ministries" className="rounded-lg">Ministries</TabsTrigger>
          </TabsList>
          
          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-blue-500" />
                    Age Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of members by age group</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.ageGroups.map((group) => (
                      <div key={group.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{group.name}</span>
                          <span className="text-sm text-slate-500">
                            {group.count} ({group.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <ClientOnly>
                          <Progress value={group.percentage} className="h-3 bg-slate-100" />
                        </ClientOnly>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    Gender Distribution
                  </CardTitle>
                  <CardDescription>Male vs Female membership</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-[200px] items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{data.genderDistribution.male}</div>
                          <div className="text-sm text-slate-600">Male</div>
                          <div className="text-xs text-slate-500">{calculatedValues.malePercentage}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-pink-600">{data.genderDistribution.female}</div>
                          <div className="text-sm text-slate-600">Female</div>
                          <div className="text-xs text-slate-500">{calculatedValues.femalePercentage}%</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <ClientOnly>
                          <Progress value={calculatedValues.malePercentage} className="h-2 w-16" />
                          <Progress value={calculatedValues.femalePercentage} className="h-2 w-16" />
                        </ClientOnly>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Member Status
                </CardTitle>
                <CardDescription>Active, inactive, and visitor breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {data.contactStatus.map((status, index) => (
                    <div key={status.status} className="text-center p-4 bg-slate-50 rounded-xl">
                      <div className="text-2xl font-bold text-slate-800 mb-1">{status.count}</div>
                      <div className="text-sm font-medium text-slate-600 mb-2">{status.status}</div>
                      <ClientOnly>
                        <Progress value={status.percentage} className="h-2" />
                      </ClientOnly>
                      <div className="text-xs text-slate-500 mt-1">{status.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  Attendance Trends
                </CardTitle>
                <CardDescription>Average weekly attendance by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
                  <BarChart className="h-16 w-16 text-slate-400 mb-4" />
                  <p className="text-slate-600 text-center mb-2">
                    Chart showing monthly attendance trends would be displayed here.
                  </p>
                  <Badge variant="outline">Chart integration with Recharts recommended</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-slate-50 rounded-b-xl">
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Average:</span> {calculatedValues.averageAttendance}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Peak Month:</span> {calculatedValues.peakMonth}
                </div>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Service Comparison
                  </CardTitle>
                  <CardDescription>Attendance by service type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Sunday Morning', count: 312, percentage: 72.9, color: 'bg-blue-500' },
                    { name: 'Sunday Evening', count: 186, percentage: 43.5, color: 'bg-purple-500' },
                    { name: 'Midweek', count: 142, percentage: 33.2, color: 'bg-green-500' },
                    { name: 'Small Groups', count: 201, percentage: 47, color: 'bg-orange-500' },
                  ].map((service) => (
                    <div key={service.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{service.name}</span>
                        <span className="text-sm text-slate-500">{service.count} ({service.percentage}%)</span>
                      </div>
                      <ClientOnly>
                        <Progress value={service.percentage} className="h-3" />
                      </ClientOnly>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-500" />
                    First-Time Visitors
                  </CardTitle>
                  <CardDescription>Monthly new visitor tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <BarChart className="h-12 w-12 text-green-400 mb-4" />
                    <p className="text-green-700 text-center">Monthly visitor chart would display here</p>
                  </div>
                </CardContent>
                <CardFooter className="bg-green-50 rounded-b-xl">
                  <div className="text-sm text-green-700">
                    <span className="font-medium">Total new visitors this year:</span> 217
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Ministries Tab */}
          <TabsContent value="ministries" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-500" />
                  Top Growing Ministries
                </CardTitle>
                <CardDescription>Ministries with highest growth rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topMinistries.map((ministry, index) => (
                    <div key={ministry.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{ministry.name}</div>
                          <div className="text-sm text-slate-600">{ministry.members} members</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">{ministry.growth.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-slate-500">growth rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 