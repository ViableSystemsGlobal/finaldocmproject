import { Database } from './supabase';

// Location type for pickup and dropoff
export interface Location {
  lat: number;
  lng: number;
  address: string;
}

// Transport Request
export type TransportRequest = Database['public']['Tables']['transport_requests']['Row'];
export type TransportRequestInsert = Database['public']['Tables']['transport_requests']['Insert'] & {
  pickup_location?: Location;
};
export type TransportRequestUpdate = Database['public']['Tables']['transport_requests']['Update'] & {
  pickup_location?: Location;
};

// Transport Status
export type TransportStatus = 'pending' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';

// Driver
export type Driver = Database['public']['Tables']['drivers']['Row'];
export type DriverInsert = Database['public']['Tables']['drivers']['Insert'];
export type DriverUpdate = Database['public']['Tables']['drivers']['Update'];

// Vehicle
export type Vehicle = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

// Transport Route
export type TransportRoute = Database['public']['Tables']['transport_routes']['Row'];
export type TransportRouteInsert = Database['public']['Tables']['transport_routes']['Insert'];
export type TransportRouteUpdate = Database['public']['Tables']['transport_routes']['Update'];

// Transport Stop
export type TransportStop = {
  request_id: string;
  address: string;
  lat?: number;
  lng?: number;
};

// Transport Request with relationships
export type TransportRequestWithRelations = TransportRequest & {
  event?: { name: string; event_date: string };
  contact?: { first_name: string; last_name: string };
  driver?: { name: string };
  vehicle?: { license_plate: string };
};

// Driver with vehicle
export type DriverWithVehicle = Driver & {
  vehicle?: Vehicle;
};

// Event Driver Assignment
export type EventDriver = {
  id: string;
  event_id: string;
  driver_id: string;
  vehicle_id?: string | null;
  assigned_at: string;
  status: 'assigned' | 'confirmed' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type EventDriverInsert = Omit<EventDriver, 'id' | 'created_at' | 'updated_at' | 'assigned_at'>;
export type EventDriverUpdate = Partial<EventDriverInsert>;

// Enhanced Driver with Event Assignment
export type DriverWithEventAssignment = Driver & {
  vehicle?: Vehicle;
  event_assignment?: EventDriver;
};

// Route Data (enhanced)
export type RoutePoint = {
  lat: number;
  lng: number;
  address: string;
  contact_id: string;
  request_id: string;
  estimated_pickup_time?: string;
};

export type OptimizedRoute = {
  id: string;
  event_id: string;
  driver_id: string;
  vehicle_id?: string | null;
  route_name: string;
  route_url?: string | null;
  total_distance?: string | null;
  estimated_duration?: string | null;
  route_data?: {
    waypoints: RoutePoint[];
    optimization_info?: any;
  } | null;
  status: 'draft' | 'confirmed' | 'sent' | 'completed';
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type OptimizedRouteInsert = Omit<OptimizedRoute, 'id' | 'created_at' | 'updated_at'>;
export type OptimizedRouteUpdate = Partial<OptimizedRouteInsert>;

// Event Transport Summary
export type EventTransportSummary = {
  event_id: string;
  event_name: string;
  event_date: string;
  location?: string | null;
  total_requests: number;
  pending_requests: number;
  assigned_requests: number;
  assigned_drivers: number;
  created_routes: number;
};

// Enhanced Transport Request with Event and Route info
export type TransportRequestWithEventAndRoute = TransportRequest & {
  event?: { 
    id: string;
    name: string; 
    event_date: string;
    location?: string;
  };
  contact?: { 
    first_name: string; 
    last_name: string;
    phone?: string;
    email?: string;
  };
  driver?: { 
    id: string;
    name: string; 
  };
  vehicle?: { 
    id: string;
    license_plate: string; 
  };
  route?: {
    id: string;
    route_name: string;
    status: string;
  };
}; 