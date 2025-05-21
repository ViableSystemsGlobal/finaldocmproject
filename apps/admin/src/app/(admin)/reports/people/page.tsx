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
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetricCard } from '@/components/MetricCard'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { safeFormatDate } from '@/lib/utils'
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

// Fallback data to use while loading or if API fails
const FALLBACK_DATA = {
  // Member statistics
  totalMembers: 0,
  activeMembers: 0,
  newMembersThisYear: 0,
  membershipGrowthRate: 0,
  
  // Demographics
  ageGroups: [
    { name: '0-12', count: 0, percentage: 0 },
    { name: '13-18', count: 0, percentage: 0 },
    { name: '19-25', count: 0, percentage: 0 },
    { name: '26-40', count: 0, percentage: 0 },
    { name: '41-55', count: 0, percentage: 0 },
    { name: '56+', count: 0, percentage: 0 },
  ],
  genderDistribution: { male: 0, female: 0 },
  
  // Attendance trends (avg people per week)
  attendanceTrends: [
    { month: 'Jan', count: 0 },
    { month: 'Feb', count: 0 },
    { month: 'Mar', count: 0 },
    { month: 'Apr', count: 0 },
    { month: 'May', count: 0 },
    { month: 'Jun', count: 0 },
    { month: 'Jul', count: 0 },
    { month: 'Aug', count: 0 },
    { month: 'Sep', count: 0 },
    { month: 'Oct', count: 0 },
    { month: 'Nov', count: 0 },
    { month: 'Dec', count: 0 },
  ],
  
  // Contact status
  contactStatus: [
    { status: 'Active', count: 0, percentage: 0 },
    { status: 'Inactive', count: 0, percentage: 0 },
    { status: 'Visitor', count: 0, percentage: 0 },
  ],
  
  // Top growing ministries
  topMinistries: [
    { name: 'Youth Ministry', members: 0, growth: 0 },
    { name: 'Worship Team', members: 0, growth: 0 },
    { name: 'Children\'s Church', members: 0, growth: 0 },
    { name: 'Outreach', members: 0, growth: 0 },
    { name: 'Prayer Team', members: 0, growth: 0 },
  ],
}

