'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  Users, 
  Car, 
  MapPin, 
  Route,
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface EventTransportTabProps {
  eventId: string;
}

interface TransportRequest {
  id: string;
  contact: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  pickup_location: {
    address: string;
  };
  status: string;
  vehicle?: {
    make: string;
    model: string;
    capacity: number;
    license_plate: string;
  };
  driver?: {
    name: string;
  };
}

interface TransportSummary {
  totalRequests: number;
  assignedRequests: number;
  availableVehicles: number;
  totalCapacity: number;
  routesGenerated: number;
}

export default function EventTransportTab({ eventId }: EventTransportTabProps) {
  const [summary, setSummary] = useState<TransportSummary>({
    totalRequests: 0,
    assignedRequests: 0,
    availableVehicles: 0,
    totalCapacity: 0,
    routesGenerated: 0
  });
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  // Using toast from imported function above

  useEffect(() => {
    loadTransportData();
  }, [eventId]);

  const loadTransportData = async () => {
    try {
      setLoading(true);
      
      // Fetch transport requests with vehicle/driver info (with cache busting)
      const response = await fetch(`/api/events/${eventId}/transport/summary?_t=${Date.now()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        setSummary(data.summary);
        setRequests(data.requests || []);
        
        // Determine current step based on data
        if (data.summary.assignedRequests === 0) {
          setCurrentStep(1); // Need to assign vehicles
        } else if (data.summary.routesGenerated === 0) {
          setCurrentStep(2); // Need to generate routes
        } else {
          setCurrentStep(3); // Ready to send routes
        }
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', response.status, errorData);
        throw new Error(`API returned ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Error loading transport data:', error);
      toast({
        title: "Error",
        description: "Failed to load transport data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/transport/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "✅ Vehicles Assigned!",
          description: `Assigned ${result.data?.length || 0} people to vehicles`
        });
        setCurrentStep(2);
        await loadTransportData();
      } else {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Assignment failed');
      }
    } catch (error) {
      toast({
        title: "❌ Assignment Failed",
        description: error instanceof Error ? error.message : "Please check if drivers and vehicles are assigned to this event",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateRoutes = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/transport/generate-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "🗺️ Routes Generated!",
          description: `Created ${result.data?.length || 0} optimized routes`
        });
        setCurrentStep(3);
        await loadTransportData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Route generation failed');
      }
    } catch (error) {
      toast({
        title: "❌ Route Generation Failed",
        description: error instanceof Error ? error.message : "Unable to generate routes",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSendRoutes = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/transport/send-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "📧 Routes Sent!",
          description: `Emailed routes to ${result.data?.emailsSent || 0} drivers`
        });
        await loadTransportData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send routes');
      }
    } catch (error) {
      toast({
        title: "❌ Email Failed",
        description: error instanceof Error ? error.message : "Unable to send routes to drivers",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/transport/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "🔄 Transport Reset!",
          description: `Reset ${result.data?.resetRequests || 0} requests and cleared all routes`
        });
        setCurrentStep(1);
        await loadTransportData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Reset failed');
      }
    } catch (error) {
      toast({
        title: "❌ Reset Failed",
        description: error instanceof Error ? error.message : "Unable to reset transport assignments",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading transport data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🚗 Transport Management</h2>
        <p className="text-gray-600">Simple 3-step process to manage event transportation</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center items-center space-x-4 py-6">
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          currentStep >= 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            1
          </div>
          <span className="font-medium">Assign Vehicles</span>
        </div>
        
        <ArrowRight className="text-gray-400" />
        
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          currentStep >= 2 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <span className="font-medium">Generate Routes</span>
        </div>
        
        <ArrowRight className="text-gray-400" />
        
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
          currentStep >= 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
          <span className="font-medium">Send Routes to Drivers</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{summary.totalRequests}</p>
                <p className="text-sm text-gray-600">Transport Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{summary.availableVehicles}</p>
                <p className="text-sm text-gray-600">Available Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{summary.totalCapacity}</p>
                <p className="text-sm text-gray-600">Total Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{summary.assignedRequests}</p>
                <p className="text-sm text-gray-600">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {currentStep === 1 && (
          <>
            <Button
              onClick={handleAutoAssign}
              disabled={processing || summary.totalRequests === 0}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Car className="h-5 w-5 mr-2" />
                  Auto-Assign Vehicles
                </>
              )}
            </Button>
            
            {summary.assignedRequests > 0 && (
              <Button
                onClick={handleReset}
                disabled={processing}
                size="lg"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-3"
              >
                {processing ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Reset All
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            <Button
              onClick={handleGenerateRoutes}
              disabled={processing || summary.assignedRequests === 0}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Route className="h-5 w-5 mr-2" />
                  Generate Routes
                </>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              disabled={processing}
              size="lg"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-3"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Reset All
                </>
              )}
            </Button>
          </>
        )}

        {currentStep === 3 && (
          <>
            <Button
              onClick={handleSendRoutes}
              disabled={processing || summary.routesGenerated === 0}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  Send Routes to Drivers
                </>
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              disabled={processing}
              size="lg"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 px-6 py-3"
            >
              {processing ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Reset All
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {currentStep === 1 && <AlertCircle className="h-5 w-5 text-blue-500" />}
            {currentStep === 2 && <AlertCircle className="h-5 w-5 text-purple-500" />}
            {currentStep === 3 && <CheckCircle className="h-5 w-5 text-green-500" />}
            <span>
              {currentStep === 1 && 'Step 1: Assign People to Vehicles'}
              {currentStep === 2 && 'Step 2: Generate Driving Routes'}
              {currentStep === 3 && 'Step 3: Send Routes to Drivers'}
            </span>
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && `${summary.totalRequests} people need transportation. Click "Auto-Assign Vehicles" to distribute them among available vehicles.`}
            {currentStep === 2 && `${summary.assignedRequests} people are assigned to vehicles. Click "Generate Routes" to create optimized driving directions.`}
            {currentStep === 3 && `${summary.routesGenerated} routes are ready. Click "Send Routes to Drivers" to email them the directions.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Transport Requests List */}
          {requests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Transport Requests:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {request.contact.first_name} {request.contact.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{request.pickup_location.address}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={request.status === 'assigned' ? 'default' : 'secondary'}
                        className={request.status === 'assigned' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {request.status}
                      </Badge>
                      {request.vehicle && (
                        <p className="text-sm text-gray-600 mt-1">
                          {request.vehicle.make} {request.vehicle.model} • {request.driver?.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transport Requests</h3>
              <p className="text-gray-600">No one has requested transportation for this event yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routes Section */}
      {summary.routesGenerated > 0 && (
        <RoutesSection eventId={eventId} />
      )}
    </div>
  );
}

// Routes Section Component
function RoutesSection({ eventId }: { eventId: string }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  // Helper function to create Google Maps embed URL using proper Embed API
  const createGoogleMapsEmbedUrl = (stops: any[]) => {
    if (!stops || stops.length === 0) return null;
    
    console.log('Creating embed URL for stops:', stops);
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return null;
    }
    
    // For single stop, use place embed
    if (stops.length === 1) {
      const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(stops[0].address)}`;
      console.log('Single stop URL:', url);
      return url;
    }
    
    // For multiple stops, use directions embed with proper API format
    const originAddress = stops[0]?.address;
    const destinationAddress = stops[stops.length - 1]?.address;
    
    if (!originAddress || !destinationAddress) {
      console.error('Missing origin or destination address:', { originAddress, destinationAddress });
      return null;
    }
    
    const origin = encodeURIComponent(originAddress);
    const destination = encodeURIComponent(destinationAddress);
    
    let url = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}`;
    
    // Add waypoints if there are more than 2 stops
    // Note: Google Maps Embed API has a limit on waypoints (typically 8-10)
    if (stops.length > 2) {
      const waypoints = stops.slice(1, -1).map((stop: any) => encodeURIComponent(stop.address));
      
      // Limit waypoints to avoid API errors (max 8 intermediate waypoints)
      const limitedWaypoints = waypoints.slice(0, 8);
      
      if (limitedWaypoints.length > 0) {
        url += `&waypoints=${limitedWaypoints.join('|')}`;
      }
      
      if (waypoints.length > 8) {
        console.warn(`Route has ${waypoints.length} waypoints, limited to 8 for Embed API`);
      }
    }
    
    // Add driving mode
    url += '&mode=driving';
    
    console.log('Directions URL (Maps Embed API):', url);
    console.log('Route details:', {
      origin: stops[0]?.address,
      destination: stops[stops.length - 1]?.address,
      waypointCount: stops.length - 2,
      totalStops: stops.length
    });
    return url;
  };

  useEffect(() => {
    loadRoutes();
  }, [eventId]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/transport/routes`);
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRouteExpansion = (routeId: string) => {
    const newExpanded = new Set(expandedRoutes);
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId);
    } else {
      newExpanded.add(routeId);
    }
    setExpandedRoutes(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Route className="h-5 w-5 mr-2" />
            Generated Routes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading routes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (routes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Route className="h-5 w-5 mr-2" />
          Generated Routes ({routes.length})
        </CardTitle>
        <CardDescription>
          Click on a route to view the Google Maps directions and stops
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routes.map((route) => {
            const isExpanded = expandedRoutes.has(route.id);
            const routeName = route.waypoints?.route_name || `Route for ${route.driver?.name || 'Unknown Driver'}`;
            const stops = route.waypoints?.stops || [];
            
            return (
              <div key={route.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleRouteExpansion(route.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{routeName}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">
                          Driver: {route.driver?.name || 'Unknown'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {stops.length} stops
                        </span>
                        <Badge variant="outline">
                          {route.vehicle?.make} {route.vehicle?.model}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {route.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(route.url, '_blank');
                          }}
                        >
                          Open in Maps
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        {isExpanded ? '▼' : '▶'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {/* Google Maps Embed */}
                    <div className="p-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-blue-900">📍 Interactive Route Map</h5>
                            <p className="text-sm text-blue-700">Embedded Google Maps with turn-by-turn directions</p>
                          </div>
                          {route.url && (
                            <Button
                              onClick={() => window.open(route.url, '_blank')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Open in New Tab
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Embedded Google Maps */}
                      {stops.length > 0 ? (
                        <div className="space-y-4">
                          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                            <div className="relative">
                              <iframe
                                src={createGoogleMapsEmbedUrl(stops) || ''}
                                width="100%"
                                height="450"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title={`Route map for ${routeName}`}
                                className="w-full"
                                onError={(e) => {
                                  console.error('iframe error:', e);
                                  // Show error message instead of hiding iframe
                                  const container = (e.target as HTMLIFrameElement).parentElement;
                                  if (container) {
                                    container.innerHTML = `
                                      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                                        <div class="text-yellow-800 font-medium mb-2">🔑 Google Maps API Setup Required</div>
                                        <p class="text-sm text-yellow-700 mb-4">
                                          To display embedded maps, please enable the <strong>Maps Embed API</strong> in your Google Cloud Console.
                                        </p>
                                        <div class="space-y-2 text-xs text-yellow-600">
                                          <p>1. Go to <a href="https://console.cloud.google.com/" target="_blank" class="underline">Google Cloud Console</a></p>
                                          <p>2. Enable "Maps Embed API" for your project</p>
                                          <p>3. Ensure your API key has access to Maps Embed API</p>
                                        </div>
                                        <button 
                                          onclick="window.open('${route.url}', '_blank')" 
                                          class="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                                        >
                                          Open Route in New Tab
                                        </button>
                                      </div>
                                    `;
                                  }
                                }}
                                onLoad={() => {
                                  console.log('Google Maps iframe loaded successfully');
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            📌 Embedded Google Maps showing route with {stops.length} stops
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-lg p-8 text-center border border-gray-200">
                          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h5 className="font-medium text-gray-900 mb-2">No Route Data</h5>
                          <p className="text-sm text-gray-600 mb-4">
                            No stops available for this route
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Route Stops */}
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-3">Route Stops:</h4>
                      <div className="space-y-2">
                        {stops.map((stop: any, index: number) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {stop.passenger || 'Unknown Passenger'}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                {stop.address || 'Unknown Address'}
                              </p>
                              {stop.phone && (
                                <p className="text-sm text-gray-500">
                                  📞 {stop.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 