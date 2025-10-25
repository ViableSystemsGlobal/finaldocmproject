import { NextRequest, NextResponse } from 'next/server';
import { 
  loadCommunicationSettings, 
  saveCommunicationSettings,
  CommunicationSettings 
} from '@/services/comms/settings';

/**
 * GET /api/settings/communications
 * Load communication settings
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📡 Loading communication settings via API...');
    
    const { data: settings, error } = await loadCommunicationSettings();
    
    if (error) {
      console.error('❌ Error loading communication settings:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error 
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Communication settings loaded successfully');
    return NextResponse.json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error('💥 Unexpected error loading communication settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/communications
 * Save communication settings
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📡 Saving communication settings via API...');
    
    const body = await request.json();
    
    // Validate the request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body' 
        },
        { status: 400 }
      );
    }
    
    console.log('📧 Saving settings:', {
      hasEmail: !!body.email,
      hasSms: !!body.sms,
      hasWhatsApp: !!body.whatsapp,
      hasPush: !!body.push,
      emailTestMode: body.email?.test_mode
    });
    
    const result = await saveCommunicationSettings(body as Partial<CommunicationSettings>);
    
    if (!result.success) {
      console.error('❌ Error saving communication settings:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to save settings' 
        },
        { status: 500 }
      );
    }
    
    console.log('✅ Communication settings saved successfully');
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
    
  } catch (error) {
    console.error('💥 Unexpected error saving communication settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 