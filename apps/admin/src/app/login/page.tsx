'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Mail, Lock, Eye, EyeOff, Sparkles, Shield, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CookieConsentProvider, CookieConsentModal, CookieStatusIndicator, useCookieConsent } from '@/components/CookieConsent'

// Login Form Component (needs to be separate to use the hook)
function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [churchName, setChurchName] = useState('Church')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const { hasConsent, isLoading: consentLoading } = useCookieConsent()

  // Load church settings - use the church profile logo
  useEffect(() => {
    const loadChurchSettings = async () => {
      try {
        const supabaseClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: settings } = await supabaseClient
          .from('tenant_settings')
          .select('logo_url, logo_black_url, name')
          .limit(1)
          .single()

        if (settings) {
          setChurchName(settings.name || 'Demonstration of Christ Ministries')
        }
        
        // Use the church profile logo (same as used in other fallbacks)
        setLogoUrl('https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1749507248987.png')
      } catch (error) {
        console.error('Failed to load church settings:', error)
        // Set fallback values including the church profile logo
        setChurchName('Demonstration of Christ Ministries')
        setLogoUrl('https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1749507248987.png')
      }
    }

    loadChurchSettings()
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      // Only check session if cookies are consented
      if (!hasConsent) return
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('Session found on page load:', session.user.email)
        router.push('/dashboard')
      }
    }
    
    if (!consentLoading) {
      checkSession()
    }
  }, [router, hasConsent, consentLoading])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check for cookie consent before authentication
    if (!hasConsent) {
      setError('Please accept cookies to enable login functionality')
      setLoading(false)
      return
    }

    // Validate inputs before sending to Supabase
    if (!email || email.trim() === '') {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (!password || password.trim() === '') {
      setError('Password is required')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('Login error:', error)
        throw error
      }

      if (data?.session) {
        console.log('Login successful, session:', data.session)
        console.log('Login successful, user:', data.session.user.email)
        
        // Wait a moment for the session to be set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if session is set
        const { data: { session: newSession } } = await supabase.auth.getSession()
        console.log('Session after login:', newSession ? 'Present' : 'Not present')
        
        if (newSession) {
          router.push('/dashboard')
        } else {
          throw new Error('Session not set after login')
        }
      } else {
        console.error('No session after login')
        throw new Error('No session after login')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCookieAccept = () => {
    // Cookie consent accepted, clear any error
    setError(null)
  }

  // Show loading state while checking consent
  if (consentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg text-slate-600">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Cookie Consent Modal */}
      <CookieConsentModal onAccept={handleCookieAccept} />

      {/* Cookie Status Indicator */}
      <CookieStatusIndicator />

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-gradient-to-r from-indigo-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-75"></div>
              <div className="relative bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-white/20">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={`${churchName} Logo`}
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <Sparkles className="h-12 w-12 text-blue-600" />
                )}
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600">
            Sign in to access {churchName} Admin
          </p>
        </div>

        {/* Main Login Card */}
        <Card className={`bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden transition-opacity duration-300 ${!hasConsent ? 'opacity-50' : 'opacity-100'}`}>
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-blue-600" />
              Sign In
            </CardTitle>
            <CardDescription>
              {!hasConsent 
                ? 'Please accept cookies to enable authentication'
                : 'Enter your email and password to continue'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 px-4 py-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Cookie Consent Required Message */}
            {!hasConsent && (
              <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 text-amber-800 px-4 py-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Cookie consent required for authentication
                  </span>
                </div>
              </div>
            )}

            {/* Email Login Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-white/50 border-2 border-slate-200/50 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    disabled={loading || !hasConsent}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-white/50 border-2 border-slate-200/50 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                    disabled={loading || !hasConsent}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100/50"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!hasConsent}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !hasConsent}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Mail className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" />
                )}
                {loading ? 'Signing in...' : !hasConsent ? 'Accept Cookies to Sign In' : 'Sign in'}
                {!loading && hasConsent && <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>Powered by {churchName} Management System</p>
        </div>
      </div>
    </div>
  )
}

// Main Login Page Component with Provider
export default function LoginPage() {
  return (
    <CookieConsentProvider>
      <LoginForm />
    </CookieConsentProvider>
  )
} 