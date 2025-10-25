'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, User, Phone, Mail, Car, Save, X } from 'lucide-react';
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
import { fetchVehicles } from '@/services/transportRequests';
import { supabaseAdmin } from '@/lib/supabase';
import { Vehicle } from '@/types/transport';

export default function NewDriverPage() {
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleId, setVehicleId] = useState<string>('none');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const { data, error } = await fetchVehicles();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: 'Warning',
        description: 'Could not load vehicles. You can assign a vehicle later.',
        variant: 'default',
      });
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Name is required'
      });
      return;
    }
    
    if (!phone.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Phone number is required'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const driverData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        vehicle_id: vehicleId && vehicleId !== 'none' ? vehicleId : null
      };
      
      const { data, error } = await supabaseAdmin
        .from('drivers')
        .insert([driverData])
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Driver has been added successfully!'
      });
      
      // Redirect back to drivers list
      router.push('/people/transport/drivers');
      
    } catch (error) {
      console.error('Error creating driver:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create driver. Please try again.'
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
              <Link href="/people/transport/drivers">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-blue-500 p-4 rounded-2xl">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Add New Driver
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Register a new driver for transport services
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Driver Information Card */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Driver Information</CardTitle>
                  <CardDescription className="text-blue-100">
                    Basic contact details for the driver
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-slate-700">
                    <User className="h-4 w-4 inline mr-2" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter driver's full name"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {/* Phone */}
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-base font-semibold text-slate-700">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="email" className="text-base font-semibold text-slate-700">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@example.com"
                    className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-slate-500">
                    Email is optional but recommended for notifications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Assignment Card */}
          <Card className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Vehicle Assignment</CardTitle>
                  <CardDescription className="text-purple-100">
                    Optionally assign a vehicle to this driver
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-3">
                <Label htmlFor="vehicle" className="text-base font-semibold text-slate-700">
                  <Car className="h-4 w-4 inline mr-2" />
                  Assigned Vehicle
                </Label>
                
                {isLoadingVehicles ? (
                  <div className="flex items-center gap-3 h-12 px-4 border-2 border-slate-200 rounded-xl bg-white/50">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    <span className="text-slate-500">Loading vehicles...</span>
                  </div>
                ) : (
                  <Select value={vehicleId} onValueChange={setVehicleId}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select a vehicle (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No vehicle assigned</SelectItem>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.year} {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                <p className="text-sm text-slate-500">
                  You can assign or change the vehicle later from the driver details page
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/people/transport/drivers')}
              className="h-12 px-8 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
              disabled={isSubmitting}
            >
              <X className="mr-2 h-5 w-5" />
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 px-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0 shadow-lg rounded-xl"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Driver...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Add Driver
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 