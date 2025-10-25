import { NextRequest, NextResponse } from 'next/server';
import { debugEventsTable, fetchEventsWithImagesSimple } from '@/services/events';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const testType = url.searchParams.get('test') || 'basic';
    
    console.log(`🔍 DEBUG API: Testing events table (${testType})...`);
    
    if (testType === 'simple') {
      console.log('🧪 Running simple fetchEventsWithImages test...');
      const result = await fetchEventsWithImagesSimple();
      
      if (!result.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: result.error,
            step: result.step,
            message: `Simple test failed at step: ${result.step}`
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Simple test successful',
        tests: result.tests
      });
    } else {
      console.log('🧪 Running basic events table test...');
      const result = await debugEventsTable();
      
      if (!result.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: result.error,
            message: 'Events table test failed'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Events table test successful',
        count: result.count,
        eventsData: result.eventsData?.length,
        eventsCount: result.eventsCount
      });
    }
  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Debug API failed'
      },
      { status: 500 }
    );
  }
} 