import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Route permissions mapping - same as in permissions.ts
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['dashboard:view'],
  
  // Reports & Analytics
  '/reports': ['reports:view:all', 'attendance:reports', 'giving:reports', 'comms:reports'],
  '/reports/people': ['reports:view:all', 'contacts:view:all'],
  '/reports/attendance': ['reports:view:all', 'attendance:reports'],
  '/reports/financial': ['reports:view:all', 'giving:reports'],
  '/reports/communication': ['reports:view:all', 'comms:reports'],
  
  // People Management
  '/people': ['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned'],
  '/people/contacts': ['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned'],
  '/people/members': ['members:view:all', 'contacts:view:all'],
  '/people/visitors': ['contacts:view:all', 'contacts:view:department', 'contacts:view:assigned'],
  '/people/groups': ['groups:view:all', 'groups:view:department'],
  '/people/attendance': ['attendance:view:all', 'attendance:view:department'],
  '/people/discipleship': ['discipleship:view:all', 'discipleship:view:department'],
  
  // Outreach
  '/people/outreach': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
  '/people/outreach/follow-ups': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
  '/people/outreach/soul-winning': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
  '/people/outreach/prayer-requests': ['prayers:view:all', 'prayers:view:department', 'prayers:view:assigned'],
  '/people/outreach/planned-visits': ['followups:view:all', 'followups:view:department', 'followups:view:assigned'],
  '/people/outreach/website-messages': ['comms:view:all', 'followups:view:all'],
  
  // Other People sections
  '/people/transport': ['events:view:all', 'events:view:assigned'],
  '/people/mobile-users': ['admin:settings'],
  
  // Events
  '/events': ['events:view:all', 'events:view:assigned'],
  
  // Finance & Giving
  '/finance': ['giving:view:all', 'giving:view:summary'],
  '/finance/giving': ['giving:view:all', 'giving:view:summary'],
  '/finance/expenses': ['giving:view:all'],
  '/finance/assets': ['giving:view:all'],
  
  // Communications
  '/comms': ['comms:view:all'],
  '/comms/newsletter': ['comms:view:all'],
  '/comms/campaigns': ['comms:view:all'],
  '/comms/templates': ['comms:view:all'],
  
  // Content Management
  '/content': ['sermons:view:all', 'blogs:view:all', 'media:view:all'],
  '/content/sermons': ['sermons:view:all'],
  '/content/blogs': ['blogs:view:all'],
  '/content/media': ['media:view:all'],
  
  // Settings & Administration
  '/settings': ['admin:settings', 'roles:manage'],
  '/settings/roles': ['roles:manage', 'admin:users']
}

// Check if user has any of the required permissions
function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission))
}

// Get user profile and permissions from database
async function getUserProfileAndPermissions(supabase: any, userId: string): Promise<{
  profile: any | null;
  permissions: string[];
  hasAdminAccess: boolean;
}> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      console.error('Middleware - Error fetching user profile:', profileError)
      
      // If user profile doesn't exist, create a basic one for existing admin users
      if (profileError.code === 'PGRST116') {
        console.log('Middleware - User profile not found, creating basic admin profile')
        
        try {
          // Get user info from auth
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
          
          if (!authError && authUser?.user) {
            // Create basic admin profile (using correct column names)
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: userId,
                first_name: authUser.user.user_metadata?.full_name?.split(' ')[0] || 'Admin',
                last_name: authUser.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'User',
                user_type: 'admin_staff',
                app_access: ['admin'],
                is_active: true
              })
              .select()
              .single()
            
            if (!createError && newProfile) {
              console.log('Middleware - Created basic admin profile successfully')
              return { profile: newProfile, permissions: [], hasAdminAccess: true }
            } else {
              console.error('Middleware - Error creating profile:', createError)
            }
          }
        } catch (createErr) {
          console.error('Middleware - Error in profile creation:', createErr)
        }
      }
      
      return { profile: null, permissions: [], hasAdminAccess: false }
    }

    // Check if user has admin access
    const hasAdminAccess = profile?.app_access?.includes('admin') || false

    if (!hasAdminAccess) {
      console.log('Middleware - User does not have admin access')
      return { profile, permissions: [], hasAdminAccess: false }
    }

    // Get user permissions if they have admin access
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`role:roles(permissions)`)
      .eq('user_id', userId)

    if (rolesError) {
      console.error('Middleware - Error fetching user roles:', rolesError)
      return { profile, permissions: [], hasAdminAccess }
    }

    const permissions = (userRoles || [])
      .map((ur: any) => ur.role?.permissions || [])
      .flat()
    
    return { 
      profile, 
      permissions: Array.from(new Set(permissions)), 
      hasAdminAccess 
    }
  } catch (error) {
    console.error('Middleware - Error getting user data:', error)
    return { profile: null, permissions: [], hasAdminAccess: false }
  }
}

