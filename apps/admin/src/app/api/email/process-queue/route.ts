import { NextResponse } from 'next/server';
import { processEmailQueue } from '@/services/emailService';

// This route can be called by a cron job to process the email queue
export async function GET(request: Request) {
  try {
    // Extract batch size from query params if provided
    const url = new URL(request.url);
    const batchSize = parseInt(url.searchParams.get('batchSize') || '20', 10);
    
    console.log(`Processing email queue with batch size: ${batchSize}`);
    
    // Process the queue
    const result = await processEmailQueue(batchSize);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed
    });
  } catch (error) {
    console.error('Error processing email queue:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing email queue'
    }, { status: 500 });
  }
} 