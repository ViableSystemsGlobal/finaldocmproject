'use client'

import Link from 'next/link'
import { 
  MessageSquare, 
  Mail, 
  Users, 
  Send, 
  FileText, 
  BarChart3,
  Plus,
  Activity,
  TrendingUp,
  Eye,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CommsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Communications
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Manage newsletters, campaigns, and messaging templates
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Newsletter Subscribers</p>
                  <p className="text-3xl font-bold">1,247</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Active subscribers</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Send className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Campaigns Sent</p>
                  <p className="text-3xl font-bold">45</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">This month</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Eye className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">Open Rate</p>
                  <p className="text-3xl font-bold">68%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Above average</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Templates</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Ready to use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Newsletter Management */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Newsletter</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Subscriber management & email sending
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Manage newsletter subscribers, create email campaigns, and track engagement with your church community.
              </p>
              <div className="flex gap-2">
                <Button 
                  asChild 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg rounded-lg"
                >
                  <Link href="/comms/newsletter">
                    <Mail className="mr-2 h-4 w-4" /> Manage
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-lg"
                >
                  <Link href="/comms/newsletter/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Campaigns</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Email & SMS campaigns
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Create and manage email and SMS campaigns for events, announcements, and ministry outreach.
              </p>
              <div className="flex gap-2">
                <Button 
                  asChild 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg rounded-lg"
                >
                  <Link href="/comms/campaigns">
                    <Send className="mr-2 h-4 w-4" /> Manage
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg"
                >
                  <Link href="/comms/campaigns/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-800">Templates</CardTitle>
                  <CardDescription className="text-sm text-slate-600">
                    Reusable message templates
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Create and manage reusable templates for newsletters, announcements, and regular communications.
              </p>
              <div className="flex gap-2">
                <Button 
                  asChild 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg rounded-lg"
                >
                  <Link href="/comms/templates">
                    <FileText className="mr-2 h-4 w-4" /> Manage
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-purple-200 hover:bg-purple-50 text-purple-700 rounded-lg"
                >
                  <Link href="/comms/templates/new">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/70 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common communication tasks and shortcuts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Link href="/comms/newsletter/new">
                  <Mail className="h-6 w-6 text-emerald-600" />
                  <span>Send Newsletter</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Link href="/comms/campaigns/new">
                  <Send className="h-6 w-6 text-blue-600" />
                  <span>New Campaign</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Link href="/comms/newsletter/subscribers">
                  <Users className="h-6 w-6 text-purple-600" />
                  <span>View Subscribers</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Link href="/comms/reports">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                  <span>View Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 