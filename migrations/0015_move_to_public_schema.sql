-- Move tables from events schema to public schema
ALTER TABLE IF EXISTS events.events SET SCHEMA public;
ALTER TABLE IF EXISTS events.event_images SET SCHEMA public;
ALTER TABLE IF EXISTS events.registrations SET SCHEMA public;
ALTER TABLE IF EXISTS events.invitations SET SCHEMA public;
ALTER TABLE IF EXISTS events.event_exceptions SET SCHEMA public;

-- Update table references for foreign keys
-- This is in case the constraints need to be dropped and recreated

-- Note: Since we're moving all tables to public schema, the references should update automatically
-- If there are any specific foreign key issues, they can be handled here 