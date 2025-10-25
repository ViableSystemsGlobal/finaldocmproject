'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  UserPlus, 
  Truck, 
  Route, 
  Send, 
  Eye, 
  Trash2, 
  Users,
  MapPin,
  Clock,
  AlertCircle
} from 'lucide-react';
import { fetchEvent } from '@/services/events';
import { 
  fetchEventDrivers,
  assignDriverToEvent,
  removeDriverFromEvent,
  fetchEventTransportRequests,
  fetchDrivers,
  fetchVehicles,
  generateRoutesForEvent,
  fetchEventRoutes,
  sendRouteToDriverEmail
} from '@/services/transportRequests';
import type { 
  Driver,
  Vehicle,
  TransportRequestWithEventAndRoute,
  OptimizedRoute
} from '@/types/transport';
import type { Event } from '@/services/events';

export default function EventTransportPage() {
  const params = useParams();
  const eventId = params.id as string;

  // State
  const [event, setEvent] = useState<Event | null>(null);
  const [eventDrivers, setEventDrivers] = useState<any[]>([]);
  const [transportRequests, setTransportRequests] = useState<TransportRequestWithEventAndRoute[]>([]);
  const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [isGeneratingRoutes, setIsGeneratingRoutes] = useState(false);
  const [isSendingRoute, setIsSendingRoute] = useState<string | null>(null);
  
  // Dialog states
  const [showAssignDriverDialog, setShowAssignDriverDialog] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Fetch data
  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [
        eventResponse,
        driversResponse,
        requestsResponse,
        routesResponse,
        availableDriversResponse,
        availableVehiclesResponse
      ] = await Promise.all([
        fetchEvent(eventId),
        fetchEventDrivers(eventId),
        fetchEventTransportRequests(eventId),
        fetchEventRoutes(eventId),
        fetchDrivers(),
        fetchVehicles()
      ]);

      if (eventResponse.data) {
        setEvent(eventResponse.data);
      }

      if (driversResponse.data) {
        setEventDrivers(driversResponse.data);
      }

      if (requestsResponse.data) {
        setTransportRequests(requestsResponse.data);
      }

      if (routesResponse.data) {
        setRoutes(routesResponse.data);
      }

      if (availableDriversResponse.data) {
        setAvailableDrivers(availableDriversResponse.data);
      }

      if (availableVehiclesResponse.data) {
        setAvailableVehicles(availableVehiclesResponse.data);
      }

    } catch (error) {
      console.error('Error loading event transport data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event transport data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      toast({
        title: 'Error',
        description: 'Please select a driver',
        variant: 'destructive',
      });
      return;
    }

    setIsAssigningDriver(true);
    try {
      const { error } = await assignDriverToEvent({
        event_id: eventId,
        driver_id: selectedDriverId,
        vehicle_id: selectedVehicleId || undefined,
        notes: assignmentNotes || undefined,
        status: 'assigned'
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Driver assigned to event successfully',
      });

      // Refresh data
      await loadEventData();
      
      // Reset form
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setAssignmentNotes('');
      setShowAssignDriverDialog(false);

    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign driver to event',
        variant: 'destructive',
      });
    } finally {
      setIsAssigningDriver(false);
    }
  };

  const handleRemoveDriver = async (driverId: string) => {
    try {
      const { error } = await removeDriverFromEvent(eventId, driverId);

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Success',
        description: 'Driver removed from event',
      });

      await loadEventData();

    } catch (error) {
      console.error('Error removing driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove driver from event',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateRoutes = async () => {
    setIsGeneratingRoutes(true);
    try {
      const { data: generatedRoutes, error } = await generateRoutesForEvent(eventId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: `Generated ${generatedRoutes?.length || 0} routes successfully`,
      });

      await loadEventData();

    } catch (error) {
      console.error('Error generating routes:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate routes',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingRoutes(false);
    }
  };

  const handleSendRoute = async (routeId: string, driverEmail: string) => {
    setIsSendingRoute(routeId);
    try {
      const { error } = await sendRouteToDriverEmail(routeId, driverEmail);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Route sent to driver successfully',
      });

      await loadEventData();

    } catch (error) {
      console.error('Error sending route:', error);
      toast({
        title: 'Error',
        description: 'Failed to send route to driver',
        variant: 'destructive',
      });
    } finally {
      setIsSendingRoute(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'assigned': return 'default';
      case 'confirmed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'draft': return 'outline';
      case 'sent': return 'secondary';
      case 'completed': return 'default';
      default: return 'outline';
    }
  };

  const getDriversNotAssigned = () => {
    const assignedDriverIds = eventDrivers.map(ed => ed.driver_id);
    return availableDrivers.filter(driver => !assignedDriverIds.includes(driver.id));
  };

  if (isLoading) {
  return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading transport data...</p>
                </div>
              </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-2 text-muted-foreground">Event not found</p>
        </div>
            </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{event.name} - Transport Management</h1>
          <p className="text-muted-foreground">
            {new Date(event.event_date).toLocaleDateString()} • {event.location || 'Location TBD'}
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={showAssignDriverDialog} onOpenChange={setShowAssignDriverDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Driver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Driver to Event</DialogTitle>
                <DialogDescription>
                  Select a driver and optionally a vehicle for this event
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driver">Driver *</Label>
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDriversNotAssigned().map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle (Optional)</Label>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} - {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
            
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Any special instructions or notes..."
                  />
                </div>
              </div>
              
              <DialogFooter>
                  <Button 
                    variant="outline"
                  onClick={() => setShowAssignDriverDialog(false)}
                  disabled={isAssigningDriver}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignDriver} disabled={isAssigningDriver}>
                  {isAssigningDriver ? 'Assigning...' : 'Assign Driver'}
                  </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
                  
                  <Button 
            onClick={handleGenerateRoutes}
            disabled={isGeneratingRoutes || eventDrivers.length === 0 || transportRequests.length === 0}
          >
            <Route className="h-4 w-4 mr-2" />
            {isGeneratingRoutes ? 'Generating...' : 'Generate Routes'}
                  </Button>
                </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Assigned Drivers</p>
                <p className="text-2xl font-bold">{eventDrivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Transport Requests</p>
                <p className="text-2xl font-bold">{transportRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Route className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Generated Routes</p>
                <p className="text-2xl font-bold">{routes.length}</p>
              </div>
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Routes Sent</p>
                <p className="text-2xl font-bold">
                  {routes.filter(r => r.status === 'sent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Assigned Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No drivers assigned to this event yet</p>
              <p className="text-sm">Click "Assign Driver" to get started</p>
              </div>
            ) : (
                <Table>
                  <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {eventDrivers.map((assignment: any) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.driver?.name || 'Unknown Driver'}
                    </TableCell>
                        <TableCell>
                      {assignment.vehicle ? 
                        `${assignment.vehicle.license_plate} - ${assignment.vehicle.make} ${assignment.vehicle.model}` :
                        'No vehicle assigned'
                      }
                        </TableCell>
                        <TableCell>
                      <Badge variant={getStatusBadgeVariant(assignment.status)}>
                        {assignment.status}
                          </Badge>
                        </TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {assignment.notes || '-'}
                    </TableCell>
                        <TableCell>
                            <Button 
                        variant="outline"
                              size="sm" 
                        onClick={() => handleRemoveDriver(assignment.driver_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
          )}
        </CardContent>
      </Card>

      {/* Generated Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Route className="h-5 w-5 mr-2" />
            Generated Routes ({routes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No routes generated yet</p>
              <p className="text-sm">Assign drivers and click "Generate Routes"</p>
              </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route: any) => (
                <Card key={route.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{route.route_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Driver: {route.driver?.name || 'Unknown'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={getStatusBadgeVariant(route.status)}>
                            {route.status}
                          </Badge>
                          {route.route_data?.waypoints && (
                            <span className="text-sm text-muted-foreground">
                              {route.route_data.waypoints.length} stops
                            </span>
            )}
          </div>
        </div>
                      <div className="flex space-x-2">
                        {route.route_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={route.route_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {route.driver?.email && route.status !== 'sent' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendRoute(route.id, route.driver.email)}
                            disabled={isSendingRoute === route.id}
                          >
                            {isSendingRoute === route.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
        )}
      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 