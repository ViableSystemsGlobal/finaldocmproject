"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import {
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
  MessageSquare,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Cake,
  Phone,
  Mail,
  AlertTriangle,
  X,
  ChevronRight,
  Clock,
  MapPin,
  Bell,
  Plus,
  Eye,
  FileText,
  Loader2,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from "recharts"
import { MetricCard } from "@/components/MetricCard"
import { ChartCard } from "@/components/ChartCard"
import { 
  MembershipTrendChart, 
  AttendanceTrendChart, 
  GivingTrendChart 
} from "@/components/reports/ReportsCharts"
import { getAttendanceMetrics } from "@/services/attendance"
import { getMembersCount, getNewMembersThisMonth, getMembersServing } from "@/services/members"

// Demo data for charts
const membersTrend = [
  { month: 'Jan', members: 245, new: 12 },
  { month: 'Feb', members: 267, new: 22 },
  { month: 'Mar', members: 289, new: 22 },
  { month: 'Apr', members: 312, new: 23 },
  { month: 'May', members: 334, new: 22 },
  { month: 'Jun', members: 356, new: 22 }
]

const attendanceTrend = [
  { week: 'W1', attendance: 85 },
  { week: 'W2', attendance: 92 },
  { week: 'W3', attendance: 88 },
  { week: 'W4', attendance: 95 }
]

const givingTrend = [
  { month: 'Jan', amount: 12500 },
  { month: 'Feb', amount: 13200 },
  { month: 'Mar', amount: 11800 },
  { month: 'Apr', amount: 14500 },
  { month: 'May', amount: 13900 },
  { month: 'Jun', amount: 15200 }
]

interface Birthday {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  birthday: string
  days_until: number
  age_turning: number
}

interface DashboardStats {
  totalMembers: number
  newMembersThisWeek: number
  attendanceRate: number
  todayGiving: number
  upcomingEvents: number
  pendingPrayerRequests: number
  activeGroups: number
  loading: boolean
  error: string | null
}

interface ChartData {
  membershipTrend: any[]
  attendanceTrend: any[]
  givingTrend: any[]
  loading: boolean
  error: string | null
}

interface QuickAction {
  title: string
  description: string
  icon: any
  href: string
  color: string
  priority: 'high' | 'medium' | 'low'
}

const quickActions: QuickAction[] = [
  {
    title: "Add New Member",
    description: "Register a new church member",
    icon: UserPlus,
    href: "/people/members/new",
    color: "from-blue-500 to-blue-600",
    priority: "high"
  },
  {
    title: "Record Attendance",
    description: "Log service attendance",
    icon: Users,
    href: "/people/attendance/new",
    color: "from-green-500 to-green-600",
    priority: "high"
  },
  {
    title: "Create Event",
    description: "Schedule a new event",
    icon: Calendar,
    href: "/events/new",
    color: "from-purple-500 to-purple-600",
    priority: "medium"
  },
  {
    title: "Send Message",
    description: "Communicate with members",
    icon: MessageSquare,
    href: "/comms/campaigns",
    color: "from-indigo-500 to-indigo-600",
    priority: "medium"
  },
  {
    title: "View Reports",
    description: "Analytics & insights",
    icon: BarChart3,
    href: "/reports",
    color: "from-orange-500 to-orange-600",
    priority: "low"
  },
  {
    title: "Manage Settings",
    description: "System configuration",
    icon: Settings,
    href: "/settings",
    color: "from-gray-500 to-gray-600",
    priority: "low"
  }
]