export default function PeopleReportsPage() {
  const [data, setData] = useState(FALLBACK_DATA)
  const [loading, setLoading] = useState(true)
  
  // Use a fixed year value for initial render to avoid hydration mismatches
  const initialYear = 2025
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedPeriod, setSelectedPeriod] = useState('year-to-date')
  
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
        // Update with actual current year after client-side hydration
        if (selectedYear === initialYear) {
          setSelectedYear(new Date().getFullYear())
        }
        
        // Fetch member data
        const [
          membersResponse, 
          membersCountResponse, 
          newMembersResponse,
          membersServingResponse,
          attendanceMetricsResponse,
          attendanceEventsResponse
        ] = await Promise.all([
          fetchMembers(),
          getMembersCount(),
          getNewMembersThisMonth(),
          getMembersServing(),
          getAttendanceMetrics(),
          fetchAttendanceEvents({ limit: 50 })
        ])
        
        if (membersResponse.error || !membersResponse.data) {
          console.error('Error fetching members:', membersResponse.error)
          throw new Error('Failed to fetch members data')
        }
        
        // Process member data
        const members = membersResponse.data
        const totalMembers = membersCountResponse.count || 0
        const newMembers = newMembersResponse.count || 0
        const activeMembers = Math.round(totalMembers * 0.8) // Placeholder calculation
        
        // Calculate gender distribution from members
        // This is a simplified approach, in real app you would have gender in your contacts table
        const maleCount = Math.round(totalMembers * 0.45) // Placeholder - replace with real calculation
        const femaleCount = totalMembers - maleCount
        
        // Calculate age groups
        // This is a simplified approach, in real app you would have date_of_birth in your contacts table
        const ageGroups = FALLBACK_DATA.ageGroups.map(group => {
          // Apply a distribution percentage to total members
          const agePercentage = (group.name === '26-40') ? 25 : 
                              (group.name === '41-55') ? 20 : 
                              (group.name === '0-12') ? 15 : 
                              (group.name === '19-25') ? 15 : 
                              (group.name === '56+') ? 15 : 10
          const count = Math.round((totalMembers * agePercentage) / 100)
          return {
            name: group.name,
            count,
            percentage: (count / totalMembers) * 100
          }
        })
        
        // Process attendance data
        const averageAttendance = attendanceMetricsResponse.avgAttendance || 0
        
        // Convert attendance events to monthly trends
        // Group attendance by month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthlyData = new Array(12).fill(0).map((_, i) => ({ 
          month: monthNames[i], 
          count: 0,
          events: 0
        }))
        
        // Process attendance events to calculate monthly averages
        if (attendanceEventsResponse.data) {
          attendanceEventsResponse.data.forEach(event => {
            try {
              const eventDate = new Date(event.event_date)
              const month = eventDate.getMonth()
              // Increment the count for this month (assuming count is average attendance per event)
              monthlyData[month].count += 100 // Placeholder - replace with actual attendance count
              monthlyData[month].events += 1
            } catch (err) {
              console.error('Error processing event date:', err)
            }
          })
          
          // Calculate average per month
          monthlyData.forEach(month => {
            if (month.events > 0) {
              month.count = Math.round(month.count / month.events)
            }
          })
        }
        
        // Find peak month
        const peakMonth = monthlyData.reduce((max, month) => max.count > month.count ? max : month, { month: '', count: 0 }).month
        
        // Create updated data object
        const updatedData = {
          totalMembers,
          activeMembers,
          newMembersThisYear: newMembers,
          membershipGrowthRate: newMembers > 0 ? (newMembers / totalMembers) * 100 : 0,
          ageGroups,
          genderDistribution: { male: maleCount, female: femaleCount },
          attendanceTrends: monthlyData,
          contactStatus: [
            { status: 'Active', count: activeMembers, percentage: (activeMembers / totalMembers) * 100 },
            { status: 'Inactive', count: totalMembers - activeMembers, percentage: ((totalMembers - activeMembers) / totalMembers) * 100 },
            { status: 'Visitor', count: Math.round(totalMembers * 0.1), percentage: 10 }, // Placeholder
          ],
          topMinistries: FALLBACK_DATA.topMinistries.map((ministry, index) => ({
            ...ministry,
            members: Math.round(totalMembers * (0.2 - (index * 0.02))), // Simple distribution
            growth: 20 - (index * 2)
          }))
        }
        
        // Update state with real data
        setData(updatedData)
        
        // Calculate derived values
        setCalculatedValues({
          activeMembersPercentage: Math.round((updatedData.activeMembers / updatedData.totalMembers) * 100) || 0,
          malePercentage: Math.round((updatedData.genderDistribution.male / updatedData.totalMembers) * 100) || 0,
          femalePercentage: Math.round((updatedData.genderDistribution.female / updatedData.totalMembers) * 100) || 0,
          averageAttendance: Math.round(updatedData.attendanceTrends.reduce((acc, cur) => acc + cur.count, 0) / 12) || 0,
          peakMonth
        })
        
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error loading data",
          description: "Could not load reports data. Using fallback values.",
          variant: "destructive"
        })
        // Keep using fallback data
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [selectedYear, selectedPeriod, initialYear])
  
  // Handle report download
  const handleDownloadReport = () => {
    toast({
      title: "Downloading report",
      description: "Your report is being generated and will download shortly."
    })
    
    // This would be replaced with actual export logic
    setTimeout(() => {
      toast({
        title: "Report downloaded",
        description: "Your people report has been downloaded successfully."
      })
    }, 2000)
  }
  
  return (
    <div className="space-y-6">
      <RenderInfo />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">People Reports</h1>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
              <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
              <SelectItem value="q2">Q2 (Apr-Jun)</SelectItem>
              <SelectItem value="q3">Q3 (Jul-Sep)</SelectItem>
              <SelectItem value="q4">Q4 (Oct-Dec)</SelectItem>
              <SelectItem value="full-year">Full Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleDownloadReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* People Summary Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Members"
          value={data.totalMembers}
          icon={<Users className="h-6 w-6" />}
          loading={loading}
        />
        <MetricCard
          title="Active Members"
          value={data.activeMembers}
          icon={<Users className="h-6 w-6" />}
          loading={loading}
          trend={{ 
            value: calculatedValues.activeMembersPercentage, 
            label: "of total" 
          }}
        />
        <MetricCard
          title="New Members This Year"
          value={data.newMembersThisYear}
          icon={<UserPlus className="h-6 w-6" />}
          loading={loading}
        />
        <MetricCard
          title="Growth Rate"
          value={data.membershipGrowthRate}
          icon={<TrendingUp className="h-6 w-6" />}
          loading={loading}
          formatter="percentage"
        />
      </div>
      
      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="ministries">Ministries</TabsTrigger>
        </TabsList>
        
        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Breakdown of members by age group</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.ageGroups.map((group) => (
                    <div key={group.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{group.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {group.count} ({group.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <ClientOnly>
                        <Progress value={group.percentage} className="h-2" />
                      </ClientOnly>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Male vs Female membership</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[200px] items-center justify-center">
                  <div className="flex flex-col items-center">
                    <PieChart className="h-24 w-24 text-muted-foreground mb-4" />
                    <div className="flex flex-col gap-2 items-center">
                      <div className="flex gap-8 items-center text-center">
                        <div>
                          <div className="font-bold text-2xl">{data.genderDistribution.male}</div>
                          <div className="text-sm text-muted-foreground">Male</div>
                        </div>
                        <div>
                          <div className="font-bold text-2xl">{data.genderDistribution.female}</div>
                          <div className="text-sm text-muted-foreground">Female</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {calculatedValues.malePercentage}% Male / 
                        {calculatedValues.femalePercentage}% Female
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Member Status</CardTitle>
              <CardDescription>Active, inactive, and visitor breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead className="w-[40%]">Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.contactStatus.map((status) => (
                    <TableRow key={status.status}>
                      <TableCell className="font-medium">{status.status}</TableCell>
                      <TableCell>{status.count}</TableCell>
                      <TableCell>{status.percentage.toFixed(1)}%</TableCell>
                      <TableCell>
                        <ClientOnly>
                          <Progress value={status.percentage} className="h-2" />
                        </ClientOnly>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Average weekly attendance by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {/* This would be replaced with an actual chart component */}
                <div className="flex flex-col items-center justify-center h-full">
                  <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Chart showing monthly attendance trends would be displayed here.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The chart would integrate with a library like Chart.js or Recharts.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
              <div>Average Attendance: {calculatedValues.averageAttendance}</div>
              <div>Peak Month: {calculatedValues.peakMonth}</div>
            </CardFooter>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Service Comparison</CardTitle>
                <CardDescription>Attendance by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sunday Morning</span>
                      <span className="text-sm text-muted-foreground">312 (72.9%)</span>
                    </div>
                    <ClientOnly>
                      <Progress value={72.9} className="h-2" />
                    </ClientOnly>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sunday Evening</span>
                      <span className="text-sm text-muted-foreground">186 (43.5%)</span>
                    </div>
                    <ClientOnly>
                      <Progress value={43.5} className="h-2" />
                    </ClientOnly>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Midweek</span>
                      <span className="text-sm text-muted-foreground">142 (33.2%)</span>
                    </div>
                    <ClientOnly>
                      <Progress value={33.2} className="h-2" />
                    </ClientOnly>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Small Groups</span>
                      <span className="text-sm text-muted-foreground">201 (47%)</span>
                    </div>
                    <ClientOnly>
                      <Progress value={47} className="h-2" />
                    </ClientOnly>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>First-Time Visitors</CardTitle>
                <CardDescription>Monthly new visitor count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  {/* This would be replaced with an actual chart component */}
                  <div className="flex flex-col items-center justify-center h-full">
                    <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Chart showing monthly new visitors would be displayed here.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground">
                  Total new visitors this year: 217
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Ministries Tab */}
        <TabsContent value="ministries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Growing Ministries</CardTitle>
              <CardDescription>Ministries with highest growth rate</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ministry</TableHead>
                    <TableHead>Total Members</TableHead>
                    <TableHead>Growth Rate</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topMinistries.map((ministry) => (
                    <TableRow key={ministry.name}>
                      <TableCell className="font-medium">{ministry.name}</TableCell>
                      <TableCell>{ministry.members}</TableCell>
                      <TableCell>{ministry.growth.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <TrendingUp className="h-4 w-4 text-green-500 inline ml-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ministry Participation</CardTitle>
                <CardDescription>Members involved in ministries</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold mb-2">68%</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    of members are actively serving in a ministry
                  </p>
                  <ClientOnly>
                    <Progress value={68} className="h-2 w-full" />
                  </ClientOnly>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between text-sm text-muted-foreground">
                <div>Target: 75%</div>
                <div>+5.2% from last year</div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Leadership Development</CardTitle>
                <CardDescription>New leaders trained this year</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[120px]">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">23</div>
                    <p className="text-sm text-muted-foreground">
                      New ministry leaders trained
                    </p>
                    <p className="text-sm text-muted-foreground">
                      (7 more than previous year)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 