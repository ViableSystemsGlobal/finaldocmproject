import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Try to fetch drivers from the database
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .select('*')
      .order('name');
    
    // If there's an error or no data, return mock data
    if (error || !data || data.length === 0) {
      console.log('No drivers found in database or error occurred, returning mock data');
      
      // Return mock drivers for development
      return NextResponse.json({
        data: [
          {
            id: 'mock-driver-1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '555-123-4567',
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-driver-2',
            name: 'Maria Garcia',
            email: 'maria.garcia@example.com',
            phone: '555-987-6543',
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-driver-3',
            name: 'David Johnson',
            email: 'david.johnson@example.com',
            phone: '555-456-7890',
            created_at: new Date().toISOString(),
          }
        ]
      });
    }
    
    // Return actual drivers
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    
    // Return mock data in case of errors
    return NextResponse.json({
      data: [
        {
          id: 'mock-driver-1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '555-123-4567',
          created_at: new Date().toISOString(),
        },
        {
          id: 'mock-driver-2',
          name: 'Maria Garcia',
          email: 'maria.garcia@example.com',
          phone: '555-987-6543',
          created_at: new Date().toISOString(),
        }
      ]
    });
  }
} 