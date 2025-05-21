"use client"

import Link from "next/link"
import { 
  Users, 
  UserPlus, 
  UsersRound, 
  CalendarClock, 
  Car, 
  Smartphone 
} from "lucide-react"

export default function PeoplePage() {
  const sections = [
    { 
      title: "Contacts",
      description: "Manage all contacts in the system",
      icon: Users,
      href: "/people/contacts",
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    { 
      title: "Members",
      description: "View and manage church members",
      icon: UsersRound,
      href: "/people/members",
      color: "bg-green-50 text-green-700 border-green-200"
    },
    { 
      title: "Visitors",
      description: "Track and follow up with visitors",
      icon: UserPlus,
      href: "/people/visitors",
      color: "bg-purple-50 text-purple-700 border-purple-200"
    },
    { 
      title: "Groups",
      description: "Manage ministries and small groups",
      icon: UsersRound,
      href: "/people/groups",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200"
    },
    { 
      title: "Attendance",
      description: "Track attendance for events and services",
      icon: CalendarClock,
      href: "/people/attendance",
      color: "bg-pink-50 text-pink-700 border-pink-200"
    },
    { 
      title: "Transport",
      description: "Manage transport requests",
      icon: Car,
      href: "/people/transport",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    { 
      title: "Mobile App Users",
      description: "View and manage mobile app users",
      icon: Smartphone,
      href: "/people/mobile-users",
      color: "bg-cyan-50 text-cyan-700 border-cyan-200"
    }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">People</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link 
            key={section.title}
            href={section.href}
            className={`p-4 rounded-lg border ${section.color} hover:opacity-90 transition-opacity`}
          >
            <div className="flex items-center space-x-3">
              <section.icon className="h-6 w-6" />
              <div>
                <h2 className="font-semibold">{section.title}</h2>
                <p className="text-sm opacity-80">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
} 