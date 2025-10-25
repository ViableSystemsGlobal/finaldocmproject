'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Users, FileText, MapPin, Car, CalendarIcon, Clock, Navigation } from 'lucide-react';
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
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createRequest } from '@/services/transportRequests';
import { useContacts } from '@/hooks/useContacts';
import { Event, fetchEvents } from '@/services/events';
import { AddressAutocomplete } from '@/components/transport/AddressAutocomplete';

export default function NewTransportPage() {
  const router = useRouter();
  
  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventId, setEventId] = useState('');
  const [contactId, setContactId] = useState('');
  const [requestType, setRequestType] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupLocationData, setPickupLocationData] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [destination, setDestination] = useState('');
  const [destinationData, setDestinationData] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // Events and contacts
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<Error | null>(null);
  
  // Use the custom hooks for contacts
  const { contacts, isLoading: isContactsLoading, error: contactsError } = useContacts();
  
  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsEventsLoading(true);
        const { data, error } = await fetchEvents();
        
        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error('Failed to load events:', err);
        setEventsError(err as Error);
      } finally {
        setIsEventsLoading(false);
      }
    };
    
    loadEvents();
  }, []);
  
  // Transport request types
  const transportTypes = [
    'Church Service',
    'Bible Study',
    'Prayer Meeting',
    'Hospital Visit',
    'Doctor Appointment',
    'Grocery Shopping',
    'Church Event',
    'Fellowship Activity',
    'Home Visit',
    'Other'
  ];
  
  // Handle pickup location change with Google Maps data
  const handlePickupLocationChange = (value: string, location?: { lat: number; lng: number; address: string }) => {
    setPickupLocation(value);
    if (location) {
      setPickupLocationData(location);
    }
  };

  // Handle destination change with Google Maps data
  const handleDestinationChange = (value: string, location?: { lat: number; lng: number; address: string }) => {
    setDestination(value);
    if (location) {
      setDestinationData(location);
    }
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!eventId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event is required'
      });
      return;
    }
    
    if (!contactId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Contact is required'
      });
      return;
    }
    
    if (!requestType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Request type is required'
      });
      return;
    }
    
    if (!pickupLocation.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Pickup location is required'
      });
      return;
    }
    
    if (!requestedDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Date is required'
      });
      return;
    }
    
    if (!requestedTime) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Time is required'
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create transport request with location data if available
      const requestData: any = {
        event_id: eventId,
        contact_id: contactId,
        pickup_address: pickupLocation.trim(),
        dropoff_address: destination.trim(),
        scheduled_time: `${requestedDate}T${requestedTime}:00`,
        notes: `Request Type: ${requestType}${notes.trim() ? '\n\nAdditional Notes:\n' + notes.trim() : ''}`,
        status: 'pending'
      };

      // Add pickup location data if available
      if (pickupLocationData) {
        requestData.pickup_location = pickupLocationData;
      }

      // Add destination location data if available  
      if (destinationData) {
        requestData.dropoff_location = destinationData;
      }

      const { error } = await createRequest(requestData);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Transport request created successfully',
      });
      
      // Navigate back to transport list
      router.push('/people/transport');
      router.refresh();
    } catch (err) {
      console.error('Error creating transport request:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create transport request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  const isLoading = isContactsLoading || isEventsLoading;

  // Show errors if any
  useEffect(() => {
    if (contactsError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contacts. ' + contactsError.message
      });
    }
  }, [contactsError]);

  useEffect(() => {
    if (eventsError) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events. ' + eventsError.message
      });
    }
  }, [eventsError]);

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
              <Link href="/people/transport">
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
                  New Transport Request
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Submit a new transport request for the community
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
              <p className="text-lg text-slate-600">Loading data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Selection Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Event Selection</h2>
                    <p className="text-purple-100">Choose which event this transport request is for</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-3">
                  <Label htmlFor="event" className="text-base font-semibold text-slate-700">
                    Event <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    onValueChange={setEventId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger 
                      id="event"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                    >
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {new Date(event.event_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">
                    Select the specific event this transport request is for
                  </p>
                </div>
              </div>
            </div>

            {/* Contact & Type Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Contact & Request Type</h2>
                    <p className="text-blue-100">Select the person and type of transport needed</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="contact" className="text-base font-semibold text-slate-700">
                      Contact <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={setContactId}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        id="contact"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {`${contact.first_name || ''} ${contact.last_name || ''}`}
                            {contact.email && ` - ${contact.email}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">
                      The person requesting transport
                    </p>
                  </div>
                  
                  {/* Request Type */}
                  <div className="space-y-3">
                    <Label htmlFor="request_type" className="text-base font-semibold text-slate-700">
                      Request Type <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      onValueChange={setRequestType}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger 
                        id="request_type"
                        className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                      >
                        <SelectValue placeholder="Select request type" />
                      </SelectTrigger>
                      <SelectContent>
                        {transportTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-slate-500">
                      The purpose of the transport request
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Locations Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Journey Details</h2>
                    <p className="text-purple-100">Specify pickup location and destination</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pickup Location */}
                  <div className="space-y-3">
                    <Label htmlFor="pickup_location" className="text-base font-semibold text-slate-700">
                      <Navigation className="h-4 w-4 inline mr-2" />
                      Pickup Location <span className="text-red-500">*</span>
                    </Label>
                    <AddressAutocomplete
                      value={pickupLocation}
                      onChange={handlePickupLocationChange}
                      placeholder="Enter pickup address or location..."
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-slate-500">
                      Where to pick up the person
                    </p>
                  </div>
                  
                  {/* Destination */}
                  <div className="space-y-3">
                    <Label htmlFor="destination" className="text-base font-semibold text-slate-700">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Destination
                    </Label>
                    <AddressAutocomplete
                      value={destination}
                      onChange={handleDestinationChange}
                      placeholder="Enter destination address..."
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-slate-500">
                      Where to drop off the person (optional)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Schedule</h2>
                    <p className="text-emerald-100">When is the transport needed?</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Date */}
                  <div className="space-y-3">
                    <Label htmlFor="requested_date" className="text-base font-semibold text-slate-700">
                      <CalendarIcon className="h-4 w-4 inline mr-2" />
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="requested_date"
                      type="date"
                      value={requestedDate}
                      onChange={(e) => setRequestedDate(e.target.value)}
                      disabled={isSubmitting}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                    <p className="text-sm text-slate-500">
                      The date transport is needed
                    </p>
                  </div>
                  
                  {/* Time */}
                  <div className="space-y-3">
                    <Label htmlFor="requested_time" className="text-base font-semibold text-slate-700">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="requested_time"
                      type="time"
                      value={requestedTime}
                      onChange={(e) => setRequestedTime(e.target.value)}
                      disabled={isSubmitting}
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-emerald-500 focus:ring-emerald-500"
                      required
                    />
                    <p className="text-sm text-slate-500">
                      The time transport is needed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes Card */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Additional Information</h2>
                    <p className="text-orange-100">Any special requirements or notes</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-base font-semibold text-slate-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Any special requirements, mobility needs, or additional information..."
                    className="min-h-[120px] border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-sm text-slate-500">
                    Special requirements, wheelchair access, multiple stops, etc. (optional)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/people/transport')}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl border-2 border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Request...
                  </>
                ) : (
                  <>
                    <Car className="mr-2 h-4 w-4" />
                    Submit Transport Request
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 