'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Car, Hash, Calendar, Palette, Save, X, Edit, Trash2, Gauge } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/transport';

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const vehicleId = params.id as string;
  const isEditing = searchParams.get('mode') === 'edit';
  
  // Vehicle data
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    }
  }, [vehicleId]);

  const loadVehicle = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setVehicle(data);
      setMake(data.make || '');
      setModel(data.model || '');
      setYear(data.year?.toString() || '');
      setColor(data.color || '');
      setLicensePlate(data.license_plate || '');
      setCapacity(data.capacity?.toString() || '');
      setStatus(data.status || 'available');
    } catch (error) {
      console.error('Error loading vehicle:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicle details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        status: status,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('vehicles')
        .update(vehicleData)
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: 'Success',
        description: 'Vehicle has been updated successfully!'
      });
      
      // Redirect back to view mode
      router.push(`/people/transport/vehicles/${vehicleId}`);
      
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update vehicle. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('🗑️ Attempting to delete vehicle:', vehicleId);
      
      const { data, error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
        .select();
      
      console.log('Delete response:', { data, error });
      
      if (error) {
        console.error('❌ Delete error:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Vehicle deleted successfully');
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Vehicle has been deleted successfully!'
      });
      
      // Wait a moment for delete to propagate
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Hard redirect with full page reload (no cache)
      console.log('🔄 Redirecting to vehicles list...');
      window.location.replace('/people/transport/vehicles');
      
    } catch (error) {
      console.error('❌ Exception during delete:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete vehicle. Please try again.'
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white';
      case 'in_use':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'maintenance':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      case 'inactive':
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'in_use':
        return 'In Use';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
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
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Vehicle Details</h2>
          <p className="text-slate-600">Fetching vehicle information...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Car className="h-8 w-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Vehicle Not Found</h2>
          <p className="text-slate-600 mb-6">The vehicle you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/people/transport/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
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
                  {isEditing ? 'Edit Vehicle' : 'Vehicle Details'}
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  {isEditing ? 'Update vehicle information' : `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                </p>
              </div>
            </div>

            {!isEditing && (
              <div className="flex gap-3">
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-6 py-3 rounded-xl"
                >
                  <Link href={`/people/transport/vehicles/${vehicleId}?mode=edit`}>
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
                      Update basic information about the vehicle
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
                      placeholder="e.g., Camry, Accord, F-150"
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
                      placeholder="e.g., White, Black, Blue"
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
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="ABC-1234"
                      className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
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
                  </div>
                  
                  {/* Status */}
                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="status" className="text-base font-semibold text-slate-700">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select vehicle status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available - Ready for assignments</SelectItem>
                        <SelectItem value="in_use">In Use - Currently assigned</SelectItem>
                        <SelectItem value="maintenance">Maintenance - Under repair</SelectItem>
                        <SelectItem value="inactive">Inactive - Not in service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/people/transport/vehicles/${vehicleId}`)}
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
            {/* Vehicle Information Card */}
            <Card className="bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Car className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Vehicle Information</CardTitle>
                      <CardDescription className="text-orange-100">
                        Complete vehicle details and specifications
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Make & Model</Label>
                      <p className="text-xl font-semibold text-slate-800 mt-1">{vehicle.make} {vehicle.model}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Year</Label>
                      <p className="text-lg text-slate-700 mt-1">{vehicle.year}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Color</Label>
                      <p className="text-lg text-slate-700 mt-1 capitalize">{vehicle.color}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">License Plate</Label>
                      <p className="text-lg font-mono text-slate-700 mt-1">{vehicle.license_plate}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Passenger Capacity</Label>
                      <p className="text-lg text-slate-700 mt-1">{vehicle.capacity} passengers</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Current Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(vehicle.status)}>
                          {getStatusLabel(vehicle.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Are you sure you want to delete this {vehicle?.year} {vehicle?.make} {vehicle?.model}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Delete Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 