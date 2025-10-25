import { NextResponse } from 'next/server';

// Test data for transport requests
const testData = {
  event_id: "test-event-id",
  waypoints: [
    {
      lat: 39.72341827331013,
      lng: -104.80330062208942,
      address: "Test Address 1",
      contact_id: "test-contact-1",
      request_id: "test-request-1"
    },
    {
      lat: 39.73045,
      lng: -104.79855,
      address: "Test Address 2",
      contact_id: "test-contact-2",
      request_id: "test-request-2"
    },
    {
      lat: 39.71698,
      lng: -104.81121,
      address: "Test Address 3",
      contact_id: "test-contact-3",
      request_id: "test-request-3"
    }
  ],
  is_test_data: true
};

export async function GET(request: Request) {
  try {
    console.log('Test route API called');
    
    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin;
    console.log('Base URL:', baseUrl);
    
    // Make the API call to our route builder endpoint
    try {
      console.log('Calling route builder with test data');
      const response = await fetch(`${baseUrl}/api/events/build-transport-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      if (!response.ok) {
        let errorMessage = `Route builder returned status: ${response.status} ${response.statusText}`;
        let errorData = {};
        
        try {
          errorData = await response.json();
          console.error('Error response:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        return NextResponse.json(
          { 
            message: 'Route builder API error', 
            error: errorData,
            status: response.status,
            statusText: response.statusText
          },
          { status: 500 }
        );
      }
      
      const routeData = await response.json();
      console.log('Test route generated successfully');
      
      return NextResponse.json({
        message: 'Test route generated successfully',
        route: routeData,
        test_data: testData,
      });
    } catch (fetchError) {
      console.error('Error fetching from route builder:', fetchError);
      return NextResponse.json(
        { 
          message: 'Error calling route builder API',
          error: String(fetchError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test route API:', error);
    return NextResponse.json(
      { message: 'Error testing route', error: String(error) },
      { status: 500 }
    );
  }
} 