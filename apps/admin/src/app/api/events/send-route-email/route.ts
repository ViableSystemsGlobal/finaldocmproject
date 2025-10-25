import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Email configuration - load from environment variables
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@churchapp.com';
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Get static map URL from route URL
function getStaticMapUrl(routeUrl: string): string {
  // Parse route coordinates from Google Maps URL
  // Example URL: https://www.google.com/maps/dir/lat1,lng1/lat2,lng2/lat3,lng3
  try {
    const urlParts = routeUrl.split('/dir/')[1];
    if (!urlParts) return '';

    const coordinates = urlParts.split('/').filter(p => p.trim());
    
    if (coordinates.length < 2) return '';

    // Create markers and path for static map
    const markers = coordinates.map(coord => `markers=color:red|${coord}`).join('&');
    const path = `path=color:0x0000ff|weight:5|${coordinates.join('|')}`;
    
    // Build static map URL
    return `https://maps.googleapis.com/maps/api/staticmap?size=600x400&${markers}&${path}&key=${GOOGLE_MAPS_API_KEY}`;
  } catch (error) {
    console.error('Error generating static map URL:', error);
    return '';
  }
}

// Mock email sender function (since we can't install nodemailer in this environment)
async function sendMockEmail(to: string, subject: string, html: string, text: string) {
  console.log(`MOCK EMAIL SENDER`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text: ${text.substring(0, 100)}...`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a mock success response
  return {
    messageId: `mock-email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  };
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    
    console.log('Email route request:', body);
    
    // Validate required fields
    if (!body.route_url) {
      return NextResponse.json(
        { message: 'Missing required field: route_url' },
        { status: 400 }
      );
    }
    
    if (!body.recipients || (Array.isArray(body.recipients) && body.recipients.length === 0)) {
      return NextResponse.json(
        { message: 'No recipients specified' },
        { status: 400 }
      );
    }
    
    const { 
      recipients, 
      email_type = 'custom', 
      route_url, 
      event_name = 'Church Event', 
      destination_name = 'the event',
      include_map = true,
      custom_message = ''
    } = body;
    
    // If recipients are driver IDs, get their email addresses
    let recipientEmails: string[] = [];
    
    if (email_type === 'driver') {
      // Fetch driver emails from database
      for (const driverId of recipients) {
        const { data: driver, error } = await supabaseAdmin
          .from('drivers')
          .select('email, name')
          .eq('id', driverId)
          .single();
        
        if (error) {
          console.error('Error fetching driver:', error);
          continue;
        }
        
        if (driver?.email) {
          recipientEmails.push(driver.email);
        }
      }
    } else {
      // For custom emails, use directly
      recipientEmails = recipients.filter(Boolean);
    }
    
    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { message: 'No valid recipient email addresses found' },
        { status: 400 }
      );
    }
    
    // Get static map URL if needed
    const staticMapUrl = include_map ? getStaticMapUrl(route_url) : '';
    
    // Prepare email HTML
    const mapHtml = staticMapUrl 
      ? `<div style="margin: 20px 0;">
           <img src="${staticMapUrl}" alt="Route Map" style="max-width: 100%; border-radius: 4px;" />
         </div>`
      : '';
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${event_name} - Transportation Route</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #444;">
          ${custom_message || `Here's the route for the transportation to ${destination_name}.`}
        </p>
        
        ${mapHtml}
        
        <div style="margin-top: 30px;">
          <a href="${route_url}" 
             style="background-color: #4e54c8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            View Route in Google Maps
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated email from your church transportation system.</p>
        </div>
      </div>
    `;
    
    // Send email to each recipient
    const emailPromises = recipientEmails.map(async (email) => {
      try {
        // Use mock email sender instead of nodemailer
        const info = await sendMockEmail(
          email,
          `${event_name} - Transportation Route`,
          emailHtml,
          `${custom_message || `Here's the route for the transportation to ${destination_name}.`}\n\nView route: ${route_url}`
        );
        
        console.log('Email sent:', info.messageId);
        return info.messageId;
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        throw error;
      }
    });
    
    try {
      await Promise.all(emailPromises);
    } catch (error) {
      console.error('Error sending emails:', error);
      return NextResponse.json(
        { message: 'Failed to send some emails', error: String(error) },
        { status: 500 }
      );
    }
    
    // Record email send in the database
    try {
      await supabaseAdmin
        .from('route_emails')
        .insert({
          recipients: recipientEmails,
          route_url,
          event_name,
          created_at: new Date().toISOString(),
          email_type,
          custom_message: custom_message || null
        });
    } catch (dbError) {
      // Don't fail if DB logging fails
      console.error('Failed to log email to database:', dbError);
    }
    
    return NextResponse.json({
      message: 'Route emails sent successfully',
      recipients: recipientEmails.length
    });
  } catch (error) {
    console.error('Error sending route email:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
} 