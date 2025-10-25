'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useNavigation } from '@/hooks/useNavigation'
import { useTenantSettings } from '@/hooks/useTenantSettings'
import { X } from 'lucide-react'

export function Navigation() {
  const { navigation, loading } = useNavigation()
  const { churchName, webLogoUrl, loading: settingsLoading } = useTenantSettings()
  const pathname = usePathname()
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({})
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Check if we're on the plan-visit page
  const isPlanVisitPage = pathname === '/events/plan-visit'

  const openDropdown = (itemId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemId]: true
    }))
  }

  const closeDropdown = (itemId: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [itemId]: false
    }))
  }

  const closeAllDropdowns = () => {
    setOpenDropdowns({})
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
        closeMobileMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isPlanVisitPage
          ? 'bg-white border-b border-gray-200' // Solid white background for plan-visit page
          : isScrolled 
            ? 'bg-black border-b border-gray-800' 
            : 'bg-black/10 backdrop-blur-md border-b border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                {settingsLoading ? (
                  // Loading state
                  <div className="w-32 h-32 bg-white/20 rounded-full animate-pulse"></div>
                ) : webLogoUrl ? (
                  // Church Logo from Admin Settings
                  <div className="w-32 h-32 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <img 
                      src={webLogoUrl} 
                      alt={`${churchName} Logo`}
                      className="w-32 h-32 object-contain rounded-full"
                      onError={(e) => {
                        // Fallback to default icon if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-32 h-32 bg-white rounded-full flex items-center justify-center"><span class="text-black font-bold text-4xl">D</span></div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  // Fallback default logo
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-black font-bold text-4xl">D</span>
                  </div>
                )}
              </Link>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-2">
              {loading ? (
                // Loading skeleton - keeps your design intact while loading
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-16 h-8 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                navigation.map((item) => (
                  <div key={item.id} className="relative">
                    {item.children && item.children.length > 0 ? (
                      // Dropdown menu item - improved event handling
                      <div 
                        className="relative group"
                        onMouseLeave={() => closeDropdown(item.id)}
                      >
                        <button 
                          className={`relative px-4 py-2 font-medium transition-all duration-300 flex items-center gap-1 group ${
                            isPlanVisitPage
                              ? 'text-gray-700 hover:text-gray-900'
                              : 'text-white/90 hover:text-white'
                          }`}
                          onMouseEnter={() => openDropdown(item.id)}
                          onClick={() => openDropdown(item.id)}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            {item.label}
                            <svg className={`w-4 h-4 transition-transform duration-300 ${openDropdowns[item.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                          <div className={`absolute inset-0 bg-white/10 rounded-md transition-opacity duration-300 ${openDropdowns[item.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                        </button>
                        
                        {/* Dropdown Menu - preserving ALL your beautiful styling */}
                        <div 
                          className={`absolute top-full left-0 mt-1 w-48 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 py-2 transition-all duration-300 ${
                            openDropdowns[item.id] 
                              ? 'opacity-100 visible transform translate-y-0 scale-100' 
                              : 'opacity-0 invisible transform -translate-y-2 scale-95'
                          }`}
                          onMouseEnter={() => openDropdown(item.id)}
                          onMouseLeave={() => closeDropdown(item.id)}
                        >
                          {item.children.map((child) => (
                            <Link 
                              key={child.id}
                              href={child.href} 
                              className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 relative group"
                              onClick={() => closeAllDropdowns()}
                            >
                              <span className="flex items-center gap-2">
                                {getIconForLink(child.href)}
                                {child.label}
                              </span>
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top"></div>
                            </Link>
                          ))}
                        </div>

                        {/* Invisible bridge to prevent dropdown from closing - made larger */}
                        <div 
                          className="absolute top-full left-0 w-48 h-3 bg-transparent"
                          onMouseEnter={() => openDropdown(item.id)}
                        ></div>
                      </div>
                    ) : (
                      // Regular menu item - keeping ALL your original styling
                      <Link href={item.href} className={`relative px-4 py-2 font-medium transition-all duration-300 group ${
                        isPlanVisitPage
                          ? 'text-gray-700 hover:text-gray-900'
                          : 'text-white/90 hover:text-white'
                      }`}>
                        <span className="relative z-10">{item.label}</span>
                        <div className="absolute inset-0 bg-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Desktop CTA Button & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Desktop Donation Button - Hidden on mobile */}
              <Link 
                href="/give" 
                className={`hidden lg:block px-6 py-3 font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group ${
                  isPlanVisitPage
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="relative z-10">Make A Donation</span>
                {!isPlanVisitPage && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                )}
              </Link>
              
              {/* Mobile Give Button */}
              <Link 
                href="/give" 
                className="lg:hidden px-3 py-2 text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-all duration-300 rounded-md"
              >
                Give
              </Link>
              
              {/* Mobile Menu Button */}
              <button 
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 group"
              >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sidebar */}
      <div className={`fixed inset-0 z-60 lg:hidden transition-all duration-300 ${
        isMobileMenuOpen ? 'visible' : 'invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
        ></div>
        
        {/* Sidebar */}
        <div className={`mobile-menu-container absolute top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button 
                onClick={closeMobileMenu}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {loading ? (
                <div className="px-6 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <nav className="space-y-1">
                  {navigation.map((item) => (
                    <div key={item.id}>
                      {item.children && item.children.length > 0 ? (
                        // Dropdown menu item for mobile
                        <div>
                          <button 
                            className="w-full flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => openDropdown(item.id)}
                          >
                            <span className="font-medium">{item.label}</span>
                            <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdowns[item.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {/* Submenu */}
                          {openDropdowns[item.id] && (
                            <div className="bg-gray-50 border-t border-gray-200">
                              {item.children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={child.href}
                                  className="flex items-center gap-3 px-8 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                  onClick={closeMobileMenu}
                                >
                                  {getIconForLink(child.href)}
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        // Regular menu item for mobile
                        <Link
                          href={item.href}
                          className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                          onClick={closeMobileMenu}
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </>
  )
}

// Helper function to get icons for different menu items
function getIconForLink(href: string) {
  const lowerHref = href.toLowerCase()
  
  if (lowerHref.includes('sermon')) {
    return (
      <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
      </svg>
    )
  }
  
  if (lowerHref.includes('gallery')) {
    return (
      <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  }
  
  if (lowerHref.includes('blog')) {
    return (
      <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  }
  
  return null
}