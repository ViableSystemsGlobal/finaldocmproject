import { supabaseAdmin } from '@/lib/supabase';

export interface VehicleCapacityInfo {
  id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  capacity: number;
  status: string;
  current_assignments: number;
  remaining_capacity: number;
  utilization_percentage: number;
  assigned_passengers: {
    id: string;
    contact_name: string;
    pickup_address: string;
    event_name?: string;
  }[];
}

export interface CapacityAnalytics {
  total_vehicles: number;
  available_vehicles: number;
  in_use_vehicles: number;
  total_capacity: number;
  used_capacity: number;
  available_capacity: number;
  overall_utilization: number;
  vehicles: VehicleCapacityInfo[];
}

/**
 * Get comprehensive vehicle capacity information with current assignments
 */
export async function getVehicleCapacityInfo(eventId?: string): Promise<{ data: CapacityAnalytics | null; error: any }> {
  try {
    // Get all vehicles with their current assignments
    const { data: vehicles, error: vehiclesError } = await supabaseAdmin
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        license_plate,
        capacity,
        status
      `);

    if (vehiclesError) throw vehiclesError;

    // Get current transport requests assignments
    let transportQuery = supabaseAdmin
      .from('transport_requests')
      .select(`
        id,
        assigned_vehicle,
        pickup_address,
        status,
        event_id,
        contacts!inner(first_name, last_name),
        events(name)
      `)
      .in('status', ['assigned', 'in_transit']);

    // Filter by event if specified
    if (eventId) {
      transportQuery = transportQuery.eq('event_id', eventId);
    }

    const { data: transportRequests, error: transportError } = await transportQuery;

    if (transportError) throw transportError;

    // Process vehicle capacity data
    const vehicleCapacityInfo: VehicleCapacityInfo[] = vehicles?.map(vehicle => {
      // Find all passengers assigned to this vehicle
      const assignedPassengers = transportRequests?.filter(req => req.assigned_vehicle === vehicle.id) || [];
      
      const current_assignments = assignedPassengers.length;
      const remaining_capacity = Math.max(0, vehicle.capacity - current_assignments);
      const utilization_percentage = vehicle.capacity > 0 ? (current_assignments / vehicle.capacity) * 100 : 0;

      return {
        ...vehicle,
        current_assignments,
        remaining_capacity,
        utilization_percentage,
        assigned_passengers: assignedPassengers.map(req => ({
          id: req.id,
          contact_name: (req as any).contacts ? `${(req as any).contacts.first_name} ${(req as any).contacts.last_name}` : 'Unknown',
          pickup_address: req.pickup_address || 'No address',
          event_name: (req as any).events?.name
        }))
      };
    }) || [];

    // Calculate overall analytics
    const total_vehicles = vehicleCapacityInfo.length;
    const available_vehicles = vehicleCapacityInfo.filter(v => v.remaining_capacity > 0).length;
    const in_use_vehicles = vehicleCapacityInfo.filter(v => v.current_assignments > 0).length;
    const total_capacity = vehicleCapacityInfo.reduce((sum, v) => sum + v.capacity, 0);
    const used_capacity = vehicleCapacityInfo.reduce((sum, v) => sum + v.current_assignments, 0);
    const available_capacity = total_capacity - used_capacity;
    const overall_utilization = total_capacity > 0 ? (used_capacity / total_capacity) * 100 : 0;

    const analytics: CapacityAnalytics = {
      total_vehicles,
      available_vehicles,
      in_use_vehicles,
      total_capacity,
      used_capacity,
      available_capacity,
      overall_utilization,
      vehicles: vehicleCapacityInfo
    };

    return { data: analytics, error: null };

  } catch (error) {
    console.error('Error fetching vehicle capacity info:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error fetching capacity info') 
    };
  }
}

/**
 * Get capacity info for a specific vehicle
 */
export async function getVehicleCapacityById(vehicleId: string): Promise<{ data: VehicleCapacityInfo | null; error: any }> {
  try {
    const { data: analytics, error } = await getVehicleCapacityInfo();
    
    if (error) throw error;
    
    const vehicle = analytics?.vehicles.find(v => v.id === vehicleId);
    
    return { data: vehicle || null, error: null };

  } catch (error) {
    console.error('Error fetching vehicle capacity by ID:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error fetching vehicle capacity') 
    };
  }
}

/**
 * Get vehicles with available capacity for assignment
 */
export async function getAvailableVehicles(eventId?: string): Promise<{ data: VehicleCapacityInfo[] | null; error: any }> {
  try {
    const { data: analytics, error } = await getVehicleCapacityInfo(eventId);
    
    if (error) throw error;
    
    // Filter to only vehicles with remaining capacity and available status
    const availableVehicles = analytics?.vehicles.filter(v => 
      v.remaining_capacity > 0 && (v.status === 'available' || v.status === 'in_use')
    ) || [];

    return { data: availableVehicles, error: null };

  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error fetching available vehicles') 
    };
  }
}

/**
 * Get capacity utilization trends (for future analytics)
 */
export async function getCapacityTrends(days: number = 30): Promise<{ data: any[] | null; error: any }> {
  try {
    // This would be enhanced with historical data tracking
    // For now, we'll return current day snapshot
    const { data: analytics, error } = await getVehicleCapacityInfo();
    
    if (error) throw error;
    
    const trends = [{
      date: new Date().toISOString().split('T')[0],
      total_capacity: analytics?.total_capacity || 0,
      used_capacity: analytics?.used_capacity || 0,
      utilization: analytics?.overall_utilization || 0
    }];

    return { data: trends, error: null };

  } catch (error) {
    console.error('Error fetching capacity trends:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error fetching capacity trends') 
    };
  }
} 