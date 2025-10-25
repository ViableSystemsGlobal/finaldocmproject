"use client"

import Link from "next/link"
import { 
  Users, 
  UserPlus, 
  UsersRound, 
  CalendarClock, 
  Car, 
  Smartphone,
  Heart,
  BookOpen,
  ChevronRight,
  Sparkles
} from "lucide-react"

export default function PeoplePage() {
  const sections = [
    { 
      title: "Contacts",
      description: "Manage all contacts in the system",
      icon: Users,
      href: "/people/contacts",
      gradient: "from-blue-500 to-blue-600",
      stats: { count: "2,847", label: "Total Contacts" }
    },
    { 
      title: "Members",
      description: "View and manage church members",
      icon: UsersRound,
      href: "/people/members",
      gradient: "from-emerald-500 to-emerald-600",
      stats: { count: "1,234", label: "Active Members" }
    },
    { 
      title: "Visitors",
      description: "Track and follow up with visitors",
      icon: UserPlus,
      href: "/people/visitors",
      gradient: "from-purple-500 to-purple-600",
      stats: { count: "89", label: "Recent Visitors" }
    },
    { 
      title: "Ministries & Groups",
      description: "Manage ministries and small groups",
      icon: UsersRound,
      href: "/people/groups",
      gradient: "from-amber-500 to-orange-500",
      stats: { count: "24", label: "Active Groups" }
    },
    { 
      title: "Attendance",
      description: "Track attendance for events and services",
      icon: CalendarClock,
      href: "/people/attendance",
      gradient: "from-pink-500 to-rose-500",
      stats: { count: "856", label: "Avg Attendance" }
    },
    { 
      title: "Discipleship Groups",
      description: "Manage discipleship and small groups",
      icon: BookOpen,
      href: "/people/discipleship",
      gradient: "from-teal-500 to-cyan-500",
      stats: { count: "12", label: "Study Groups" }
    },
    { 
      title: "Outreach",
      description: "Soul winning and follow-up activities",
      icon: Heart,
      href: "/people/outreach",
      gradient: "from-red-500 to-pink-500",
      stats: { count: "45", label: "Active Outreach" }
    },
    { 
      title: "Transport",
      description: "Manage transport requests",
      icon: Car,
      href: "/people/transport",
      gradient: "from-indigo-500 to-blue-500",
      stats: { count: "18", label: "Active Requests" }
    },
    { 
      title: "Mobile App Users",
      description: "View and manage mobile app users",
      icon: Smartphone,
      href: "/people/mobile-users",
      gradient: "from-slate-600 to-slate-700",
      stats: { count: "456", label: "App Users" }
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                People Management
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Comprehensive tools for managing your church community
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Community Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-800">4,123</p>
                <p className="text-sm font-medium text-slate-600">Total People</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">1,234</p>
                <p className="text-sm font-medium text-slate-600">Active Members</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">89</p>
                <p className="text-sm font-medium text-slate-600">New This Month</p>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">24</p>
                <p className="text-sm font-medium text-slate-600">Active Groups</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section) => (
            <Link 
              key={section.title}
              href={section.href}
              className="group"
            >
              <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105">
                {/* Header */}
                <div className={`bg-gradient-to-r ${section.gradient} px-6 py-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <section.icon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{section.title}</h3>
                        <p className="text-white/80 text-sm">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-white/60 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6">
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-slate-800">{section.stats.count}</p>
                    <p className="text-sm font-medium text-slate-600">{section.stats.label}</p>
                  </div>
                  
                  <div className="flex items-center justify-center text-sm text-slate-500">
                    <span>Click to manage →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Additional Tools Section */}
        <div className="mt-16">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
                  <p className="text-slate-300">Common tasks and workflows</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link 
                  href="/people/contacts/new"
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 transition-all duration-200 group"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg mb-4 mx-auto w-fit">
                    <UserPlus className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600">Add New Contact</h4>
                  <p className="text-slate-600">Add a new person to the system</p>
                </Link>

                <Link 
                  href="/people/members/new"
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200 transition-all duration-200 group"
                >
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-3 rounded-lg mb-4 mx-auto w-fit">
                    <UsersRound className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-emerald-600">Add New Member</h4>
                  <p className="text-slate-600">Register a new church member</p>
                </Link>

                <Link 
                  href="/people/groups/new"
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 transition-all duration-200 group"
                >
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-lg mb-4 mx-auto w-fit">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-purple-600">Create Group</h4>
                  <p className="text-slate-600">Start a new ministry or group</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 