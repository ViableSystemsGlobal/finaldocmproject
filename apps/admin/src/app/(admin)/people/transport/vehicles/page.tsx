'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  Truck,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  Gauge,
  Calendar,
  Loader2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toast } from '@/components/ui/use-toast';
import { fetchVehicles } from '@/services/transportRequests';
import { Vehicle } from '@/types/transport';
import { supabase } from '@/lib/supabase';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    totalCapacity: 0
  });

  useEffect(() => {
    loadVehicles();
    
    // Listen for custom reload event
    const handleReloadVehicles = () => {
      console.log('🔄 Reloading vehicles from custom event');
      loadVehicles();
    };
    
    window.addEventListener('reloadVehicles', handleReloadVehicles);
    return () => window.removeEventListener('reloadVehicles', handleReloadVehicles);
  }, []);

  // Reload vehicles when page becomes visible (e.g., after navigation back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadVehicles();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchQuery, statusFilter]);

  const loadVehicles = async () => {
    setIsLoading(true);
    try {
      // Add cache-busting timestamp to force fresh data
      const timestamp = Date.now();
      console.log(`🔄 Loading vehicles... (t=${timestamp})`);
      
      const { data, error } = await fetchVehicles();
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log(`✅ Loaded ${data?.length || 0} vehicles`);
      setVehicles(data || []);
      
      // Update metrics
      if (data) {
        const totalCapacity = data.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
        const metrics = {
          total: data.length,
          available: data.filter(vehicle => vehicle.status === 'available').length,
          inUse: data.filter(vehicle => vehicle.status === 'in_use').length,
          maintenance: data.filter(vehicle => vehicle.status === 'maintenance').length,
          totalCapacity
        };
        setMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vehicles.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = [...vehicles];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.make.toLowerCase().includes(query) ||
        vehicle.model.toLowerCase().includes(query) ||
        vehicle.license_plate.toLowerCase().includes(query) ||
        vehicle.color.toLowerCase().includes(query) ||
        vehicle.year.toString().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }
    
    setFilteredVehicles(filtered);
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleId) return;
    
    try {
      console.log('🗑️ Deleting vehicle from table:', deleteVehicleId);
      
      // Actually delete the vehicle from database
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', deleteVehicleId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      console.log('✅ Vehicle deleted successfully');
      
      toast({
        title: 'Vehicle Deleted',
        description: 'The vehicle has been removed successfully.',
      });
      
      // Reload the vehicles list
      await loadVehicles();
    } catch (error) {
      console.error('❌ Error deleting vehicle:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete vehicle.',
        variant: 'destructive',
      });
    } finally {
      setDeleteVehicleId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: 'Available', color: 'bg-green-500' },
      in_use: { label: 'In Use', color: 'bg-blue-500' },
      maintenance: { label: 'Maintenance', color: 'bg-orange-500' },
      inactive: { label: 'Inactive', color: 'bg-gray-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Vehicles</h2>
          <p className="text-slate-600">Fetching vehicle information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
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
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl">
                  <Car className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Vehicle Management
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage transport fleet and vehicle assignments
                </p>
              </div>
            </div>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg rounded-xl px-6 py-3"
            >
              <Link href="/people/transport/vehicles/new">
                <Plus className="mr-2 h-5 w-5" />
                Add Vehicle
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Vehicles</p>
                <p className="text-3xl font-bold text-slate-800">{metrics.total}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                <Car className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Available</p>
                <p className="text-3xl font-bold text-green-600">{metrics.available}</p>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                <Car className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">In Use</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.inUse}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Maintenance</p>
                <p className="text-3xl font-bold text-orange-600">{metrics.maintenance}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
                <Gauge className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Capacity</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.totalCapacity}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
                <Gauge className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  <Search className="h-4 w-4 inline mr-2" />
                  Search Vehicles
                </label>
                <Input
                  placeholder="Search by make, model, license plate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Status Filter
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <span className="text-sm font-medium text-slate-600">
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
                {filteredVehicles.length !== vehicles.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Vehicles Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Fleet Directory</h2>
                <p className="text-slate-300">Manage and track all transport vehicles</p>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700">Vehicle</TableHead>
                <TableHead className="font-semibold text-slate-700">License Plate</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Capacity</TableHead>
                <TableHead className="font-semibold text-slate-700">Year</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="text-center">
                      <Car className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No vehicles found</h3>
                      <p className="text-slate-500 mb-6">
                        {searchQuery || statusFilter !== 'all' 
                          ? 'Try adjusting your search criteria.' 
                          : 'Get started by adding your first vehicle.'
                        }
                      </p>
                      {(!searchQuery && statusFilter === 'all') && (
                        <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg rounded-xl">
                          <Link href="/people/transport/vehicles/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Vehicle
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                          <Car className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-slate-500 capitalize">
                            {vehicle.color}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="font-mono font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg inline-block">
                        {vehicle.license_plate}
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      {getStatusBadge(vehicle.status)}
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Gauge className="h-4 w-4 text-slate-500" />
                        <span>{vehicle.capacity} passengers</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>{vehicle.year}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-100 rounded-lg"
                          >
                            <span className="sr-only">Open menu</span>
                            <div className="flex flex-col gap-1">
                              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild>
                            <Link href={`/people/transport/vehicles/${vehicle.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/people/transport/vehicles/${vehicle.id}?mode=edit`} className="flex items-center">
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteVehicleId(vehicle.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicleId} onOpenChange={() => setDeleteVehicleId(null)}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete the vehicle and cannot be undone. Any existing assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVehicle}
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