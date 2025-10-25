'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  MapPin,
  Calendar,
  BarChart3
} from 'lucide-react';
import { getVehicleCapacityInfo, CapacityAnalytics, VehicleCapacityInfo } from '@/services/vehicleCapacity';
import { toast } from '@/components/ui/use-toast';

interface VehicleCapacityDashboardProps {
  eventId?: string;
  className?: string;
}

export function VehicleCapacityDashboard({ eventId, className }: VehicleCapacityDashboardProps) {
  const [analytics, setAnalytics] = useState<CapacityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadCapacityData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getVehicleCapacityInfo(eventId);
      
      if (error) throw error;
      
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading capacity data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicle capacity data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCapacityData();
  }, [eventId]);

  const getCapacityColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600 bg-red-50 border-red-200';
    if (utilization >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (utilization >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getProgressColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-orange-500';
    if (utilization >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className={`bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Vehicle Capacity Dashboard</h2>
              <p className="text-blue-100">Real-time capacity tracking and analytics</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Capacity Data</h3>
            <p className="text-slate-600">Analyzing vehicle utilization...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden ${className}`}>
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Capacity Data Unavailable</h2>
              <p className="text-red-100">Unable to load vehicle capacity information</p>
            </div>
          </div>
        </div>
        
        <div className="p-8 text-center">
          <Button onClick={loadCapacityData} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Vehicle Capacity Dashboard</h2>
              <p className="text-blue-100">
                {eventId ? 'Event-specific capacity tracking' : 'Fleet-wide capacity monitoring'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-blue-100">Last Updated</p>
              <p className="text-white font-medium">{lastUpdated.toLocaleTimeString()}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadCapacityData}
              className="border-white/30 bg-white/20 hover:bg-white/30 text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-blue-800">{analytics.total_vehicles}</p>
              </div>
              <Car className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Available Capacity</p>
                <p className="text-2xl font-bold text-green-800">{analytics.available_capacity}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">In Use</p>
                <p className="text-2xl font-bold text-orange-800">{analytics.in_use_vehicles}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Utilization</p>
                <p className="text-2xl font-bold text-purple-800">{analytics.overall_utilization.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-800">Fleet Utilization</h3>
            <span className="text-sm text-slate-600">
              {analytics.used_capacity} / {analytics.total_capacity} passengers
            </span>
          </div>
          <Progress 
            value={analytics.overall_utilization} 
            className="h-3 bg-slate-200"
          />
        </div>

        {/* Vehicle Details */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Vehicle Details</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="bg-white/50 border border-slate-200 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-slate-800">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono">
                      {vehicle.license_plate}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Capacity Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-600">Capacity</span>
                      <span className="text-sm text-slate-600">
                        {vehicle.current_assignments} / {vehicle.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(vehicle.utilization_percentage)}`}
                        style={{ width: `${vehicle.utilization_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getCapacityColor(vehicle.utilization_percentage)}`}>
                      {vehicle.utilization_percentage.toFixed(0)}% utilized
                    </div>
                    <div className="flex items-center gap-1">
                      {vehicle.remaining_capacity > 0 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm text-slate-600">
                        {vehicle.remaining_capacity} seats available
                      </span>
                    </div>
                  </div>

                  {/* Assigned Passengers */}
                  {vehicle.assigned_passengers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Current Passengers</h4>
                      <div className="space-y-2">
                        {vehicle.assigned_passengers.map((passenger) => (
                          <div key={passenger.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {passenger.contact_name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {passenger.pickup_address}
                              </p>
                            </div>
                            {passenger.event_name && (
                              <Badge variant="secondary" className="text-xs">
                                {passenger.event_name}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {analytics.vehicles.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="h-12 w-12 text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No Vehicles Found</h3>
            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
              No vehicles are currently registered in the system. Add vehicles to start tracking capacity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 