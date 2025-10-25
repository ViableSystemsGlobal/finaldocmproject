import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    // Extract and explicitly type the ID parameter
    const { eventId } = params;
    
    console.log('Update event location API called for event:', eventId);
    
    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required' }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate body contains required location data
    if (!body.lat || !body.lng || !body.address) {
      console.error('Missing required location data', body);
      return NextResponse.json(
        { message: 'Missing required location data: lat, lng, and address are required' },
        { status: 400 }
      );
    }
    
    // Prepare location data
    const locationData = {
      lat: body.lat,
      lng: body.lng,
      address: body.address
    };
    
    console.log('Updating event location data:', locationData);
    
    // Update the event in the database
    const { data, error } = await supabaseAdmin
      .from('events')
      .update({ 
        location_data: locationData,
        location: body.address // Also update the human-readable location
      })
      .eq('id', eventId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating event location:', error);
      return NextResponse.json(
        { message: 'Error updating event location', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Event location updated successfully',
      data
    });
  } catch (error: any) {
    console.error('Exception in update event location API:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message || String(error) },
      { status: 500 }
    );
  }
} 