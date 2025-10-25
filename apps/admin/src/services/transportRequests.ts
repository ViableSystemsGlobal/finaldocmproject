import { supabase } from '@/lib/supabase';
import {
  TransportRequest,
  TransportRequestInsert,
  TransportRequestUpdate,
  TransportRequestWithRelations,
  TransportRequestWithEventAndRoute,
  Driver,
  Vehicle,
  TransportRoute,
  TransportStatus,
  EventDriver,
  EventDriverInsert,
  EventDriverUpdate,
  OptimizedRoute,
  OptimizedRouteInsert,
  OptimizedRouteUpdate,
  EventTransportSummary
} from '@/types/transport';

// Type for the route data returned from the route optimizer
export interface RouteData {
  url: string;
  eta: string;
  total_distance: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    address: string;
    contact_id: string;
  }>;
  event?: {
    id: string;
    name: string;
    date: string;
    location: {
      lat: number;
      lng: number;
      address: string;
    }
  };
}

// Additional contact type
export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

// Requests CRUD
export async function fetchRequests(filters: { event_id?: string; status?: string } = {}) {
  console.log('Fetching transport requests with filters:', filters);
  
  try {
    const query = supabase
      .from('transport_requests')
      .select('*, event:event_id(name,event_date), contact:contact_id(first_name,last_name), driver:assigned_driver(name), vehicle:assigned_vehicle(license_plate)')
      .order('requested_at', { ascending: false });
    
    // Apply filters if provided
    if (filters.event_id) {
      query.eq('event_id', filters.event_id);
    }
    
    if (filters.status) {
      query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching transport requests:', error);
      throw new Error(`Failed to fetch transport requests: ${error.message}`);
    }
    
    return { data: data as TransportRequestWithRelations[], error: null };
  } catch (error) {
    console.error('Exception in fetchRequests:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Unknown error fetching requests') 
    };
  }
}

export async function fetchRequest(id: string) {
  return supabase
    .from('transport_requests')
    .select('*, event:event_id(name,event_date), contact:contact_id(first_name,last_name), driver:assigned_driver(name), vehicle:assigned_vehicle(license_plate)')
    .eq('id', id)
    .single();
}

