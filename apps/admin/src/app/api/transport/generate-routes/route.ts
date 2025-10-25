import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;
    
    console.log('🗺️ Generating routes for event:', eventId);

    // Step 1: Get all assigned transport requests with correct field names
    const { data: transportRequests, error: requestsError } = await supabase
      .from('transport_requests')
      .select(`
        *,
        contact:contact_id(*),
        assigned_driver_data:assigned_driver(*),
        assigned_vehicle_data:assigned_vehicle(*)
      `)
      .eq('event_id', eventId)
      .eq('status', 'assigned')
      .not('assigned_driver', 'is', null)
      .not('assigned_vehicle', 'is', null);

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      throw new Error(`Failed to fetch transport requests: ${requestsError.message}`);
    }

    if (!transportRequests || transportRequests.length === 0) {
      return NextResponse.json(
        { 
          error: 'No assigned transport requests found',
          details: 'Please assign vehicles first using the auto-assign feature'
        },
        { status: 400 }
      );
    }

    console.log(`📋 Found ${transportRequests.length} assigned requests`);

    // Step 2: Group requests by driver
    const driverGroups = new Map();
    
    transportRequests.forEach((request: any) => {
      const driverId = request.assigned_driver;
      if (!driverGroups.has(driverId)) {
        driverGroups.set(driverId, {
          driver: request.assigned_driver_data,
          vehicle: request.assigned_vehicle_data,
          requests: []
        });
      }
      driverGroups.get(driverId).requests.push(request);
    });

    console.log(`👥 Grouped into ${driverGroups.size} driver routes`);

    // Step 3: Create routes for each driver
    const routes = [];
    let routeIndex = 1;

    for (const [driverId, group] of Array.from(driverGroups.entries())) {
      const routeName = `Route ${routeIndex} - ${group.driver?.name || 'Unknown Driver'}`;
      
      // Create waypoints from pickup locations
      const waypoints = group.requests.map((request: any, index: number) => ({
        order: index + 1,
        address: request.pickup_address || 'Unknown Address',
        passenger: request.contact ? `${request.contact.first_name} ${request.contact.last_name}` : 'Unknown Passenger',
        phone: request.contact?.phone || null,
        lat: request.pickup_location?.lat || 0,
        lng: request.pickup_location?.lng || 0,
        contact_id: request.contact_id,
        request_id: request.id
      }));

      // Create Google Maps URL for this route
      const addresses = waypoints
        .filter((wp: any) => wp.address && wp.address !== 'Unknown Address')
        .map((wp: any) => encodeURIComponent(wp.address));
      
      let googleMapsUrl = '';
      if (addresses.length > 1) {
        googleMapsUrl = `https://www.google.com/maps/dir/${addresses.join('/')}`;
      } else if (addresses.length === 1) {
        googleMapsUrl = `https://www.google.com/maps/search/${addresses[0]}`;
      } else {
        googleMapsUrl = 'https://www.google.com/maps';
      }

      const routeData = {
        event_id: eventId,
        driver_id: driverId,
        vehicle_id: group.vehicle?.id,
        waypoints: {
          route_name: routeName,
          stops: waypoints,
          total_stops: waypoints.length
        },
        url: googleMapsUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      routes.push(routeData);
      
      console.log(`📍 Created route for ${group.driver?.name}: ${waypoints.length} stops`);
      routeIndex++;
    }

    if (routes.length === 0) {
      return NextResponse.json(
        { 
          error: 'No routes could be generated',
          details: 'No valid pickup addresses found for assigned requests'
        },
        { status: 400 }
      );
    }

    // Step 4: Delete existing routes for this event first
    const { error: deleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('event_id', eventId);

    if (deleteError) {
      console.warn('Warning: Could not delete existing routes:', deleteError);
    }

    // Step 5: Save new routes to database
    const { data: savedRoutes, error: saveError } = await supabase
      .from('transport_routes')
      .insert(routes)
      .select();

    if (saveError) {
      console.error('Error saving routes:', saveError);
      throw new Error(`Failed to save routes: ${saveError.message}`);
    }

    console.log(`🎉 Successfully generated and saved ${routes.length} routes`);

    return NextResponse.json({
      success: true,
      message: `Generated ${routes.length} optimized routes for ${driverGroups.size} drivers`,
      data: savedRoutes,
      summary: {
        routesGenerated: routes.length,
        driversAssigned: driverGroups.size,
        totalStops: routes.reduce((total, route) => total + (route.waypoints as any).stops.length, 0)
      }
    });

  } catch (error) {
    console.error('❌ Route generation error:', error);
    return NextResponse.json(
      { 
        error: 'Route generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 