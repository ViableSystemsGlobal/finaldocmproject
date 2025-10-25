import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;
    
    console.log('🚗 Starting auto-assignment for event:', eventId);

    // Step 1: Get all transport requests that need assignment (only pending ones)
    const { data: allRequests, error: requestsError } = await supabase
      .from('transport_requests')
      .select(`
        *,
        contact:contact_id(first_name, last_name, phone)
      `)
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .is('assigned_driver', null)
      .is('assigned_vehicle', null);

    if (requestsError) {
      throw new Error(`Failed to fetch transport requests: ${requestsError.message}`);
    }

    if (!allRequests || allRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending transport requests found',
        data: []
      });
    }

    // Step 1.5: Remove duplicate contacts (keep only one request per unique contact)
    const uniqueContactMap = new Map();
    const duplicateRequests: string[] = [];
    
    allRequests.forEach((request: any) => {
      const contactKey = `${request.contact?.first_name}_${request.contact?.last_name}_${request.contact_id}`;
      
      if (uniqueContactMap.has(contactKey)) {
        duplicateRequests.push(request.id);
        console.log(`⚠️ Duplicate contact found: ${request.contact?.first_name} ${request.contact?.last_name} (removing request ${request.id})`);
      } else {
        uniqueContactMap.set(contactKey, request);
      }
    });

    // Get only unique requests (no duplicate contacts)
    const transportRequests = Array.from(uniqueContactMap.values());
    
    console.log(`📋 Found ${allRequests.length} total requests, ${transportRequests.length} unique contacts`);
    if (duplicateRequests.length > 0) {
      console.log(`🗑️ Removed ${duplicateRequests.length} duplicate requests: ${duplicateRequests.join(', ')}`);
    }

    // Step 2: Get all available drivers and vehicles for this event
    const { data: eventDrivers, error: driversError } = await supabase
      .from('event_drivers')
      .select(`
        *,
        driver:drivers(*),
        vehicle:vehicles(*)
      `)
      .eq('event_id', eventId)
      .in('status', ['assigned', 'confirmed'])
      .not('vehicle', 'is', null);

    if (driversError) {
      throw new Error(`Failed to fetch event drivers: ${driversError.message}`);
    }

    if (!eventDrivers || eventDrivers.length === 0) {
      return NextResponse.json(
        { 
          error: 'No drivers with vehicles assigned to this event',
          details: 'Please assign drivers and vehicles to this event first'
        },
        { status: 400 }
      );
    }

    console.log(`🚙 Found ${eventDrivers.length} drivers with vehicles`);

    // Step 3: Geographic clustering assignment algorithm
    const availableDrivers = eventDrivers.filter(driver => 
      driver.vehicle && driver.vehicle.capacity > 0
    ).sort((a, b) => 
      (b.vehicle?.capacity || 0) - (a.vehicle?.capacity || 0)
    );

    if (availableDrivers.length === 0) {
      return NextResponse.json(
        { 
          error: 'No drivers with available vehicles found',
          details: 'All vehicles are at capacity or unavailable'
        },
        { status: 400 }
      );
    }

    // Helper function to extract zip code and determine region
    const extractZipCode = (address: string): string => {
      if (!address) return '99999';
      
      // Extract 5-digit zip code
      const zipMatch = address.match(/\b(\d{5})\b/);
      return zipMatch ? zipMatch[1] : '99999';
    };

    // Helper function to group zip codes into geographic regions
    const getGeographicRegion = (zipCode: string): string => {
      const zip = parseInt(zipCode);
      
      // Denver, CO area (80200-80299)
      if (zip >= 80200 && zip <= 80299) {
        return 'Denver, CO';
      }
      
      // New York area (10000-11999)
      if (zip >= 10000 && zip <= 11999) {
        return 'New York, NY';
      }
      
      // Add more regions as needed
      if (zip >= 20000 && zip <= 20599) {
        return 'Washington, DC';
      }
      
      if (zip >= 90000 && zip <= 90999) {
        return 'Los Angeles, CA';
      }
      
      // Default to zip code if no region match
      return zipCode;
    };

    // Sort requests by zip code first for better clustering
    const requestsWithZips = transportRequests.map(request => ({
      ...request,
      zipCode: extractZipCode(request.pickup_address || ''),
      region: getGeographicRegion(extractZipCode(request.pickup_address || ''))
    })).sort((a, b) => a.zipCode.localeCompare(b.zipCode));

    // Group requests by geographic region (not individual zip codes)
    const regionGroups = new Map<string, any[]>();
    
    requestsWithZips.forEach(request => {
      const region = request.region;
      if (!regionGroups.has(region)) {
        regionGroups.set(region, []);
      }
      regionGroups.get(region)!.push(request);
    });

    // Sort region groups by size (largest first for efficiency)
    const sortedRegionGroups = Array.from(regionGroups.entries())
      .sort(([, a], [, b]) => b.length - a.length);

    console.log(`\n📍 ZIP CODE SORTING & GEOGRAPHIC GROUPING:`);
    console.log(`Found ${sortedRegionGroups.length} regional areas:`);
    sortedRegionGroups.forEach(([region, requests]) => {
      const zipCodes = requests.map(r => r.zipCode).sort();
      console.log(`  - ${region}: ${requests.length} people (zips: ${zipCodes.join(', ')})`);
    });

    // Initialize vehicle assignments tracking
    const vehicleAssignments = availableDrivers.map(driver => ({
      driverId: driver.driver_id,
      vehicleId: driver.vehicle_id,
      driverName: driver.driver?.name,
      vehicleInfo: `${driver.vehicle?.make} ${driver.vehicle?.model}`,
      capacity: driver.vehicle?.capacity || 0,
      assigned: 0,
      available: driver.vehicle?.capacity || 0,
      requestIds: [] as string[],
      zipCodes: [] as string[]
    }));

    const assignments: any[] = [];
    let currentVehicleIndex = 0;

    // Create a working copy of region groups that we can modify
    const remainingRegionGroups = new Map(sortedRegionGroups.map(([region, requests]) => [region, [...requests]]));
    
    // Assign one geographic region per vehicle to force distribution
    let vehicleIndex = 0;
    
    console.log(`\n🎯 FORCE DISTRIBUTION: Assigning each geographic region to different vehicles`);
    console.log(`Available vehicles: ${vehicleAssignments.length}`);
    vehicleAssignments.forEach((v, idx) => {
      console.log(`  Vehicle ${idx + 1}: ${v.driverName} - ${v.vehicleInfo} (capacity: ${v.capacity})`);
    });
    
    for (const [region, originalRequests] of sortedRegionGroups) {
      if (vehicleIndex >= vehicleAssignments.length) {
        console.log(`⚠️ More regional groups than available vehicles - remaining people will be distributed`);
        break;
      }
      
      // Get the working copy of requests for this region
      const requests = remainingRegionGroups.get(region) || [];
      if (requests.length === 0) {
        console.log(`⏭️ Region ${region} already fully assigned, skipping`);
        continue;
      }
      
      const currentVehicle = vehicleAssignments[vehicleIndex];
      console.log(`\n🚗 Vehicle ${vehicleIndex + 1}: Assigning region ${region} (${requests.length} people) to ${currentVehicle.driverName} (${currentVehicle.vehicleInfo})`);
      
      // Assign this entire region group to current vehicle (up to capacity)
      const canAssign = Math.min(requests.length, currentVehicle.capacity);
      const peopleToAssign = requests.slice(0, canAssign);
      
      console.log(`📦 Adding ${canAssign} people from region ${region} to ${currentVehicle.driverName}`);
      
      for (const request of peopleToAssign) {
        const assignment = {
          requestId: request.id,
          driverId: currentVehicle.driverId,
          vehicleId: currentVehicle.vehicleId,
          driverName: currentVehicle.driverName,
          vehicleInfo: currentVehicle.vehicleInfo,
          contactName: `${request.contact?.first_name} ${request.contact?.last_name}`,
          region: region
        };
        
        assignments.push(assignment);
        currentVehicle.assigned++;
        currentVehicle.available--;
        currentVehicle.requestIds.push(request.id);
      }
      
      currentVehicle.zipCodes.push(region);
      
      // Remove assigned people from the working copy
      const remainingPeople = requests.slice(canAssign);
      if (remainingPeople.length > 0) {
        remainingRegionGroups.set(region, remainingPeople);
      } else {
        remainingRegionGroups.delete(region);
      }
      
      console.log(`✅ ${currentVehicle.driverName}: ${currentVehicle.assigned}/${currentVehicle.capacity} filled with region ${region}`);
      
      // Move to next vehicle for next region group
      vehicleIndex++;
      
      // If there are remaining people from this region that didn't fit, keep them for overflow
      const remaining = requests.length - canAssign;
      if (remaining > 0) {
        console.log(`📦 ${remaining} people from ${region} remaining for overflow assignment`);
      }
    }
    
    // Now fill remaining capacity in vehicles with any leftover people
    if (remainingRegionGroups.size > 0) {
      console.log(`\n🔄 Distributing ${Array.from(remainingRegionGroups.values()).reduce((sum, arr: any[]) => sum + arr.length, 0)} remaining people...`);
      
      for (let i = 0; i < vehicleAssignments.length && remainingRegionGroups.size > 0; i++) {
        const currentVehicle = vehicleAssignments[i];
        
        if (currentVehicle.available <= 0) continue;
        
        console.log(`\n🚗 Filling remaining capacity in ${currentVehicle.driverName} (${currentVehicle.available} seats available)`);
        
        while (currentVehicle.available > 0 && remainingRegionGroups.size > 0) {
          // Find the best region to add to this vehicle (prefer same region as already assigned)
          let bestRegion: string | null = null;
          let bestRequests: any[] = [];
          
          // First, try to find a region that matches what's already in this vehicle
          if (currentVehicle.zipCodes.length > 0) {
            const currentRegion = currentVehicle.zipCodes[0]; // This vehicle already has people from this region
            if (remainingRegionGroups.has(currentRegion)) {
              bestRegion = currentRegion;
              bestRequests = remainingRegionGroups.get(currentRegion)!;
              console.log(`🎯 Prioritizing same region ${currentRegion} for ${currentVehicle.driverName}`);
            }
          }
          
          // If no same region found, pick any remaining region
          if (!bestRegion && remainingRegionGroups.size > 0) {
            const [region, requests] = Array.from(remainingRegionGroups.entries())[0];
            bestRegion = region;
            bestRequests = requests;
            console.log(`📦 No same region available, using ${region} for ${currentVehicle.driverName}`);
          }
          
          if (!bestRegion || bestRequests.length === 0) {
            if (bestRegion) remainingRegionGroups.delete(bestRegion);
            continue;
          }
          
          const canFit = Math.min(bestRequests.length, currentVehicle.available);
          const peopleToAssign = bestRequests.slice(0, canFit);
          
          console.log(`📦 Adding ${canFit} overflow people from ${bestRegion} to ${currentVehicle.driverName}`);
          
          for (const request of peopleToAssign) {
            const assignment = {
              requestId: request.id,
              driverId: currentVehicle.driverId,
              vehicleId: currentVehicle.vehicleId,
              driverName: currentVehicle.driverName,
              vehicleInfo: currentVehicle.vehicleInfo,
              contactName: `${request.contact?.first_name} ${request.contact?.last_name}`,
              region: bestRegion
            };
            
            assignments.push(assignment);
            currentVehicle.assigned++;
            currentVehicle.available--;
            currentVehicle.requestIds.push(request.id);
          }
          
          // Remove assigned people
          bestRequests.splice(0, canFit);
          
          if (bestRequests.length === 0) {
            remainingRegionGroups.delete(bestRegion);
          }
          
          console.log(`   ${currentVehicle.driverName}: ${currentVehicle.assigned}/${currentVehicle.capacity} filled with ${bestRegion}`);
        }
      }
    }
    
    // Log any remaining unassigned people
    const totalRemaining = Array.from(remainingRegionGroups.values()).reduce((sum, arr: any[]) => sum + arr.length, 0);
    if (totalRemaining > 0) {
      console.log(`\n⚠️ ${totalRemaining} people could not be assigned - insufficient vehicle capacity`);
      remainingRegionGroups.forEach((requests, region) => {
        if (requests.length > 0) {
          console.log(`   ${region}: ${requests.length} people unassigned`);
        }
      });
    }

    // Log final vehicle assignments
    console.log('\n🚗 Final Vehicle Assignments:');
    vehicleAssignments.forEach(v => {
      if (v.assigned > 0) {
        console.log(`- ${v.driverName} (${v.vehicleInfo}): ${v.assigned}/${v.capacity} people`);
      }
    });

    const totalCapacity = vehicleAssignments.reduce((sum, v) => sum + v.capacity, 0);
    console.log(`\n📊 Total capacity: ${totalCapacity} seats, Unique contacts: ${transportRequests.length}, Assigned: ${assignments.length}`);

    // Step 4: Delete duplicate requests from database
    if (duplicateRequests.length > 0) {
      console.log(`🗑️ Deleting ${duplicateRequests.length} duplicate requests...`);
      const { error: deleteError } = await supabase
        .from('transport_requests')
        .delete()
        .in('id', duplicateRequests);
        
      if (deleteError) {
        console.error('Warning: Could not delete duplicate requests:', deleteError);
      } else {
        console.log(`✅ Deleted ${duplicateRequests.length} duplicate requests`);
      }
    }

    // Step 5: Update transport requests in database
    const updatePromises = assignments.map(assignment => 
      supabase
        .from('transport_requests')
        .update({
          assigned_driver: assignment.driverId,
          assigned_vehicle: assignment.vehicleId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.requestId)
    );

    const updateResults = await Promise.all(updatePromises);
    
    const updateErrors = updateResults.filter(result => result.error);
    if (updateErrors.length > 0) {
      console.error('Update errors:', updateErrors);
      throw new Error(`Failed to update ${updateErrors.length} transport requests`);
    }

    console.log(`🎉 Successfully assigned ${assignments.length} unique contacts`);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignments.length} unique contacts to ${vehicleAssignments.filter(v => v.assigned > 0).length} vehicles`,
      data: assignments,
      summary: {
        totalRequests: allRequests.length,
        uniqueContacts: transportRequests.length,
        duplicatesRemoved: duplicateRequests.length,
        assignedRequests: assignments.length,
        vehiclesUsed: vehicleAssignments.filter(v => v.assigned > 0).length,
        totalCapacity,
        remainingCapacity: totalCapacity - assignments.length
      }
    });

  } catch (error) {
    console.error('❌ Auto-assignment error:', error);
    return NextResponse.json(
      { 
        error: 'Auto-assignment failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 