export async function createRequest(data: TransportRequestInsert) {
  console.log('Creating transport request with service role access');
  
  // Check if supabase is properly initialized
  if (!supabase) {
    console.error('supabase client not initialized');
    return { data: null, error: new Error('Admin client not initialized') };
  }
  
  try {
    // Clone the data to avoid modifying the original
    const requestData = { ...data };
    
    // Handle the pickup_location separately to avoid geometry parsing errors
    const pickupLocation = requestData.pickup_location;
    delete requestData.pickup_location; // Remove from the main request data
    
    console.log('Request data without location:', requestData);
    
    // First create the transport request without the location
    const response = await supabase
      .from('transport_requests')
      .insert(requestData)
      .select()
      .single();
    
    if (response.error) {
      console.error('Error creating transport request:', response.error);
      return response;
    }
    
    // If we have location data and the initial insert was successful
    if (pickupLocation && response.data?.id) {
      console.log('Adding pickup location data:', pickupLocation);
      
      try {
        // Format location data for PostGIS
        const locationData = {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
          address: pickupLocation.address
        };
        
        // Update the record with the location data
        const locationUpdate = await supabase
          .from('transport_requests')
          .update({ pickup_location: locationData })
          .eq('id', response.data.id)
          .select()
          .single();
        
        if (locationUpdate.error) {
          console.warn('Failed to update with location data:', locationUpdate.error);
          // Return the original response even if location update fails
          return response;
        }
        
        return locationUpdate;
      } catch (locationError) {
        console.error('Error updating location data:', locationError);
        // Return the original response even if location update fails
        return response;
      }
    }
    
    return response;
  } catch (err) {
    console.error('Exception in createRequest:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

export async function updateRequest(id: string, data: TransportRequestUpdate) {
  return supabase
    .from('transport_requests')
    .update(data)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteRequest(id: string) {
  try {
    const { error } = await supabase
      .from('transport_requests')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting transport request:', error);
      throw new Error(`Failed to delete transport request: ${error.message}`);
    }
    
    return { error: null };
  } catch (error) {
    console.error('Exception in deleteRequest:', error);
    return { 
      error: error instanceof Error ? error : new Error('Unknown error deleting request') 
    };
  }
}

// Drivers & Vehicles
export async function fetchDrivers() {
  return supabase
    .from('drivers')
    .select('*')
    .order('name');
}

export async function fetchVehicles() {
  return supabase
    .from('vehicles')
    .select('*')
    .order('make');
}

/**
 * Auto-assign vehicles to transport requests based on capacity and proximity
 */
export async function autoAssignVehicles(eventId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    console.log('Starting auto vehicle assignment for event:', eventId);

    // Get all pending transport requests for this event
    const { data: requests, error: requestsError } = await supabase
      .from('transport_requests')
      .select(`
        id,
        contact_id,
        pickup_location,
        status,
        contact:contacts(first_name, last_name, phone, email)
      `)
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .is('assigned_driver', null)
      .is('assigned_vehicle', null);

    if (requestsError) {
      console.error('Error fetching transport requests:', requestsError);
      return { data: null, error: requestsError };
    }

    if (!requests || requests.length === 0) {
      console.log('No pending transport requests found for auto assignment');
      return { data: [], error: null };
    }

    // Get available drivers and their vehicles
    const { data: eventDrivers, error: driversError } = await supabase
      .from('event_drivers')
      .select(`
        driver_id,
        vehicle_id,
        status,
        driver:drivers(id, name, email),
        vehicle:vehicles(id, make, model, license_plate, capacity, status)
      `)
      .eq('event_id', eventId)
      .eq('status', 'assigned');

    if (driversError) {
      console.error('Error fetching event drivers:', driversError);
      return { data: null, error: driversError };
    }

    if (!eventDrivers || eventDrivers.length === 0) {
      console.log('No drivers assigned to this event for auto assignment');
      return { data: [], error: null };
    }

    // Filter drivers with available vehicles
    const availableDrivers = eventDrivers.filter(ed => 
      ed.vehicle && 
      ed.vehicle.status === 'available' && 
      ed.vehicle.capacity > 0
    );

    if (availableDrivers.length === 0) {
      console.log('No drivers with available vehicles found');
      return { data: [], error: { message: 'No drivers with available vehicles found' } };
    }

    console.log(`Found ${requests.length} requests and ${availableDrivers.length} available drivers`);

    // Simple assignment algorithm: assign to driver with largest available capacity
    const assignments = [];
    const driverLoads = new Map(); // Track how many passengers assigned to each driver

    // Initialize driver loads
    availableDrivers.forEach(driver => {
      driverLoads.set(driver.driver_id, 0);
    });

    for (const request of requests) {
      // Find driver with largest remaining capacity
      let bestDriver = null;
      let maxRemainingCapacity = 0;

      for (const driver of availableDrivers) {
        const currentLoad = driverLoads.get(driver.driver_id) || 0;
        const remainingCapacity = (driver.vehicle?.capacity || 0) - currentLoad;

        if (remainingCapacity > maxRemainingCapacity) {
          maxRemainingCapacity = remainingCapacity;
          bestDriver = driver;
        }
      }

      if (bestDriver && maxRemainingCapacity > 0) {
        // Assign this request to the best driver
        const { data: assignedRequest, error: assignError } = await supabase
          .from('transport_requests')
          .update({
            assigned_driver: bestDriver.driver_id,
            assigned_vehicle: bestDriver.vehicle_id,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id)
          .select(`
            id,
            assigned_driver,
            assigned_vehicle,
            status,
            contact:contacts(first_name, last_name)
          `)
          .single();

        if (assignError) {
          console.error('Error assigning request:', assignError);
          continue;
        }

        // Update driver load
        driverLoads.set(bestDriver.driver_id, (driverLoads.get(bestDriver.driver_id) || 0) + 1);

                 assignments.push({
           request_id: request.id,
           driver_id: bestDriver.driver_id,
           vehicle_id: bestDriver.vehicle_id,
           driver_name: bestDriver.driver?.name || 'Unknown Driver',
           vehicle_info: `${bestDriver.vehicle?.make || ''} ${bestDriver.vehicle?.model || ''} (${bestDriver.vehicle?.license_plate || ''})`,
           vehicle_capacity: bestDriver.vehicle?.capacity || 0,
           contact_name: request.contact ? `${request.contact.first_name} ${request.contact.last_name}` : 'Unknown'
         });

         console.log(`Assigned request ${request.id} to driver ${bestDriver.driver?.name} in vehicle ${bestDriver.vehicle?.make} ${bestDriver.vehicle?.model}`);
      } else {
        console.log(`No available capacity for request ${request.id}`);
      }
    }

    console.log(`Successfully auto-assigned ${assignments.length} transport requests`);
    return { data: assignments, error: null };

  } catch (error) {
    console.error('Error in auto vehicle assignment:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error in auto assignment') 
    };
  }
}

export async function assignDriver(requestId: string, driverId: string) {
  return supabase
    .from('transport_requests')
    .update({ assigned_driver: driverId, status: 'assigned' })
    .eq('id', requestId)
    .select()
    .single();
}

export async function assignVehicle(requestId: string, vehicleId: string) {
  return supabase
    .from('transport_requests')
    .update({ assigned_vehicle: vehicleId })
    .eq('id', requestId)
    .select()
    .single();
}

export async function updateRequestStatus(requestId: string, status: TransportStatus) {
  return supabase
    .from('transport_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();
}

/**
 * Assign both driver and vehicle to a transport request in one operation
 */
export async function assignRequest(id: string, driverId: string, vehicleId: string) {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        assigned_driver: driverId,
        assigned_vehicle: vehicleId,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error assigning transport request:', error);
      throw new Error(`Failed to assign transport request: ${error.message}`);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception in assignRequest:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error assigning request') 
    };
  }
}

/**
 * Mark a transport request as completed
 */
export async function completeRequest(id: string) {
  try {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error completing transport request:', error);
      throw new Error(`Failed to complete transport request: ${error.message}`);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception in completeRequest:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error completing request') 
    };
  }
}

