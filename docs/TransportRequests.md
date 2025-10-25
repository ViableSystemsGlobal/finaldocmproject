# Transport Requests Feature Guide

This document provides instructions for setting up and using the Transport Requests feature for the Church Management System. The feature allows church staff to manage transportation for members and visitors to church events.

## Overview

The Transport Requests feature consists of the following components:

1. **Database Tables**: Transport requests, drivers, vehicles, and routes
2. **Admin UI**: Pages for listing, creating, viewing, and managing transport requests
3. **Edge Functions**: For route optimization and SMS notifications

## Setup Instructions

### 1. Database Setup

Run the following migration to create the required tables:

```bash
supabase db push
```

This will create the following tables:
- `transport_requests` - For storing transport request details
- `drivers` - For storing driver information
- `vehicles` - For storing vehicle information
- `transport_routes` - For storing optimized routes

### 2. Edge Functions Deployment

Deploy the edge functions using the following commands:

```bash
cd supabase/functions
supabase functions deploy route_optimizer
supabase functions deploy send_route_sms
```

These functions will be used for:
- `route_optimizer` - For optimizing pickup routes based on locations
- `send_route_sms` - For sending route details to drivers via SMS

### 3. Environment Variables

Make sure the following environment variables are set in your Supabase project:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_MAPS_API_KEY (for production)
```

## Usage Guide

### Managing Transport Requests

1. **View All Requests**
   - Navigate to `/people/transport-requests` in the admin dashboard
   - Use filters to find specific requests (by status, search term, etc.)

2. **Create a New Request**
   - Click "New Request" button from the requests list
   - Fill in the required details (event, passenger, pickup address)
   - Submit the form to create the request

3. **Assign Drivers & Vehicles**
   - Click "Assign" button on a request (either from the list or detail view)
   - Select a driver and vehicle from the dropdown menus
   - Submit to assign them to the request

4. **Manage Request Status**
   - From the request detail page, use the status action buttons to:
     - Mark as "In Transit" when the pickup begins
     - Mark as "Completed" when the transport is done
     - Cancel the request if needed

### Route Optimization

1. **Build Optimized Routes**
   - From an assigned request's detail page, click "Build Route"
   - The system will generate an optimized route for all pickups for the event
   - A Google Maps URL will be generated for navigation

2. **Send Route to Driver**
   - Click "Send Route to Driver" to send the route URL via SMS
   - The driver will receive a message with a link to Google Maps

## Entities and Relationships

- **Transport Request**: Connected to an event and a contact (passenger)
- **Driver**: Can be assigned to transport requests
- **Vehicle**: Can be assigned to transport requests and drivers
- **Transport Route**: Connected to an event, containing stops for multiple requests

## Flow Diagram

```
1. Create Transport Request
2. Assign Driver & Vehicle
3. Build Optimized Route
4. Send Route to Driver
5. Update Status (In Transit → Completed)
```

## Advanced Features

- **Route Optimization**: Calculates the most efficient pickup route for multiple passengers
- **SMS Notifications**: Sends route details directly to drivers
- **Status Tracking**: Track the progress of each transport request

## Troubleshooting

- **Route Not Building**: Check that there are multiple assigned requests for the same event
- **SMS Not Sending**: Verify that the driver has a valid phone number in the system
- **Performance Issues**: Consider batching route optimization for larger events

## Future Enhancements

- Real-time tracking of drivers
- Passenger notifications
- Integration with Google Maps for accurate ETAs
- Mobile app for drivers to manage pickups

# Transport Requests

This module handles transportation requests for church events, including assigning drivers and vehicles, building optimized routes, and managing the transportation process.

## Features

- Create transport requests for event attendees
- Assign drivers and vehicles to requests
- Build optimized routes for pickup
- Track transportation status
- Send route information to drivers

## Database Schema

The transport requests are stored in the `transport_requests` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | Reference to event |
| contact_id | uuid | Reference to the passenger |
| pickup_address | text | Address text for pickup |
| pickup_location | jsonb | JSON with lat, lng, and address fields |
| dropoff_address | text | Optional alternative dropoff location |
| status | text | 'pending', 'assigned', 'in_transit', 'completed', 'cancelled' |
| assigned_driver | uuid | Reference to assigned driver |
| assigned_vehicle | uuid | Reference to assigned vehicle |
| scheduled_time | timestamptz | Optional scheduled pickup time |
| notes | text | Additional notes |
| requested_at | timestamptz | When the request was made |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Record update timestamp |

## API

The Transport API includes endpoints for:

- `/api/people/transport/create-sample` - Creates a sample transport request for testing
- `/api/events/build-transport-route` - Builds an optimized route for all pickups
- `/api/events/test-route` - Test endpoint for route generation

## Troubleshooting

### Location Data Issues

If you encounter errors with location data such as:
- `parse error - invalid geometry`
- `Could not find the 'pickup_location' column in the schema cache`

Run the fix-transport-location script:

```bash
cd scripts
node run-fix-transport-location.js
```

This script updates the database schema to properly handle the location data as a JSONB object.

### Google Maps Integration

The transport request form uses Google Maps Places Autocomplete to search for addresses. Make sure:

1. The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in your `.env` file
2. The API key has Places API enabled
3. The Google Maps script is loading correctly in the browser

### Sample Data Creation

To test the transport module without real user data, use the "Create Sample" button which:
1. Creates a random contact if needed
2. Generates a sample location
3. Creates a transport request with pending status

## Development Notes

The transport requests use a two-step process for location data:
1. The address text is stored in `pickup_address`
2. The geocoded data (lat/lng) is stored in `pickup_location` as a JSON object

When building routes, the system uses the geocoded data when available, with fallbacks to test data when needed.

## Event Location Integration

The transport system now integrates with the event locations to create more logical routes:

1. Event locations are stored with full geocoding information (lat/lng coordinates)
2. Routes are built using the event location as both:
   - The starting point (origin) for the driver
   - The final destination where all passengers will be dropped off

### Setting Up Event Locations

When creating or editing events:

1. Use the location field with Google Maps autocomplete
2. Select a valid address from the dropdown suggestions
3. The system will automatically capture and store the coordinates

### How Routes Are Generated

The transport route is generated to create the most efficient path:

1. Start at the event location (church/venue)
2. Visit each passenger's pickup location in an optimized order
3. Return to the event location with all passengers

This circular route ensures the driver:
- Starts from a known location
- Picks up all passengers efficiently
- Delivers everyone to the event

## Troubleshooting Event Locations

If event locations aren't showing properly or routes aren't using them correctly:

1. Run the database update script:
   ```bash
   cd scripts
   node run-add-location-data-to-events.js
   ```

2. Verify your Google Maps API key is configured properly in `.env`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
   ```

3. Make sure the Google Maps API key has the following services enabled:
   - Maps JavaScript API
   - Places API
   - Directions API

4. Check browser console for any API-related errors

## Development Notes

The event location integration uses a two-step process:
1. The human-readable address is stored in the `location` field
2. The geocoded data (lat/lng) is stored in the `location_data` JSONB field

This approach provides both human-readable addresses and precise coordinates for mapping and routing. 