// Legacy function for backward compatibility
async function getUserPermissions(supabase: any, userId: string): Promise<string[]> {
  const { permissions } = await getUserProfileAndPermissions(supabase, userId)
  return permissions
}

export async function middleware(request: NextRequest) {
  console.log('Middleware - Starting request for path:', request.nextUrl.pathname)
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = request.cookies.get(name)
          // Reduced logging - only log auth token, not the chunked pieces
          if (name === 'sb-ufjfafcfkalaasdhgcbi-auth-token') {
            console.log('Middleware - Getting auth token:', cookie ? 'Found' : 'Not found')
          }
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          console.log('Middleware - Setting cookie:', name)
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          console.log('Middleware - Removing cookie:', name)
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    }
  )

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Middleware - Session error:', error)
    }
    
    console.log('Middleware - Session:', session ? 'Present' : 'Not present')
    if (session) {
      console.log('Middleware - Session user:', session.user.email)
    }
    console.log('Middleware - Current path:', request.nextUrl.pathname)

    // If user is not signed in and the current path is not /login,
    // redirect the user to /login
    if (!session && request.nextUrl.pathname !== "/login") {
      console.log('Middleware - Redirecting to login')
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // If user is signed in and the current path is /login,
    // redirect the user to /dashboard
    if (session && request.nextUrl.pathname === "/login") {
      console.log('Middleware - Redirecting to dashboard')
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Check user access and permissions for protected routes
    if (session) {
      const pathname = request.nextUrl.pathname
      
      // Create service role client for database access
      const serviceSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get: () => undefined,
            set: () => {},
            remove: () => {},
          },
        }
      )
      
      // Get user profile and permissions
      const { profile, permissions: userPermissions, hasAdminAccess } = await getUserProfileAndPermissions(serviceSupabase, session.user.id)
      console.log('Middleware - User profile:', profile)
      console.log('Middleware - Has admin access:', hasAdminAccess)
      console.log('Middleware - User permissions:', userPermissions)
      
      // TEMPORARY: Allow admin@docmchurch.org to bypass profile check
      const isAdminUser = session.user.email === 'admin@docmchurch.org'
      const finalHasAdminAccess = hasAdminAccess || isAdminUser
      
      console.log('Middleware - Is admin user:', isAdminUser)
      console.log('Middleware - Final has admin access:', finalHasAdminAccess)
      
      // Check if user has admin access to the admin system
      if (!finalHasAdminAccess) {
        console.log('Middleware - User does not have admin access, redirecting to unauthorized page')
        
        // Redirect to a "unauthorized" page or login with message
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'unauthorized')
        redirectUrl.searchParams.set('message', 'You do not have access to the admin system')
        return NextResponse.redirect(redirectUrl)
      }
      
      // Check if user profile is active
      if (profile && !profile.is_active) {
        console.log('Middleware - User profile is inactive')
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'account_disabled')
        redirectUrl.searchParams.set('message', 'Your account has been disabled')
        return NextResponse.redirect(redirectUrl)
      }
      
      const requiredPermissions = routePermissions[pathname]
      
      // If the route requires specific permissions
      if (requiredPermissions) {
        console.log('Middleware - Checking permissions for route:', pathname)
        console.log('Middleware - Required permissions:', requiredPermissions)
        
        // Check if user has any of the required permissions
        const hasAccess = hasAnyPermission(userPermissions, requiredPermissions)
        console.log('Middleware - Has access:', hasAccess)
        
        if (!hasAccess) {
          console.log('Middleware - Access denied for route:', pathname)
          
          // Don't create redirect loops - allow access to dashboard even without permissions
          // but the dashboard page itself will show appropriate error/limited view
          if (pathname === '/dashboard') {
            console.log('Middleware - Dashboard access denied but allowing to prevent redirect loop')
            return response
          }
          
          // For other protected routes, redirect to dashboard with error message
          console.log('Middleware - Redirecting to dashboard with access denied message')
          const redirectUrl = new URL('/dashboard', request.url)
          redirectUrl.searchParams.set('access_denied', '1')
          redirectUrl.searchParams.set('attempted_route', pathname)
          return NextResponse.redirect(redirectUrl)
        }
      } else {
        console.log('Middleware - Route not in permissions map, allowing access:', pathname)
      }
    }

    return response
  } catch (error) {
    console.error('Middleware - Error:', error)
    return response
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
} 