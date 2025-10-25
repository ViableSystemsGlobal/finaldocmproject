'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  Calendar, 
  Users, 
  Car, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  Sparkles,
  TrendingUp,
  CarFront,
  Shield,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabaseAdmin } from '@/lib/supabase';
import { Event, fetchEvents } from '@/services/events';
import { getVehicleCapacityInfo, VehicleCapacityInfo } from '@/services/vehicleCapacity';

interface AutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentComplete: () => void;
}

interface TransportRequest {
  id: string;
  contact_id: string;
  pickup_address: string;
  status: string;
  contact?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: string;
  license_plate: string;
  current_assignments?: number;
  remaining_capacity?: number;
  utilization_percentage?: number;
}

interface Driver {
  id: string;
  name: string;
  vehicle_id: string | null;
}

interface AssignmentResult {
  requestId: string;
  passengerName: string;
  vehicleInfo: string;
  driverName: string;
  success: boolean;
  reason?: string;
}

export function AutoAssignModal({ isOpen, onClose, onAssignmentComplete }: AutoAssignModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResults, setAssignmentResults] = useState<AssignmentResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Vehicle selection state with enhanced capacity info
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [capacityData, setCapacityData] = useState<{ [key: string]: VehicleCapacityInfo }>({});

  useEffect(() => {
    if (isOpen) {
      loadEvents();
      loadAvailableVehicles();
      setSelectedEventId('');
      setAssignmentResults([]);
      setShowResults(false);
      setSelectedVehicleIds(new Set());
    }
  }, [isOpen]);

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      console.log('Loading events from database...');
      const { data, error } = await fetchEvents();

      console.log('Events query result:', { data, error });
      
      if (error) throw error;
      
      // Filter for upcoming events
      const upcomingEvents = data?.filter(event => 
        new Date(event.event_date) >= new Date()
      ) || [];
      
      setEvents(upcomingEvents);
      
      if (!upcomingEvents || upcomingEvents.length === 0) {
        console.log('No upcoming events found in database');
        toast({
          title: 'No Events Found',
          description: 'No upcoming events found. Please create some events first.',
          variant: 'default',
        });
      } else {
        console.log(`Found ${upcomingEvents.length} upcoming events`);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadAvailableVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      // Get vehicles with capacity information
      const { data: capacityAnalytics, error: capacityError } = await getVehicleCapacityInfo(selectedEventId);
      
      if (capacityError) throw capacityError;

      // Filter to available vehicles or vehicles with remaining capacity
      const availableVehiclesWithCapacity = capacityAnalytics?.vehicles.filter(v => 
        v.status === 'available' || (v.status === 'in_use' && v.remaining_capacity > 0)
      ) || [];

      // Convert to our Vehicle interface format
      const vehicles: Vehicle[] = availableVehiclesWithCapacity.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        year: v.year,
        capacity: v.capacity,
        status: v.status,
        license_plate: v.license_plate,
        current_assignments: v.current_assignments,
        remaining_capacity: v.remaining_capacity,
        utilization_percentage: v.utilization_percentage
      }));

      setAvailableVehicles(vehicles);

      // Create capacity data lookup
      const capacityLookup: { [key: string]: VehicleCapacityInfo } = {};
      availableVehiclesWithCapacity.forEach(v => {
        capacityLookup[v.id] = v;
      });
      setCapacityData(capacityLookup);

      // Auto-select vehicles with available capacity
      setSelectedVehicleIds(new Set(vehicles.filter(v => (v.remaining_capacity || 0) > 0).map(v => v.id)));

    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available vehicles.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleVehicleSelection = (vehicleId: string, checked: boolean) => {
    setSelectedVehicleIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(vehicleId);
      } else {
        newSet.delete(vehicleId);
      }
      return newSet;
    });
  };

  const handleSelectAllVehicles = () => {
    setSelectedVehicleIds(new Set(availableVehicles.map(v => v.id)));
  };

  const handleClearAllVehicles = () => {
    setSelectedVehicleIds(new Set());
  };

  const performAutoAssignment = async () => {
    if (!selectedEventId) {
      toast({
        title: 'Error',
        description: 'Please select an event first.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedVehicleIds.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one vehicle for assignment.',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigning(true);
    setAssignmentResults([]);

    try {
      // 1. Get pending transport requests for the selected event
      const { data: requests, error: requestsError } = await supabaseAdmin
        .from('transport_requests')
        .select(`
          id,
          contact_id,
          pickup_address,
          status,
          contacts!inner(first_name, last_name)
        `)
        .eq('event_id', selectedEventId)
        .eq('status', 'pending');

      if (requestsError) throw new Error(requestsError.message);

      // Transform the data to match our interface
      const transformedRequests = requests?.map(req => ({
        ...req,
        contact: (req as any).contacts
      })) || [];

      // 2. Get only selected vehicles
      const { data: allVehicles, error: vehiclesError } = await supabaseAdmin
        .from('vehicles')
        .select('*')
        .in('id', Array.from(selectedVehicleIds))
        .eq('status', 'available')
        .order('capacity', { ascending: false });

      if (vehiclesError) throw new Error(vehiclesError.message);

      // 3. Get all drivers and check their availability
      const { data: allDrivers, error: driversError } = await supabaseAdmin
        .from('drivers')
        .select('*');

      if (driversError) throw new Error(driversError.message);

      // Filter to only drivers who are available:
      // 1. Drivers with no vehicle assigned (vehicle_id is null)
      // 2. Drivers whose assigned vehicle is available and selected (for reassignment)
      const availableDrivers = allDrivers?.filter(driver => {
        if (!driver.vehicle_id) {
          // Driver has no vehicle assigned - available
          return true;
        }
        
        // Check if driver's assigned vehicle is available and selected for reassignment
        const assignedVehicle = allVehicles?.find(v => v.id === driver.vehicle_id);
        return assignedVehicle && assignedVehicle.status === 'available';
      }) || [];

      console.log('Assignment data:', {
        requestsCount: transformedRequests.length,
        selectedVehiclesCount: allVehicles?.length || 0,
        totalAvailableVehiclesCount: availableVehicles.length,
        totalDriversCount: allDrivers?.length || 0,
        availableDriversCount: availableDrivers.length,
        selectedVehicleIds: Array.from(selectedVehicleIds),
        vehicles: allVehicles,
        availableDrivers: availableDrivers
      });

      const results: AssignmentResult[] = [];

      if (!transformedRequests || transformedRequests.length === 0) {
        toast({
          title: 'No Assignments Needed',
          description: 'No pending transport requests found for this event.',
        });
        setIsAssigning(false);
        return;
      }

      if (!allVehicles || allVehicles.length === 0) {
        console.log('No selected vehicles available for assignment');
        toast({
          title: 'No Selected Vehicles',
          description: 'No selected vehicles are available for assignment. Please check vehicle selection and statuses.',
          variant: 'destructive',
        });
        setIsAssigning(false);
        return;
      }

      if (!availableDrivers || availableDrivers.length === 0) {
        console.log('No drivers available for assignment');
        toast({
          title: 'No Available Drivers',
          description: 'No available drivers found for assignment. Please add drivers or check vehicle assignments.',
          variant: 'destructive',
        });
        setIsAssigning(false);
        return;
      }

      // 4. Smart assignment algorithm with capacity tracking
      const workingVehicles = allVehicles?.map(v => ({ ...v, remainingCapacity: v.capacity })) || [];
      const workingDrivers = [...availableDrivers];

      console.log(`Starting assignments for ${transformedRequests.length} requests with ${workingVehicles.length} selected vehicles and ${workingDrivers.length} drivers`);

      for (const request of transformedRequests) {
        const passengerName = request.contact 
          ? `${request.contact.first_name} ${request.contact.last_name}`
          : 'Unknown';

        console.log(`Processing request for ${passengerName}`);

        // Find best vehicle based on remaining capacity (smallest vehicle that can handle 1 more passenger)
        const suitableVehicle = workingVehicles.find(v => v.remainingCapacity >= 1);
        const driver = workingDrivers.find(d => !d.vehicle_id || d.vehicle_id === suitableVehicle?.id);

        console.log(`Assignment attempt:`, {
          passengerName,
          suitableVehicle: suitableVehicle ? `${suitableVehicle.make} ${suitableVehicle.model} (${suitableVehicle.remainingCapacity}/${suitableVehicle.capacity})` : 'None',
          driver: driver ? driver.name : 'None',
          totalVehicles: workingVehicles.length,
          vehiclesWithCapacity: workingVehicles.filter(v => v.remainingCapacity >= 1).length,
          totalDrivers: workingDrivers.length
        });

        if (suitableVehicle && driver) {
          try {
            console.log(`Assigning ${suitableVehicle.make} ${suitableVehicle.model} to ${driver.name} for ${passengerName} (${suitableVehicle.remainingCapacity - 1}/${suitableVehicle.capacity} remaining after)`);

            // Check if driver already has this vehicle assigned
            const needsVehicleAssignment = driver.vehicle_id !== suitableVehicle.id;

            // Assign vehicle to driver (only if different)
            if (needsVehicleAssignment) {
              const { error: driverUpdateError } = await supabaseAdmin
                .from('drivers')
                .update({ vehicle_id: suitableVehicle.id })
                .eq('id', driver.id);

              if (driverUpdateError) throw driverUpdateError;
            }

            // Assign driver and vehicle to transport request
            const { error: requestUpdateError } = await supabaseAdmin
              .from('transport_requests')
              .update({
                assigned_driver: driver.id,
                assigned_vehicle: suitableVehicle.id,
                status: 'assigned'
              })
              .eq('id', request.id);

            if (requestUpdateError) throw requestUpdateError;

            // Update vehicle status to in_use (only once)
            if (suitableVehicle.status !== 'in_use') {
              const { error: vehicleUpdateError } = await supabaseAdmin
                .from('vehicles')
                .update({ status: 'in_use' })
                .eq('id', suitableVehicle.id);

              if (vehicleUpdateError) throw vehicleUpdateError;
            }

            // Reduce vehicle capacity by 1
            suitableVehicle.remainingCapacity -= 1;

            // Remove vehicle from available list only if at full capacity
            if (suitableVehicle.remainingCapacity <= 0) {
              const vehicleIndex = workingVehicles.findIndex(v => v.id === suitableVehicle.id);
              if (vehicleIndex > -1) {
                workingVehicles.splice(vehicleIndex, 1);
                console.log(`Vehicle ${suitableVehicle.make} ${suitableVehicle.model} removed - at full capacity`);
              }
            }

            // Don't remove driver - they can handle multiple passengers in the same vehicle

            results.push({
              requestId: request.id,
              passengerName,
              vehicleInfo: `${suitableVehicle.year || ''} ${suitableVehicle.make} ${suitableVehicle.model} (${suitableVehicle.license_plate})`.trim(),
              driverName: driver.name,
              success: true
            });

            console.log(`Successfully assigned ${passengerName}`);

          } catch (error) {
            console.error('Assignment error:', error);
            results.push({
              requestId: request.id,
              passengerName,
              vehicleInfo: 'N/A',
              driverName: 'N/A',
              success: false,
              reason: 'Database error during assignment'
            });
          }
        } else {
          const reason = !suitableVehicle ? 'No selected vehicle with available capacity' : 'No available driver';
          console.log(`Assignment failed for ${passengerName}: ${reason}`);
          
          results.push({
            requestId: request.id,
            passengerName,
            vehicleInfo: 'N/A',
            driverName: 'N/A',
            success: false,
            reason
          });
        }
      }

      setAssignmentResults(results);
      setShowResults(true);

      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      if (successCount === totalCount) {
        toast({
          title: 'Assignment Complete',
          description: `Successfully assigned ${successCount} transport requests!`,
        });
      } else {
        toast({
          title: 'Partial Assignment',
          description: `Assigned ${successCount} of ${totalCount} transport requests.`,
          variant: 'default',
        });
      }

      onAssignmentComplete();

    } catch (error) {
      console.error('Error during auto assignment:', error);
      toast({
        title: 'Assignment Failed',
        description: 'Failed to perform auto assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setAssignmentResults([]);
    setSelectedEventId('');
    setSelectedVehicleIds(new Set());
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-5xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Auto Assign Vehicles
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Select an event and vehicles to automatically assign available drivers to pending transport requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {!showResults ? (
            <>
              {/* Event Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-slate-800">Select Event</Label>
                    <p className="text-sm text-slate-600">Choose the event for which to assign vehicles</p>
                  </div>
                </div>

                {isLoadingEvents ? (
                  <div className="flex items-center gap-3 h-12 px-4 border-2 border-slate-200 rounded-xl bg-white/50">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    <span className="text-slate-500">Loading events...</span>
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-6 border-2 border-slate-200 rounded-xl bg-white/50 text-center">
                    <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium mb-2">No Upcoming Events Found</p>
                    <p className="text-sm text-slate-500">
                      Create some events first to use the auto-assign feature.
                    </p>
                  </div>
                ) : (
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{event.name}</span>
                            <span className="text-sm text-slate-500 ml-4">
                              {formatDate(event.event_date)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Vehicle Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg">
                      <CarFront className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <Label className="text-lg font-semibold text-slate-800">Select Vehicles</Label>
                      <p className="text-sm text-slate-600">Choose which vehicles to include in the assignment</p>
                    </div>
                  </div>
                  
                  {/* Select All / Clear All buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllVehicles}
                      disabled={isLoadingVehicles || availableVehicles.length === 0}
                      className="h-8 px-3 text-xs border border-blue-300 hover:bg-blue-50"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllVehicles}
                      disabled={isLoadingVehicles || selectedVehicleIds.size === 0}
                      className="h-8 px-3 text-xs border border-red-300 hover:bg-red-50"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {isLoadingVehicles ? (
                  <div className="flex items-center gap-3 h-16 px-4 border-2 border-slate-200 rounded-xl bg-white/50">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    <span className="text-slate-500">Loading available vehicles...</span>
                  </div>
                ) : availableVehicles.length === 0 ? (
                  <div className="p-6 border-2 border-slate-200 rounded-xl bg-white/50 text-center">
                    <Car className="h-8 w-8 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium mb-2">No Available Vehicles</p>
                    <p className="text-sm text-slate-500">
                      All vehicles are currently assigned or unavailable.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto p-4 border-2 border-slate-200 rounded-xl bg-white/50">
                    {availableVehicles.map((vehicle) => {
                      const capacityInfo = capacityData[vehicle.id];
                      const utilization = vehicle.utilization_percentage || 0;
                      const remaining = vehicle.remaining_capacity || vehicle.capacity;
                      const current = vehicle.current_assignments || 0;
                      
                      const getCapacityColor = (util: number) => {
                        if (util >= 90) return 'text-red-600 bg-red-50 border-red-200';
                        if (util >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
                        if (util >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                        return 'text-green-600 bg-green-50 border-green-200';
                      };

                      return (
                        <div
                          key={vehicle.id}
                          className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                            selectedVehicleIds.has(vehicle.id)
                              ? 'border-blue-500 bg-blue-50/80 shadow-md'
                              : 'border-slate-200 bg-white/50 hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="space-y-4">
                            {/* Header with checkbox and vehicle info */}
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`vehicle-${vehicle.id}`}
                                checked={selectedVehicleIds.has(vehicle.id)}
                                onCheckedChange={(checked) => 
                                  handleVehicleSelection(vehicle.id, checked as boolean)
                                }
                                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-slate-800 truncate">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                  </p>
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {vehicle.license_plate}
                                  </Badge>
                                </div>
                                
                                {/* Status indicators */}
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="flex items-center gap-1">
                                    {vehicle.status === 'available' ? (
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                                    )}
                                    <span className={vehicle.status === 'available' ? 'text-green-600' : 'text-orange-600'}>
                                      {vehicle.status === 'available' ? 'Available' : 'In Use'}
                                    </span>
                                  </div>
                                  <div className={`px-2 py-1 rounded-full border text-xs font-medium ${getCapacityColor(utilization)}`}>
                                    {utilization.toFixed(0)}% utilized
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Capacity visualization */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-700">Capacity Usage</span>
                                <span className="text-slate-600">
                                  {current} / {vehicle.capacity} passengers
                                </span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    utilization >= 90 ? 'bg-red-500' :
                                    utilization >= 70 ? 'bg-orange-500' :
                                    utilization >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${utilization}%` }}
                                ></div>
                              </div>
                              
                              {/* Capacity details */}
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{remaining} seats available</span>
                                </div>
                                {current > 0 && (
                                  <div className="flex items-center gap-1">
                                    <BarChart3 className="h-3 w-3" />
                                    <span>{current} assigned</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Current passengers (if any) */}
                            {capacityInfo?.assigned_passengers && capacityInfo.assigned_passengers.length > 0 && (
                              <div className="pt-2 border-t border-slate-200">
                                <p className="text-xs font-medium text-slate-700 mb-2">Current Passengers:</p>
                                <div className="space-y-1">
                                  {capacityInfo.assigned_passengers.slice(0, 2).map((passenger) => (
                                    <div key={passenger.id} className="text-xs text-slate-600 truncate">
                                      • {passenger.contact_name}
                                    </div>
                                  ))}
                                  {capacityInfo.assigned_passengers.length > 2 && (
                                    <div className="text-xs text-slate-500">
                                      +{capacityInfo.assigned_passengers.length - 2} more...
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Enhanced Selection Summary */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Selection Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-slate-800">
                          {selectedVehicleIds.size} of {availableVehicles.length}
                        </div>
                        <div className="text-xs text-slate-600">vehicles selected</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium text-slate-800">
                          {availableVehicles
                            .filter(v => selectedVehicleIds.has(v.id))
                            .reduce((sum, v) => sum + (v.remaining_capacity || v.capacity), 0)}
                        </div>
                        <div className="text-xs text-slate-600">available seats</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="font-medium text-slate-800">
                          {availableVehicles
                            .filter(v => selectedVehicleIds.has(v.id))
                            .reduce((sum, v) => sum + v.capacity, 0)}
                        </div>
                        <div className="text-xs text-slate-600">total capacity</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="font-medium text-slate-800">
                          {availableVehicles
                            .filter(v => selectedVehicleIds.has(v.id))
                            .reduce((sum, v) => sum + (v.current_assignments || 0), 0)}
                        </div>
                        <div className="text-xs text-slate-600">currently assigned</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Utilization bar */}
                  {selectedVehicleIds.size > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span>Fleet Utilization</span>
                        <span>
                          {(() => {
                            const selectedVehicles = availableVehicles.filter(v => selectedVehicleIds.has(v.id));
                            const totalCapacity = selectedVehicles.reduce((sum, v) => sum + v.capacity, 0);
                            const usedCapacity = selectedVehicles.reduce((sum, v) => sum + (v.current_assignments || 0), 0);
                            const utilization = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
                            return `${utilization.toFixed(1)}%`;
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ 
                            width: `${(() => {
                              const selectedVehicles = availableVehicles.filter(v => selectedVehicleIds.has(v.id));
                              const totalCapacity = selectedVehicles.reduce((sum, v) => sum + v.capacity, 0);
                              const usedCapacity = selectedVehicles.reduce((sum, v) => sum + (v.current_assignments || 0), 0);
                              return totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
                            })()}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Algorithm Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Smart Assignment Algorithm</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-500" />
                    <span>Uses only selected vehicles for assignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span>Assigns available drivers to vehicles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>Optimizes for efficient vehicle utilization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Updates all statuses automatically</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isAssigning}
                  className="h-12 px-8 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  Cancel
                </Button>
                <Button
                  onClick={performAutoAssignment}
                  disabled={!selectedEventId || selectedVehicleIds.size === 0 || isAssigning}
                  className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg rounded-xl"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Assigning Vehicles...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Start Auto Assignment ({selectedVehicleIds.size} vehicles)
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Assignment Results */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Assignment Results</h3>
                  <p className="text-sm text-slate-600">
                    {assignmentResults.filter(r => r.success).length} of {assignmentResults.length} assignments completed
                  </p>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3">
                {assignmentResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{result.passengerName}</p>
                          {result.success ? (
                            <p className="text-sm text-slate-600">
                              {result.driverName} • {result.vehicleInfo}
                            </p>
                          ) : (
                            <p className="text-sm text-red-600">{result.reason}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={result.success ? "default" : "destructive"}
                        className={
                          result.success
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                        }
                      >
                        {result.success ? 'Assigned' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-200">
                <Button
                  onClick={handleClose}
                  className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg rounded-xl"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 