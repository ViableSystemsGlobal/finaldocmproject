"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  Receipt,
  CreditCard,
  Building,
  Clock,
  Search,
  Moon,
  Sun,
  Command,
  Mail,
  Sparkles,
  Zap,
  User,
  UserCircle,
  Settings as SettingsIcon,
  UserCheck,
  QrCode,
  Wrench
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useTenantSettings } from "@/hooks/use-tenant-settings"
import { usePermissions } from "@/hooks/usePermissions"
import { canAccessRoute } from "@/lib/permissions"
import { initializeTimezoneCache } from "@/lib/timezone-utils"
import { logEnvironmentStatus } from "@/lib/env-validation"

// Define the type for navigation items
type NavigationChildItem = {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
};

type NavigationSubItem = NavigationChildItem & {
  children?: NavigationChildItem[];
};

type NavigationItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationSubItem[];
  shortcut?: string;
};

// Custom hook for recently visited pages
function useRecentlyVisited(maxItems = 5) {
  const [recentlyVisited, setRecentlyVisited] = useState<Array<{ name: string; href: string; timestamp: number }>>([]);
  const pathname = usePathname();

  // Client-side only effect to avoid hydration mismatches with Date.now()
  useEffect(() => {
    const savedVisited = localStorage.getItem('recentlyVisited');
    if (savedVisited) {
      try {
        setRecentlyVisited(JSON.parse(savedVisited));
      } catch (e) {
        console.error('Failed to parse saved visits', e);
      }
    }
    
    // Validate environment on startup
    logEnvironmentStatus();
    
    // Initialize timezone cache on app startup
    const initTimezone = async () => {
      try {
        const { initializeTimezoneCache } = await import('@/lib/timezone-utils');
        await initializeTimezoneCache();
      } catch (error) {
        console.error('Failed to initialize timezone cache:', error);
      }
    };
    initTimezone();
  }, []);

  useEffect(() => {
    const findCurrentPage = () => {
      const findInItems = (items: (NavigationItem | NavigationSubItem | NavigationChildItem)[]): { name: string; href: string } | null => {
        for (const item of items) {
          if (item.href === pathname) {
            return { name: item.name, href: item.href };
          }
          
          if ('children' in item && item.children) {
            const found = findInItems(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      return findInItems(navigation);
    };
    
    const currentPage = findCurrentPage();
    if (currentPage) {
      setRecentlyVisited(prev => {
        // Remove if already exists
        const filtered = prev.filter(item => item.href !== currentPage.href);
        // Add to beginning with timestamp
        const newVisited = [{ ...currentPage, timestamp: Date.now() }, ...filtered].slice(0, maxItems);
        // Save to localStorage for persistence
        localStorage.setItem('recentlyVisited', JSON.stringify(newVisited));
        return newVisited;
      });
    }
  }, [pathname, maxItems]);

  return recentlyVisited;
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "D" },
  {
    name: "Reports & Analytics",
    href: "/reports",
    icon: BarChart3,
    shortcut: "R"
  },
  {
    name: "People",
    href: "/people",
    icon: Users,
    children: [
      { name: "Contacts", href: "/people/contacts", icon: Users },
      { name: "Pending Contacts", href: "/people/pending-contacts", icon: UserCheck },
      { name: "Members", href: "/people/members", icon: UsersRound },
      { name: "Visitors", href: "/people/visitors", icon: UserPlus },
      { name: "Ministries & Groups", href: "/people/groups", icon: UsersRound },
      { name: "Attendance", href: "/people/attendance", icon: CalendarClock },
      { name: "Discipleship", href: "/people/discipleship", icon: BookOpen },
      { 
        name: "Outreach", 
        href: "/people/outreach", 
        icon: Heart,
        children: [
          { name: "Follow-Ups", href: "/people/outreach/follow-ups" },
          { name: "Soul Winning", href: "/people/outreach/soul-winning" },
          { name: "Prayer Requests", href: "/people/outreach/prayer-requests" },
          { name: "Planned Visits", href: "/people/outreach/planned-visits" },
          { name: "Website Messages", href: "/people/outreach/website-messages" },
        ]
      },
      { name: "Transport Requests", href: "/people/transport", icon: Car },
      { name: "Mobile App Users", href: "/people/mobile-users", icon: Smartphone },
    ],
    shortcut: "P"
  },
  { name: "Events", href: "/events", icon: Calendar, shortcut: "E" },
  { 
    name: "Giving & Finance", 
    href: "/finance", 
    icon: DollarSign,
    children: [
      { name: "Giving", href: "/finance/giving", icon: Receipt },
      { name: "Expenses", href: "/finance/expenses", icon: CreditCard },
      { name: "Assets", href: "/finance/assets", icon: Building },
    ],
    shortcut: "F"
  },
  {
    name: "Communications",
    href: "/comms",
    icon: MessageSquare,
    children: [
      { name: "Newsletter", href: "/comms/newsletter" },
      { name: "Campaigns", href: "/comms/campaigns" },
      { name: "Templates", href: "/comms/templates" },
      { name: "Email Health", href: "/comms/email-health" },
    ],
    shortcut: "C"
  },
  { 
    name: "Content & Media", 
    href: "/content", 
    icon: FileText, 
    children: [
      { name: "Pages", href: "/content" },
      { name: "Blogs", href: "/content/blogs" },
      { name: "Sermons", href: "/content/sermons" },
      { name: "Media Library", href: "/content/media" },
    ],
    shortcut: "M" 
  },
  {
    name: "Tools",
    href: "/tools",
    icon: Wrench,
    children: [
      { name: "QR Code Generator", href: "/tools/qr-code", icon: QrCode },
    ],
    shortcut: "T"
  },
  { name: "Settings", href: "/settings", icon: Settings, shortcut: "S" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useLocalStorage("sidebar-collapsed", false)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ name: string; href: string; icon?: React.ComponentType<{ className?: string }> }>>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const recentlyVisited = useRecentlyVisited()
  const { churchName, logoUrl } = useTenantSettings()
  const { userPermissions } = usePermissions()

  // Fetch current user information
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        
        if (user) {
          // Fetch user profile from user_profiles table
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
          
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    
    getCurrentUser()
  }, [])

  // Get user display name
  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`
    }
    if (userProfile?.first_name) {
      return userProfile.first_name
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0]
    }
    return 'User'
  }

  // Get user initials
  const getUserInitials = () => {
    const displayName = getUserDisplayName()
    if (displayName === 'User') return 'U'
    
    const words = displayName.split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase()
    }
    return displayName[0].toUpperCase()
  }

  // Get user role
  const getUserRole = () => {
    if (userProfile?.user_type === 'admin_staff') return 'Administrator'
    if (userProfile?.user_type === 'staff') return 'Staff'
    if (userProfile?.user_type === 'volunteer') return 'Volunteer'
    return 'User'
  }

  // Flatten navigation for search
  const flattenNavigation = () => {
    const flattened: Array<{ name: string; href: string; icon?: React.ComponentType<{ className?: string }> }> = []
    
    const processItem = (item: NavigationItem | NavigationSubItem) => {
      if (item.href) {
        flattened.push({ name: item.name, href: item.href, icon: item.icon })
      }
      
      if ('children' in item && item.children) {
        item.children.forEach(child => {
          processItem(child)
        })
      }
    }
    
    navigation.forEach(item => processItem(item))
    return flattened
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() === "") {
      setSearchResults([])
      return
    }
    
    const allItems = flattenNavigation()
    const filtered = allItems.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    )
    setSearchResults(filtered)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearchDialog(true)
      }
      
      // Alt + letter shortcuts
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toUpperCase()
        
        // Find navigation item with matching shortcut
        const findItemWithShortcut = (items: (NavigationItem | NavigationSubItem)[]): string | null => {
          for (const item of items) {
            if (item.shortcut === key && item.href) {
              return item.href
            }
            if ('children' in item && item.children) {
              const found = findItemWithShortcut(item.children)
              if (found) return found
            }
          }
          return null
        }
        
        const targetHref = findItemWithShortcut(navigation)
        if (targetHref) {
          e.preventDefault()
          router.push(targetHref)
        }
      }
      
      // Escape to close search dialog
      if (e.key === 'Escape' && showSearchDialog) {
        setShowSearchDialog(false)
      }
      
      // Enter to select first search result
      if (e.key === 'Enter' && showSearchDialog && searchResults.length > 0) {
        e.preventDefault()
        router.push(searchResults[0].href)
        setShowSearchDialog(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, showSearchDialog, searchResults])

  const toggleDropdown = (itemName: string, parentItem?: string) => {
    console.log(`Toggling dropdown for: ${itemName}, Parent: ${parentItem || 'none'}`);
    
    setOpenDropdowns(prev => {
      const key = parentItem ? `${parentItem}.${itemName}` : itemName
      const isCurrentlyOpen = prev[key]
      
      if (isCurrentlyOpen) {
        // If currently open, just close it
        const newState = { ...prev }
        delete newState[key]
        console.log('Closing dropdown, new state:', newState);
        return newState
      } else {
        // If currently closed, open this one
        if (parentItem) {
          // This is a child dropdown - just toggle it without affecting others
          const newState = { ...prev, [key]: true }
          console.log('Opening child dropdown, new state:', newState);
          return newState
        } else {
          // This is a top-level dropdown - close other top-level dropdowns but keep children
          const newState = { ...prev }
          
          // Close other top-level dropdowns (those without dots in the key)
          Object.keys(newState).forEach(existingKey => {
            if (!existingKey.includes('.') && existingKey !== key) {
              delete newState[existingKey]
            }
          })
          
          // Open this dropdown
          newState[key] = true
          console.log('Opening top-level dropdown and closing others, new state:', newState);
          return newState
        }
      }
    })
  }

  const handleNavItemClick = (item: NavigationItem | NavigationSubItem, parentName?: string) => {
    console.log(`Navigation item clicked: ${item.name}, Parent: ${parentName || 'none'}`);
    
    if ('children' in item && item.children) {
      // This item has children, toggle the dropdown
      toggleDropdown(item.name, parentName);
    } else if (item.href) {
      // This is a leaf item, navigate to it
      router.push(item.href);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  const renderNavItem = (item: NavigationItem | NavigationSubItem, level: number = 0, parentName?: string) => {
    const isActive = pathname === item.href || (item.href && pathname.startsWith(item.href + "/"))
    
    // For items with children
    if ('children' in item && item.children) {
      const dropdownKey = parentName ? `${parentName}.${item.name}` : item.name
      const isOpen = openDropdowns[dropdownKey]
      
      return (
        <div key={item.name} className="space-y-1">
          <TooltipProvider delayDuration={collapsed ? 100 : 1000}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (!collapsed) {
                      console.log(`Clicked item: ${item.name}, Level: ${level}, Parent: ${parentName || 'none'}`);
                      handleNavItemClick(item, level > 0 ? parentName : undefined);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center justify-start px-4 py-3 text-sm font-semibold rounded-xl group transition-all duration-200 relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-md dark:text-slate-300 dark:hover:bg-slate-700/50",
                    collapsed ? "justify-center px-3" : "",
                    level > 0 ? "ml-4" : ""
                  )}
                >
                  {/* Animated background effect */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 transition-opacity duration-200",
                    !isActive && "group-hover:opacity-100"
                  )} />
                  
                  {item.icon && (
                    <div className={cn(
                      "relative p-2 rounded-lg transition-all duration-200",
                      isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isActive ? "text-white" : "text-slate-600 group-hover:text-slate-800 dark:text-slate-300"
                      )} />
                    </div>
                  )}
                  {!collapsed && (
                    <>
                      <span className="ml-3 text-left flex-1 relative z-10">{item.name}</span>
                      {item.shortcut && (
                        <kbd className={cn(
                          "hidden sm:inline-flex h-6 select-none items-center gap-1 rounded-lg px-2 font-mono text-[10px] font-bold transition-all duration-200 relative z-10",
                          isActive 
                            ? "bg-white/20 text-white" 
                            : "bg-slate-200 text-slate-600 group-hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                        )}>
                          <span className="text-xs">⌥</span>{item.shortcut}
                        </kbd>
                      )}
                      <ChevronDown className={cn(
                        "h-4 w-4 flex-shrink-0 transition-all duration-300 relative z-10",
                        isOpen ? 'rotate-180' : 'rotate-0',
                        isActive ? "text-white" : "text-slate-400"
                      )} />
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right" className="font-semibold">{item.name}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
          
          {!collapsed && isOpen && (
            <div className={cn(
              "space-y-1 pl-4 animate-in slide-in-from-left-2 duration-300", 
              level > 0 ? "ml-4" : ""
            )}>
              {item.children.filter((child) => {
                // If child has children, check if user has access to any grandchild
                if ('children' in child && child.children && Array.isArray(child.children) && child.children.length > 0) {
                  return child.children.some((grandchild) => canAccessRoute(userPermissions, grandchild.href))
                }
                // Show child if no href or if user has access to the route
                return !child.href || canAccessRoute(userPermissions, child.href)
              }).map((child) => renderNavItem(child, level + 1, item.name))}
            </div>
          )}
        </div>
      );
    }
    
    // For items without children (leaf nodes)
    return (
      <TooltipProvider key={item.name} delayDuration={collapsed ? 100 : 1000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href || "#"}
              className={cn(
                "flex items-center justify-start px-4 py-3 text-sm font-semibold rounded-xl group transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-md dark:text-slate-300 dark:hover:bg-slate-700/50",
                collapsed ? "justify-center px-3" : "",
                level > 0 ? "ml-4" : ""
              )}
            >
              {/* Animated background effect */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 transition-opacity duration-200",
                !isActive && "group-hover:opacity-100"
              )} />
              
              {item.icon && (
                <div className={cn(
                  "relative p-2 rounded-lg transition-all duration-200",
                  isActive ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "text-white" : "text-slate-600 group-hover:text-slate-800 dark:text-slate-300"
                  )} />
                </div>
              )}
              {!collapsed && (
                <>
                  <span className="ml-3 text-left relative z-10">{item.name}</span>
                  {item.shortcut && (
                    <kbd className={cn(
                      "ml-auto hidden sm:inline-flex h-6 select-none items-center gap-1 rounded-lg px-2 font-mono text-[10px] font-bold transition-all duration-200 relative z-10",
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-200 text-slate-600 group-hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                    )}>
                      <span className="text-xs">⌥</span>{item.shortcut}
                    </kbd>
                  )}
                </>
              )}
            </Link>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right" className="font-semibold">{item.name}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 bg-white/95 backdrop-blur-xl dark:bg-slate-900/95">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Search</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Find pages quickly with search
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-100/50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <Search className="h-5 w-5 text-slate-500" />
              <Input 
                placeholder="Search..." 
                value={searchQuery} 
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 border-0 bg-transparent text-lg placeholder:text-slate-400 focus-visible:ring-0"
                autoFocus
              />
            </div>
            {searchResults.length > 0 && (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <Button
                      key={result.href}
                      variant="ghost" 
                      className="w-full justify-start h-12 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700"
                      onClick={() => {
                        router.push(result.href);
                        setShowSearchDialog(false);
                      }}
                    >
                      {result.icon && (
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 mr-3">
                          <result.icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </div>
                      )}
                      <span className="font-medium">{result.name}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter className="text-xs text-slate-500">
            Press Esc to close or Enter to select
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-xl transition-all duration-300 relative dark:bg-slate-900/70 dark:border-slate-700/50",
          collapsed ? "w-20" : "w-80"
        )}
      >
        {/* Logo */}
        <div className="flex h-32 items-start justify-between px-6 pt-4 border-b border-slate-200/50 dark:border-slate-700/50">
          {!collapsed ? (
            <div className="flex flex-col items-center gap-2 flex-1 mt-2">
              <div className="relative">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={`${churchName} Logo`}
                    className="h-16 w-16 object-contain rounded-xl"
                    onError={(e) => {
                      // Fallback to default icon if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackIcon = document.createElement('div');
                        fallbackIcon.innerHTML = '<svg class="h-16 w-16 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                        parent.appendChild(fallbackIcon);
                      }
                    }}
                  />
                ) : (
                  <Sparkles className="h-16 w-16 text-slate-600 dark:text-slate-300" />
                )}
              </div>
              <div className="text-center max-w-full">
                <span className="text-sm font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300 leading-tight block truncate px-2">
                  {churchName}
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Church Management System</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center w-full mt-4">
              <div className="relative">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={`${churchName} Logo`}
                    className="h-12 w-12 object-contain rounded-lg"
                    onError={(e) => {
                      // Fallback to default icon if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackIcon = document.createElement('div');
                        fallbackIcon.innerHTML = '<svg class="h-12 w-12 text-slate-600 dark:text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
                        parent.appendChild(fallbackIcon);
                      }
                    }}
                  />
                ) : (
                  <Sparkles className="h-12 w-12 text-slate-600 dark:text-slate-300" />
                )}
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-xl dark:text-slate-300 dark:hover:bg-slate-700/50 absolute top-2 right-4"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Search button for collapsed sidebar */}
        {collapsed ? (
          <div className="p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-full h-12 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700"
              onClick={() => setShowSearchDialog(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="px-4 py-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 rounded-xl border-2 border-slate-200 bg-white/50 hover:bg-white/80 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
              onClick={() => setShowSearchDialog(true)}
            >
              <Search className="mr-3 h-5 w-5 text-slate-500" />
              <span className="font-medium text-slate-600 dark:text-slate-300">Search...</span>
              <kbd className="ml-auto inline-flex h-6 select-none items-center gap-1 rounded-lg border bg-slate-100 px-2 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
                      <nav className="space-y-2 px-4 py-2">
              {navigation.filter((item) => {
                // If item has children, check if user has access to any child
                if (item.children && item.children.length > 0) {
                  const hasAccessToAnyChild = item.children.some(child => {
                    if (child.children && child.children.length > 0) {
                      return child.children.some(grandchild => canAccessRoute(userPermissions, grandchild.href))
                    }
                    return canAccessRoute(userPermissions, child.href)
                  })
                                     return hasAccessToAnyChild
                 }
                 
                 // Show item if no href (has children) or if user has access to the route
                 const hasAccess = !item.href || canAccessRoute(userPermissions, item.href)
                return hasAccess
              }).map((item) => renderNavItem(item))}
          </nav>

          {/* Recently visited */}
          {!collapsed && recentlyVisited.length > 0 && (
            <div className="px-4 py-4 mt-6">
              <h3 className="mb-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center dark:text-slate-400">
                <Clock className="mr-2 h-4 w-4" /> Recently Visited
              </h3>
              <div className="space-y-2">
                {recentlyVisited.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2 text-sm rounded-xl text-slate-600 hover:bg-white/50 hover:text-slate-800 transition-all duration-200 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200"
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="text-xs opacity-60 font-mono">{formatTime(item.timestamp)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="mt-auto border-t border-slate-200/50 p-4 flex items-center justify-between dark:border-slate-700/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            className="rounded-xl hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-slate-800 dark:hover:to-slate-700"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-amber-500" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 dark:hover:bg-red-900/20"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-white/20 px-6 bg-white/50 backdrop-blur-xl dark:bg-slate-900/50 dark:border-slate-700/50">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300">{churchName} Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Church Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearchDialog(true)}
              className="hidden sm:flex items-center gap-2 h-10 rounded-xl border-2 bg-white/50 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
            >
              <Search className="h-4 w-4" />
              <span className="font-medium">Search</span>
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-100 px-1.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/50">
                  <Avatar
                    src={userProfile?.profile_image}
                    alt={getUserDisplayName()}
                    fallback={getUserInitials()}
                    size="sm"
                    className="h-8 w-8"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-xl border-0 bg-white/95 backdrop-blur-xl shadow-xl dark:bg-slate-900/95" align="end">
                <DropdownMenuLabel className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={userProfile?.profile_image}
                      alt={getUserDisplayName()}
                      fallback={getUserInitials()}
                      size="md"
                    />
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getUserRole()}
                      </p>
                      {currentUser?.email && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                          {currentUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                <DropdownMenuItem
                  onClick={() => router.push('/settings/profile')}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer rounded-lg mx-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <User className="h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer rounded-lg mx-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <SettingsIcon className="h-4 w-4" />
                  <span>Preferences</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer rounded-lg mx-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer rounded-lg mx-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="sm:hidden rounded-xl hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-slate-800 dark:hover:to-slate-700"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="sm:hidden text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 dark:hover:bg-red-900/20"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
} 