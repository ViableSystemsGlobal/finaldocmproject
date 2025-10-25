import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing driver-vehicle assignments...');
    
    const eventId = '170d4e77-b2df-418b-b557-f341374e0d3b';
    
    // Correct driver-vehicle mappings based on user feedback
    const correctAssignments = [
      {
        driverName: 'Nana Yaw Sasu Appiah-Miracle',
        vehicleInfo: 'Ford Transit (FOR-9012)',
        driverId: 'da44ee47-f735-4863-805a-b2fb0319f2a0',
        vehicleId: '4cb92358-2f9d-4afc-bb98-42e65e9aa799'
      },
      {
        driverName: 'Michael Brown', 
        vehicleInfo: 'Honda Pilot (HON-5678)',
        driverId: '296f253f-b93f-4929-808d-d9ccb5f9c802',
        vehicleId: 'e8d3d858-18a2-43f6-9baa-7f363e2621d0'
      },
      {
        driverName: 'Sarah Davis',
        vehicleInfo: 'Toyota Sienna (TOY-1234)', 
        driverId: 'adf73628-f42c-4e24-885a-49d733adb814',
        vehicleId: '54be4082-8814-48ff-a216-2cd2465264f5'
      },
      {
        driverName: 'John Smith',
        vehicleInfo: 'Chevrolet Suburban (CHE-3456)',
        driverId: '2bd056f7-7cb8-4322-b3b8-1c2ac5c18107', 
        vehicleId: 'a1989374-2923-4336-9b47-1e53ebdeee22'
      },
      {
        driverName: 'David Wilson',
        vehicleInfo: 'Toyota Highlander (TOY-7890)',
        driverId: '40998a11-b286-4023-8ded-66c7b3d71022',
        vehicleId: 'f28da38e-2600-496a-8a50-f25fff0de275'  
      }
    ];
    
    console.log('📝 Updating event_drivers table with correct assignments...\n');
    
    for (const assignment of correctAssignments) {
      const { error } = await supabase
        .from('event_drivers')
        .update({
          vehicle_id: assignment.vehicleId,
          updated_at: new Date().toISOString()
        })
        .eq('event_id', eventId)
        .eq('driver_id', assignment.driverId);
        
      if (error) {
        console.error(`❌ Failed to update ${assignment.driverName}:`, error);
      } else {
        console.log(`✅ Updated ${assignment.driverName} → ${assignment.vehicleInfo}`);
      }
    }
    
    console.log('\n🎉 Driver-vehicle assignments updated!');
    
    return NextResponse.json({
      success: true,
      message: 'Driver-vehicle assignments have been corrected',
      assignments: correctAssignments
    });
    
  } catch (error) {
    console.error('❌ Fix fleet error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix fleet assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 