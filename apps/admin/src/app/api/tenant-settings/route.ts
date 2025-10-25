import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantSettings, updateTenantSettings } from '@/services/settings'

export async function GET(request: NextRequest) {
  try {
    console.log('📱 Mobile app requesting tenant settings');
    
    const settings = await getCurrentTenantSettings();
    
    console.log('📱 Returning tenant settings:', {
      name: settings.name,
      logo_url: settings.logo_url,
      logo_mobile_url: settings.logo_mobile_url
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('❌ Error fetching tenant settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📱 Updating tenant settings:', body);
    
    const result = await updateTenantSettings(body);
    
    if (result.success) {
      console.log('✅ Tenant settings updated successfully');
      return NextResponse.json({ success: true, data: result.data });
    } else {
      console.error('❌ Failed to update tenant settings:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error updating tenant settings:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant settings' },
      { status: 500 }
    );
  }
} 