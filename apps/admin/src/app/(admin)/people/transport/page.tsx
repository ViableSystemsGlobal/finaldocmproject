'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  User,
  Calendar,
  MoreHorizontal,
  Plus,
  Search,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  Activity,
  Sparkles,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Users,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  UserPlus,
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/components/ui/use-toast';
import { Pagination, usePagination } from '@/components/ui/pagination';

import { TransportMetricCard } from '@/components/transport/TransportMetricCard';
import { AssignRideModal } from '@/components/transport/AssignRideModal';
import { AutoAssignModal } from '@/components/transport/AutoAssignModal';
import { fetchRequests, deleteRequest, fetchDrivers, fetchVehicles } from '@/services/transportRequests';
import { TransportRequestWithRelations, TransportStatus } from '@/types/transport';

export default function TransportRequestsPage() {
  const router = useRouter();
  const [transportRequests, setTransportRequests] = useState<TransportRequestWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [assignRequestId, setAssignRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequestWithRelations | null>(null);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  
  // Checkbox selection state
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inTransit: 0,
    completed: 0,
    cancelled: 0
  });

  // Driver and Vehicle metrics
  const [driverMetrics, setDriverMetrics] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    loading: true
  });

  const [vehicleMetrics, setVehicleMetrics] = useState({
    total: 0,
    available: 0,
    inUse: 0,
    loading: true
  });

  useEffect(() => {
    loadTransportRequests();
    loadDriversAndVehicles();
  }, [statusFilter]);

  const loadTransportRequests = async () => {
    setIsLoading(true);
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      const { data, error } = await fetchRequests(filters);
      
      if (error) {
        throw new Error(error.message);
      }
      
      setTransportRequests(data || []);
      
      // Update metrics
      if (data) {
        const metrics = {
          total: data.length,
          pending: data.filter(req => req.status === 'pending').length,
          assigned: data.filter(req => req.status === 'assigned').length,
          inTransit: data.filter(req => req.status === 'in_transit').length,
          completed: data.filter(req => req.status === 'completed').length,
          cancelled: data.filter(req => req.status === 'cancelled').length
        };
        setMetrics(metrics);
      }
    } catch (error) {
      console.error('Error loading transport requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transport requests.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDriversAndVehicles = async () => {
    try {
      // Load drivers
      const { data: drivers, error: driversError } = await fetchDrivers();
      if (driversError) {
        console.error('Error loading drivers:', driversError);
      } else {
        setDriverMetrics({
          total: drivers?.length || 0,
          available: drivers?.filter(driver => !driver.vehicle_id).length || 0,
          assigned: drivers?.filter(driver => driver.vehicle_id).length || 0,
          loading: false
        });
      }

      // Load vehicles
      const { data: vehicles, error: vehiclesError } = await fetchVehicles();
      if (vehiclesError) {
        console.error('Error loading vehicles:', vehiclesError);
      } else {
        setVehicleMetrics({
          total: vehicles?.length || 0,
          available: vehicles?.length || 0, // Simplified - all vehicles are considered available
          inUse: 0, // This would need more complex logic to determine actual usage
          loading: false
        });
      }
    } catch (error) {
      console.error('Error loading drivers and vehicles:', error);
      setDriverMetrics(prev => ({ ...prev, loading: false }));
      setVehicleMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteRequest = async () => {
    if (!deleteRequestId) return;
    
    try {
      const { error } = await deleteRequest(deleteRequestId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Remove from local state
      setTransportRequests(
        transportRequests.filter((req) => req.id !== deleteRequestId)
      );
      
      toast({
        title: 'Success',
        description: 'Transport request deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting transport request:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete transport request.',
        variant: 'destructive',
      });
    } finally {
      setDeleteRequestId(null);
    }
  };

  const handleAssignRequest = (request: TransportRequestWithRelations) => {
    setSelectedRequest(request);
    setAssignRequestId(request.id);
  };

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedRequests(new Set(pagination.currentItems.map(request => request.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
      setSelectAll(false);
    }
    setSelectedRequests(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedRequests.size === 0) return;
    
    const selectedRequestsList = Array.from(selectedRequests);
    const requestNames = selectedRequestsList.map(id => {
      const request = transportRequests.find(r => r.id === id);
      return request ? `${request.contact?.first_name || ''} ${request.contact?.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
    });

    const confirmMessage = `Are you sure you want to delete ${selectedRequests.size} transport request${selectedRequests.size > 1 ? 's' : ''}?\n\n${requestNames.slice(0, 5).join(', ')}${requestNames.length > 5 ? '\n...and ' + (requestNames.length - 5) + ' more' : ''}`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setIsBulkDeleting(true);
      
      let successCount = 0;
      let failedRequests: string[] = [];
      
      for (const requestId of selectedRequestsList) {
        try {
          const { error } = await deleteRequest(requestId);
          if (error) throw error;
          successCount++;
        } catch (error) {
          const request = transportRequests.find(r => r.id === requestId);
          const name = request ? `${request.contact?.first_name || ''} ${request.contact?.last_name || ''}`.trim() || 'Unknown' : 'Unknown';
          failedRequests.push(name);
        }
      }
      
      // Remove successfully deleted requests from state
      setTransportRequests(prev => prev.filter(request => !selectedRequestsList.includes(request.id) || failedRequests.includes(`${request.contact?.first_name || ''} ${request.contact?.last_name || ''}`.trim())));
      
      // Clear selections
      setSelectedRequests(new Set());
      setSelectAll(false);
      
      if (failedRequests.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Partial deletion completed',
          description: `${successCount} request${successCount !== 1 ? 's' : ''} deleted successfully. ${failedRequests.length} failed: ${failedRequests.slice(0, 3).join(', ')}${failedRequests.length > 3 ? ' and ' + (failedRequests.length - 3) + ' more' : ''}`,
        });
      } else {
        toast({
          title: 'Success',
          description: `${successCount} transport request${successCount !== 1 ? 's' : ''} deleted successfully.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete transport requests.',
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Filter requests based on search query
  const filteredRequests = transportRequests.filter((request) => {
    const contactName = `${request.contact?.first_name || ''} ${request.contact?.last_name || ''}`.toLowerCase();
    const eventName = (request.event?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return contactName.includes(query) || eventName.includes(query) || request.pickup_address.toLowerCase().includes(query);
  });

  // Add pagination
  const pagination = usePagination(filteredRequests, 10);

  // Date helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Transport Requests</h2>
          <p className="text-slate-600">Fetching transport data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-sm opacity-75"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-2xl">
                  <Truck className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Transport Requests
                </h1>
                <p className="text-xl text-slate-600 mt-2">
                  Manage transportation requests and assignments
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setShowAutoAssignModal(true)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Sparkles className="mr-2 h-5 w-5" /> Auto Assign
              </Button>
              {selectedRequests.size > 0 && (
                <Button 
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-5 w-5" />
                      Delete Selected ({selectedRequests.size})
                    </>
                  )}
                </Button>
              )}
              <Button 
                asChild
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0 shadow-lg px-8 py-3 rounded-xl"
              >
                <Link href="/people/transport/new">
                  <Plus className="mr-2 h-5 w-5" /> New Request
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Cards for Management Areas */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Management Areas</h2>
            <p className="text-slate-600">Manage drivers, vehicles, and view transport requests</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Transport Requests Card */}
            <div className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Truck className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-100 text-sm font-medium">Total Requests</p>
                    <p className="text-3xl font-bold">{metrics.total}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Transport Requests</h3>
                    <p className="text-cyan-100 text-sm">View all transport requests below</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drivers Management Card */}
            <Link href="/people/transport/drivers" className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm font-medium">Active Drivers</p>
                    <p className="text-3xl font-bold">
                      {driverMetrics.loading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        driverMetrics.total
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Driver Management</h3>
                    <p className="text-blue-100 text-sm">Add and manage transport drivers</p>
                  </div>
                  <div className="text-white/60 group-hover:text-white transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Vehicles Management Card */}
            <Link href="/people/transport/vehicles" className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Car className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-orange-100 text-sm font-medium">Fleet Size</p>
                    <p className="text-3xl font-bold">
                      {vehicleMetrics.loading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        vehicleMetrics.total
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Vehicle Management</h3>
                    <p className="text-orange-100 text-sm">Add and manage transport fleet</p>
                  </div>
                  <div className="text-white/60 group-hover:text-white transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Truck className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-amber-100 text-sm font-medium">Pending Requests</p>
                  <p className="text-3xl font-bold">{metrics.pending}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-200" />
                <span className="text-amber-100 text-sm font-medium">Awaiting assignment</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <UserCheck className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Assigned</p>
                  <p className="text-3xl font-bold">{metrics.assigned}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Driver assigned</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Car className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium">In Transit</p>
                  <p className="text-3xl font-bold">{metrics.inTransit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-200" />
                <span className="text-purple-100 text-sm font-medium">Currently in progress</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">{metrics.completed}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span className="text-emerald-100 text-sm font-medium">Successfully delivered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Controls */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Search & Filter Transport Requests</h2>
                <p className="text-slate-300">Find requests by passenger, event, or location</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Search by passenger, event, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 rounded-xl bg-white/50 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl bg-white/50">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={loadTransportRequests}
                  variant="outline"
                  className="w-full h-12 border-2 border-slate-200 rounded-xl bg-white/50 hover:bg-white/80"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Results Summary with Pagination Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.currentPage * pagination.itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
                  {filteredRequests.length !== transportRequests.length && ` (filtered from ${transportRequests.length} total)`}
                </span>
                
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Show:</span>
                  <Select value={pagination.itemsPerPage.toString()} onValueChange={(value) => pagination.handleItemsPerPageChange(Number(value))}>
                    <SelectTrigger className="w-20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-slate-600">per page</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Transport Requests Table */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-200">
              <TableRow>
                <TableHead className="py-4 w-12">
                  <Checkbox
                    checked={selectAll && pagination.currentItems.length > 0}
                    onCheckedChange={handleSelectAll}
                    disabled={pagination.currentItems.length === 0}
                  />
                </TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Date</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Event</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Passenger</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Status</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Driver</TableHead>
                <TableHead className="py-4 font-bold text-slate-700">Vehicle</TableHead>
                <TableHead className="text-right py-4 font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full flex items-center justify-center">
                        <Truck className="h-8 w-8 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No transport requests found</h3>
                        <p className="text-slate-600">
                          {transportRequests.length === 0 
                            ? "No transport requests found. Create the first request."
                            : "No requests match your search criteria."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.currentItems.map((request) => (
                  <TableRow key={request.id} className="hover:bg-white/80 transition-colors">
                    <TableCell className="py-4 text-slate-600">
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onCheckedChange={(checked) => handleSelectRequest(request.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {formatDate(request.requested_at)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-800">
                        {request.event?.name || 'Unknown Event'}
                      </div>
                      {request.event?.event_date && (
                        <div className="text-slate-600 text-sm">
                          {formatDate(request.event.event_date)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-slate-800">
                        {request.contact 
                          ? `${request.contact.first_name} ${request.contact.last_name}` 
                          : 'Unknown'
                        }
                      </div>
                      {request.pickup_address && (
                        <div className="text-slate-600 text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {request.pickup_address.length > 30 
                            ? `${request.pickup_address.substring(0, 30)}...`
                            : request.pickup_address
                          }
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={
                          request.status === 'completed' ? "default" : 
                          request.status === 'in_transit' ? "secondary" : 
                          request.status === 'assigned' ? "outline" :
                          request.status === 'cancelled' ? "destructive" :
                          "secondary"
                        } 
                        className={
                          request.status === 'completed' 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white" 
                            : request.status === 'in_transit'
                            ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                            : request.status === 'assigned'
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : request.status === 'cancelled'
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }
                      >
                        {request.status === 'pending' ? 'Pending' : 
                         request.status === 'assigned' ? 'Assigned' : 
                         request.status === 'in_transit' ? 'In Transit' :
                         request.status === 'completed' ? 'Completed' :
                         'Cancelled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {request.driver?.name || 'Not assigned'}
                    </TableCell>
                    <TableCell className="py-4 text-slate-600">
                      {request.vehicle?.license_plate || 'Not assigned'}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/people/transport/${request.id}`)}
                          className="hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/people/transport/${request.id}?mode=edit`)}
                          className="hover:bg-emerald-50 hover:text-emerald-600 rounded-lg text-slate-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {request.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAssignRequest(request)}
                            className="hover:bg-purple-50 hover:text-purple-600 rounded-lg text-slate-600"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDeleteRequestId(request.id)}
                          className="hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={filteredRequests.length}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handlePageChange}
          onItemsPerPageChange={pagination.handleItemsPerPageChange}
        />
      </div>

      {/* Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRequestId} onOpenChange={() => setDeleteRequestId(null)}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              This will permanently delete the transport request and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRequest}
              className="rounded-xl px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Ride Modal */}
      <AssignRideModal
        isOpen={!!assignRequestId}
        onClose={() => setAssignRequestId(null)}
        transportRequest={selectedRequest}
        onAssignmentComplete={loadTransportRequests}
      />

      {/* Auto Assign Modal */}
      <AutoAssignModal
        isOpen={showAutoAssignModal}
        onClose={() => setShowAutoAssignModal(false)}
        onAssignmentComplete={loadTransportRequests}
      />
    </div>
  );
} 