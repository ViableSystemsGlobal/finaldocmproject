'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNextParams } from '@/lib/nextParams';
import { fetchEvent } from '@/services/events';

export default function UpdateEventLocationPage() {
  const router = useRouter();
  const params = useParams();
  const { id: eventId } = useNextParams(params);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [locationData, setLocationData] = useState({
    lat: 39.72341827331013,
    lng: -104.80330062208942,
    address: 'Denver, CO'
  });
  const [success, setSuccess] = useState(false);

  // Fetch event data
  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;
      
      try {
        const { data, error } = await fetchEvent(eventId as string);
        if (error) throw error;
        
        setEvent(data);
        
        // Initialize form with existing location data if available
        if (data.location_data && typeof data.location_data === 'object') {
          const { lat, lng, address } = data.location_data;
          if (lat && lng) {
            setLocationData({
              lat,
              lng,
              address: address || data.location || 'Unknown address'
            });
          }
        } else if (data.location) {
          // Just set the address field if no coordinates
          setLocationData(prev => ({
            ...prev,
            address: data.location
          }));
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load event data'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvent();
  }, [eventId]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationData(prev => ({
      ...prev,
      [name]: name === 'lat' || name === 'lng' ? parseFloat(value) : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form fields
      if (!locationData.lat || !locationData.lng || !locationData.address) {
        throw new Error('All fields are required');
      }
      
      // Send update request to API
      const response = await fetch(`/api/events/${eventId}/update-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update location');
      }
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Event location updated successfully'
      });
      
      setSuccess(true);
      
      // Redirect back to event page after a short delay
      setTimeout(() => {
        router.push(`/events/${eventId}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update location'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Button 
          onClick={() => router.push('/events')}
          className="mt-4"
        >
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/events/${eventId}`)}
          className="mb-4"
        >
          Back to Event
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Update Event Location</h1>
        <p className="text-muted-foreground mt-1">
          Update the location coordinates for {event.name}
        </p>
      </div>
      
      <div className="bg-muted/20 p-4 mb-6 rounded-lg">
        <h2 className="font-medium mb-2">Current Location Data</h2>
        <p className="text-sm text-muted-foreground">
          {event.location_data && typeof event.location_data === 'object' && event.location_data.lat ? (
            <>
              <span className="font-medium">Coordinates:</span> {event.location_data.lat}, {event.location_data.lng}
              <br />
              <span className="font-medium">Address:</span> {event.location_data.address || event.location || 'Not set'}
            </>
          ) : (
            'No location coordinates are currently set. This event will use the default church location.'
          )}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat">Latitude</Label>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="0.0000001"
              value={locationData.lat}
              onChange={handleChange}
              placeholder="39.72341827331013"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lng">Longitude</Label>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="0.0000001"
              value={locationData.lng}
              onChange={handleChange}
              placeholder="-104.80330062208942"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={locationData.address}
            onChange={handleChange}
            placeholder="Enter address"
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full mt-6"
          disabled={isSubmitting || success}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {success && <Check className="mr-2 h-4 w-4" />}
          {isSubmitting ? 'Updating...' : success ? 'Updated Successfully' : 'Update Location'}
        </Button>
      </form>
      
      <div className="mt-8 p-4 border rounded-lg">
        <h3 className="font-medium mb-2 flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Denver Church Location
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          Default church coordinates for quick access:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Latitude:</span> 39.72341827331013
          </div>
          <div>
            <span className="font-medium">Longitude:</span> -104.80330062208942
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="mt-2"
          onClick={() => {
            setLocationData({
              lat: 39.72341827331013,
              lng: -104.80330062208942,
              address: '8400 E Yale Ave, Denver, CO 80231, USA'
            });
          }}
        >
          Use Church Coordinates
        </Button>
      </div>
    </div>
  );
} 