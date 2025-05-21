"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts"
import { 
  Users, UserPlus, Calendar, DollarSign, MessageSquare 
} from "lucide-react"
import { MetricCard } from "@/components/MetricCard"
import { ChartCard } from "@/components/ChartCard"
import { ShortcutTile } from "@/components/ShortcutTile"
import { ActivityFeed } from "@/components/ActivityFeed"
import { supabase } from "@/lib/supabase"

// Demo data
const membersTrend = [100, 120, 115, 134, 168, 132, 200]
const attendanceTrend = [80, 85, 90, 88, 92, 95, 98]
const eventsByCampus = [
  { campus: "Main", count: 12 },
  { campus: "North", count: 8 },
  { campus: "South", count: 6 },
  { campus: "East", count: 4 },
]

const recentActivities = [
  { timestamp: "2 hours ago", text: "New member registration" },
  { timestamp: "4 hours ago", text: "Sunday service attendance recorded" },
  { timestamp: "1 day ago", text: "New event created: Youth Group Meeting" },
  { timestamp: "2 days ago", text: "Monthly giving report generated" },
  { timestamp: "3 days ago", text: "New visitor registered" },
]

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

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
  }, [router])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Members"
          value="1,234"
          delta="+12%"
          sparklineData={membersTrend}
        />
        <MetricCard
          title="New Members"
          value="23"
          delta="+5%"
          sparklineData={[5, 8, 12, 15, 18, 20, 23]}
        />
        <MetricCard
          title="Attendance Rate"
          value="85%"
          delta="+3%"
          sparklineData={attendanceTrend}
        />
        <MetricCard
          title="Giving Today"
          value="$2,450"
          delta="+8%"
          sparklineData={[1200, 1500, 1800, 2100, 2300, 2400, 2450]}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard title="Member Growth">
          <ResponsiveContainer>
            <LineChart data={membersTrend.map((value, index) => ({ month: index + 1, value }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Events by Campus">
          <ResponsiveContainer>
            <BarChart data={eventsByCampus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campus" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Activity Feed and Shortcuts */}
      <div className="grid gap-4 md:grid-cols-3">
        <ActivityFeed items={recentActivities} />
        <div className="grid grid-cols-2 gap-4">
          <ShortcutTile
            icon={<UserPlus className="h-6 w-6" />}
            label="Add Member"
            onClick={() => router.push('/members/new')}
          />
          <ShortcutTile
            icon={<Calendar className="h-6 w-6" />}
            label="Create Event"
            onClick={() => router.push('/events/new')}
          />
          <ShortcutTile
            icon={<MessageSquare className="h-6 w-6" />}
            label="Send Message"
            onClick={() => router.push('/communications/new')}
          />
          <ShortcutTile
            icon={<DollarSign className="h-6 w-6" />}
            label="Record Expense"
            onClick={() => router.push('/finance/expenses/new')}
          />
        </div>
        <div className="bg-muted rounded-lg" /> {/* Placeholder for future widget */}
      </div>
    </div>
  )
} 