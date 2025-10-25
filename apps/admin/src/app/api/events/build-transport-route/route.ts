import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Google Maps API key from environment variables
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Type definitions
interface Waypoint {
  lat: number;
  lng: number;
  address: string;
  contact_id: string;
  request_id?: string;
}

interface RouteRequest {
  event_id: string;
  waypoints: Waypoint[];
  is_test_data?: boolean;
}

export async function POST(request: Request) {
  try {
    console.log('Route builder API called');
    
    // Validate request body
    const body: RouteRequest = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    if (!body.event_id || !body.waypoints || !Array.isArray(body.waypoints) || body.waypoints.length === 0) {
      console.error('Invalid request: missing required fields', body);
      return NextResponse.json(
        { message: 'Invalid request: event_id and waypoints are required' },
        { status: 400 }
      );
    }
    
    // Validate waypoints (skip detailed validation for test data)
    if (!body.is_test_data) {
      for (const waypoint of body.waypoints) {
        if (typeof waypoint.lat !== 'number' || typeof waypoint.lng !== 'number') {
          console.error('Invalid waypoint coordinates', waypoint);
          return NextResponse.json(
            { message: 'Invalid waypoint: lat and lng must be numbers' },
            { status: 400 }
          );
        }
      }
    }
    
    // Default location values if we can't get them from the event
    let eventName = 'Event';
    let eventDate = new Date().toISOString();
    let eventLocation = {
      lat: 39.72341827331013,
      lng: -104.80330062208942,
      address: 'Denver Church, 8400 E Yale Ave, Denver, CO 80231'
    };
    let eventData = null;
    
    // Only try to fetch the event if it's not a test ID
    if (body.event_id !== 'test-event-id') {
      try {
        console.log('Fetching event data for:', body.event_id);
        const { data: event, error: eventError } = await supabaseAdmin
          .from('events')
          .select('location, location_data, name, event_date')
          .eq('id', body.event_id)
          .single();
        
        if (eventError) {
          console.error('Error fetching event:', eventError);
        } else if (event) {
          console.log('Event found:', event);
          eventData = event;
          eventName = event.name || eventName;
          eventDate = event.event_date || eventDate;
          
          // Use event location_data if it exists and has coordinates
          if (event.location_data && 
              typeof event.location_data === 'object' && 
              event.location_data.lat && 
              event.location_data.lng) {
            eventLocation = event.location_data;
            console.log('Using location_data from event:', JSON.stringify(eventLocation));
          } else {
            console.log('No valid location_data found in event:', JSON.stringify(event.location_data));
            console.log('Using default Denver location instead');
          }
        }
      } catch (eventFetchError) {
        console.error('Exception fetching event:', eventFetchError);
        // Continue with default values
      }
    }
    
    if (!eventData) {
      console.log('Using default/mock event data');
    }
    
    console.log('Using event location:', eventLocation);
    
    // Generate a Google Maps directions URL with all the waypoints
    // This builds a route that starts at the church, visits all pickup locations, and returns to the church
    if (body.waypoints.length === 0) {
      return NextResponse.json(
        { message: 'No waypoints provided for route' },
        { status: 400 }
      );
    }
    
    // Build the Google Maps directions URL - format that will work both for embedding and direct navigation
    let directionsUrl = 'https://www.google.com/maps/dir/';
    
    // Start at the event location (origin) - use only coordinates for better compatibility
    directionsUrl += `${eventLocation.lat},${eventLocation.lng}/`;
    
    // Add all waypoints (passenger pickup locations) - use only coordinates
    for (const waypoint of body.waypoints) {
      directionsUrl += `${waypoint.lat},${waypoint.lng}/`;
    }
    
    // Return to the event location (destination) - use only coordinates
    directionsUrl += `${eventLocation.lat},${eventLocation.lng}/`;
    
    // No need for special parameters - Google Maps will recognize the format
    
    console.log('Generated directions URL:', directionsUrl);
    
    // Save the route to the database (only if not a test)
    if (body.event_id !== 'test-event-id') {
      try {
        console.log('Saving route to database');
        const { data: routeData, error: routeError } = await supabaseAdmin
          .from('transport_routes')
          .insert({
            event_id: body.event_id,
            waypoints: body.waypoints,
            url: directionsUrl,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (routeError) {
          console.error('Error saving route:', routeError);
          // Continue anyway since we want to return the route URL
        } else {
          console.log('Route saved to database:', routeData?.id);
        }
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Continue with the response
      }
    } else {
      console.log('Skipping database save for test route');
    }
    
    // Calculate approximate ETA and distance (this would ideally use the Google Distance Matrix API)
    // For now, we're providing a placeholder value
    const approxETA = '30 mins'; // Placeholder
    const totalDistance = '15 km'; // Placeholder
    
    return NextResponse.json({
      url: directionsUrl,
      eta: approxETA,
      total_distance: totalDistance,
      waypoints: body.waypoints,
      event: {
        id: body.event_id,
        name: eventName,
        date: eventDate,
        location: eventLocation
      }
    });
    
  } catch (error) {
    console.error('Error processing route request:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to build a test route when real data isn't available
function buildTestRoute(waypoints: Waypoint[]): string {
  const defaultLat = 39.72341827331013;
  const defaultLng = -104.80330062208942;
  
  let directionsUrl = 'https://www.google.com/maps/dir/';
  
  // Start at the default location (church) - use only coordinates
  directionsUrl += `${defaultLat},${defaultLng}/`;
  
  // Add waypoints - use only coordinates
  for (const waypoint of waypoints) {
    directionsUrl += `${waypoint.lat || defaultLat},${waypoint.lng || defaultLng}/`;
  }
  
  // Return to the default location (church) - use only coordinates
  directionsUrl += `${defaultLat},${defaultLng}/`;
  
  return directionsUrl;
} 