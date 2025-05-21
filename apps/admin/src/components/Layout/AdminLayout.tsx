"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserPlus,
  UsersRound,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CalendarClock,
  Car,
  Smartphone,
  ChevronDown,
  Heart,
  BookOpen,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Define the type for navigation items
type NavigationChildItem = {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type NavigationSubItem = NavigationChildItem & {
  children?: NavigationChildItem[];
};

type NavigationItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationSubItem[];
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Reports & Analytics",
    href: "/reports",
    icon: BarChart3,
    children: [
      { name: "People Reports", href: "/reports/people" },
      { name: "Attendance Reports", href: "/reports/attendance" },
      { name: "Financial Reports", href: "/reports/financial" },
      { name: "Communication Reports", href: "/reports/communication" },
    ],
  },
  {
    name: "People",
    href: "/people",
    icon: Users,
    children: [
      { name: "Contacts", href: "/people/contacts", icon: Users },
      { name: "Members", href: "/people/members", icon: UsersRound },
      { name: "Visitors", href: "/people/visitors", icon: UserPlus },
      { name: "Ministries & Groups", href: "/people/groups", icon: UsersRound },
      { name: "Attendance", href: "/people/attendance", icon: CalendarClock },
      { name: "Discipleship Groups", href: "/people/discipleship-groups", icon: BookOpen },
      { 
        name: "Outreach", 
        href: "/people/outreach", 
        icon: Heart,
        children: [
          { name: "Follow-Ups", href: "/people/outreach/follow-ups" },
          { name: "Soul Winning", href: "/people/outreach/soul-winning" },
          { name: "Prayer Requests", href: "/people/outreach/prayer-requests" },
        ]
      },
      { name: "Transport Requests", href: "/people/transport", icon: Car },
      { name: "Mobile App Users", href: "/people/mobile-users", icon: Smartphone },
    ],
  },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Giving & Finance", href: "/finance", icon: DollarSign },
  { name: "Communications", href: "/communications", icon: MessageSquare },
  { name: "Content & Media", href: "/content", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()

  // Automatically open dropdowns based on the current path
  useEffect(() => {
    const newOpenState: Record<string, boolean> = {};
    
    navigation.forEach(item => {
      if (item.children) {
        // Check if current path starts with the item's href or if any child matches the current path
        const shouldOpen = 
          (item.href && pathname.startsWith(item.href)) || 
          item.children.some(child => {
            if (child.children) {
              return pathname.startsWith(child.href) || 
                child.children.some(grandchild => pathname.startsWith(grandchild.href));
            }
            return pathname.startsWith(child.href);
          });
        
        if (shouldOpen) {
          newOpenState[item.name] = true;
          
          // Also open any nested children that match the path
          item.children.forEach(child => {
            if (child.children) {
              const childShouldOpen = 
                pathname.startsWith(child.href) || 
                child.children.some(grandchild => pathname.startsWith(grandchild.href));
              
              if (childShouldOpen) {
                newOpenState[child.name] = true;
              }
            }
          });
        }
      }
    });
    
    setOpenDropdowns(prev => ({
      ...prev,
      ...newOpenState
    }));
  }, [pathname]);

  const toggleDropdown = (itemName: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  const handleNavItemClick = (item: NavigationItem | NavigationSubItem) => {
    // For items with children, only toggle the dropdown
    if ('children' in item && item.children) {
      toggleDropdown(item.name);
    } 
    // For items without children, navigate to the href
    else if (item.href) {
      router.push(item.href);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Render a nav item with optional children (recursive)
  const renderNavItem = (item: NavigationItem | NavigationSubItem, level: number = 0) => {
    // For items with children
    if ('children' in item && item.children) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => !collapsed && handleNavItemClick(item)}
            className={cn(
              "flex w-full items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
              pathname === item.href || pathname.startsWith(item.href || "")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed ? "justify-center" : "",
              level > 0 ? "ml-6" : ""
            )}
          >
            {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
            {!collapsed && (
              <>
                <span className="ml-3 text-left flex-1">{item.name}</span>
                <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform" 
                  style={{ transform: openDropdowns[item.name] ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </>
            )}
          </button>
          
          {!collapsed && openDropdowns[item.name] && (
            <div className={cn("space-y-1", level > 0 ? "ml-6" : "")}>
              {item.children.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }
    
    // For items without children (leaf nodes)
    return (
      <Link
        key={item.name}
        href={item.href || "#"}
        className={cn(
          "flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
          pathname === item.href
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed ? "justify-center" : "",
          level > 0 ? "ml-6" : ""
        )}
      >
        {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
        {!collapsed && <span className="ml-3 text-left">{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && <span className="text-lg font-semibold">CICS Admin</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => renderNavItem(item))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold">CICS Dashboard</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  )
} 