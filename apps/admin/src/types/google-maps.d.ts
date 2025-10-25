declare namespace google {
  namespace maps {
    namespace places {
      // Deprecated - use AutocompleteSuggestion instead
      interface AutocompleteService {
        getPlacePredictions(
          request: {
            input: string;
            types?: string[];
            componentRestrictions?: { country: string | string[] };
            bounds?: LatLngBounds;
          },
          callback: (
            results: AutocompletePrediction[] | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      // New recommended API
      interface AutocompleteSuggestion {
        placePrediction?: PlacePrediction;
        queryPrediction?: QueryPrediction;
      }

      interface PlacePrediction {
        place: string; // Place ID
        placeId: string;
        text: {
          text: string;
          matches: Array<{
            endOffset: number;
          }>;
        };
        structuredFormat: {
          mainText: {
            text: string;
            matches: Array<{
              endOffset: number;
            }>;
          };
          secondaryText: {
            text: string;
            matches: Array<{
              endOffset: number;
            }>;
          };
        };
        types: string[];
      }

      interface QueryPrediction {
        text: {
          text: string;
          matches: Array<{
            endOffset: number;
          }>;
        };
        structuredFormat: {
          mainText: {
            text: string;
            matches: Array<{
              endOffset: number;
            }>;
          };
          secondaryText: {
            text: string;
            matches: Array<{
              endOffset: number;
            }>;
          };
        };
      }

      interface PlacesService {
        getDetails(
          request: {
            placeId: string;
            fields?: string[];
          },
          callback: (
            result: PlaceResult | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      interface AutocompletePrediction {
        description: string;
        place_id: string;
        structured_formatting?: {
          main_text: string;
          secondary_text: string;
        };
        terms?: Array<{
          offset: number;
          value: string;
        }>;
        matched_substrings?: Array<{
          length: number;
          offset: number;
        }>;
      }

      interface PlaceResult {
        geometry?: {
          location?: {
            lat(): number;
            lng(): number;
          };
        };
        formatted_address?: string;
        name?: string;
        place_id?: string;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
        NOT_FOUND = 'NOT_FOUND'
      }

      // Deprecated - use the new approach instead
      class AutocompleteService {
        constructor();
      }

      class PlacesService {
        constructor(attrContainer: Element);
      }

      // New API functions
      function searchByText(request: {
        textQuery: string;
        fields: string[];
        locationBias?: LatLng;
        maxResultCount?: number;
      }): Promise<{
        places: PlaceResult[];
      }>;

      function searchByAddress(request: {
        address: string;
        maxResultCount?: number;
      }): Promise<{
        places: PlaceResult[];
      }>;

      function getSuggestions(request: {
        input: string;
        locationBias?: LatLng;
        types?: string[];
        maxResultCount?: number;
      }): Promise<{
        suggestions: AutocompleteSuggestion[];
      }>;
    }

    interface LatLngBounds {
      contains(latLng: LatLng): boolean;
      equals(other: LatLngBounds): boolean;
      extend(point: LatLng): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      intersects(other: LatLngBounds): boolean;
      isEmpty(): boolean;
      toJSON(): object;
      toSpan(): LatLng;
      toString(): string;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
      toString(): string;
      toUrlValue(precision?: number): string;
    }
  }
}

// Extend Window interface
interface Window {
  initGoogleMapsAutocomplete?: () => void;
  google?: typeof google;
} 