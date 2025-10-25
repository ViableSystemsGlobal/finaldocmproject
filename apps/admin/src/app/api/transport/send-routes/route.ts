import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { sendEmailDirectlySimple, EmailVariables } from '../../../../services/emailService';

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
    
    console.log('📧 Sending routes for event:', eventId);

    // Step 1: Get all routes for this event
    const { data: routes, error: routesError } = await supabase
      .from('transport_routes')
      .select(`
        *,
        driver:drivers(*),
        vehicle:vehicles(*)
      `)
      .eq('event_id', eventId)
      .not('driver_id', 'is', null)
      .not('vehicle_id', 'is', null);

    if (routesError) {
      throw new Error(`Failed to fetch routes: ${routesError.message}`);
    }

    if (!routes || routes.length === 0) {
      return NextResponse.json(
        { 
          error: 'No routes found',
          details: 'Please generate routes first'
        },
        { status: 400 }
      );
    }

    console.log(`📋 Found ${routes.length} routes to send`);

    // Step 2: Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      throw new Error(`Failed to fetch event details: ${eventError.message}`);
    }

    // Step 3: Send email to each driver using your existing email service
    const emailPromises = routes.map(async (route) => {
      if (!route.driver?.email) {
        console.warn(`⚠️ No email for driver ${route.driver?.name}`);
        return { success: false, driverId: route.driver_id, error: 'No email address' };
      }

      // Handle waypoints data structure properly
      const waypointsData = route.waypoints || {};
      const waypoints = waypointsData.stops || [];
      
      // Debug: Log route URL and event info
      console.log(`🗺️ Route URL for ${route.driver?.name}:`, route.url);
      console.log(`📍 Waypoints count: ${waypoints.length}`);
      console.log(`📅 Event date info:`, { 
        start_datetime: event.start_datetime, 
        title: event.title,
        location: event.location 
      });
      
      const waypointsList = waypoints.length > 0 
        ? waypoints
            .map((wp: any, index: number) => `
              <div style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6;">
                <strong style="color: #1e40af;">${index + 1}. ${wp.passenger || 'Unknown Passenger'}</strong><br>
                <span style="color: #374151; font-size: 14px;">📍 ${wp.address || 'Address not specified'}</span>
                ${wp.phone ? `<br><span style="color: #6b7280; font-size: 13px;">📞 ${wp.phone}</span>` : ''}
              </div>
            `)
            .join('')
        : '<p style="color: #6b7280; font-style: italic;">No pickup locations specified</p>';

      // Prepare email using your email service format
      const emailVariables: EmailVariables = {
        subject: `🚗 Transport Route for ${event.title}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🚗 Transport Route Assignment</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">DOCM Church Transport Ministry</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #2563eb;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">📅 Event Details</h2>
              <div style="display: grid; gap: 8px;">
                <p style="margin: 0;"><strong style="color: #374151;">Event:</strong> <span style="color: #1f2937;">${event.title}</span></p>
                <p style="margin: 0;"><strong style="color: #374151;">Date:</strong> <span style="color: #1f2937;">${event.start_datetime ? new Date(event.start_datetime).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'Date TBD'}</span></p>
                <p style="margin: 0;"><strong style="color: #374151;">Time:</strong> <span style="color: #1f2937;">${event.start_datetime ? new Date(event.start_datetime).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                }) : 'Time TBD'}</span></p>
                <p style="margin: 0;"><strong style="color: #374151;">Location:</strong> <span style="color: #1f2937;">${event.location}</span></p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h2 style="margin-top: 0; color: #1e40af; font-size: 20px;">🚙 Your Transport Assignment</h2>
              <div style="display: grid; gap: 8px;">
                <p style="margin: 0;"><strong style="color: #1e40af;">Vehicle:</strong> <span style="color: #1f2937;">${route.vehicle?.make} ${route.vehicle?.model} (${route.vehicle?.license_plate})</span></p>
                <p style="margin: 0;"><strong style="color: #1e40af;">Passengers:</strong> <span style="color: #1f2937; font-weight: 600;">${waypoints.length} pickup locations</span></p>
                <p style="margin: 0;"><strong style="color: #1e40af;">Driver:</strong> <span style="color: #1f2937;">${route.driver?.name}</span></p>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="margin-top: 0; color: #0c4a6e; font-size: 18px;">📍 Pickup Locations</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                ${waypointsList}
              </div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              ${route.url ? `
                <a href="${route.url}" 
                   style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); transition: all 0.3s; margin-bottom: 15px;">
                  🗺️ Open Route in Google Maps
                </a>
                <br>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Click the button above for turn-by-turn directions</p>
              ` : `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; color: #92400e;">
                  <p style="margin: 0; font-weight: 600;">⚠️ Route map unavailable</p>
                  <p style="margin: 5px 0 0 0; font-size: 14px;">Please use the pickup addresses listed above for navigation</p>
                </div>
              `}
            </div>

            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h4 style="margin-top: 0; color: #92400e; font-size: 16px;">💡 Important Tips</h4>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #92400e;">
                <li style="margin-bottom: 8px;">Click the Google Maps link above for turn-by-turn directions</li>
                <li style="margin-bottom: 8px;">Contact passengers if you can't find their pickup location</li>
                <li style="margin-bottom: 8px;">Arrive 5-10 minutes early at each pickup point</li>
                <li style="margin-bottom: 8px;">Call/text passengers if you're running late</li>
                <li style="margin-bottom: 0;">Ensure all passengers are wearing seatbelts</li>
              </ul>
            </div>

            <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #8b5cf6;">
              <h4 style="margin-top: 0; color: #6b21a8; font-size: 16px;">📞 Emergency Contact</h4>
              <p style="margin: 0; color: #6b21a8;">
                <strong>Transport Coordinator:</strong> Call the church office if you need assistance or have questions about your route.
              </p>
            </div>

            <div style="border-top: 2px solid #e5e7eb; padding-top: 25px; margin-top: 40px; text-align: center;">
              <p style="color: #374151; font-weight: 600; margin-bottom: 10px;">Thank you for serving in our transport ministry! 🙏</p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This email was automatically generated by the DOCM Church Transport Management System.
                <br>Please confirm receipt and contact us if you have any questions.
              </p>
            </div>
          </div>
        `
      };

      try {
        // Use your existing email service (same as campaigns)
        const result = await sendEmailDirectlySimple(route.driver.email, emailVariables, {
          emailType: 'events', // Use events email type since this is event-related
          metadata: {
            event_id: eventId,
            route_id: route.id,
            driver_id: route.driver_id,
            transport_type: 'route_assignment'
          }
        });

        if (result.success) {
          console.log(`✅ Email sent to ${route.driver.name} (${route.driver.email})`);
          return { success: true, driverId: route.driver_id, email: route.driver.email };
        } else {
          console.error(`❌ Failed to send email to ${route.driver.email}:`, result.error);
          return { success: false, driverId: route.driver_id, error: result.error };
        }
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${route.driver.email}:`, emailError);
        return { success: false, driverId: route.driver_id, error: emailError instanceof Error ? emailError.message : 'Unknown error' };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successCount = emailResults.filter(result => result.success).length;
    const failureCount = emailResults.filter(result => !result.success).length;

    console.log(`📧 Email results: ${successCount} sent, ${failureCount} failed`);

    // Step 4: Log successful email sending (routes table doesn't have status column)
    if (successCount > 0) {
      console.log(`✅ Successfully sent ${successCount} route emails`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent routes to ${successCount} drivers${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
      data: {
        totalRoutes: routes.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        results: emailResults
      }
    });

  } catch (error) {
    console.error('❌ Route email sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send routes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 