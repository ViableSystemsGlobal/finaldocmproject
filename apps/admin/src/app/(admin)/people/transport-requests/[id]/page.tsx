'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  MapPin,
  Calendar,
  User,
  Edit,
  MessageSquare,
  Map,
  Send,
  Loader2,
  CheckCircle,
  XCircle,
  Save,
  CalendarIcon,
  Clock,
  Users,
  Navigation,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fetchRequest, updateRequest } from '@/services/transportRequests';
import { useContacts } from '@/hooks/useContacts';
import { useUsers } from '@/hooks/useUsers';
import { useNextParams } from '@/lib/nextParams';

import { AssignRideModal } from '@/components/transport/AssignRideModal';
import { 
  updateRequestStatus, 
  buildRoute,
  sendRouteToDriver
} from '@/services/transportRequests';
import { TransportStatus } from '@/types/transport';

export default function TransportRequestDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  
  const { id } = useNextParams(params);
  
  const [transportRequest, setTransportRequest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBuildingRoute, setIsBuildingRoute] = useState(false);
  const [isSendingRoute, setIsSendingRoute] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [routeUrl, setRouteUrl] = useState<string | null>(null);
  
  // Form state
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [status, setStatus] = useState('pending');
  const [assignedDriver, setAssignedDriver] = useState('none');
  const [assignedVehicle, setAssignedVehicle] = useState('none');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // Use the custom hooks
  const { contacts, isLoading: isContactsLoading } = useContacts();
  const { users, isLoading: isUsersLoading } = useUsers();
  
  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'assigned', label: 'Assigned', color: 'bg-blue-500' },
    { value: 'in_transit', label: 'In Transit', color: 'bg-purple-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' }
  ];

  useEffect(() => {
    if (isEditMode) {
      router.push(`/people/transport-requests/edit/${id}`);
      return;
    }
    
    loadTransportRequest();
  }, [id, isEditMode, router]);
  
  const loadTransportRequest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchRequest(id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('Transport request not found');
      }
      
      setTransportRequest(data);
      
      // Set form fields
      if (data) {
        setPickupAddress(data.pickup_address || '');
        setDropoffAddress(data.dropoff_address || '');
        setStatus(data.status || 'pending');
        setAssignedDriver(data.assigned_driver || 'none');
        setAssignedVehicle(data.assigned_vehicle || 'none');
        setScheduledTime(data.scheduled_time ? data.scheduled_time.slice(0, 16) : '');
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Error loading transport request:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transport request details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAssign = () => {
    setIsAssignModalOpen(true);
  };
  
  const handleBuildRoute = async () => {
    if (!transportRequest) return;
    
    setIsBuildingRoute(true);
    try {
      const result = await buildRoute(transportRequest.event_id);
      setRouteUrl(result.url);
      
      toast({
        title: 'Route Built',
        description: 'The optimized route has been generated.',
      });
    } catch (error) {
      console.error('Error building route:', error);
      toast({
        title: 'Error',
        description: 'Failed to build the route.',
        variant: 'destructive',
      });
    } finally {
      setIsBuildingRoute(false);
    }
  };
  
  const handleSendRoute = async () => {
    if (!transportRequest || !routeUrl || !transportRequest.driver) return;
    
    setIsSendingRoute(true);
    try {
      await sendRouteToDriver(
        transportRequest.assigned_driver,
        routeUrl,
        transportRequest.event?.name || 'Event'
      );
      
      toast({
        title: 'Route Sent',
        description: 'The route has been sent to the driver.',
      });
    } catch (error) {
      console.error('Error sending route:', error);
      toast({
        title: 'Error',
        description: 'Failed to send the route to the driver.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingRoute(false);
    }
  };
  
  const handleStatusUpdate = async (status: TransportStatus) => {
    if (!transportRequest) return;
    
    setIsUpdatingStatus(true);
    try {
      const { data, error } = await updateRequestStatus(id, status);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setTransportRequest(data);
      
      toast({
        title: 'Status Updated',
        description: `Transport request is now ${status.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the status.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return null;
    
    return (
      <Badge className={`${statusOption.color} text-white text-lg px-4 py-2`}>
        {statusOption.label}
      </Badge>
    );
  };
  
  const handleSave = async () => {
    if (!transportRequest) return;
    
    try {
      setIsUpdatingStatus(true);
      
      const { error } = await updateRequest(id, {
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        status,
        assigned_driver: assignedDriver === 'none' ? null : assignedDriver || null,
        assigned_vehicle: assignedVehicle === 'none' ? null : assignedVehicle || null,
        scheduled_time: scheduledTime || null,
        notes: notes || null
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Transport request updated successfully'
      });
      
      // Refresh data
      const { data: refreshedData } = await fetchRequest(id);
      if (refreshedData) setTransportRequest(refreshedData);
      
      // Exit edit mode
      router.push(`/people/transport-requests/${id}`);
    } catch (err) {
      console.error('Error updating transport request:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update transport request'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Loading transport request details...</p>
        </div>
      </div>
    );
  }

  if (!transportRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Transport request not found</h2>
          <p className="text-slate-600 mb-6">The transport request you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/people/transport-requests">Back to Transport Requests</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
            <Button 
              variant="outline" 
              size="icon" 
              asChild
              className="bg-white/70 hover:bg-white/90 border-white/20 backdrop-blur-sm shadow-lg rounded-xl"
            >
              <Link href="/people/transport-requests">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-2xl">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Transport Request' : 'Transport Request Details'}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {transportRequest.contact ? 
                    `${transportRequest.contact.first_name} ${transportRequest.contact.last_name}` : 
                    'Unknown Contact'
                  } • {transportRequest.pickup_address || 'No pickup address'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {!isEditMode && (
            <div className="flex gap-3 flex-wrap">
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg"
              >
                <Link href={`/people/transport-requests/${id}?mode=edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Request
                </Link>
              </Button>
            </div>
          )}
        </div>

        {isEditMode ? (
          /* Edit Mode */
          <div className="space-y-8">
            {/* Journey Details Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Journey Details</h2>
                    <p className="text-blue-100">Update pickup and destination information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pickup Address */}
                  <div className="space-y-3">
                    <Label htmlFor="pickup_address" className="text-base font-semibold text-slate-700">
                      <Navigation className="h-4 w-4 inline mr-2" />
                      Pickup Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pickup_address"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      disabled={isUpdatingStatus}
                      placeholder="Enter pickup address..."
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {/* Dropoff Address */}
                  <div className="space-y-3">
                    <Label htmlFor="dropoff_address" className="text-base font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Destination Address
                    </Label>
                    <Input
                      id="dropoff_address"
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      disabled={isUpdatingStatus}
                      placeholder="Enter destination address..."
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Assignment Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Status & Assignment</h2>
                    <p className="text-purple-100">Update request status and assignments</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Status */}
                  <div className="space-y-3">
                    <Label htmlFor="status" className="text-base font-semibold text-slate-700">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus} disabled={isUpdatingStatus}>
                      <SelectTrigger 
                        id="status"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Assigned Driver */}
                  <div className="space-y-3">
                    <Label htmlFor="assigned_driver" className="text-base font-semibold text-slate-700">
                      Assigned Driver
                    </Label>
                    <Select value={assignedDriver} onValueChange={setAssignedDriver} disabled={isUpdatingStatus}>
                      <SelectTrigger 
                        id="assigned_driver"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No driver assigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Assigned Vehicle */}
                  <div className="space-y-3">
                    <Label htmlFor="assigned_vehicle" className="text-base font-semibold text-slate-700">
                      Assigned Vehicle
                    </Label>
                    <Select value={assignedVehicle} onValueChange={setAssignedVehicle} disabled={isUpdatingStatus}>
                      <SelectTrigger 
                        id="assigned_vehicle"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      >
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No vehicle assigned</SelectItem>
                        {/* Note: You'll need to add vehicle data here when available */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule & Notes Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Schedule & Notes</h2>
                    <p className="text-emerald-100">Update timing and additional information</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  {/* Scheduled Time */}
                  <div className="space-y-3">
                    <Label htmlFor="scheduled_time" className="text-base font-semibold text-slate-700">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Scheduled Time
                    </Label>
                    <Input
                      id="scheduled_time"
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      disabled={isUpdatingStatus}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isUpdatingStatus}
                      placeholder="Any special requirements or additional information..."
                      className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/people/transport-requests/${id}`)}
                disabled={isUpdatingStatus}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUpdatingStatus}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-8">
            {/* Overview Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Transport Request Overview</h2>
                    <p className="text-slate-300">Complete details about this transport request</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Contact Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Contact Information
                      </h3>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-lg">
                              {transportRequest.contact ? 
                                `${transportRequest.contact.first_name} ${transportRequest.contact.last_name}` : 
                                'Unknown Contact'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        Status
                      </h3>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                        {getStatusBadge(transportRequest.status)}
                      </div>
                    </div>
                  </div>

                  {/* Request Date */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-orange-600" />
                        Requested Date
                      </h3>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                        <p className="text-slate-800 font-semibold text-lg">
                          {new Date(transportRequest.requested_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Scheduled Time */}
                    {transportRequest.scheduled_time && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5 text-emerald-600" />
                          Scheduled Time
                        </h3>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
                          <p className="text-slate-800 font-semibold text-lg">
                            {new Date(transportRequest.scheduled_time).toLocaleString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Journey Details */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cyan-600" />
                    Journey Details
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pickup */}
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl border border-cyan-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="h-5 w-5 text-cyan-600" />
                        <h4 className="font-semibold text-slate-800">Pickup Address</h4>
                      </div>
                      <p className="text-slate-700 text-lg">
                        {transportRequest.pickup_address || 'Not specified'}
                      </p>
                    </div>

                    {/* Destination */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-semibold text-slate-800">Destination</h4>
                      </div>
                      <p className="text-slate-700 text-lg">
                        {transportRequest.dropoff_address || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                {(transportRequest.driver || transportRequest.vehicle) && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Assignment
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {transportRequest.driver && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                          <h4 className="font-semibold text-slate-800 mb-2">Driver</h4>
                          <p className="text-slate-700 text-lg">{transportRequest.driver.name}</p>
                        </div>
                      )}
                      {transportRequest.vehicle && (
                        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border border-teal-200">
                          <h4 className="font-semibold text-slate-800 mb-2">Vehicle</h4>
                          <p className="text-slate-700 text-lg">{transportRequest.vehicle.license_plate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {transportRequest.notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-slate-600" />
                      Notes
                    </h3>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                        {transportRequest.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Ride Modal */}
      <AssignRideModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        transportRequest={transportRequest}
        onAssignmentComplete={loadTransportRequest}
      />
    </div>
  );
} 