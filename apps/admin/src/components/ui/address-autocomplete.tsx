'use client';

import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';

// A global variable to track if Google Maps is already being loaded
let isLoadingGoogleMaps = false;
let googleMapsLoadPromise: Promise<void> | null = null;

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, location?: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

// Global function to ensure Google Maps is loaded
function loadGoogleMaps(): Promise<void> {
  // If already loaded, resolve immediately
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  // Check if script already exists
  const existingScript = document.getElementById('google-maps-script');
  if (existingScript && !isLoadingGoogleMaps) {
    // Script exists but Google isn't loaded yet, wait for it
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Google Maps failed to load'));
      }, 10000);
    });
    return googleMapsLoadPromise;
  }

  // Create new loading promise
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (existingScript) {
      existingScript.remove();
    }

    isLoadingGoogleMaps = true;

    // Create a unique callback name to avoid conflicts
    const callbackName = `initGoogleMaps_${Date.now()}`;
    
    // Create the global callback
    (window as any)[callbackName] = () => {
      console.log('Google Maps loaded successfully');
      isLoadingGoogleMaps = false;
      // Clean up the callback
      delete (window as any)[callbackName];
      resolve();
    };

    // Load the script
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Using latest Google Maps API with places library - supports both legacy and new AutocompleteSuggestion API
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      console.error('Error loading Google Maps script:', error);
      isLoadingGoogleMaps = false;
      delete (window as any)[callbackName];
      reject(error);
    };
    
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Enter address',
  className,
  disabled = false,
  style,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [scriptLoadError, setScriptLoadError] = useState(false);
  const [useNewAPI, setUseNewAPI] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const placesDiv = useRef<HTMLDivElement | null>(null);
  const isSelectingPlace = useRef<boolean>(false);
  const lastSelectedValue = useRef<string>('');
  
  // Load Google Maps when component mounts
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        initializeServices();
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setScriptLoadError(true);
      });

    return () => {
      // Clean up places div when component unmounts
      if (placesDiv.current && document.body.contains(placesDiv.current)) {
        try {
          document.body.removeChild(placesDiv.current);
        } catch (error) {
          console.error('Error removing placesDiv:', error);
        }
      }
    };
  }, []);
  
  // Initialize Google services
  const initializeServices = () => {
    try {
      console.log('Initializing Google services');
      
      // Create a div for PlacesService if it doesn't exist
      if (!placesDiv.current) {
        placesDiv.current = document.createElement('div');
        placesDiv.current.id = 'places-div-' + Math.random().toString(36).substring(2, 9);
        placesDiv.current.style.display = 'none';
        document.body.appendChild(placesDiv.current);
      }
      
      // Make sure Google services are defined before using them
      if (window.google?.maps?.places) {
        // Check if new API is available
        if (typeof window.google.maps.places.getSuggestions === 'function') {
          console.log('Using new Google Places API (getSuggestions)');
          setUseNewAPI(true);
        } else {
          console.log('Using legacy Google Places API (AutocompleteService)');
          console.info('⚠️  Google Maps AutocompleteService is deprecated. The new AutocompleteSuggestion API is recommended. See: https://developers.google.com/maps/documentation/javascript/places-migration-overview');
          try {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
          } catch (error) {
            console.error('Error creating AutocompleteService:', error);
          }
        }
        
        if (placesDiv.current) {
          try {
            placesService.current = new window.google.maps.places.PlacesService(placesDiv.current);
          } catch (error) {
            console.error('Error creating PlacesService:', error);
          }
        }
        
        setGoogleLoaded(true);
        console.log('Google services initialized successfully');
      } else {
        console.error('Google Maps or Places library not available');
        setScriptLoadError(true);
      }
    } catch (error) {
      console.error('Error initializing Google services:', error);
      setScriptLoadError(true);
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteContainerRef.current &&
        !autocompleteContainerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Debounce input value to prevent too many API calls
  const debouncedInputValue = useDebounce(inputValue, 300);
  
  // Fetch predictions when input value changes
  useEffect(() => {
    // Skip if no input, too short, Google not loaded, or currently selecting a place
    if (!debouncedInputValue || debouncedInputValue.length < 3 || !googleLoaded) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    
    // If the current input matches the last selected value, don't fetch predictions
    if (debouncedInputValue === lastSelectedValue.current) {
      setPredictions([]);
      setShowDropdown(false);
      // Reset selection state after a delay if user hasn't changed the input
      setTimeout(() => {
        if (inputValue === lastSelectedValue.current) {
          isSelectingPlace.current = false;
        }
      }, 100);
      return;
    }
    
    // If user is typing something different from the selected value, reset selection state
    if (isSelectingPlace.current && debouncedInputValue !== lastSelectedValue.current) {
      isSelectingPlace.current = false;
    }
    
    setIsLoading(true);
    
    if (useNewAPI && window.google?.maps?.places?.getSuggestions) {
      // Use new API
      try {
        window.google.maps.places.getSuggestions({
          input: debouncedInputValue,
          types: ['address'],
          maxResultCount: 10
        }).then((response: any) => {
          setIsLoading(false);
          
          // Don't show predictions if we're still in selection mode
          if (isSelectingPlace.current) {
            setPredictions([]);
            return;
          }
          
          if (!response.suggestions) {
            setPredictions([]);
            return;
          }
          
          // Convert new API format to legacy format for compatibility
          const convertedPredictions = response.suggestions
            .filter((suggestion: any) => suggestion.placePrediction)
            .map((suggestion: any) => ({
              description: suggestion.placePrediction.text.text,
              place_id: suggestion.placePrediction.placeId,
              structured_formatting: {
                main_text: suggestion.placePrediction.structuredFormat.mainText.text,
                secondary_text: suggestion.placePrediction.structuredFormat.secondaryText.text
              }
            }));
          
          setPredictions(convertedPredictions);
          setShowDropdown(true);
        }).catch((error: any) => {
          console.error('Error getting suggestions with new API:', error);
          setIsLoading(false);
          setPredictions([]);
        });
      } catch (error) {
        console.error('Error with new getSuggestions API:', error);
        setIsLoading(false);
        setPredictions([]);
      }
    } else if (autocompleteService.current) {
      // Use legacy API
      try {
        autocompleteService.current.getPlacePredictions(
          {
            input: debouncedInputValue,
            types: ['address'],
          },
          (results: any, status: any) => {
            setIsLoading(false);
            
            // Don't show predictions if we're still in selection mode
            if (isSelectingPlace.current) {
              setPredictions([]);
              return;
            }
            
            if (!status || !window.google?.maps?.places?.PlacesServiceStatus || 
                status !== window.google.maps.places.PlacesServiceStatus.OK || !results) {
              setPredictions([]);
              return;
            }
            
            setPredictions(results);
            setShowDropdown(true);
          }
        );
      } catch (error) {
        console.error('Error getting place predictions:', error);
        setIsLoading(false);
        setPredictions([]);
      }
    } else {
      setIsLoading(false);
      setPredictions([]);
    }
  }, [debouncedInputValue, googleLoaded, useNewAPI, inputValue]);
  
  const handleSelectPlace = (placeId: string, description: string) => {
    // Immediately set selection state and update UI
    isSelectingPlace.current = true;
    lastSelectedValue.current = description;
    setInputValue(description);
    setShowDropdown(false);
    setPredictions([]);
    
    if (!placesService.current) {
      console.error('Places Service not available');
      onChange(description);
      // Reset selection state after a delay
      setTimeout(() => {
        isSelectingPlace.current = false;
      }, 300);
      return;
    }
    
    try {
      placesService.current.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address'],
        },
        (place: any, status: any) => {
          if (!status || !window.google?.maps?.places?.PlacesServiceStatus || 
              status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
            console.error('Error fetching place details:', status);
            onChange(description);
            // Reset selection state after a delay
            setTimeout(() => {
              isSelectingPlace.current = false;
            }, 300);
            return;
          }
          
          const location = {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            address: place.formatted_address || description,
          };
          
          // Update the selected value if place details provide a different formatted address
          if (place.formatted_address && place.formatted_address !== description) {
            setInputValue(place.formatted_address);
            lastSelectedValue.current = place.formatted_address;
          }
          
          onChange(place.formatted_address || description, location);
          
          // Reset selection state after a delay
          setTimeout(() => {
            isSelectingPlace.current = false;
          }, 300);
        }
      );
    } catch (error) {
      console.error('Error getting place details:', error);
      onChange(description);
      // Reset selection state after a delay
      setTimeout(() => {
        isSelectingPlace.current = false;
      }, 300);
    }
  };
  
  // If we have a script loading error, show a simpler input without maps functionality
  if (scriptLoadError) {
    return (
      <div className="relative w-full">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={`${placeholder} (Maps unavailable)`}
          className={className}
          disabled={disabled}
          style={style}
        />
      </div>
    );
  }
  
  // Render a simple input if Google isn't loaded
  if (!googleLoaded) {
    return (
      <div className="relative w-full">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={`${placeholder} (Maps loading...)`}
          className={className}
          disabled={disabled}
          style={style}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  return (
    <div ref={autocompleteContainerRef} className="relative w-full">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (debouncedInputValue.length > 2 && predictions.length > 0 && !isSelectingPlace.current) {
            setShowDropdown(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        style={style}
      />
      
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background dark:bg-slate-800 border border-border dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-4 py-2 hover:bg-muted dark:hover:bg-slate-700 cursor-pointer text-slate-900 dark:text-slate-100"
              onClick={() => handleSelectPlace(prediction.place_id, prediction.description)}
            >
              {prediction.description}
            </div>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
} 