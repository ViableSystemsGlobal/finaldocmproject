import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check for environment variables before creating client
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('🔄 TENANT-SETTINGS SOURCE: DEFAULT (Supabase not configured)')
      return NextResponse.json({
        success: true,
        data: {
          id: 'default',
          name: 'Demonstration of Christ Ministries',
          time_zone: 'America/Denver',
          primary_color: '#1A202C',
          secondary_color: '#F6E05E',
          address: '1234 Faith Avenue, Aurora, CO 80014',
          contact_email: 'hello@docmchurch.org',
          contact_phone: '(720) 555-0123',
          logo_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1748735572117.png',
          logo_web_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1752957761040.png',
          logo_black_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1749507248987.png',
          description: 'Demonstration of Christ Ministries',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        message: 'Using default tenant settings (Supabase not configured)',
        source: 'default'
      });
    }

    let supabase
    try {
      supabase = createServerSupabaseClient();
    } catch (error) {
      console.log('🔄 TENANT-SETTINGS SOURCE: DEFAULT (Supabase client creation failed)')
      return NextResponse.json({
        success: true,
        data: {
          id: 'default',
          name: 'Demonstration of Christ Ministries',
          time_zone: 'America/Denver',
          primary_color: '#1A202C',
          secondary_color: '#F6E05E',
          address: '1234 Faith Avenue, Aurora, CO 80014',
          contact_email: 'hello@docmchurch.org',
          contact_phone: '(720) 555-0123',
          logo_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1748735572117.png',
          logo_web_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1752957761040.png',
          logo_black_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1749507248987.png',
          description: 'Demonstration of Christ Ministries',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        message: 'Using default tenant settings (Supabase client failed)',
        source: 'default'
      });
    }
    
    console.log('🔍 Fetching tenant settings from database...');
    
    // Fetch tenant settings from database
    const { data: tenantSettings, error } = await supabase
      .from('tenant_settings')
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Error fetching tenant settings:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      // Return default fallback
      return NextResponse.json({
        success: true,
        data: {
          id: 'default',
          name: 'Demonstration of Christ Ministries',
          time_zone: 'America/Denver',
          primary_color: '#1A202C',
          secondary_color: '#F6E05E',
          address: '1234 Faith Avenue, Aurora, CO 80014',
          contact_email: 'hello@docmchurch.org',
          contact_phone: '(720) 555-0123',
          logo_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1748735572117.png',
          logo_web_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1752957761040.png',
          logo_black_url: 'https://ufjfafcfkalaasdhgcbi.supabase.co/storage/v1/object/public/church-logos/logo-1749507248987.png',
          description: 'Demonstration of Christ Ministries',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        message: 'Using default tenant settings (database error)',
        source: 'default'
      });
    }
    
    if (!tenantSettings) {
      // No settings found
      console.log('⚠️ No tenant settings found in database');
      return NextResponse.json({
        success: true,
        data: {
          id: 'default',
          name: 'Demonstration of Christ Ministries',
          time_zone: 'America/Denver',
          primary_color: '#1A202C',
          secondary_color: '#F6E05E',
          address: '1234 Faith Avenue, Aurora, CO 80014',
          contact_email: 'hello@docmchurch.org',
          contact_phone: '(720) 555-0123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        message: 'Using default tenant settings (no data found)',
        source: 'default'
      });
    }
    
    // Success! Return actual data from database
    console.log('✅ Tenant settings loaded from database:', {
      name: tenantSettings.name,
      address: tenantSettings.address,
      hasAddress: !!tenantSettings.address
    });
    
    return NextResponse.json({
      success: true,
      data: tenantSettings,
      message: 'Loaded from database',
      source: 'database'
    });
    
  } catch (error) {
    console.error('Exception in tenant-settings API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tenant settings'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Tenant settings creation not allowed from web frontend. Use admin panel.' 
  }, { status: 403 });
} 