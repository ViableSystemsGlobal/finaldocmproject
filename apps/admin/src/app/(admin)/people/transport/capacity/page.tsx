'use client';

import React, { useState } from 'react';
import { VehicleCapacityDashboard } from '@/components/transport/VehicleCapacityDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  BarChart3, 
  Filter,
  Calendar,
  RefreshCw,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VehicleCapacityPage() {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/people/transport')}
                className="border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transport
              </Button>
              
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-2xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Vehicle Capacity Analytics
                </h1>
                <p className="text-lg text-slate-600">
                  Monitor real-time vehicle utilization and capacity management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Event Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-48 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        All Events (Fleet-wide)
                      </div>
                    </SelectItem>
                    {/* Event options would be loaded here */}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-bold text-slate-800">Live Tracking</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Real-time capacity monitoring</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">Smart</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  AI-Powered
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">Optimized assignments</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <span className="text-lg font-bold text-slate-800">
                  {selectedEventId ? 'Event-Specific' : 'Fleet-Wide'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Capacity view mode</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                <span className="text-lg font-bold text-slate-800">Auto</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Data refreshes automatically</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <VehicleCapacityDashboard 
          key={refreshKey}
          eventId={selectedEventId || undefined} 
          className="mb-8"
        />

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Capacity Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">✅ Optimization Tips</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Vehicles with remaining capacity stay available for new assignments</li>
                  <li>• Smart algorithm prioritizes efficient vehicle utilization</li>
                  <li>• Real-time tracking prevents overbooking</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Capacity Management</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Monitor utilization rates in real-time</li>
                  <li>• Track passenger assignments per vehicle</li>
                  <li>• Optimize routes based on capacity</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-lg border border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">System Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">🚀 Auto-Assignment</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Intelligent vehicle and driver matching</li>
                  <li>• Respects capacity constraints</li>
                  <li>• Maximizes efficiency</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">📈 Analytics</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• Real-time capacity tracking</li>
                  <li>• Utilization percentage monitoring</li>
                  <li>• Historical usage patterns</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 