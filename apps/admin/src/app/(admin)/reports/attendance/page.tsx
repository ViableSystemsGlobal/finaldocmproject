'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  PieChart,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Award,
  Clock,
  UserX,
  Phone,
  Mail
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { MetricCard } from '@/components/MetricCard'
import { supabase } from '@/lib/supabase'
import { safeFormatDate, getDateRange, exportToCSV, formatDisplayDate, getPeriodDisplayName } from '@/lib/utils'

// Placeholder data for development
const PLACEHOLDER_DATA = {
  summary: {
    totalServices: 152,
    avgAttendance: 243,
    peakAttendance: 378,
    yearOverYearGrowth: 12.5,
    attendanceRate: 85.2
  },
  weeklyAttendance: [
    { date: '2025-01-05', count: 230, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-01-12', count: 245, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-01-19', count: 248, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-01-26', count: 253, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-02-02', count: 262, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-02-09', count: 268, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-02-16', count: 271, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-02-23', count: 270, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-03-02', count: 277, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-03-09', count: 282, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-03-16', count: 279, capacity: 300, serviceName: 'Sunday Morning' },
    { date: '2025-03-23', count: 285, capacity: 300, serviceName: 'Sunday Morning' },
  ],
  serviceTypes: [
    { name: 'Sunday Morning', avgAttendance: 243, trend: 5.2 },
    { name: 'Sunday Evening', avgAttendance: 117, trend: 2.3 },
    { name: 'Wednesday Bible Study', avgAttendance: 98, trend: 7.8 },
    { name: 'Youth Group', avgAttendance: 54, trend: 12.5 },
    { name: 'Special Events', avgAttendance: 187, trend: -2.1 },
  ],
  demographicBreakdown: {
    ageGroups: [
      { group: '0-12', percentage: 18 },
      { group: '13-18', percentage: 12 },
      { group: '19-25', percentage: 10 },
      { group: '26-40', percentage: 25 },
      { group: '41-55', percentage: 20 },
      { group: '56+', percentage: 15 },
    ],
    genderDistribution: { male: 47, female: 53 },
    membershipStatus: [
      { status: 'Members', percentage: 65 },
      { status: 'Regular Attendees', percentage: 20 },
      { status: 'First-time Visitors', percentage: 8 },
      { status: 'Returning Visitors', percentage: 7 }
    ]
  },
  seasonalTrends: {
    monthlyAverages: [
      { month: 'Jan', average: 238 },
      { month: 'Feb', average: 245 },
      { month: 'Mar', average: 256 },
      { month: 'Apr', average: 267 },
      { month: 'May', average: 259 },
      { month: 'Jun', average: 230 },
      { month: 'Jul', average: 228 },
      { month: 'Aug', average: 233 },
      { month: 'Sep', average: 252 },
      { month: 'Oct', average: 248 },
      { month: 'Nov', average: 260 },
      { month: 'Dec', average: 278 },
    ],
    specialServices: [
      { name: 'Easter', date: '2025-04-20', attendance: 378 },
      { name: 'Christmas Eve', date: '2024-12-24', attendance: 352 },
      { name: 'Mother\'s Day', date: '2025-05-11', attendance: 312 },
      { name: 'Baptism Sunday', date: '2025-06-08', attendance: 298 },
    ]
  },
  recentServices: [
    { date: '2025-03-23', serviceName: 'Sunday Morning', attendance: 285, capacity: 300, percentFilled: 95 },
    { date: '2025-03-23', serviceName: 'Sunday Evening', attendance: 125, capacity: 300, percentFilled: 41.7 },
    { date: '2025-03-19', serviceName: 'Wednesday Bible Study', attendance: 102, capacity: 150, percentFilled: 68 },
    { date: '2025-03-16', serviceName: 'Sunday Morning', attendance: 279, capacity: 300, percentFilled: 93 },
    { date: '2025-03-16', serviceName: 'Sunday Evening', attendance: 119, capacity: 300, percentFilled: 39.7 },
    { date: '2025-03-12', serviceName: 'Wednesday Bible Study', attendance: 96, capacity: 150, percentFilled: 64 },
    { date: '2025-03-09', serviceName: 'Sunday Morning', attendance: 282, capacity: 300, percentFilled: 94 },
    { date: '2025-03-09', serviceName: 'Sunday Evening', attendance: 122, capacity: 300, percentFilled: 40.7 },
  ]
};

