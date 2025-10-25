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
    
    console.log('🔄 Resetting transport assignments for event:', eventId);

    // Step 1: Reset all transport requests to pending status
    const { data: resetRequests, error: resetError } = await supabase
      .from('transport_requests')
      .update({
        assigned_driver: null,
        assigned_vehicle: null,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .select('id');

    if (resetError) {
      console.error('Error resetting transport requests:', resetError);
      throw new Error(`Failed to reset transport requests: ${resetError.message}`);
    }

    const resetCount = resetRequests?.length || 0;
    console.log(`📋 Reset ${resetCount} transport requests to pending`);

    // Step 2: Delete all existing routes for this event
    const { error: routeDeleteError } = await supabase
      .from('transport_routes')
      .delete()
      .eq('event_id', eventId);

    if (routeDeleteError) {
      console.error('Error deleting routes:', routeDeleteError);
      // Don't fail the whole operation if route deletion fails
      console.log('⚠️ Warning: Could not delete existing routes, but continuing...');
    } else {
      console.log('🗺️ Deleted all existing routes');
    }

    console.log(`✅ Successfully reset ${resetCount} transport assignments`);

    return NextResponse.json({
      success: true,
      message: `Reset ${resetCount} transport requests and cleared all routes`,
      data: {
        resetRequests: resetCount,
        routesCleared: true
      }
    });

  } catch (error) {
    console.error('❌ Reset error:', error);
    return NextResponse.json(
      { 
        error: 'Reset failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 