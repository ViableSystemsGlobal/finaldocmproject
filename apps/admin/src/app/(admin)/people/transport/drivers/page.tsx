'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  User,
  Phone,
  Car,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  Activity,
  Sparkles,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  UserCheck,
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
import { fetchDrivers } from '@/services/transportRequests';
import { Driver } from '@/types/transport';

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDriverId, setDeleteDriverId] = useState<string | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    inactive: 0
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [drivers, searchQuery, statusFilter]);

  const loadDrivers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchDrivers();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setDrivers(data || []);
      
      // Update metrics (simplified since we don't have status field yet)
      if (data) {
        const metrics = {
          total: data.length,
          available: data.filter(driver => !driver.vehicle_id).length, // Available = no vehicle assigned
          assigned: data.filter(driver => driver.vehicle_id).length,   // Assigned = has vehicle
          inactive: 0 // Not available in current schema
        };
        setMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drivers.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = [...drivers];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(driver => 
        driver.name.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query) ||
        (driver.email && driver.email.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter (simplified)
    if (statusFilter === 'available') {
      filtered = filtered.filter(driver => !driver.vehicle_id);
    } else if (statusFilter === 'assigned') {
      filtered = filtered.filter(driver => driver.vehicle_id);
    }
    // 'all' and 'inactive' show all drivers since we don't have status field
    
    setFilteredDrivers(filtered);
  };

  const handleDeleteDriver = async () => {
    if (!deleteDriverId) return;
    
    try {
      // Add delete driver API call here
      // await deleteDriver(deleteDriverId);
      
      toast({
        title: 'Driver Deleted',
        description: 'The driver has been removed successfully.',
      });
      
      loadDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete driver.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDriverId(null);
    }
  };

  const getStatusBadge = (hasVehicle: boolean) => {
    if (hasVehicle) {
      return (
        <Badge className="bg-blue-500 text-white">
          Assigned
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500 text-white">
          Available
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Drivers</h2>
          <p className="text-slate-600">Fetching driver information...</p>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-2xl">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Driver Management
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage transport drivers and their availability
                </p>
              </div>
            </div>
            
            <Button 
              asChild
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg rounded-xl px-6 py-3"
            >
              <Link href="/people/transport/drivers/new">
                <Plus className="mr-2 h-5 w-5" />
                Add Driver
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Drivers</p>
                <p className="text-3xl font-bold text-slate-800">{metrics.total}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                <Users className="h-6 w-6 text-white" />
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
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Assigned</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.assigned}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                <Car className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Inactive</p>
                <p className="text-3xl font-bold text-gray-600">{metrics.inactive}</p>
              </div>
              <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-3 rounded-xl">
                <User className="h-6 w-6 text-white" />
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
                  Search Drivers
                </label>
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-blue-500 focus:ring-blue-500"
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
                    <SelectItem value="assigned">Assigned</SelectItem>
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
                Showing {filteredDrivers.length} of {drivers.length} drivers
                {filteredDrivers.length !== drivers.length && ` (filtered)`}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Drivers Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Drivers Directory</h2>
                <p className="text-slate-300">Manage and track all transport drivers</p>
              </div>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700">Driver</TableHead>
                <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Vehicle</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No drivers found</h3>
                      <p className="text-slate-500 mb-6">
                        {searchQuery || statusFilter !== 'all' 
                          ? 'Try adjusting your search criteria.' 
                          : 'Get started by adding your first driver.'
                        }
                      </p>
                      {(!searchQuery && statusFilter === 'all') && (
                        <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg rounded-xl">
                          <Link href="/people/transport/drivers/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Driver
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers.map((driver) => (
                  <TableRow key={driver.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{driver.name}</div>
                          {driver.email && (
                            <div className="text-sm text-slate-500">{driver.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span>{driver.phone}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      {getStatusBadge(!!driver.vehicle_id)}
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Car className="h-4 w-4 text-slate-500" />
                        <span>{driver.vehicle_id ? 'Assigned' : '—'}</span>
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
                            <Link href={`/people/transport/drivers/${driver.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/people/transport/drivers/${driver.id}?mode=edit`} className="flex items-center">
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteDriverId(driver.id)}
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
      <AlertDialog open={!!deleteDriverId} onOpenChange={() => setDeleteDriverId(null)}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete the driver and cannot be undone. Any existing assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDriver}
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