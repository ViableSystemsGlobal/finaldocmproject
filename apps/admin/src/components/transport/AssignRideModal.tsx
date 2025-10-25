'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, UserCheck, Car, Users, Truck, Check, X } from 'lucide-react';

import { fetchDrivers, fetchVehicles, assignDriver, assignVehicle } from '@/services/transportRequests';
import { Driver, Vehicle, TransportRequestWithRelations } from '@/types/transport';

interface AssignRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  transportRequest: TransportRequestWithRelations | null;
  onAssignmentComplete: () => void;
}

export function AssignRideModal({
  isOpen,
  onClose,
  transportRequest,
  onAssignmentComplete,
}: AssignRideModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setIsSubmitting(false);
      loadData();
    } else {
      // Clean up state when modal closes
      setDrivers([]);
      setVehicles([]);
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setIsLoading(true);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (transportRequest) {
      if (transportRequest.assigned_driver) {
        setSelectedDriverId(transportRequest.assigned_driver);
      }
      if (transportRequest.assigned_vehicle) {
        setSelectedVehicleId(transportRequest.assigned_vehicle);
      }
    }
  }, [transportRequest]);

  const loadData = async () => {
    if (!isOpen) return; // Don't load if modal is not open
    
    setIsLoading(true);
    try {
      const [driversResponse, vehiclesResponse] = await Promise.all([
        fetchDrivers(),
        fetchVehicles()
      ]);
      
      // Check if modal is still open before setting state
      if (!isOpen) return;
      
      if (driversResponse.error) {
        throw new Error(driversResponse.error.message);
      }
      
      if (vehiclesResponse.error) {
        throw new Error(vehiclesResponse.error.message);
      }
      
      setDrivers(driversResponse.data || []);
      setVehicles(vehiclesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      if (isOpen) { // Only show toast if modal is still open
        toast({
          title: 'Error loading data',
          description: 'Could not load drivers and vehicles.',
          variant: 'destructive',
        });
      }
    } finally {
      if (isOpen) { // Only update loading state if modal is still open
        setIsLoading(false);
      }
    }
  };

  const handleAssign = async () => {
    if (!transportRequest) return;
    
    setIsSubmitting(true);
    try {
      // Assign driver if selected
      if (selectedDriverId) {
        const driverResponse = await assignDriver(transportRequest.id, selectedDriverId);
        if (driverResponse.error) {
          throw new Error(driverResponse.error.message);
        }
      }
      
      // Assign vehicle if selected
      if (selectedVehicleId) {
        const vehicleResponse = await assignVehicle(transportRequest.id, selectedVehicleId);
        if (vehicleResponse.error) {
          throw new Error(vehicleResponse.error.message);
        }
      }
      
      toast({
        title: 'Assignment successful',
        description: 'The ride has been successfully assigned.',
      });
      
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error assigning ride:', error);
      toast({
        title: 'Error assigning ride',
        description: 'Could not assign the ride. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
        onInteractOutside={(e) => {
          if (isSubmitting) e.preventDefault();
        }}
      >
        {/* Enhanced Header */}
        <DialogHeader className="space-y-6 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Assign Driver & Vehicle
              </DialogTitle>
              <DialogDescription className="text-lg text-slate-600 mt-1">
                Select a driver and vehicle for this transport request
              </DialogDescription>
            </div>
          </div>
          
          {/* Request Info Card */}
          {transportRequest && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <Car className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-800">
                  {transportRequest.contact ? 
                    `${transportRequest.contact.first_name} ${transportRequest.contact.last_name}` : 
                    'Unknown Contact'
                  }
                </span>
              </div>
              <div className="text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">From:</span>
                  <span>{transportRequest.pickup_address}</span>
                </div>
                {transportRequest.dropoff_address && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">To:</span>
                    <span>{transportRequest.dropoff_address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
              </div>
              <p className="text-lg text-slate-600">Loading drivers and vehicles...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Driver Selection Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Driver Assignment</h3>
                    <p className="text-blue-100 text-sm">Choose who will drive this request</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <Label htmlFor="driver" className="text-base font-semibold text-slate-700">
                    Select Driver
                  </Label>
                  <select
                    id="driver"
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="h-12 w-full border-2 border-slate-200 rounded-xl bg-white/50 px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-800 transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1rem',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">Choose a driver...</option>
                    {drivers.length === 0 ? (
                      <option disabled>No drivers available</option>
                    ) : (
                      drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.phone}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-sm text-slate-500">
                    The driver will be notified of the assignment
                  </p>
                </div>
              </div>
            </div>
            
            {/* Vehicle Selection Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Vehicle Assignment</h3>
                    <p className="text-purple-100 text-sm">Choose which vehicle to use</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <Label htmlFor="vehicle" className="text-base font-semibold text-slate-700">
                    Select Vehicle
                  </Label>
                  <select
                    id="vehicle"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="h-12 w-full border-2 border-slate-200 rounded-xl bg-white/50 px-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-slate-800 transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpath d='M6 9l6 6 6-6'/%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1rem',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">Choose a vehicle...</option>
                    {vehicles.length === 0 ? (
                      <option disabled>No vehicles available</option>
                    ) : (
                      vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-sm text-slate-500">
                    The vehicle capacity and details will be tracked
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter className="pt-6 gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isSubmitting || (!selectedDriverId && !selectedVehicleId)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Assign Ride
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 