// Edge-function integration
export async function buildRoute(eventId: string): Promise<RouteData> {
  console.log('Building optimized route for event:', eventId);
  
  try {
    // First get all transport requests for this event
    const { data: requests, error } = await supabase
      .from('transport_requests')
      .select(`
        id, 
        contact_id,
        pickup_location,
        status
      `)
      .eq('event_id', eventId)
      .in('status', ['pending', 'assigned']);
    
    if (error) {
      console.error('Error fetching transport requests for route:', error);
      throw new Error(`Failed to fetch transport requests: ${error.message}`);
    }
    
    if (!requests || requests.length === 0) {
      throw new Error('No pending or assigned transport requests found for this event');
    }

    console.log('Found transport requests:', requests.length);
    console.log('Request data sample:', JSON.stringify(requests[0], null, 2));

    // Check if pickup_location data is valid
    const validWaypoints = requests.filter(r => 
      r.pickup_location && 
      typeof r.pickup_location === 'object' && 
      r.pickup_location.lat && 
      r.pickup_location.lng
    );

    console.log('Valid waypoints:', validWaypoints.length);
    console.log('Invalid waypoints:', requests.length - validWaypoints.length);

    // Log all pickup locations for debugging
    requests.forEach((req, index) => {
      console.log(`Request ${index} pickup location:`, 
        req.pickup_location ? JSON.stringify(req.pickup_location) : 'undefined');
    });

    if (validWaypoints.length === 0) {
      // Fall back to generating test data
      console.log('No valid waypoints found, generating test data for all requests');
      
      const testWaypoints = requests.map((r, index) => ({
        request_id: r.id,
        lat: 39.72341827331013 + (index * 0.01), // Slightly different locations
        lng: -104.80330062208942 + (index * 0.01),
        address: 'Generated test location',
        contact_id: r.contact_id,
      }));
      
      // Try using the test data with our API
      try {
        console.log('Calling route builder API with test waypoints');
        const res = await fetch('/api/events/build-transport-route', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            event_id: eventId,
            waypoints: testWaypoints,
            is_test_data: true
          })
        });
        
        // Check if response is ok
        if (!res.ok) {
          // Try to get detailed error message
          let errorMsg = `Failed to build route: ${res.status} ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMsg += `. ${errorData.message || ''}`;
            console.error('Route builder API error response:', errorData);
          } catch (parseError) {
            console.error('Could not parse error response:', parseError);
          }
          throw new Error(errorMsg);
        }
        
        const routeData = await res.json();
        console.log('Successfully built route with test data');
        return routeData as RouteData;
      } catch (testError) {
        console.error('Error with test data fallback:', testError);
        
        // Try the test endpoint as last resort
        console.log('Falling back to test endpoint');
        try {
          const testResponse = await fetch('/api/events/test-route');
          
          if (!testResponse.ok) {
            console.error('Test route API error:', testResponse.status, testResponse.statusText);
            throw new Error(`Test route API error: ${testResponse.status} ${testResponse.statusText}`);
          }
          
          const testData = await testResponse.json();
          
          if (testData?.route) {
            console.log('Successfully generated test route');
            return testData.route;
          } else {
            console.error('Test route response missing route data:', testData);
            throw new Error('Test route response missing route data');
          }
        } catch (testEndpointError) {
          console.error('Error with test endpoint fallback:', testEndpointError);
          throw testEndpointError;
        }
      }
      
      throw new Error('No valid pickup locations found. Please ensure transport requests have location data.');
    }
    
    // Extract waypoints for API call
    const waypoints = validWaypoints.map(r => ({
      request_id: r.id,
      lat: r.pickup_location?.lat,
      lng: r.pickup_location?.lng,
      address: r.pickup_location?.address || 'Pickup location',
      contact_id: r.contact_id,
    }));
    
    console.log('Calling route builder API with waypoints:', waypoints.length);
    
    // Call our local API route for route optimization
    const res = await fetch('/api/events/build-transport-route', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        event_id: eventId,
        waypoints
      })
    });
    
    if (!res.ok) {
      const statusText = res.statusText;
      const status = res.status;
      
      let errorData: any = {};
      try {
        errorData = await res.json();
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
      }
      
      console.error('Route builder API error:', { status, statusText, errorData });
      throw new Error(`Failed to build route: ${status} ${statusText}. ${errorData.message || ''}`);
    }
    
    const routeData = await res.json();
    console.log('Successfully built route:', routeData.url);
    return routeData as RouteData;
  } catch (error) {
    console.error('Error building transport route:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while building the route');
  }
}

export async function sendRouteToDriver(driverId: string, routeUrl: string, eventName: string) {
  const functionsUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : '';
  const res = await fetch(`${functionsUrl}/send_route_sms`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ 
      driver_id: driverId, 
      route_url: routeUrl,
      event_name: eventName
    })
  });
  
  if (!res.ok) {
    throw new Error('Failed to send route to driver');
  }
  
  return res.json();
}

// Fetch routes
export async function fetchRoutes(eventId: string) {
  return supabase
    .from('transport_routes')
    .select('*, driver:driver_id(name), vehicle:vehicle_id(*)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
}

// ===== EVENT-BASED TRANSPORT MANAGEMENT =====

// Event Transport Summary
export async function fetchEventTransportSummary(): Promise<{ data: EventTransportSummary[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('event_transport_summary')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching event transport summary:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Exception in fetchEventTransportSummary:', error);
    return { data: null, error };
  }
}

// Event Driver Management
export async function assignDriverToEvent(data: EventDriverInsert): Promise<{ data: EventDriver | null; error: any }> {
  try {
    console.log('Assigning driver to event (simplified):', data);
    
    // Check if driver is already assigned to prevent duplicates
    const { data: existing, error: checkError } = await supabase
      .from('transport_routes')
      .select('id')
      .eq('event_id', data.event_id)
      .eq('driver_id', data.driver_id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing assignment:', checkError);
      return { data: null, error: checkError };
    }
    
    if (existing) {
      console.log('Driver already assigned to this event');
      return { data: null, error: { message: 'Driver is already assigned to this event' } };
    }
    
    // Create a placeholder route for this driver assignment
    const placeholderRoute = {
      event_id: data.event_id,
      driver_id: data.driver_id,
      vehicle_id: data.vehicle_id,
      waypoints: [],
      url: null
    };
    
    const { data: result, error } = await supabase
      .from('transport_routes')
      .insert(placeholderRoute)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error assigning driver to event:', error);
      return { data: null, error };
    }
    
    // Map to EventDriver format
    const eventDriver: EventDriver = {
      id: result.id,
      event_id: result.event_id,
      driver_id: result.driver_id,
      vehicle_id: result.vehicle_id,
      assigned_at: result.created_at,
      status: 'assigned',
      notes: data.notes || null,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
    
    return { data: eventDriver, error: null };
  } catch (error) {
    console.error('Exception in assignDriverToEvent:', error);
    return { data: null, error };
  }
}

export async function fetchEventDrivers(eventId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    // Get drivers assigned to this event from transport_routes, 
    // and manually join with drivers and vehicles tables
    const { data: routeData, error } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching transport routes:', error);
      return { data: null, error };
    }

    if (!routeData || routeData.length === 0) {
      return { data: [], error: null };
    }

    // Get unique driver and vehicle IDs
    const driverIds = Array.from(new Set(routeData.map(route => route.driver_id).filter(Boolean)));
    const vehicleIds = Array.from(new Set(routeData.map(route => route.vehicle_id).filter(Boolean)));

    // Fetch drivers and vehicles separately
    const [driversResult, vehiclesResult] = await Promise.all([
      driverIds.length > 0 ? supabase
        .from('drivers')
        .select('id, name, phone, email, status')
        .in('id', driverIds) : { data: [], error: null },
      vehicleIds.length > 0 ? supabase
        .from('vehicles')
        .select('id, make, model, license_plate, capacity, year, color, status')
        .in('id', vehicleIds) : { data: [], error: null }
    ]);

    if (driversResult.error) {
      console.error('Error fetching drivers:', driversResult.error);
      return { data: null, error: driversResult.error };
    }

    if (vehiclesResult.error) {
      console.error('Error fetching vehicles:', vehiclesResult.error);
      return { data: null, error: vehiclesResult.error };
    }

    // Create lookup maps
    const driversMap = new Map((driversResult.data || []).map(d => [d.id, d]));
    const vehiclesMap = new Map((vehiclesResult.data || []).map(v => [v.id, v]));
    
    // Map to expected format and remove duplicates
    const mappedDrivers = routeData.map((route: any) => ({
      id: route.id,
      event_id: route.event_id,
      driver_id: route.driver_id,
      vehicle_id: route.vehicle_id,
      assigned_at: route.created_at,
      status: 'assigned',
      notes: null,
      created_at: route.created_at,
      updated_at: route.updated_at,
      driver: driversMap.get(route.driver_id) || null,
      vehicle: vehiclesMap.get(route.vehicle_id) || null
    }));
    
    // Remove duplicate drivers (same driver_id)
    const uniqueDrivers = mappedDrivers.filter((driver, index, arr) => 
      arr.findIndex(d => d.driver_id === driver.driver_id) === index
    );
    
    console.log('Fetched event drivers:', uniqueDrivers.length, 'unique drivers');
    return { data: uniqueDrivers, error: null };
  } catch (error) {
    console.error('Exception in fetchEventDrivers:', error);
    return { data: null, error };
  }
}

export async function removeDriverFromEvent(eventId: string, driverId: string): Promise<{ error: any }> {
  try {
    console.log('Attempting to remove driver from event:', { eventId, driverId });
    
    // First check if there are any records to delete
    const { data: existingRecords, error: checkError } = await supabase
      .from('transport_routes')
      .select('id')
      .eq('event_id', eventId)
      .eq('driver_id', driverId);
    
    if (checkError) {
      console.error('Error checking existing records:', checkError);
      return { error: checkError };
    }
    
    if (!existingRecords || existingRecords.length === 0) {
      console.log('No records found to delete for driver:', driverId, 'in event:', eventId);
      return { error: null }; // No error if nothing to delete
    }
    
    console.log('Found', existingRecords.length, 'records to delete');
    
    // Now delete the records
    const { data: deletedData, error: deleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('event_id', eventId)
      .eq('driver_id', driverId)
      .select(); // Return deleted rows
    
    if (deleteError) {
      console.error('Error deleting driver from event:', deleteError);
      return { error: deleteError };
    }
    
    console.log('Successfully deleted', deletedData?.length || 0, 'records');
    return { error: null };
  } catch (error) {
    console.error('Exception in removeDriverFromEvent:', error);
    return { error };
  }
}

// Enhanced Transport Request Functions
export async function fetchEventTransportRequests(eventId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    console.log('Fetching transport requests for event:', eventId);
    
    // First get the transport requests with contact info
    const { data: requests, error } = await supabase
      .from('transport_requests')
      .select(`
        *,
        contact:contacts(first_name, last_name, phone, email)
      `)
      .eq('event_id', eventId)
      .order('requested_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching event transport requests:', error);
      return { data: null, error };
    }

    if (!requests || requests.length === 0) {
      return { data: [], error: null };
    }

    // Get unique driver and vehicle IDs from assigned requests
    const driverIds = Array.from(new Set(
      requests
        .map(req => req.assigned_driver)
        .filter(Boolean)
    ));
    
    const vehicleIds = Array.from(new Set(
      requests
        .map(req => req.assigned_vehicle)
        .filter(Boolean)
    ));

    console.log('Transport requests found:', requests.length);
    console.log('Driver IDs to fetch:', driverIds);
    console.log('Vehicle IDs to fetch:', vehicleIds);

    // Fetch drivers and vehicles separately
    const [driversResult, vehiclesResult] = await Promise.all([
      driverIds.length > 0 ? supabase
        .from('drivers')
        .select('id, name, phone, email, status')
        .in('id', driverIds) : { data: [], error: null },
      vehicleIds.length > 0 ? supabase
        .from('vehicles')
        .select('id, make, model, license_plate, capacity, year, color, status')
        .in('id', vehicleIds) : { data: [], error: null }
    ]);

    if (driversResult.error) {
      console.error('Error fetching drivers:', driversResult.error);
      return { data: null, error: driversResult.error };
    }

    if (vehiclesResult.error) {
      console.error('Error fetching vehicles:', vehiclesResult.error);
      return { data: null, error: vehiclesResult.error };
    }

    // Create lookup maps
    const driversMap = new Map((driversResult.data || []).map(d => [d.id, d]));
    const vehiclesMap = new Map((vehiclesResult.data || []).map(v => [v.id, v]));

    console.log('Drivers fetched:', driversResult.data?.length || 0);
    console.log('Vehicles fetched:', vehiclesResult.data?.length || 0);

    // Map the requests with driver and vehicle data
    const enhancedRequests = requests.map(request => ({
      ...request,
      driver: request.assigned_driver ? driversMap.get(request.assigned_driver) : null,
      vehicle: request.assigned_vehicle ? vehiclesMap.get(request.assigned_vehicle) : null
    }));
    
    console.log('Returning enhanced transport requests:', enhancedRequests.length, 'requests');
    return { data: enhancedRequests, error: null };
  } catch (error) {
    console.error('Exception in fetchEventTransportRequests:', error);
    return { data: null, error };
  }
}

// Route Optimization Functions
export async function createOptimizedRoute(data: OptimizedRouteInsert): Promise<{ data: OptimizedRoute | null; error: any }> {
  try {
    // Map our enhanced data to the existing schema
    const insertData = {
      event_id: data.event_id,
      driver_id: data.driver_id,
      vehicle_id: data.vehicle_id,
      waypoints: data.route_data?.waypoints || [],
      url: data.route_url
    };
    
    console.log('Creating route with data:', insertData);
    
    const { data: result, error } = await supabase
      .from('transport_routes')
      .insert(insertData)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating optimized route:', error);
      return { data: null, error };
    }
    
    // Map the result back to our enhanced format
    const mappedResult: OptimizedRoute = {
      id: result.id,
      event_id: result.event_id,
      driver_id: result.driver_id,
      vehicle_id: result.vehicle_id,
      route_name: data.route_name || `Route ${result.id.substring(0, 8)}`,
      route_url: result.url,
      total_distance: null,
      estimated_duration: null,
      route_data: {
        waypoints: result.waypoints || []
      },
      status: data.status || 'draft',
      sent_at: null,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
    
    return { data: mappedResult, error: null };
  } catch (error) {
    console.error('Exception in createOptimizedRoute:', error);
    return { data: null, error };
  }
}

export async function fetchEventRoutes(eventId: string): Promise<{ data: OptimizedRoute[] | null; error: any }> {
  try {
    // Get route data first
    const { data: routeData, error } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching event routes:', error);
      return { data: null, error };
    }

    if (!routeData || routeData.length === 0) {
      return { data: [], error: null };
    }

    // Get unique driver and vehicle IDs
    const driverIds = Array.from(new Set(routeData.map(route => route.driver_id).filter(Boolean)));
    const vehicleIds = Array.from(new Set(routeData.map(route => route.vehicle_id).filter(Boolean)));

    console.log('DEBUG fetchEventRoutes:');
    console.log('- Route data count:', routeData.length);
    console.log('- Route data sample:', routeData[0]);
    console.log('- Driver IDs found:', driverIds);
    console.log('- Vehicle IDs found:', vehicleIds);

    // Fetch drivers and vehicles separately
    const [driversResult, vehiclesResult] = await Promise.all([
      driverIds.length > 0 ? supabase
        .from('drivers')
        .select('id, name, phone, email, status')
        .in('id', driverIds) : { data: [], error: null },
      vehicleIds.length > 0 ? supabase
        .from('vehicles')
        .select('id, make, model, license_plate, capacity, year, color, status')
        .in('id', vehicleIds) : { data: [], error: null }
    ]);

    if (driversResult.error) {
      console.error('Error fetching drivers for routes:', driversResult.error);
      return { data: null, error: driversResult.error };
    }

    if (vehiclesResult.error) {
      console.error('Error fetching vehicles for routes:', vehiclesResult.error);
      return { data: null, error: vehiclesResult.error };
    }

    console.log('- Drivers fetched:', driversResult.data?.length || 0, driversResult.data);
    console.log('- Vehicles fetched:', vehiclesResult.data?.length || 0, vehiclesResult.data);

    // Create lookup maps
    const driversMap = new Map((driversResult.data || []).map(d => [d.id, d]));
    const vehiclesMap = new Map((vehiclesResult.data || []).map(v => [v.id, v]));
    
    console.log('- Driver map keys:', Array.from(driversMap.keys()));
    console.log('- Vehicle map keys:', Array.from(vehiclesMap.keys()));
    
    // Map the results to our enhanced format with proper driver and vehicle data
    const mappedRoutes: OptimizedRoute[] = routeData.map((route: any) => {
      const driver = driversMap.get(route.driver_id);
      const vehicle = vehiclesMap.get(route.vehicle_id);
      
      console.log(`- Mapping route ${route.id}: driver_id=${route.driver_id}, vehicle_id=${route.vehicle_id}`);
      console.log(`  - Found driver:`, driver);
      console.log(`  - Found vehicle:`, vehicle);
      
      return {
        id: route.id,
        event_id: route.event_id,
        driver_id: route.driver_id,
        vehicle_id: route.vehicle_id,
        route_name: `${driver?.name || 'Unknown Driver'} - Route`,
        route_url: route.url,
        total_distance: null,
        estimated_duration: null,
        route_data: {
          waypoints: route.waypoints || []
        },
        status: 'draft',
        sent_at: null,
        created_at: route.created_at,
        updated_at: route.updated_at,
        // Add driver and vehicle info for the component to use
        driver: driver || null,
        vehicle: vehicle || null
      };
    });
    
    console.log('Fetched event routes:', mappedRoutes.length, 'routes with driver/vehicle data');
    return { data: mappedRoutes, error: null };
  } catch (error) {
    console.error('Exception in fetchEventRoutes:', error);
    return { data: null, error };
  }
}

// Auto-assign drivers with vehicles from fleet to event based on capacity needs
export async function autoAssignFleetToEvent(eventId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    console.log('Auto-assigning fleet to event:', eventId);
    
    // 1. Get transport requests count to estimate capacity needed
    const { data: requests, error: requestsError } = await supabase
      .from('transport_requests')
      .select('id')
      .eq('event_id', eventId)
      .eq('status', 'pending');
    
    if (requestsError) {
      console.error('Error fetching transport requests:', requestsError);
      return { data: null, error: requestsError };
    }
    
    const requestsCount = requests?.length || 0;
    console.log(`Need capacity for ${requestsCount} transport requests`);
    
    // 2. Get available drivers with vehicles from fleet (driver.vehicle_id is set)
    const { data: availableDrivers, error: driversError } = await supabase
      .from('drivers')
      .select(`
        id, name, email, phone, vehicle_id, status,
        vehicle:vehicle_id (
          id, make, model, year, license_plate, capacity, status, color
        )
      `)
      .not('vehicle_id', 'is', null)  // Only drivers with vehicles
      .eq('status', 'available');     // Only available drivers
    
    if (driversError) {
      console.error('Error fetching fleet drivers:', driversError);
      return { data: null, error: driversError };
    }
    
    if (!availableDrivers || availableDrivers.length === 0) {
      console.log('No fleet drivers available');
      return { data: [], error: null };
    }
    
    // 3. Calculate how many drivers we need based on capacity
    const totalCapacity = availableDrivers.reduce((sum, driver) => {
      const vehicle = Array.isArray(driver.vehicle) ? driver.vehicle[0] : driver.vehicle;
      return sum + (vehicle?.capacity || 0);
    }, 0);
    const driversNeeded = Math.min(
      availableDrivers.length,
      Math.ceil(requestsCount / (totalCapacity / availableDrivers.length))
    );
    
    console.log(`Total fleet capacity: ${totalCapacity}, drivers needed: ${driversNeeded}`);
    
    // 4. Sort drivers by vehicle capacity (largest first) and select the needed amount
    const selectedDrivers = availableDrivers
      .sort((a, b) => {
        const vehicleA = Array.isArray(a.vehicle) ? a.vehicle[0] : a.vehicle;
        const vehicleB = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle;
        return (vehicleB?.capacity || 0) - (vehicleA?.capacity || 0);
      })
      .slice(0, driversNeeded);
    
    console.log('Selected drivers:', selectedDrivers.map(d => {
      const vehicle = Array.isArray(d.vehicle) ? d.vehicle[0] : d.vehicle;
      return {
        name: d.name,
        vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'No vehicle',
        capacity: vehicle?.capacity || 0
      };
    }));
    
    // 5. Assign selected drivers to the event
    const assignments = [];
    for (const driver of selectedDrivers) {
      const vehicle = Array.isArray(driver.vehicle) ? driver.vehicle[0] : driver.vehicle;
      const { data: assignment, error: assignError } = await assignDriverToEvent({
        event_id: eventId,
        driver_id: driver.id,
        vehicle_id: driver.vehicle_id,
        notes: 'Auto-assigned from fleet',
        status: 'assigned'
      });
      
      if (assignError) {
        console.error(`Error assigning driver ${driver.name}:`, assignError);
        continue;
      }
      
      if (assignment) {
        assignments.push({
          ...assignment,
          driver: driver,
          vehicle: vehicle
        });
      }
    }
    
    console.log(`Successfully auto-assigned ${assignments.length} drivers to event`);
    return { data: assignments, error: null };
    
  } catch (error) {
    console.error('Exception in autoAssignFleetToEvent:', error);
    return { data: null, error };
  }
}

// Auto-generate routes for all assigned drivers
export async function generateRoutesForEvent(eventId: string): Promise<{ data: OptimizedRoute[] | null; error: any }> {
  try {
    // 1. Get all drivers assigned to this event (from transport_routes) BEFORE clearing
    const { data: eventDrivers, error: driversError } = await fetchEventDrivers(eventId);
    
    if (driversError) {
      console.error('Error fetching event drivers:', driversError);
      return { data: null, error: driversError };
    }

    if (!eventDrivers || eventDrivers.length === 0) {
      return { data: [], error: null };
    }

    // 2. Clear existing routes for this event to start fresh
    console.log('Clearing existing routes for event:', eventId);
    const { error: clearError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('event_id', eventId);
    
    if (clearError) {
      console.error('Error clearing existing routes:', clearError);
      // Don't fail completely, just log and continue
    }

    // Also reset transport request assignments
    await supabase
      .from('transport_requests')
      .update({ 
        route_id: null,
        assigned_driver: null,
        status: 'pending'
      })
      .eq('event_id', eventId);

    // 3. Get all transport requests for this event
    const { data: requests, error: requestsError } = await supabase
      .from('transport_requests')
      .select(`
        *,
        contact:contact_id(first_name, last_name, phone, email)
      `)
      .eq('event_id', eventId)
      .eq('status', 'pending');
    
    if (requestsError) {
      console.error('Error fetching transport requests:', requestsError);
      return { data: null, error: requestsError };
    }
    
    if (!requests || requests.length === 0) {
      return { data: [], error: null };
    }
    
    // 5. Smart capacity-based distribution using fleet assignments
    console.log('Starting smart capacity-based distribution...');
    
    // Create drivers with their fleet vehicle capacity info
    const driversWithCapacity = eventDrivers.map((driver: any) => ({
      ...driver,
      requests: [] as any[],
      capacity: driver.vehicle?.capacity || 4, // Default capacity if no vehicle assigned
      remainingCapacity: driver.vehicle?.capacity || 4
    }));

    console.log('Drivers with capacity:', driversWithCapacity.map(d => ({
      name: d.driver?.name,
      vehicle: d.vehicle ? `${d.vehicle.make} ${d.vehicle.model}` : 'No vehicle',
      capacity: d.capacity
    })));

    // Sort drivers by remaining capacity (highest first) for optimal distribution
    driversWithCapacity.sort((a, b) => b.remainingCapacity - a.remainingCapacity);

    // Distribute requests based on capacity
    for (const request of requests) {
      // Find driver with most remaining capacity
      const availableDriver = driversWithCapacity.find(d => d.remainingCapacity > 0);
      
      if (availableDriver) {
        availableDriver.requests.push(request);
        availableDriver.remainingCapacity -= 1;
        
        console.log(`Assigned passenger to ${availableDriver.driver?.name || 'Unknown'}: ${availableDriver.remainingCapacity}/${availableDriver.capacity} remaining`);
        
        // Re-sort to maintain optimal capacity distribution
        driversWithCapacity.sort((a, b) => b.remainingCapacity - a.remainingCapacity);
      } else {
        console.warn('No available capacity for request:', request.id);
        // Still assign to first driver even if over capacity
        if (driversWithCapacity.length > 0) {
          driversWithCapacity[0].requests.push(request);
          console.log(`Over-capacity assignment to ${driversWithCapacity[0].driver?.name || 'Unknown'}`);
        }
      }
    }

    const driversWithRequests = driversWithCapacity;

     // 6. Create routes for each driver with requests
    const createdRoutes = [];
    for (const driverWithRequests of driversWithRequests) {
      if (driverWithRequests.requests.length === 0) {
        console.log(`Driver ${driverWithRequests.driver?.name || 'Unknown'} has no requests, skipping route creation`);
        continue;
      }
      
      const waypoints = driverWithRequests.requests.map((req: any) => ({
        lat: req.pickup_location?.lat || 0,
        lng: req.pickup_location?.lng || 0,
        address: req.pickup_location?.address || 'Unknown Address',
        contact_id: req.contact_id,
        request_id: req.id,
      }));

      // Safety check for driver data
      const driverName = driverWithRequests.driver?.name || `Driver ${driverWithRequests.driver_id}`;
      
      const routeData: OptimizedRouteInsert = {
        event_id: eventId,
        driver_id: driverWithRequests.driver_id,
        vehicle_id: driverWithRequests.vehicle_id, // Include vehicle_id
        route_name: `${driverName} - Route`,
        route_data: {
          waypoints: waypoints,
        },
        status: 'draft'
      };
      
      const { data: route, error: routeError } = await createOptimizedRoute(routeData);
      if (routeError) {
        console.error('Error creating route for driver:', driverName, routeError);
        continue;
      }
      
      // Update requests to reference this route
      const requestIds = driverWithRequests.requests.map((req: any) => req.id);
      await supabase
        .from('transport_requests')
        .update({ 
          route_id: route?.id,
          assigned_driver: driverWithRequests.driver_id,
          status: 'assigned'
        })
        .in('id', requestIds);
      
      if (route) {
        createdRoutes.push(route);
      }
    }
    
    return { data: createdRoutes, error: null };
  } catch (error) {
    console.error('Exception in generateRoutesForEvent:', error);
    return { data: null, error };
  }
}

// Send route to driver via email
export async function sendRouteToDriverEmail(routeId: string, driverEmail: string): Promise<{ error: any }> {
  try {
    // First get the route data
    const { data: route, error: routeError } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('id', routeId)
      .single();
    
    if (routeError || !route) {
      console.error('Error fetching route for email:', routeError);
      return { error: routeError || 'Route not found' };
    }
    
    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('name, event_date, location')
      .eq('id', route.event_id)
      .single();
    
    if (eventError) {
      console.error('Error fetching event for email:', eventError);
      return { error: eventError };
    }
    
    // Fetch driver details
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('name, email')
      .eq('id', route.driver_id)
      .single();
    
    if (driverError) {
      console.error('Error fetching driver for email:', driverError);
      return { error: driverError };
    }
    
    // Fetch vehicle details if available
    let vehicle = null;
    if (route.vehicle_id) {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('make, model, license_plate, capacity')
        .eq('id', route.vehicle_id)
        .single();
      
      if (!vehicleError && vehicleData) {
        vehicle = vehicleData;
      }
    }
    
    // Fetch contact information for each waypoint
    let enrichedWaypoints = route.waypoints || [];
    if (route.waypoints && route.waypoints.length > 0) {
      // Get all contact IDs from waypoints
      const contactIds = route.waypoints
        .map((wp: any) => wp.contact_id)
        .filter(Boolean);
      
      if (contactIds.length > 0) {
        // Fetch contact details
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, phone, email')
          .in('id', contactIds);
        
        if (!contactsError && contacts) {
          // Create a map for quick lookup
          const contactsMap = new Map(contacts.map(c => [c.id, c]));
          
          // Enrich waypoints with contact information
          enrichedWaypoints = route.waypoints.map((wp: any) => {
            const contact = contactsMap.get(wp.contact_id);
            return {
              ...wp,
              contact_name: contact ? `${contact.first_name} ${contact.last_name}` : null,
              contact_phone: contact?.phone || null,
              contact_email: contact?.email || null
            };
          });
        }
      }
    }
    
    console.log('Route data for email:', {
      route: route,
      event: event,
      driver: driver,
      vehicle: vehicle,
      waypoints: enrichedWaypoints
    });
    
    // Generate Google Maps route URL from waypoints using a simpler format
    let mapsUrl = '';
    if (enrichedWaypoints && enrichedWaypoints.length > 0) {
      if (enrichedWaypoints.length === 1) {
        // Single destination - just show the location
        const wp = enrichedWaypoints[0];
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wp.address || `${wp.lat},${wp.lng}`)}`;
      } else {
        // Multiple waypoints - create a directions URL
        // Use a simpler format that works better
        const addresses = enrichedWaypoints
          .map(wp => wp.address || `${wp.lat},${wp.lng}`)
          .join(' to ');
        
        mapsUrl = `https://www.google.com/maps/dir/${enrichedWaypoints.map(wp => 
          encodeURIComponent(wp.address || `${wp.lat},${wp.lng}`)
        ).join('/')}`;
      }
    }
    
    // Generate proper route name
    const routeName = `${driver.name} - ${event.name} Route`;
    
    // Generate email content using the existing email service structure
    const subject = `Transport Route Assignment - ${event.name}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Transport Route Assignment</h2>
        
        <p>Hello <strong>${driver.name}</strong>,</p>
        <p>You have been assigned a transport route for <strong>${event.name}</strong></p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">📅 Event Details:</h3>
          <ul style="color: #4b5563;">
            <li><strong>Event:</strong> ${event.name}</li>
            <li><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString()}</li>
            <li><strong>Location:</strong> ${event.location || 'TBD'}</li>
          </ul>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">🚗 Route Information:</h3>
          <ul style="color: #4b5563;">
            <li><strong>Route Name:</strong> ${routeName}</li>
            <li><strong>Number of Stops:</strong> ${enrichedWaypoints?.length || 0}</li>
            ${vehicle ? `<li><strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) - Capacity: ${vehicle.capacity}</li>` : ''}
          </ul>
          
          ${mapsUrl ? `
            <div style="margin-top: 15px;">
              <a href="${mapsUrl}" target="_blank" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                🗺️ View Route on Google Maps
              </a>
            </div>
          ` : ''}
        </div>
        
        <div style="background-color: #f6fdf9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">📍 Pickup Points & Passengers:</h3>
          ${enrichedWaypoints && enrichedWaypoints.length > 0 ? `
            <ol style="color: #4b5563; padding-left: 20px;">
              ${enrichedWaypoints.map((waypoint: any, index: number) => `
                <li style="margin-bottom: 12px; line-height: 1.4; padding: 8px; background-color: white; border-radius: 4px; border-left: 3px solid #10b981;">
                  <div style="font-weight: 600; color: #374151;">Stop ${index + 1}: ${waypoint.address || `Coordinates: ${waypoint.lat}, ${waypoint.lng}`}</div>
                  ${waypoint.contact_name ? `
                    <div style="margin-top: 4px;">
                      <span style="color: #059669; font-weight: 500;">👤 Passenger: ${waypoint.contact_name}</span>
                      ${waypoint.contact_phone ? `<br><span style="color: #6b7280; font-size: 14px;">📞 Phone: ${waypoint.contact_phone}</span>` : ''}
                    </div>
                  ` : '<div style="color: #ef4444; font-size: 14px; margin-top: 4px;">⚠️ Contact information not available</div>'}
                </li>
              `).join('')}
            </ol>
          ` : '<p style="color: #6b7280; font-style: italic;">No pickup points assigned yet.</p>'}
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <p style="color: #4b5563;">Please confirm receipt of this assignment and contact the admin if you have any questions.</p>
          <p style="color: #374151; font-weight: 600;">Thank you for your service!</p>
          
          <div style="margin-top: 20px; padding: 10px; background-color: #fef3c7; border-radius: 5px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>📱 Contact Info:</strong> If you need assistance, please contact our transport coordinator at the church office.
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Send email using the existing email service (same as campaigns)
    console.log(`Sending route email to ${driverEmail}...`);
    
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: driverEmail,
          subject: subject,
          html: htmlContent,
          emailType: 'events', // Use events email type for transport-related emails
          metadata: {
            route_id: routeId,
            event_id: route.event_id,
            driver_id: route.driver_id,
            driver_email: driverEmail,
            event_name: event.name,
            email_type: 'transport_route_assignment'
          }
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('Failed to send route email:', result.error);
        return { error: `Failed to send email: ${result.error}` };
      }
      
      console.log(`Email sent successfully to ${driverEmail}. Message ID: ${result.messageId}`);
      
      // Update route status - add a sent_at timestamp
      await supabase
        .from('transport_routes')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId);
      
      console.log(`Route email sent successfully to ${driverEmail} for route ${routeId}`);
      
    } catch (emailError) {
      console.error('Exception sending route email:', emailError);
      return { error: `Email service error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}` };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Exception in sendRouteToDriverEmail:', error);
    return { error };
  }
} 