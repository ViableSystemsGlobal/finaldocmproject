// Edge function that tracks email opens and clicks
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.10.0";

// Configure environment
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Transparent 1x1 pixel GIF for tracking opens
const TRACKING_PIXEL = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

serve(async (req) => {
  try {
    // Get tracking parameters
    const url = new URL(req.url);
    const emailId = url.searchParams.get("id");
    const event = url.searchParams.get("event") || "open";
    const redirectUrl = url.searchParams.get("url"); // For click tracking
    
    // Validate parameters
    if (!emailId) {
      return new Response("Missing email ID", { status: 400 });
    }
    
    if (!["open", "click"].includes(event)) {
      return new Response("Invalid event type", { status: 400 });
    }
    
    if (event === "click" && !redirectUrl) {
      return new Response("Missing URL for click tracking", { status: 400 });
    }
    
    // Extract user agent and IP
    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "0.0.0.0";
    
    console.log(`Tracking ${event} event for email ${emailId}`);
    
    // Log the tracking event in the database
    const { error } = await supabase
      .from("email_tracking")
      .insert({
        email_id: emailId,
        event_type: event,
        event_data: event === "click" ? { url: redirectUrl } : {},
        user_agent: userAgent,
        ip_address: ip
      });
    
    if (error) {
      console.error("Error tracking email event:", error);
      // Continue anyway to avoid impacting user experience
    }
    
    // If it's a click event, redirect to the URL
    if (event === "click" && redirectUrl) {
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl
        }
      });
    }
    
    // For open events, return a 1x1 transparent GIF
    return new Response(Uint8Array.from(atob(TRACKING_PIXEL), c => c.charCodeAt(0)), {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error) {
    console.error("Error in email tracking:", error);
    
    // Return pixel anyway to avoid user-visible errors
    return new Response(Uint8Array.from(atob(TRACKING_PIXEL), c => c.charCodeAt(0)), {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    });
  }
}); 