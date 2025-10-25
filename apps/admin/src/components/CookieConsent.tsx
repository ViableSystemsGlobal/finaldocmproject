'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Cookie, Shield, CheckCircle2 } from 'lucide-react'

// Cookie Consent Context
interface CookieConsentContextType {
  hasConsent: boolean
  isLoading: boolean
  acceptCookies: () => void
  declineCookies: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

// Cookie Consent Provider Component
export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsent, setHasConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check initial consent state
    const consent = localStorage.getItem('cookie-consent')
    setHasConsent(consent === 'accepted')
    setIsLoading(false)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setHasConsent(true)
  }

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setHasConsent(false)
  }

  return (
    <CookieConsentContext.Provider value={{
      hasConsent,
      isLoading,
      acceptCookies,
      declineCookies
    }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

// Hook to use cookie consent
export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}

// Cookie Consent Modal Component
interface CookieConsentModalProps {
  onAccept?: () => void
}

export function CookieConsentModal({ onAccept }: CookieConsentModalProps) {
  const { hasConsent, acceptCookies, declineCookies } = useCookieConsent()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Only show banner if no consent has been given
    if (!hasConsent && localStorage.getItem('cookie-consent') !== 'declined') {
      setShowBanner(true)
    }
  }, [hasConsent])

  const handleAccept = () => {
    acceptCookies()
    setShowBanner(false)
    onAccept?.()
  }

  const handleDecline = () => {
    declineCookies()
    setShowBanner(false)
  }

  // Don't render if consent already given or declined
  if (hasConsent || !showBanner) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full mx-4 shadow-2xl border-0">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cookie className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Cookie Consent Required
              </h3>
              <p className="text-gray-600 mb-4">
                This admin portal requires cookies to manage your login session securely. 
                We use essential cookies to keep you logged in and ensure the security of your account.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Essential Cookies Only</h4>
                    <p className="text-sm text-blue-800">
                      We only use essential cookies required for authentication and security. 
                      No tracking or analytics cookies are used.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                <strong>What we store:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Authentication session tokens</li>
                  <li>Login state and security tokens</li>
                  <li>This cookie consent preference</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAccept}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium"
                >
                  Accept & Continue
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDecline}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Decline
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                By clicking "Accept & Continue", you agree to the use of essential cookies for authentication. 
                You can change this preference anytime by clearing your browser data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Cookie Status Indicator Component
export function CookieStatusIndicator() {
  const { hasConsent } = useCookieConsent()

  if (!hasConsent) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 shadow-lg">
        <CheckCircle2 className="h-4 w-4" />
        <span>Cookies enabled</span>
      </div>
    </div>
  )
}

// Main export for backward compatibility
export default CookieConsentModal 