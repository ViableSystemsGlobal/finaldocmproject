import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Note: In a real implementation, you would use Twilio or another SMS provider
// This is a simplified version that simulates sending an SMS
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface SendRouteRequest {
  driver_id: string;
  route_url: string;
  event_name: string;
}

// Simulate sending an SMS
const sendSms = async (phoneNumber: string, message: string) => {
  // In a real implementation, this would call an SMS API like Twilio
  console.log(`Sending SMS to ${phoneNumber}: ${message}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true, sid: `mock_message_${Date.now()}` };
};

serve(async (req) => {
  try {
    // Create a Supabase client with the admin key
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Parse the request body
    const { driver_id, route_url, event_name } = await req.json() as SendRouteRequest;
    
    if (!driver_id || !route_url) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { headers: { "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Fetch the driver details
    const { data: driver, error } = await supabase
      .from('drivers')
      .select('name, phone')
      .eq('id', driver_id)
      .single();
    
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    if (!driver) {
      return new Response(
        JSON.stringify({ error: "Driver not found" }),
        { headers: { "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    // Compose the SMS message
    const message = `Hello ${driver.name}, here is your route for ${event_name}: ${route_url}`;
    
    // Send the SMS
    const result = await sendSms(driver.phone, message);
    
    // Record the sent message in the database (optional)
    const { error: saveError } = await supabase
      .from('sms_messages')
      .insert({
        recipient: driver.phone,
        message,
        driver_id,
        sent_at: new Date().toISOString(),
        status: 'sent',
        message_id: result.sid
      });
    
    if (saveError) {
      console.error("Error recording SMS:", saveError);
      // Continue anyway as the SMS is already sent
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Route sent to driver" }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in send route SMS:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 