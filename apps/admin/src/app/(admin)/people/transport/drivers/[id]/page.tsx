'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, User, Phone, Mail, Car, Save, X, Edit, Trash2, UserCheck } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { fetchVehicles } from '@/services/transportRequests';
import { supabase } from '@/lib/supabase';
import { Driver, Vehicle } from '@/types/transport';

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const driverId = params.id as string;
  const isEditing = searchParams.get('mode') === 'edit';
  
  // Driver data
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleId, setVehicleId] = useState<string>('none');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (driverId) {
      loadDriver();
      if (isEditing) {
        loadVehicles();
      }
    }
  }, [driverId, isEditing]);

  const loadDriver = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('id', driverId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setDriver(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setVehicleId(data.vehicle_id || 'none');
    } catch (error) {
      console.error('Error loading driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to load driver details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        description: 'Could not load vehicles for assignment.',
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
        vehicle_id: vehicleId && vehicleId !== 'none' ? vehicleId : null,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('drivers')
        .update(driverData)
        .eq('id', driverId)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Driver has been updated successfully!'
      });
      
      // Redirect back to view mode
      router.push(`/people/transport/drivers/${driverId}`);
      
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update driver. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('🗑️ Attempting to delete driver:', driverId);
      
      const { data, error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId)
        .select();
      
      console.log('Delete response:', { data, error });
      
      if (error) {
        console.error('❌ Delete error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Driver deleted successfully');
      
      toast({
        title: 'Success',
        description: 'Driver has been deleted successfully!'
      });
      
      // Wait a bit to ensure delete propagates, then redirect
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect back to drivers list with cache bust
      window.location.href = '/people/transport/drivers?t=' + Date.now();
      
    } catch (error) {
      console.error('❌ Exception during delete:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete driver. Please try again.'
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Driver Details</h2>
          <p className="text-slate-600">Fetching driver information...</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Driver Not Found</h2>
          <p className="text-slate-600 mb-6">The driver you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/people/transport/drivers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drivers
            </Link>
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
              <Link href="/people/transport/drivers">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 flex-1">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {isEditing ? 'Edit Driver' : 'Driver Details'}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {isEditing ? 'Update driver information' : driver.name}
                </p>
              </div>
            </div>

            {!isEditing && (
              <div className="flex gap-3">
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-6 py-3 rounded-xl"
                >
                  <Link href={`/people/transport/drivers/${driverId}?mode=edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="destructive"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-6 py-3 rounded-xl"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          /* Edit Form */
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
                      Update basic contact details for the driver
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
                      Assign or change the vehicle for this driver
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
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/people/transport/drivers/${driverId}`)}
                className="h-12 px-8 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                disabled={isSubmitting}
              >
                <X className="mr-2 h-5 w-5" />
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-8">
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
                      Contact details and basic information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Full Name</Label>
                      <p className="text-xl font-semibold text-slate-800 mt-1">{driver.name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Phone Number</Label>
                      <p className="text-lg text-slate-700 mt-1">{driver.phone}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Email Address</Label>
                      <p className="text-lg text-slate-700 mt-1">{driver.email || 'Not provided'}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Status</Label>
                      <div className="mt-1">
                        <Badge 
                          variant={driver.vehicle_id ? "default" : "secondary"}
                          className={
                            driver.vehicle_id 
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          }
                        >
                          {driver.vehicle_id ? 'Assigned' : 'Available'}
                        </Badge>
                      </div>
                    </div>
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
                      Currently assigned vehicle information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                {driver.vehicle_id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Vehicle</Label>
                      <p className="text-lg font-semibold text-slate-800 mt-1">
                        {(driver as any).vehicle?.year} {(driver as any).vehicle?.make} {(driver as any).vehicle?.model}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">License Plate</Label>
                      <p className="text-lg text-slate-700 mt-1">{(driver as any).vehicle?.license_plate}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Car className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No Vehicle Assigned</h3>
                    <p className="text-slate-600">This driver is currently not assigned to any vehicle.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Delete Driver</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to delete {driver.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Delete Driver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 