'use client';

import { useEffect, useRef, useState } from 'react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  className?: string;
  placeholder?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMapsAutocomplete?: () => void;
  }
}

export default function LocationAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  className = '',
  placeholder = 'Enter your location'
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script is already in document
    const existingScript = document.getElementById('google-maps-autocomplete');
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          setIsLoading(false);
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        setIsLoading(false);
      }, 5000);

      return;
    }

    // Create callback function
    const callbackName = `initGoogleMapsAutocomplete_${Date.now()}`;
    window[callbackName as any] = () => {
      console.log('✅ Google Maps loaded');
      setIsLoaded(true);
      setIsLoading(false);
      delete window[callbackName as any];
    };

    // Load Google Maps script
    const script = document.createElement('script');
    script.id = 'google-maps-autocomplete';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps');
      setIsLoading(false);
      delete window[callbackName as any];
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      // Initialize Google Places Autocomplete
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US addresses (change if needed)
        fields: ['formatted_address', 'address_components', 'geometry', 'name']
      });

      autocompleteRef.current = autocomplete;

      // Listen for place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();

        if (place.formatted_address) {
          onChange(place.formatted_address);
          if (onPlaceSelected) {
            onPlaceSelected(place);
          }
        } else if (place.name) {
          onChange(place.name);
        }
      });

      console.log('✅ Autocomplete initialized');
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
    }
  }, [isLoaded, onChange, onPlaceSelected]);

  // Update input value when prop changes
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        className={className}
        placeholder={isLoading ? 'Loading...' : placeholder}
        disabled={isLoading}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      {!isLoading && !isLoaded && (
        <p className="text-xs text-red-500 mt-1">
          Could not load address suggestions
        </p>
      )}
    </div>
  );
}

