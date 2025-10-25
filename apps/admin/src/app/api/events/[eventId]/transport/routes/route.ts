import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;
    
    console.log('🗺️ Fetching routes for event:', eventId);

    // Fetch routes with driver and vehicle information
    const { data: routes, error: routesError } = await supabase
      .from('transport_routes')
      .select(`
        *,
        driver:driver_id(id, name, email, phone),
        vehicle:vehicle_id(id, make, model, license_plate, capacity)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (routesError) {
      console.error('Error fetching routes:', routesError);
      throw new Error(`Failed to fetch routes: ${routesError.message}`);
    }

    console.log(`📋 Found ${routes?.length || 0} routes`);

    return NextResponse.json({
      success: true,
      routes: routes || [],
      count: routes?.length || 0
    });

  } catch (error) {
    console.error('❌ Routes fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch routes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 