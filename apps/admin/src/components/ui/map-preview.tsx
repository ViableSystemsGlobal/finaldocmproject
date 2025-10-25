'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface MapPreviewProps {
  address?: string
  lat?: number
  lng?: number
  height?: number
  className?: string
}

export function MapPreview({ 
  address, 
  lat, 
  lng, 
  height = 200, 
  className = "" 
}: MapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  useEffect(() => {
    const initializeMap = () => {
      const globalThis = window as any
      
      if (globalThis.google?.maps?.Map) {
        setMapsLoaded(true)
        return
      }

      // Load Google Maps API
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setError('Google Maps API key not configured')
        setIsLoading(false)
        return
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Script exists, wait for it to load
        const checkLoaded = () => {
          if (globalThis.google?.maps?.Map) {
            setMapsLoaded(true)
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
        return
      }

      // Create new script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsPreview`
      script.async = true
      script.defer = true

      // Set up callback
      ;(globalThis as any).initGoogleMapsPreview = () => {
        // Double check that everything is loaded
        if (globalThis.google?.maps?.Map) {
          setMapsLoaded(true)
        } else {
          console.error('Google Maps callback fired but API not fully loaded')
          setError('Failed to initialize Google Maps')
          setIsLoading(false)
        }
      }

      // Handle script load errors
      script.onerror = () => {
        setError('Failed to load Google Maps script')
        setIsLoading(false)
      }

      document.head.appendChild(script)
    }

    initializeMap()
  }, [])

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return

    const createMap = () => {
      const globalThis = window as any
      
      // Double-check that Google Maps is actually loaded
      if (!globalThis.google?.maps?.Map) {
        console.warn('Google Maps not fully loaded yet')
        setError('Google Maps is still loading...')
        return
      }
      
      try {
        // Default center (use provided coordinates or fallback)
        const center = lat && lng ? { lat, lng } : { lat: 39.8283, lng: -98.5795 } // Center of US

        const map = new globalThis.google.maps.Map(mapRef.current, {
          zoom: lat && lng ? 15 : 4,
          center,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        // Add marker if we have coordinates
        if (lat && lng) {
          new globalThis.google.maps.Marker({
            position: { lat, lng },
            map,
            title: address || 'Campus Location',
            icon: {
              path: globalThis.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }
          })
        } else if (address) {
          // Geocode the address if we don't have coordinates
          const geocoder = new globalThis.google.maps.Geocoder()
          geocoder.geocode({ address }, (results: any[], status: any) => {
            if (status === 'OK' && results[0]) {
              const location = results[0].geometry.location
              map.setCenter(location)
              map.setZoom(15)
              
              new globalThis.google.maps.Marker({
                position: location,
                map,
                title: address,
                icon: {
                  path: globalThis.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#3B82F6',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2
                }
              })
            }
          })
        }

        setIsLoading(false)
        setError(null) // Clear any previous errors
      } catch (err) {
        console.error('Error creating map:', err)
        setError('Failed to load map')
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure Google Maps is fully loaded
    const timer = setTimeout(createMap, 100)
    return () => clearTimeout(timer)
  }, [mapsLoaded, address, lat, lng])

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6" style={{ height }}>
          <div className="text-center text-slate-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">Map preview requires Google Maps API key</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6" style={{ height }}>
          <div className="text-center text-slate-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 relative">
        {isLoading && (
          <div 
            className="flex items-center justify-center absolute inset-0 bg-slate-50 z-10"
            style={{ height }}
          >
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Loading map...</p>
            </div>
          </div>
        )}
        <div 
          ref={mapRef} 
          style={{ height }} 
          className="w-full rounded-lg overflow-hidden"
        />
      </CardContent>
    </Card>
  )
} 