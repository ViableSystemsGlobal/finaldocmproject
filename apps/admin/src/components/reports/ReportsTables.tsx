"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, MessageSquare, Download } from "lucide-react"

interface TableProps {
  data: any[]
  loading: boolean
  error: string | null
}

export function TopMembersTable({ data, loading, error }: TableProps) {
  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Top Active Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/70 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Top Active Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-8">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 backdrop-blur-lg border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Top Active Members
        </CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((member, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>{member.groups || 0}</TableCell>
                <TableCell>{member.attendance || 0}</TableCell>
                <TableCell>{member.last_visit || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function RecentAttendanceTable({ data, loading, error }: TableProps) {
  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Recent Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 backdrop-blur-lg border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          Recent Attendance
        </CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Visitors</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{record.date}</TableCell>
                <TableCell>{record.event || 'Sunday Service'}</TableCell>
                <TableCell>{record.total}</TableCell>
                <TableCell>{record.members}</TableCell>
                <TableCell>{record.visitors}</TableCell>
                <TableCell>
                  {record.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function TopDonorsTable({ data, loading, error }: TableProps) {
  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            Top Donors (YTD)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 backdrop-blur-lg border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-600" />
          Top Donors (YTD)
        </CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Total Given</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Avg Gift</TableHead>
              <TableHead>Last Gift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((donor, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {donor.anonymous ? 'Anonymous Donor' : `${donor.first_name} ${donor.last_name}`}
                </TableCell>
                <TableCell className="font-semibold text-green-700">
                  ${donor.total_amount?.toLocaleString() || '0'}
                </TableCell>
                <TableCell>{donor.frequency || 0} gifts</TableCell>
                <TableCell>${donor.avg_gift?.toFixed(0) || '0'}</TableCell>
                <TableCell>{donor.last_gift || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function EmailCampaignsTable({ data, loading, error }: TableProps) {
  if (loading) {
    return (
      <Card className="bg-white/70 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-600" />
            Recent Email Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/70 backdrop-blur-lg border-white/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-600" />
          Recent Email Campaigns
        </CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Clicked</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((campaign, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{campaign.subject}</TableCell>
                <TableCell>{campaign.total_recipients}</TableCell>
                <TableCell>{campaign.total_delivered}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {campaign.total_opened}
                    <Badge variant="outline">
                      {campaign.total_recipients > 0 
                        ? ((campaign.total_opened / campaign.total_recipients) * 100).toFixed(1)
                        : 0}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {campaign.total_clicked}
                    <Badge variant="outline">
                      {campaign.total_recipients > 0 
                        ? ((campaign.total_clicked / campaign.total_recipients) * 100).toFixed(1)
                        : 0}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{campaign.sent_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 