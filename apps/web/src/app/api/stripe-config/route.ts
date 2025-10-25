import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // For stripe config, we need to bypass RLS since this is used for payments
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: 'Database configuration missing',
        success: false 
      }, { status: 500 });
    }

    let supabase;
    
    // Try service role first for bypassing RLS
    if (supabaseServiceKey) {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    } else {
      // Fallback to anon key
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    // Fetch Stripe integration settings
    const { data: stripeIntegration, error } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('provider', 'stripe')
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching Stripe integration settings:', error);
      
      // Return fallback configuration
      return NextResponse.json({ 
        success: false, 
        error: 'Stripe integration not configured',
        fallback: {
          publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51M3A4oL5sFi7cbV9s5n3hemWG43sjUMzZTdfB8D6qwGCooBKUi4BXv3D6tOpfuNv0GNA1s1bZtaezrymznltEQBx000dN4XLHR'
        }
      });
    }
    
    if (!stripeIntegration) {
      return NextResponse.json({ 
        success: false, 
        error: 'Stripe integration not found',
        fallback: {
          publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51M3A4oL5sFi7cbV9s5n3hemWG43sjUMzZTdfB8D6qwGCooBKUi4BXv3D6tOpfuNv0GNA1s1bZtaezrymznltEQBx000dN4XLHR'
        }
      });
    }
    
    // Return only the publishable key for client-side use
    return NextResponse.json({ 
      success: true, 
      data: {
        publishable_key: stripeIntegration.config?.publishable_key
      },
      message: 'Stripe configuration loaded from admin settings'
    });
    
  } catch (error) {
    console.error('Unexpected error in stripe-config API:', error);
    
    // Return fallback configuration on any error
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: {
        publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51M3A4oL5sFi7cbV9s5n3hemWG43sjUMzZTdfB8D6qwGCooBKUi4BXv3D6tOpfuNv0GNA1s1bZtaezrymznltEQBx000dN4XLHR'
      }
    });
  }
} 