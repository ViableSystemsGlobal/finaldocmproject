import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Clear the assignment by updating the transport request
    const { data, error } = await supabase
      .from('transport_requests')
      .update({
        assigned_driver: null,
        assigned_vehicle: null,
        route_id: null,
        status: 'pending'
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error clearing assignment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data 
    });

  } catch (error) {
    console.error('Exception in clear-assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 