import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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
          console.log('Middleware - Getting cookie:', name, cookie ? 'Found' : 'Not found')
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

    return response
  } catch (error) {
    console.error('Middleware - Error:', error)
    return response
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
} 