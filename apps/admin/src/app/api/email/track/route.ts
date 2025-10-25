import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Transparent 1x1 pixel GIF for tracking opens
const TRACKING_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export async function GET(request: NextRequest) {
  try {
    // Get tracking parameters
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');
    const event = searchParams.get('event') || 'open';
    const url = searchParams.get('url'); // For click tracking
    
    // Validate parameters
    if (!emailId) {
      return new Response('Missing email ID', { status: 400 });
    }
    
    if (!['open', 'click'].includes(event)) {
      return new Response('Invalid event type', { status: 400 });
    }
    
    if (event === 'click' && !url) {
      return new Response('Missing URL for click tracking', { status: 400 });
    }
    
    // Extract user agent and IP
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '0.0.0.0';
    
    // Log the tracking event in the database
    const { error } = await supabaseAdmin
      .from('email_tracking')
      .insert({
        email_id: emailId,
        event_type: event,
        event_data: event === 'click' ? { url } : {},
        user_agent: userAgent,
        ip_address: ip
      });
    
    if (error) {
      console.error('Error tracking email event:', error);
      // Continue anyway to avoid impacting user experience
    }
    
    // If it's a click event, redirect to the URL
    if (event === 'click' && url) {
      return NextResponse.redirect(url);
    }
    
    // For open events, return a 1x1 transparent GIF
    return new Response(TRACKING_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in email tracking:', error);
    
    // Return pixel anyway to avoid user-visible errors
    return new Response(TRACKING_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
} 