// Calculate trends for a list of attendance numbers
const calculateTrend = (attendanceList: number[]) => {
  if (attendanceList.length < 2) return 0;
  
  const firstHalf = attendanceList.slice(0, Math.floor(attendanceList.length / 2));
  const secondHalf = attendanceList.slice(Math.floor(attendanceList.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  if (firstAvg === 0) return 0;
  
  return ((secondAvg - firstAvg) / firstAvg) * 100;
};

export default function AttendanceReportsPage() {
  const [data, setData] = useState(PLACEHOLDER_DATA);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedServiceType, setSelectedServiceType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [followUpPeople, setFollowUpPeople] = useState<any[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  
  // Generate years list for the dropdown
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  // Fetch real data from Supabase
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        // In a real implementation, we would fetch from Supabase here
        // For now, we're using placeholder data
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For now, just use the placeholder data
        setData(PLACEHOLDER_DATA);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load attendance data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [selectedYear, selectedPeriod, selectedServiceType]);

  // Fetch people who need follow-up (missed last 5 Sunday services)
  useEffect(() => {
    const fetchFollowUpPeople = async () => {
      console.log('🔍 Starting fetchFollowUpPeople...');
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

        console.log('✅ Follow-up people loaded:', followUpList);
        setFollowUpPeople(followUpList);
      } catch (error) {
        console.error('❌ Error fetching follow-up people:', error);
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
  }, []);
  
  // Handle downloading the report
  const handleDownloadReport = async () => {
    setIsExporting(true)
    try {
      // Prepare export data
      const exportData = []
      
      // Add summary metrics
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Total Services',
        value: data.summary.totalServices,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Average Attendance',
        value: data.summary.avgAttendance,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Peak Attendance',
        value: data.summary.peakAttendance,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Attendance Rate',
        value: `${data.summary.attendanceRate}%`,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      exportData.push({
        section: 'Summary Metrics',
        metric: 'Year Over Year Growth',
        value: `${data.summary.yearOverYearGrowth}%`,
        period: getPeriodDisplayName(selectedPeriod),
        date: formatDisplayDate(new Date())
      })
      
      // Add service types breakdown
      data.serviceTypes.forEach(service => {
        exportData.push({
          section: 'Service Types',
          metric: service.name,
          value: service.avgAttendance,
          trend: `${service.trend}%`,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Add demographic breakdown
      data.demographicBreakdown.ageGroups.forEach(group => {
        exportData.push({
          section: 'Age Groups',
          metric: group.group,
          value: group.percentage,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Add membership status breakdown
      data.demographicBreakdown.membershipStatus.forEach(status => {
        exportData.push({
          section: 'Membership Status',
          metric: status.status,
          value: status.percentage,
          period: getPeriodDisplayName(selectedPeriod),
          date: formatDisplayDate(new Date())
        })
      })
      
      // Add seasonal trends
      if (data.seasonalTrends.specialServices) {
        data.seasonalTrends.specialServices.forEach(service => {
          exportData.push({
            section: 'Special Services',
            metric: service.name,
            value: service.attendance,
            date: formatDisplayDate(new Date(service.date)),
            period: getPeriodDisplayName(selectedPeriod)
          })
        })
      }
      
      // Add monthly trends
      if (data.seasonalTrends.monthlyAverages) {
        data.seasonalTrends.monthlyAverages.forEach(trend => {
          exportData.push({
            section: 'Monthly Trends',
            metric: trend.month,
            value: trend.average,
            period: getPeriodDisplayName(selectedPeriod),
            date: formatDisplayDate(new Date())
          })
        })
      }
      
      // Generate filename
      const filename = `attendance-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`
      
      // Export to CSV
      exportToCSV(filename, exportData)
      
      toast({
        title: 'Report Exported',
        description: `Attendance report for ${getPeriodDisplayName(selectedPeriod)} has been downloaded successfully.`
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
  
  // Handle adding new attendance record
  const handleAddAttendance = (formData: any) => {
    console.log('Adding attendance record:', formData);
    toast({
      title: 'Attendance Recorded',
      description: 'The attendance record has been saved successfully.'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Attendance Reports</h2>
          <p className="text-slate-600">Analyzing attendance data...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Attendance Reports
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Track and analyze church attendance patterns
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[120px] bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[150px] bg-white/50 border-2 border-slate-200 hover:bg-white/80 rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Period" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Total Services</p>
                  <p className="text-3xl font-bold">{data.summary.totalServices}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Services this year</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Avg Attendance</p>
                  <p className="text-3xl font-bold">{data.summary.avgAttendance}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Average per service</span>
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
                  <p className="text-purple-100 text-sm font-medium">Peak Attendance</p>
                  <p className="text-3xl font-bold">{data.summary.peakAttendance}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Highest attendance</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <ArrowUpRight className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Growth Rate</p>
                  <p className="text-3xl font-bold">{data.summary.yearOverYearGrowth}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Year over year</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Target className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-rose-100 text-sm font-medium">Attendance Rate</p>
                  <p className="text-3xl font-bold">{data.summary.attendanceRate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-rose-200" />
                <span className="text-rose-100 text-sm font-medium">Of total membership</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg">Services</TabsTrigger>
            <TabsTrigger value="demographics" className="rounded-lg">Demographics</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg">Trends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-500" />
                    Weekly Attendance Trends
                  </CardTitle>
                  <CardDescription>Recent weekly attendance patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
                    <LineChart className="h-16 w-16 text-slate-400 mb-4" />
                    <p className="text-slate-600 text-center mb-2">
                      Weekly attendance chart would be displayed here
                    </p>
                    <Badge variant="outline">Chart integration with Recharts recommended</Badge>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50 rounded-b-xl">
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Trend:</span> +{data.summary.yearOverYearGrowth}% growth this year
                  </div>
                </CardFooter>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-red-500" />
                    Need to Follow Up
                  </CardTitle>
                  <CardDescription>Members who missed the past 5 Sunday services</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    console.log('🎯 Rendering follow-up card - Loading:', followUpLoading, 'People count:', followUpPeople.length);
                    return null;
                  })()}
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

            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  Recent Services
                </CardTitle>
                <CardDescription>Latest attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.recentServices.slice(0, 4).map((service, index) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-slate-800">{service.serviceName}</div>
                        <Badge className={`${service.percentFilled > 80 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {service.percentFilled}%
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        {new Date(service.date).toLocaleDateString()}
                      </div>
                      <div className="text-2xl font-bold text-slate-800 mb-1">
                        {service.attendance}
                      </div>
                      <div className="text-xs text-slate-500">
                        of {service.capacity} capacity
                      </div>
                      <Progress value={service.percentFilled} className="h-2 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Service Comparison
                  </CardTitle>
                  <CardDescription>Attendance breakdown by service type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.serviceTypes.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-purple-500' : 
                          index === 2 ? 'bg-green-500' : 
                          index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{service.name}</div>
                          <div className="text-sm text-slate-600">{service.avgAttendance} avg attendance</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {service.trend > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`font-medium ${service.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {service.trend > 0 ? '+' : ''}{service.trend}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">trend</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Special Services
                  </CardTitle>
                  <CardDescription>High-attendance special events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.seasonalTrends.specialServices.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                      <div>
                        <div className="font-medium text-slate-800">{service.name}</div>
                        <div className="text-sm text-slate-600">{new Date(service.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">{service.attendance}</div>
                        <div className="text-xs text-slate-500">attendees</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Age Group Attendance
                  </CardTitle>
                  <CardDescription>Attendance breakdown by age demographics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.demographicBreakdown.ageGroups.map((group) => (
                    <div key={group.group} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{group.group}</span>
                        <span className="text-sm text-slate-500">{group.percentage}%</span>
                      </div>
                      <Progress value={group.percentage} className="h-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Membership Status
                  </CardTitle>
                  <CardDescription>Attendee composition by membership status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {data.demographicBreakdown.membershipStatus.map((status, index) => (
                      <div key={status.status} className="text-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-2xl font-bold text-slate-800 mb-1">{status.percentage}%</div>
                        <div className="text-sm font-medium text-slate-600 mb-2">{status.status}</div>
                        <Progress value={status.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-8">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-green-500" />
                  Monthly Attendance Trends
                </CardTitle>
                <CardDescription>Average attendance by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <LineChart className="h-20 w-20 text-green-400 mb-4" />
                  <p className="text-green-700 text-center mb-2">
                    Monthly trends chart would be displayed here
                  </p>
                  <Badge variant="outline" className="text-green-600">Seasonal patterns and growth trends</Badge>
                </div>
              </CardContent>
              <CardFooter className="bg-green-50 rounded-b-xl">
                <div className="w-full">
                  <div className="flex justify-between text-sm text-green-700 mb-2">
                    <span><span className="font-medium">Peak Season:</span> December (278 avg)</span>
                    <span><span className="font-medium">Low Season:</span> July (228 avg)</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 