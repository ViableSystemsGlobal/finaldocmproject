'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { fetchDrivers, fetchVehicles } from '@/services/transportRequests'
import { supabase } from '@/lib/supabase'
import { Users, Car, Plus, Trash2, Edit } from 'lucide-react'

interface EventDriversTabProps {
  eventId: string
}

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  vehicle_id?: string
  status: string
  created_at: string
  updated_at: string
  event_driver_id?: string // Reference to event_drivers record
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  capacity: number
  status: string
  color: string
  created_at: string
  updated_at: string
}

export default function EventDriversTab({ eventId }: EventDriversTabProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false)
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  
  // Driver form state
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'available'
  })
  
  // Vehicle form state
  const [vehicleForm, setVehicleForm] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    capacity: 4,
    color: '',
    status: 'available'
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load event-specific drivers and their assigned vehicles
      const { data: eventDrivers, error: eventDriversError } = await supabase
        .from('event_drivers')
        .select(`
          *,
          driver:drivers(*),
          vehicle:vehicles(*)
        `)
        .eq('event_id', eventId)
        .order('created_at')

      if (eventDriversError) {
        console.error('Error loading event drivers:', eventDriversError)
        throw eventDriversError
      }

      // Load all available vehicles for assignment dropdowns
      const { data: allVehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('make')

      if (vehiclesError) {
        console.error('Error loading vehicles:', vehiclesError)
        throw vehiclesError
      }

      // Transform event drivers to match the expected Driver interface
      const transformedDrivers = eventDrivers?.map(ed => ({
        id: ed.driver?.id || '',
        name: ed.driver?.name || '',
        email: ed.driver?.email || '',
        phone: ed.driver?.phone || '',
        vehicle_id: ed.vehicle_id, // Use event-specific vehicle assignment
        status: ed.driver?.status || 'available',
        created_at: ed.driver?.created_at || '',
        updated_at: ed.driver?.updated_at || '',
        event_driver_id: ed.id // Keep reference to event_drivers record
      })) || []

      setDrivers(transformedDrivers)
      setVehicles(allVehicles || [])

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load drivers and vehicles data.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddDriver = async () => {
    if (!driverForm.name || !driverForm.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      // First, create the driver in the global drivers table
      const { data: newDriver, error: driverError } = await supabase
        .from('drivers')
        .insert([driverForm])
        .select()
        .single()

      if (driverError) throw driverError

      // Then, assign the driver to this event
      const { data: eventDriver, error: eventDriverError } = await supabase
        .from('event_drivers')
        .insert([{
          event_id: eventId,
          driver_id: newDriver.id,
          vehicle_id: null, // No vehicle assigned initially
          status: 'assigned',
          notes: 'Added via Fleet Management'
        }])
        .select()
        .single()

      if (eventDriverError) throw eventDriverError

      toast({
        title: "Success",
        description: `${newDriver.name} added to this event successfully.`,
      })

      // Reset form and close dialog
      setDriverForm({
        name: '',
        email: '',
        phone: '',
        status: 'available'
      })
      setShowAddDriverDialog(false)

      // Reload data
      loadData()
    } catch (error) {
      console.error('Error adding driver to event:', error)
      toast({
        title: "Error",
        description: "Failed to add driver to event.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddVehicle = async () => {
    if (!vehicleForm.make || !vehicleForm.model || !vehicleForm.license_plate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleForm])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Vehicle added successfully.",
      })

      // Reset form and close dialog
      setVehicleForm({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        capacity: 4,
        color: '',
        status: 'available'
      })
      setShowAddVehicleDialog(false)

      // Reload data
      loadData()
    } catch (error) {
      console.error('Error adding vehicle:', error)
      toast({
        title: "Error",
        description: "Failed to add vehicle.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDriver = async (driverId: string) => {
    try {
      // Find the driver record to get the event_driver_id
      const driver = drivers.find(d => d.id === driverId)
      if (!driver?.event_driver_id) {
        throw new Error('Event driver record not found')
      }

      // Remove from event_drivers table (removes driver from this event only)
      const { error } = await supabase
        .from('event_drivers')
        .delete()
        .eq('id', driver.event_driver_id)
      
      if (error) throw error

      toast({
        title: "Success",
        description: `${driver.name} removed from this event.`,
      })

      loadData()
    } catch (error) {
      console.error('Error removing driver from event:', error)
      toast({
        title: "Error",
        description: "Failed to remove driver from event.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)
      
      if (error) throw error

      toast({
        title: "Success",
        description: "Vehicle deleted successfully.",
      })

      loadData()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast({
        title: "Error",
        description: "Failed to delete vehicle.",
        variant: "destructive"
      })
    }
  }

  const handleAssignVehicleToDriver = async (driverId: string, vehicleId: string | null) => {
    try {
      // Find the driver record to get the event_driver_id
      const driver = drivers.find(d => d.id === driverId)
      if (!driver?.event_driver_id) {
        throw new Error('Event driver record not found')
      }

      // Update the event_drivers table (event-specific assignment)
      const { error } = await supabase
        .from('event_drivers')
        .update({ 
          vehicle_id: vehicleId,
          updated_at: new Date().toISOString()
        })
        .eq('id', driver.event_driver_id)
      
      if (error) throw error

      const vehicle = vehicleId ? vehicles.find(v => v.id === vehicleId) : null
      
      toast({
        title: "Success",
        description: vehicleId 
          ? `${vehicle?.make} ${vehicle?.model} assigned to ${driver?.name} for this event`
          : `Vehicle unassigned from ${driver?.name} for this event`,
      })

      loadData()
    } catch (error) {
      console.error('Error assigning vehicle to driver:', error)
      toast({
        title: "Error",
        description: "Failed to assign vehicle to driver.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Fleet Management</h2>
              <p className="text-green-100">Manage drivers and vehicles for this event</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-6"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Fleet Management</h3>
            <p className="text-slate-600">Loading drivers and vehicles...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Fleet Management</h2>
              <p className="text-green-100">Manage drivers and vehicles for this event</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAddDriverDialog(true)}
              variant="outline"
              className="h-12 px-6 border-2 border-white/30 rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/40"
            >
              <Users className="mr-2 h-5 w-5" />
              Add Driver
            </Button>
            <Button
              onClick={() => setShowAddVehicleDialog(true)}
              className="h-12 px-6 border-2 border-white/30 rounded-xl bg-white/20 hover:bg-white/30 text-white border-white/40"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Header with Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Total Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{drivers.length}</div>
              <p className="text-sm text-slate-600 mt-1">Available: {drivers.filter(d => d.status === 'available').length}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Car className="h-5 w-5 text-green-500" />
                Total Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{vehicles.length}</div>
              <p className="text-sm text-slate-600 mt-1">Available: {vehicles.filter(v => v.status === 'available').length}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Total Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {vehicles.reduce((total, vehicle) => total + vehicle.capacity, 0)}
              </div>
              <p className="text-sm text-slate-600 mt-1">Total passenger capacity</p>
            </CardContent>
          </Card>
        </div>

        {/* Drivers Section */}
        <Card className="mb-8 border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5" />
                  Drivers
                </CardTitle>
                <CardDescription className="text-slate-600">Manage your fleet of drivers</CardDescription>
              </div>
              <Button
                onClick={() => setShowAddDriverDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-11 px-5 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {drivers.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">No Drivers Yet</h3>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed mb-6">Add your first driver to start managing your fleet and organizing transportation.</p>
                <Button 
                  onClick={() => setShowAddDriverDialog(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-11 px-5 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Driver
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-700">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700">Email</TableHead>
                      <TableHead className="font-semibold text-slate-700">Phone</TableHead>
                      <TableHead className="font-semibold text-slate-700">Assigned Vehicle</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver) => {
                      const assignedVehicle = vehicles.find(v => v.id === driver.vehicle_id);
                      return (
                        <TableRow key={driver.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                          <TableCell className="font-semibold text-slate-800">{driver.name}</TableCell>
                          <TableCell className="text-slate-600">{driver.email}</TableCell>
                          <TableCell className="text-slate-600">{driver.phone}</TableCell>
                          <TableCell>
                            {assignedVehicle ? (
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4 text-slate-500" />
                                <span className="text-sm text-slate-700">
                                  {assignedVehicle.make} {assignedVehicle.model} ({assignedVehicle.license_plate})
                                </span>
                              </div>
                            ) : (
                              <Select 
                                value={driver.vehicle_id || 'none'} 
                                onValueChange={(value) => handleAssignVehicleToDriver(driver.id, value === 'none' ? null : value)}
                              >
                                <SelectTrigger className="w-48 h-9 rounded-lg border-slate-200">
                                  <SelectValue placeholder="Assign vehicle" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No vehicle</SelectItem>
                                  {vehicles.filter(v => !drivers.some(d => d.vehicle_id === v.id) || v.id === driver.vehicle_id).map((vehicle) => (
                                    <SelectItem key={vehicle.id} value={vehicle.id}>
                                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={driver.status === 'available' ? 'default' : 'secondary'}
                              className={driver.status === 'available' ? 'bg-green-100 text-green-800 font-medium' : 'font-medium'}
                            >
                              {driver.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {assignedVehicle && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAssignVehicleToDriver(driver.id, null)}
                                  className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                                  title="Unassign vehicle"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDriver(driver.id)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Car className="h-5 w-5" />
                  Vehicles
                </CardTitle>
                <CardDescription className="text-slate-600">Manage your fleet of vehicles</CardDescription>
              </div>
              <Button
                onClick={() => setShowAddVehicleDialog(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 h-11 px-5 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Car className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">No Vehicles Yet</h3>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed mb-6">Add your first vehicle to start building your transportation fleet.</p>
                <Button 
                  onClick={() => setShowAddVehicleDialog(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 h-11 px-5 rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Vehicle
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="font-semibold text-slate-700">Vehicle</TableHead>
                      <TableHead className="font-semibold text-slate-700">License Plate</TableHead>
                      <TableHead className="font-semibold text-slate-700">Capacity</TableHead>
                      <TableHead className="font-semibold text-slate-700">Assigned Driver</TableHead>
                      <TableHead className="font-semibold text-slate-700">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => {
                      const assignedDriver = drivers.find(d => d.vehicle_id === vehicle.id);
                      return (
                        <TableRow key={vehicle.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                          <TableCell>
                            <div>
                              <div className="font-semibold text-slate-800">{vehicle.make} {vehicle.model}</div>
                              <div className="text-sm text-slate-500">{vehicle.year} • {vehicle.color}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-slate-700">{vehicle.license_plate}</TableCell>
                          <TableCell className="text-slate-600">{vehicle.capacity} passengers</TableCell>
                          <TableCell>
                            {assignedDriver ? (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">{assignedDriver.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={vehicle.status === 'available' ? 'default' : 'secondary'}
                              className={vehicle.status === 'available' ? 'bg-green-100 text-green-800 font-medium' : 'font-medium'}
                            >
                              {vehicle.status}
                        </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Driver Dialog */}
        <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Driver</DialogTitle>
              <DialogDescription className="text-slate-600">
                Add a new driver to your fleet and start organizing transportation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="driver-name" className="text-sm font-semibold text-slate-700">Name *</Label>
                <Input
                  id="driver-name"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({...driverForm, name: e.target.value})}
                  placeholder="Enter driver's full name"
                  className="mt-1 h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <Label htmlFor="driver-email" className="text-sm font-semibold text-slate-700">Email *</Label>
                <Input
                  id="driver-email"
                  type="email"
                  value={driverForm.email}
                  onChange={(e) => setDriverForm({...driverForm, email: e.target.value})}
                  placeholder="Enter driver's email"
                  className="mt-1 h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <Label htmlFor="driver-phone" className="text-sm font-semibold text-slate-700">Phone</Label>
                <Input
                  id="driver-phone"
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})}
                  placeholder="Enter phone number"
                  className="mt-1 h-11 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <Label htmlFor="driver-status" className="text-sm font-semibold text-slate-700">Status</Label>
                <Select value={driverForm.status} onValueChange={(value) => setDriverForm({...driverForm, status: value})}>
                  <SelectTrigger className="mt-1 h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddDriverDialog(false)}
                disabled={submitting}
                className="h-11 px-6 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddDriver}
                disabled={submitting || !driverForm.name || !driverForm.email}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {submitting ? 'Adding...' : 'Add Driver'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Vehicle Dialog */}
        <Dialog open={showAddVehicleDialog} onOpenChange={setShowAddVehicleDialog}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Vehicle</DialogTitle>
              <DialogDescription className="text-slate-600">
                Add a new vehicle to your fleet and expand your transportation capacity.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle-make" className="text-sm font-semibold text-slate-700">Make *</Label>
                  <Input
                    id="vehicle-make"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                    placeholder="e.g. Toyota"
                    className="mt-1 h-11 rounded-xl border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle-model" className="text-sm font-semibold text-slate-700">Model *</Label>
                  <Input
                    id="vehicle-model"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                    placeholder="e.g. Sienna"
                    className="mt-1 h-11 rounded-xl border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicle-year" className="text-sm font-semibold text-slate-700">Year</Label>
                  <Input
                    id="vehicle-year"
                    type="number"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({...vehicleForm, year: parseInt(e.target.value)})}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="mt-1 h-11 rounded-xl border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle-capacity" className="text-sm font-semibold text-slate-700">Capacity</Label>
                  <Input
                    id="vehicle-capacity"
                    type="number"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({...vehicleForm, capacity: parseInt(e.target.value)})}
                    min="1"
                    max="50"
                    placeholder="Passengers"
                    className="mt-1 h-11 rounded-xl border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="vehicle-license" className="text-sm font-semibold text-slate-700">License Plate *</Label>
                <Input
                  id="vehicle-license"
                  value={vehicleForm.license_plate}
                  onChange={(e) => setVehicleForm({...vehicleForm, license_plate: e.target.value.toUpperCase()})}
                  placeholder="e.g. ABC-1234"
                  style={{ textTransform: 'uppercase' }}
                  className="mt-1 h-11 rounded-xl border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <Label htmlFor="vehicle-color" className="text-sm font-semibold text-slate-700">Color</Label>
                <Input
                  id="vehicle-color"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                  placeholder="e.g. White"
                  className="mt-1 h-11 rounded-xl border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <Label htmlFor="vehicle-status" className="text-sm font-semibold text-slate-700">Status</Label>
                <Select value={vehicleForm.status} onValueChange={(value) => setVehicleForm({...vehicleForm, status: value})}>
                  <SelectTrigger className="mt-1 h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAddVehicleDialog(false)}
                disabled={submitting}
                className="h-11 px-6 rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddVehicle}
                disabled={submitting || !vehicleForm.make || !vehicleForm.model || !vehicleForm.license_plate}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {submitting ? 'Adding...' : 'Add Vehicle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
