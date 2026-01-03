/**
 * Authentication middleware for API routes
 * Note: For web app, we use API keys or session tokens
 * Admin routes should use NextAuth sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from './supabase'

/**
 * Check if request has valid API key
 */
export function hasValidAPIKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!apiKey) return false
  
  // Compare with environment variable
  const validAPIKey = process.env.API_KEY || process.env.WEB_API_KEY
  
  if (!validAPIKey) {
    // If no API key is configured, allow requests (for backward compatibility)
    // But log a warning
    console.warn('⚠️  API key validation disabled - no API_KEY configured')
    return true
  }
  
  return apiKey === validAPIKey
}

/**
 * Check if request has valid session (for admin routes)
 */
export async function hasValidSession(request: NextRequest): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    return !error && !!user
  } catch (error) {
    return false
  }
}

/**
 * Require API key for route
 */
export function requireAPIKey(request: NextRequest): NextResponse | null {
  if (!hasValidAPIKey(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - API key required' },
      { status: 401 }
    )
  }
  return null
}

/**
 * Require session for route
 */
export async function requireSession(request: NextRequest): Promise<NextResponse | null> {
  const hasSession = await hasValidSession(request)
  if (!hasSession) {
    return NextResponse.json(
      { error: 'Unauthorized - Valid session required' },
      { status: 401 }
    )
  }
  return null
}

/**
 * Check if route should be public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/api/navigation',
    '/api/homepage',
    '/api/footer',
    '/api/events',
    '/api/sermons',
    '/api/blogs',
    '/api/word-of-year',
    '/api/tenant-settings',
    '/api/gallery-page',
    '/api/events-page',
    '/api/sermons-page',
    '/api/blog-page',
    '/api/about',
    '/api/contact-page',
    '/api/giving-page',
  ]
  
  return publicRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const protectedRoutes = [
    '/api/upload-media',
    '/api/donations',
    '/api/webhooks',
    '/api/send-email',
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}
