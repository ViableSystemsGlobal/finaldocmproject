'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Car, Hash, Calendar, Palette, Save, X, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { supabaseAdmin } from '@/lib/supabase';

export default function NewVehiclePage() {
  const router = useRouter();
  
  // Form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('available');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!make.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Make is required'
      });
      return;
    }
    
    if (!model.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Model is required'
      });
      return;
    }
    
    if (!year.trim() || isNaN(Number(year)) || Number(year) < 1900 || Number(year) > new Date().getFullYear() + 1) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid year'
      });
      return;
    }
    
    if (!color.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Color is required'
      });
      return;
    }
    
    if (!licensePlate.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'License plate is required'
      });
      return;
    }
    
    if (!capacity.trim() || isNaN(Number(capacity)) || Number(capacity) < 1) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a valid capacity (number of passengers)'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const vehicleData = {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        color: color.trim().toLowerCase(),
        license_plate: licensePlate.trim().toUpperCase(),
        capacity: Number(capacity),
        status: status
      };
      
      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Vehicle has been added successfully!'
      });
      
      // Redirect back to vehicles list
      router.push('/people/transport/vehicles');
      
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create vehicle. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Link href="/people/transport/vehicles">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Add New Vehicle
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Register a new vehicle for the transport fleet
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Information Card */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Vehicle Details</CardTitle>
                  <CardDescription className="text-orange-100">
                    Basic information about the vehicle
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Make */}
                <div className="space-y-3">
                  <Label htmlFor="make" className="text-base font-semibold text-slate-700">
                    <Car className="h-4 w-4 inline mr-2" />
                    Make *
                  </Label>
                  <Input
                    id="make"
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="e.g., Toyota, Honda, Ford"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {/* Model */}
                <div className="space-y-3">
                  <Label htmlFor="model" className="text-base font-semibold text-slate-700">
                    <Car className="h-4 w-4 inline mr-2" />
                    Model *
                  </Label>
                  <Input
                    id="model"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g., Camry, Civic, Focus"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {/* Year */}
                <div className="space-y-3">
                  <Label htmlFor="year" className="text-base font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Year *
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {/* Color */}
                <div className="space-y-3">
                  <Label htmlFor="color" className="text-base font-semibold text-slate-700">
                    <Palette className="h-4 w-4 inline mr-2" />
                    Color *
                  </Label>
                  <Input
                    id="color"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g., Red, Blue, White"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {/* License Plate */}
                <div className="space-y-3">
                  <Label htmlFor="licensePlate" className="text-base font-semibold text-slate-700">
                    <Hash className="h-4 w-4 inline mr-2" />
                    License Plate *
                  </Label>
                  <Input
                    id="licensePlate"
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500 font-mono"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {/* Capacity */}
                <div className="space-y-3">
                  <Label htmlFor="capacity" className="text-base font-semibold text-slate-700">
                    <Gauge className="h-4 w-4 inline mr-2" />
                    Passenger Capacity *
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="5"
                    min="1"
                    max="50"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                    disabled={isSubmitting}
                    required
                  />
                  <p className="text-sm text-slate-500">
                    Number of passengers (not including driver)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Gauge className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Vehicle Status</CardTitle>
                  <CardDescription className="text-green-100">
                    Set the initial availability status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-3">
                <Label htmlFor="status" className="text-base font-semibold text-slate-700">
                  <Gauge className="h-4 w-4 inline mr-2" />
                  Status
                </Label>
                
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-green-500 focus:ring-green-500">
                    <SelectValue placeholder="Select vehicle status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available - Ready for assignments</SelectItem>
                    <SelectItem value="in_use">In Use - Currently assigned</SelectItem>
                    <SelectItem value="maintenance">Maintenance - Under repair</SelectItem>
                    <SelectItem value="inactive">Inactive - Not in service</SelectItem>
                  </SelectContent>
                </Select>
                
                <p className="text-sm text-slate-500">
                  You can change the status later from the vehicle details page
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/people/transport/vehicles')}
              className="h-12 px-8 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
              disabled={isSubmitting}
            >
              <X className="mr-2 h-5 w-5" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Vehicle...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Add Vehicle
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 