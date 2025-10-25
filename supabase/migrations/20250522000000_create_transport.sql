-- Enable PostGIS extension for geography type
CREATE EXTENSION IF NOT EXISTS postgis;

DO $$
BEGIN
    -- Create vehicles table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vehicles') THEN
        CREATE TABLE public.vehicles (
          id             uuid        primary key default gen_random_uuid(),
          make           text        not null,
          model          text        not null,
          license_plate  text        not null,
          capacity       int         not null default 1,
          status         text        default 'available'
        );

        -- Enable RLS
        ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create drivers table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'drivers') THEN
        CREATE TABLE public.drivers (
          id          uuid        primary key default gen_random_uuid(),
          name        text        not null,
          phone       text        not null,
          vehicle_id  uuid,
          status      text        default 'available'
        );

        -- Enable RLS
        ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

        -- Add vehicle foreign key constraint
        ALTER TABLE public.drivers 
        ADD CONSTRAINT drivers_vehicle_id_fkey 
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);
    END IF;

    -- Create transport_requests table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transport_requests') THEN
        CREATE TABLE public.transport_requests (
          id               uuid        primary key default gen_random_uuid(),
          event_id         uuid,        -- Will add foreign key constraint later if events table exists
          contact_id       uuid,        -- Will add foreign key constraint later if contacts table exists
          pickup_address   text        not null,
          dropoff_address  text,
          pickup_location  geography,
          status           text        not null default 'pending',  -- pending|assigned|in_transit|completed|cancelled
          assigned_driver  uuid,
          assigned_vehicle uuid,
          requested_at     timestamptz default now(),
          scheduled_time   timestamptz,
          notes            text,
          created_at       timestamptz default now()
        );

        -- Enable RLS
        ALTER TABLE public.transport_requests ENABLE ROW LEVEL SECURITY;

        -- Add driver and vehicle foreign key constraints
        ALTER TABLE public.transport_requests 
        ADD CONSTRAINT transport_requests_assigned_driver_fkey 
        FOREIGN KEY (assigned_driver) REFERENCES public.drivers(id);

        ALTER TABLE public.transport_requests 
        ADD CONSTRAINT transport_requests_assigned_vehicle_fkey 
        FOREIGN KEY (assigned_vehicle) REFERENCES public.vehicles(id);
    END IF;

    -- Create transport_routes table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transport_routes') THEN
        CREATE TABLE public.transport_routes (
          id          uuid        primary key default gen_random_uuid(),
          event_id    uuid,        -- Will add foreign key constraint later if events table exists
          driver_id   uuid,
          vehicle_id  uuid,
          stops       jsonb,      -- ordered array of { request_id, lat, lng, address }
          polyline    text,
          created_at  timestamptz default now()
        );

        -- Enable RLS
        ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;

        -- Add driver and vehicle foreign key constraints
        ALTER TABLE public.transport_routes 
        ADD CONSTRAINT transport_routes_driver_id_fkey 
        FOREIGN KEY (driver_id) REFERENCES public.drivers(id);

        ALTER TABLE public.transport_routes 
        ADD CONSTRAINT transport_routes_vehicle_id_fkey 
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);
    END IF;

    -- Add foreign key constraints for events table if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
        -- Add event foreign key constraint to transport_requests
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'transport_requests_event_id_fkey' 
            AND table_name = 'transport_requests'
        ) THEN
            ALTER TABLE public.transport_requests 
            ADD CONSTRAINT transport_requests_event_id_fkey 
            FOREIGN KEY (event_id) REFERENCES public.events(id);
        END IF;

        -- Add event foreign key constraint to transport_routes
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'transport_routes_event_id_fkey' 
            AND table_name = 'transport_routes'
        ) THEN
            ALTER TABLE public.transport_routes 
            ADD CONSTRAINT transport_routes_event_id_fkey 
            FOREIGN KEY (event_id) REFERENCES public.events(id);
        END IF;
    END IF;

    -- Add foreign key constraints for contacts table if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        -- Add contact foreign key constraint to transport_requests
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'transport_requests_contact_id_fkey' 
            AND table_name = 'transport_requests'
        ) THEN
            ALTER TABLE public.transport_requests 
            ADD CONSTRAINT transport_requests_contact_id_fkey 
            FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
        END IF;
    END IF;
END
$$;

-- Create RLS policies conditionally
DO $$
BEGIN
    -- Transport requests policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_requests' AND policyname = 'Transport users can view all transport requests') THEN
        CREATE POLICY "Transport users can view all transport requests"
          ON public.transport_requests FOR SELECT
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_requests' AND policyname = 'Transport users can insert transport requests') THEN
        CREATE POLICY "Transport users can insert transport requests"
          ON public.transport_requests FOR INSERT
          WITH CHECK (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_requests' AND policyname = 'Transport users can update transport requests') THEN
        CREATE POLICY "Transport users can update transport requests"
          ON public.transport_requests FOR UPDATE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_requests' AND policyname = 'Transport users can delete transport requests') THEN
        CREATE POLICY "Transport users can delete transport requests"
          ON public.transport_requests FOR DELETE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Driver policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'drivers' AND policyname = 'Transport users can view all drivers') THEN
        CREATE POLICY "Transport users can view all drivers"
          ON public.drivers FOR SELECT
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'drivers' AND policyname = 'Transport users can insert drivers') THEN
        CREATE POLICY "Transport users can insert drivers"
          ON public.drivers FOR INSERT
          WITH CHECK (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'drivers' AND policyname = 'Transport users can update drivers') THEN
        CREATE POLICY "Transport users can update drivers"
          ON public.drivers FOR UPDATE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'drivers' AND policyname = 'Transport users can delete drivers') THEN
        CREATE POLICY "Transport users can delete drivers"
          ON public.drivers FOR DELETE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Vehicle policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Transport users can view all vehicles') THEN
        CREATE POLICY "Transport users can view all vehicles"
          ON public.vehicles FOR SELECT
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Transport users can insert vehicles') THEN
        CREATE POLICY "Transport users can insert vehicles"
          ON public.vehicles FOR INSERT
          WITH CHECK (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Transport users can update vehicles') THEN
        CREATE POLICY "Transport users can update vehicles"
          ON public.vehicles FOR UPDATE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Transport users can delete vehicles') THEN
        CREATE POLICY "Transport users can delete vehicles"
          ON public.vehicles FOR DELETE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Transport routes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_routes' AND policyname = 'Transport users can view all transport routes') THEN
        CREATE POLICY "Transport users can view all transport routes"
          ON public.transport_routes FOR SELECT
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_routes' AND policyname = 'Transport users can insert transport routes') THEN
        CREATE POLICY "Transport users can insert transport routes"
          ON public.transport_routes FOR INSERT
          WITH CHECK (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_routes' AND policyname = 'Transport users can update transport routes') THEN
        CREATE POLICY "Transport users can update transport routes"
          ON public.transport_routes FOR UPDATE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transport_routes' AND policyname = 'Transport users can delete transport routes') THEN
        CREATE POLICY "Transport users can delete transport routes"
          ON public.transport_routes FOR DELETE
          USING (auth.jwt() ->> 'role' = 'transport' OR auth.jwt() ->> 'role' = 'admin');
    END IF;
END
$$; 