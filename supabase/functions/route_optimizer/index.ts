import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Note: In a real implementation, you would use the Google Maps API
// This is a simplified version that generates a mock route
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface RouteRequest {
  event_id: string;
}

interface Stop {
  request_id: string;
  address: string;
  lat?: number;
  lng?: number;
}

// Mock Google Maps functionality since we don't have access to the API in this example
const mockOptimizeRoute = (addresses: string[]) => {
  // In a real implementation, this would call the Google Maps API
  // to get an optimized route
  
  // Simulate route optimization by shuffling the waypoints
  const waypointOrder = [...Array(addresses.length).keys()];
  for (let i = waypointOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [waypointOrder[i], waypointOrder[j]] = [waypointOrder[j], waypointOrder[i]];
  }
  
  // Generate a fake polyline
  const polyline = "mock_polyline_data";
  
  return { waypointOrder, polyline };
};

// Generate Google Maps URL
const generateMapsUrl = (origin: string, waypoints: string[]) => {
  const waypointsStr = waypoints.map(w => encodeURIComponent(w)).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(origin)}&waypoints=${waypointsStr}`;
};

serve(async (req) => {
  try {
    // Create a Supabase client with the admin key
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Parse the request body
    const { event_id } = await req.json() as RouteRequest;
    
    if (!event_id) {
      return new Response(
        JSON.stringify({ error: "Missing event_id in request body" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Fetch pending and assigned transport requests for the event
    const { data: requests, error } = await supabase
      .from('transport_requests')
      .select('id, pickup_address, dropoff_address')
      .eq('event_id', event_id)
      .in('status', ['pending', 'assigned']);
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (!requests || requests.length === 0) {
      return new Response(
        JSON.stringify({ error: "No transport requests found for this event" }),
        { headers: { "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    // Extract addresses
    const waypoints = requests.map(r => r.pickup_address);
    const origin = waypoints[0]; // Use the first address as the origin/destination
    
    // Optimize the route (in a real implementation, this would use the Google Maps API)
    const { waypointOrder, polyline } = mockOptimizeRoute(waypoints);
    
    // Create stops array for the optimized route
    const stops: Stop[] = waypointOrder.map(index => ({
      request_id: requests[index].id,
      address: requests[index].pickup_address,
    }));
    
    // Generate Google Maps URL
    const url = generateMapsUrl(origin, waypoints);
    
    // Save the route in the database
    const { error: saveError } = await supabase
      .from('transport_routes')
      .insert({
        event_id,
        driver_id: null, // Will be assigned later
        vehicle_id: null, // Will be assigned later
        stops,
        polyline
      });
    
    if (saveError) {
      console.error("Error saving route:", saveError);
      // Continue anyway as the URL is the important part
    }
    
    return new Response(
      JSON.stringify({ url, stops }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in route optimizer:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 