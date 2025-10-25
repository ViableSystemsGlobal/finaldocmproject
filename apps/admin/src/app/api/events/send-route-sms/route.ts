import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendRouteToDriver } from '@/services/transportRequests';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { driver_id, route_url, event_name } = body;
    
    if (!driver_id || !route_url) {
      return NextResponse.json(
        { message: 'Missing required fields: driver_id and route_url are required' },
        { status: 400 }
      );
    }
    
    // Validate driver exists
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select('id, name, phone')
      .eq('id', driver_id)
      .single();
    
    if (driverError || !driver) {
      console.error('Error fetching driver:', driverError);
      return NextResponse.json(
        { message: 'Driver not found' },
        { status: 404 }
      );
    }
    
    // Send SMS using transport service
    const result = await sendRouteToDriver(
      driver_id, 
      route_url, 
      event_name || 'Church Event'
    );
    
    return NextResponse.json({
      message: 'Route SMS sent successfully',
      driver: driver.name,
      phone: driver.phone,
      result
    });
    
  } catch (error) {
    console.error('Error sending route SMS:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
} 