function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const [attemptedRoute, setAttemptedRoute] = useState('')
  
  // State for data
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Birthday[]>([])
  const [birthdaysLoading, setBirthdaysLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalMembers: 0,
    newMembersThisWeek: 0,
    attendanceRate: 0,
    todayGiving: 0,
    upcomingEvents: 0,
    pendingPrayerRequests: 0,
    activeGroups: 0,
    loading: true,
    error: null
  })
  const [chartData, setChartData] = useState<ChartData>({
    membershipTrend: [],
    attendanceTrend: [],
    givingTrend: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) {
          router.push("/login")
        }
      } catch (err) {
        console.error("Error checking session:", err)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkSession()
    
    // Check for access denied message
    if (searchParams.get('access_denied') === '1') {
      setShowAccessDenied(true)
      setAttemptedRoute(searchParams.get('attempted_route') || '')
      
      // Clear the query params
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => setShowAccessDenied(false), 5000)
    }
  }, [router, searchParams])

  // Fetch upcoming birthdays
  useEffect(() => {
    async function fetchUpcomingBirthdays() {
      setBirthdaysLoading(true)
      try {
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email, phone, date_of_birth')
          .not('date_of_birth', 'is', null)
          .limit(50)

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }

        if (!contacts || contacts.length === 0) {
          setUpcomingBirthdays([])
          return
        }

        // Filter and calculate days until birthday
        const birthdays: Birthday[] = []
        const today = new Date()
        const currentYear = today.getFullYear()
        
        // Normalize today to midnight for proper date comparison
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        
        contacts.forEach(contact => {
          try {
            if (!contact.date_of_birth) return
            
            const birthDate = new Date(contact.date_of_birth)
            if (isNaN(birthDate.getTime())) return
            
            const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())
            
            if (thisYearBirthday < todayMidnight) {
              thisYearBirthday.setFullYear(currentYear + 1)
            }
            
            const timeDiff = thisYearBirthday.getTime() - todayMidnight.getTime()
            const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
            
            if (daysUntil >= 0 && daysUntil <= 7) {
              const ageTurning = currentYear - birthDate.getFullYear() + (thisYearBirthday.getFullYear() > currentYear ? 1 : 0)
              
              birthdays.push({
                id: contact.id,
                first_name: contact.first_name || 'Unknown',
                last_name: contact.last_name || '',
                email: contact.email || '',
                phone: contact.phone || '',
                birthday: contact.date_of_birth,
                days_until: daysUntil,
                age_turning: ageTurning > 0 ? ageTurning : 0
              })
            }
          } catch (contactError) {
            console.warn(`Error processing contact ${contact.id}:`, contactError)
          }
        })

        birthdays.sort((a, b) => a.days_until - b.days_until)
        setUpcomingBirthdays(birthdays)
        
      } catch (err: any) {
        console.error('Error fetching birthdays:', err)
        setUpcomingBirthdays([])
      } finally {
        setBirthdaysLoading(false)
      }
    }

    fetchUpcomingBirthdays()
  }, [])

  // Fetch dashboard stats using real services
  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setDashboardStats(prev => ({ ...prev, loading: true, error: null }))
        
        // Use existing services for real data - handle Supabase responses properly
        const { count: totalMembers } = await getMembersCount()
        const { count: newMembers } = await getNewMembersThisMonth()
        const attendanceMetrics = await getAttendanceMetrics()

        // Get today's giving
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const { data: todayTransactions } = await supabase
          .from('transactions')
          .select('amount')
          .gte('transacted_at', todayStart.toISOString())
          .lt('transacted_at', todayEnd.toISOString())

        const todayGiving = todayTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

        // Get upcoming events
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)

        const { count: upcomingEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gte('start_date', today.toISOString())
          .lte('start_date', nextWeek.toISOString())

        // Get pending prayer requests
        const { count: pendingPrayerRequests } = await supabase
          .from('prayer_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Get active groups
        const { count: activeGroups } = await supabase
          .from('groups')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // Calculate attendance rate from metrics
        const attendanceRate = attendanceMetrics.avgAttendance || 0

        setDashboardStats({
          totalMembers: totalMembers || 0,
          newMembersThisWeek: newMembers || 0,
          attendanceRate,
          todayGiving,
          upcomingEvents: upcomingEvents || 0,
          pendingPrayerRequests: pendingPrayerRequests || 0,
          activeGroups: activeGroups || 0,
          loading: false,
          error: null
        })
      } catch (err: any) {
        setDashboardStats(prev => ({ 
          ...prev, 
          error: err.message || 'Failed to load dashboard stats', 
          loading: false 
        }))
      }
    }

    fetchDashboardStats()
  }, [])

  // Fetch chart data from real database
  useEffect(() => {
    async function fetchChartData() {
      try {
        setChartData(prev => ({ ...prev, loading: true, error: null }))

        // Get membership trend (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const membershipTrend = []
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date()
          monthDate.setMonth(monthDate.getMonth() - i)
          monthDate.setDate(1)
          
          const nextMonth = new Date(monthDate)
          nextMonth.setMonth(nextMonth.getMonth() + 1)

          const { count: members } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .lt('created_at', nextMonth.toISOString())

          const { count: newMembers } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', monthDate.toISOString())
            .lt('created_at', nextMonth.toISOString())

          membershipTrend.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
            members: members || 0,
            newMembers: newMembers || 0
          })
        }

        // Get attendance trend (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('check_in_time, contact_id')
          .gte('check_in_time', thirtyDaysAgo.toISOString())

        // Group by date
        const attendanceByDate: { [key: string]: Set<string> } = {}
        attendanceData?.forEach(record => {
          const date = record.check_in_time.split('T')[0]
          if (!attendanceByDate[date]) {
            attendanceByDate[date] = new Set()
          }
          attendanceByDate[date].add(record.contact_id)
        })

        const attendanceTrend = Object.entries(attendanceByDate)
          .slice(-7) // Last 7 days with data
          .map(([date, contactSet]) => ({
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            attendance: contactSet.size,
            visitors: Math.floor(contactSet.size * 0.1) // Estimate 10% visitors
          }))

        // Get giving trend (last 6 months)
        const givingTrend = []
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date()
          monthDate.setMonth(monthDate.getMonth() - i)
          monthDate.setDate(1)
          
          const nextMonth = new Date(monthDate)
          nextMonth.setMonth(nextMonth.getMonth() + 1)

          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .gte('transacted_at', monthDate.toISOString())
            .lt('transacted_at', nextMonth.toISOString())

          const totalAmount = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

          givingTrend.push({
            month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
            amount: totalAmount
          })
        }

        setChartData({
          membershipTrend,
          attendanceTrend,
          givingTrend,
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
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600">Fetching the latest church data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Access Denied Alert */}
      {showAccessDenied && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Access Denied</h3>
                <p className="text-sm text-red-700 mt-1">
                  You don't have permission to access {attemptedRoute || 'that page'}. 
                  Please contact your administrator if you need access.
                </p>
              </div>
              <button
                onClick={() => setShowAccessDenied(false)}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Church Dashboard
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Welcome back! Here's what's happening today - {format(new Date(), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/reports')}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                View Full Analytics
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Row - Using your gradient card style */}
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
                  <p className="text-3xl font-bold">
                    {dashboardStats.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      dashboardStats.totalMembers
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">+{dashboardStats.newMembersThisWeek} this week</span>
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
                  <p className="text-emerald-100 text-sm font-medium">Attendance Rate</p>
                  <p className="text-3xl font-bold">
                    {dashboardStats.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${dashboardStats.attendanceRate}%`
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Above average</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Today's Giving</p>
                  <p className="text-3xl font-bold">
                    {dashboardStats.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `$${dashboardStats.todayGiving.toLocaleString()}`
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Updated live</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Upcoming Events</p>
                  <p className="text-3xl font-bold">
                    {dashboardStats.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      dashboardStats.upcomingEvents
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Next 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions and Upcoming Birthdays Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Zap className="h-5 w-5" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {quickActions
                  .filter(action => action.priority === 'high')
                  .map((action, index) => (
                    <Button
                      key={index}
                      onClick={() => router.push(action.href)}
                      className={`w-full justify-start bg-gradient-to-r ${action.color} hover:shadow-lg text-white border-0 h-12`}
                    >
                      <action.icon className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <div className="font-semibold">{action.title}</div>
                        <div className="text-xs opacity-90">{action.description}</div>
                      </div>
                    </Button>
                  ))}
                
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">More Actions</p>
                  {quickActions
                    .filter(action => action.priority !== 'high')
                    .map((action, index) => (
                      <Button
                        key={index}
                        onClick={() => router.push(action.href)}
                        variant="outline"
                        className="w-full justify-start mb-2 h-10"
                      >
                        <action.icon className="h-4 w-4 mr-3" />
                        {action.title}
                      </Button>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Birthdays */}
          <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Cake className="h-5 w-5" />
                </div>
                Today's & Upcoming Birthdays
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {birthdaysLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                </div>
              ) : upcomingBirthdays.length === 0 ? (
                <div className="text-center py-8">
                  <Cake className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No birthdays today or this week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBirthdays.slice(0, 6).map((birthday) => (
                    <div key={birthday.id} className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 transition-all duration-200 border border-pink-100">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {birthday.first_name.charAt(0)}{birthday.last_name.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {birthday.first_name} {birthday.last_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {birthday.days_until === 0 ? (
                            <Badge className="bg-pink-500 text-white text-xs">Today!</Badge>
                          ) : birthday.days_until === 1 ? (
                            <Badge variant="outline" className="text-pink-600 border-pink-300 text-xs">Tomorrow</Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-600 text-xs">
                              {birthday.days_until} days
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500">Turning {birthday.age_turning}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex gap-1">
                        {birthday.phone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-pink-600"
                            onClick={() => window.open(`tel:${birthday.phone}`)}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        {birthday.email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-pink-600"
                            onClick={() => window.open(`mailto:${birthday.email}?subject=Happy Birthday!`)}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {upcomingBirthdays.length > 6 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => router.push('/people/members?filter=birthdays')}
                >
                  View All ({upcomingBirthdays.length} total)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Membership Growth and System Overview Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Membership Growth Chart */}
          <MembershipTrendChart 
            data={chartData.membershipTrend} 
            loading={chartData.loading} 
            error={chartData.error} 
          />

          {/* System Overview */}
          <Card className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Activity className="h-5 w-5" />
                </div>
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Active Groups</p>
                      <p className="text-xs text-slate-500">Ministry groups</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{dashboardStats.activeGroups}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <Bell className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Prayer Requests</p>
                      <p className="text-xs text-slate-500">Pending review</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{dashboardStats.pendingPrayerRequests}</p>
                    {dashboardStats.pendingPrayerRequests > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-6 text-xs"
                        onClick={() => router.push('/people/outreach/prayer-requests')}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Growth Rate</p>
                      <p className="text-xs text-slate-500">Monthly average</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">+8.2%</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push('/reports')}
                className="w-full mt-6 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Detailed Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Attendance and Giving Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <AttendanceTrendChart 
            data={chartData.attendanceTrend} 
            loading={chartData.loading} 
            error={chartData.error} 
          />
          
          <GivingTrendChart 
            data={chartData.givingTrend} 
            loading={chartData.loading} 
            error={chartData.error} 
          />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  )
} 