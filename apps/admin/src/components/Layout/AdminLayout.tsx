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
import { useTheme } from "next-themes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocalStorage } from "@/hooks/use-local-storage"

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
    children: [
      { name: "People Reports", href: "/reports/people" },
      { name: "Attendance Reports", href: "/reports/attendance" },
      { name: "Financial Reports", href: "/reports/financial" },
      { name: "Communication Reports", href: "/reports/communication" },
    ],
    shortcut: "R"
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
  { name: "Communications", href: "/comms", icon: MessageSquare, shortcut: "C" },
  { name: "Content & Media", href: "/content", icon: FileText, shortcut: "M" },
  { name: "Settings", href: "/settings", icon: Settings, shortcut: "S" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<NavigationChildItem>>([])
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const recentlyVisited = useRecentlyVisited()

  // Flatten navigation for search
  const flattenNavigation = () => {
    const items: NavigationChildItem[] = [];
    
    const processItem = (item: NavigationItem | NavigationSubItem) => {
      if (item.href) {
        items.push({
          name: item.name,
          href: item.href,
          icon: item.icon,
          shortcut: 'shortcut' in item ? item.shortcut : undefined
        });
      }
      
      if ('children' in item && item.children) {
        item.children.forEach(child => processItem(child));
      }
    };
    
    navigation.forEach(item => processItem(item));
    return items;
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const flatNav = flattenNavigation();
    
    const results = flatNav.filter(item => 
      item.name.toLowerCase().includes(lowerQuery)
    );
    
    setSearchResults(results);
  };

  // Search keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchDialog(true);
      }
      
      // Keyboard shortcuts for navigation
      if (e.altKey) {
        navigation.forEach(item => {
          if (item.shortcut && e.key.toLowerCase() === item.shortcut.toLowerCase() && item.href) {
            e.preventDefault();
            router.push(item.href);
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

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

  // Format time for recently visited
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Render a nav item with optional children (recursive)
  const renderNavItem = (item: NavigationItem | NavigationSubItem, level: number = 0) => {
    // For items with children
    if ('children' in item && item.children) {
      return (
        <div key={item.name} className="space-y-1">
          <TooltipProvider delayDuration={collapsed ? 100 : 1000}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => !collapsed && handleNavItemClick(item)}
                  className={cn(
                    "flex w-full items-center justify-start px-2 py-2 text-sm font-medium rounded-md group transition-colors",
                    pathname === item.href || pathname.startsWith(item.href || "")
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed ? "justify-center" : "",
                    level > 0 ? "ml-6" : ""
                  )}
                >
                  {item.icon && (
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                      pathname === item.href || pathname.startsWith(item.href || "") 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground group-hover:text-foreground"
                    )} />
                  )}
                  {!collapsed && (
                    <>
                      <span className="ml-3 text-left flex-1">{item.name}</span>
                      {item.shortcut && (
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          <span className="text-xs">⌥</span>{item.shortcut}
                        </kbd>
                      )}
                      <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform duration-200" 
                        style={{ transform: openDropdowns[item.name] ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">{item.name}</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
          
          {!collapsed && openDropdowns[item.name] && (
            <div className={cn("space-y-1 pl-2 animate-in slide-in-from-left-2 duration-200", level > 0 ? "ml-6" : "")}>
              {item.children.map((child) => renderNavItem(child, level + 1))}
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
                "flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md group transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed ? "justify-center" : "",
                level > 0 ? "ml-6" : ""
              )}
            >
              {item.icon && (
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110",
                  pathname === item.href 
                    ? "text-primary-foreground" 
                    : "text-muted-foreground group-hover:text-foreground"
                )} />
              )}
              {!collapsed && (
                <>
                  <span className="ml-3 text-left">{item.name}</span>
                  {item.shortcut && (
                    <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">⌥</span>{item.shortcut}
                    </kbd>
                  )}
                </>
              )}
            </Link>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">{item.name}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Find pages quickly with search
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                value={searchQuery} 
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
                autoFocus
              />
            </div>
            {searchResults.length > 0 && (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  {searchResults.map((result) => (
                    <Button
                      key={result.href}
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => {
                        router.push(result.href);
                        setShowSearchDialog(false);
                      }}
                    >
                      {result.icon && <result.icon className="mr-2 h-4 w-4" />}
                      {result.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter className="text-xs text-muted-foreground">
            Press Esc to close or Enter to select
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300 relative",
          collapsed ? "w-16" : "w-72"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && <span className="text-lg font-semibold">CICS Admin</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Search button for collapsed sidebar */}
        {collapsed ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mx-auto my-2"
            onClick={() => setShowSearchDialog(true)}
          >
            <Search className="h-4 w-4" />
          </Button>
        ) : (
          <div className="px-3 py-2">
            <Button 
              variant="outline" 
              className="w-full justify-start text-muted-foreground px-3 py-4 h-9"
              onClick={() => setShowSearchDialog(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search...</span>
              <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="space-y-1 px-2 py-2">
            {navigation.map((item) => renderNavItem(item))}
          </nav>

          {/* Recently visited */}
          {!collapsed && recentlyVisited.length > 0 && (
            <div className="px-3 py-2 mt-4">
              <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground flex items-center">
                <Clock className="mr-1 h-3 w-3" /> Recently Visited
              </h3>
              <div className="space-y-1">
                {recentlyVisited.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-2 py-1.5 text-sm rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-xs opacity-60">{formatTime(item.timestamp)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="mt-auto border-t p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold">CICS Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearchDialog(true)}
              className="hidden sm:flex items-center gap-1"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="sm:hidden"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  )
} 