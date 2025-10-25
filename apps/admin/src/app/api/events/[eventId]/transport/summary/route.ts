import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase';

interface TransportSummary {
  totalRequests: number;
  assignedRequests: number;
  availableVehicles: number;
  totalCapacity: number;
  routesGenerated: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = supabaseAdmin;
    
    console.log('🚗 Fetching transport summary for event:', eventId);
    
    // Get transport requests for this event
    const { data: transportRequests } = await supabase
      .from('transport_requests')
      .select(`
        *,
        contact:contacts(*),
        assigned_vehicle:vehicles(*),
        assigned_driver:drivers(*)
      `)
      .eq('event_id', eventId);

    // Get assigned drivers/vehicles for this event
    const { data: eventDrivers } = await supabase
      .from('event_drivers')
      .select(`
        *,
        driver:drivers(*),
        vehicle:vehicles(*)
      `)
      .eq('event_id', eventId)
      .in('status', ['assigned', 'confirmed']);

    // Get generated routes for this event
    const { data: routes } = await supabase
      .from('transport_routes')
      .select('*')
      .eq('event_id', eventId);

    console.log('📊 Transport data:', {
      transportRequests: transportRequests?.length || 0,
      eventDrivers: eventDrivers?.length || 0,
      routes: routes?.length || 0
    });

    // Calculate summary with proper null checking
    const assignedRequests = transportRequests?.filter((req: any) => req.status === 'assigned') || [];
    const availableVehicles = eventDrivers?.filter((ed: any) => ed.vehicle && ed.driver) || [];
    
    const summary: TransportSummary = {
      totalRequests: transportRequests?.length || 0,
      assignedRequests: assignedRequests.length,
      availableVehicles: availableVehicles.length,
      totalCapacity: availableVehicles.reduce((total: number, ed: any) => {
        const capacity = ed.vehicle?.capacity || 0;
        console.log(`Vehicle ${ed.vehicle?.make} ${ed.vehicle?.model}: capacity ${capacity}`);
        return total + capacity;
      }, 0),
      routesGenerated: routes?.length || 0
    };

    console.log('📈 Summary calculated:', summary);

    // Format requests for display
    const formattedRequests = transportRequests?.map((request: any) => ({
      id: request.id,
      contact: {
        first_name: request.contact?.first_name || '',
        last_name: request.contact?.last_name || '',
        phone: request.contact?.phone
      },
      pickup_location: {
        address: request.pickup_address || 'Address not specified'
      },
      status: request.status,
      vehicle: request.assigned_vehicle ? {
        make: request.assigned_vehicle.make,
        model: request.assigned_vehicle.model,
        capacity: request.assigned_vehicle.capacity,
        license_plate: request.assigned_vehicle.license_plate
      } : undefined,
      driver: request.assigned_driver ? {
        name: request.assigned_driver.name
      } : undefined
    })) || [];

    return NextResponse.json({
      success: true,
      summary,
      requests: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching transport summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transport summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 