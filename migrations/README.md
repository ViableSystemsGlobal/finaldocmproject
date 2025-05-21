# Database Migrations

This directory contains SQL migration files for the CICS database.

## Migration Files

- `0001_init.sql`: Initial migration that creates the contacts table
- `0002_members.sql`: Creates members, groups, group_memberships, and mobile_app_users tables

## Running Migrations in Supabase

The simplest way to run these migrations is through the Supabase SQL Editor:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the SQL Editor tab
4. For each migration file (in numerical order):
   - Open the migration file from this directory
   - Copy the entire SQL content
   - Create a new query in the Supabase SQL Editor
   - Paste the SQL content
   - Click "Run" to execute the migration

### Alternative: Using Supabase CLI

If you prefer using the Supabase CLI:

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run SQL from files:
   ```bash
   supabase db execute -f migrations/0001_init.sql
   supabase db execute -f migrations/0002_members.sql
   ```

## Database Schema

### Tables

- `people.contacts`: Stores contact information for all people
- `people.members`: Church members (references contacts)
- `people.groups`: Church groups/ministries
- `people.group_memberships`: Membership of contacts in groups
- `people.mobile_app_users`: Tracks mobile app users

### Functions

- `count_members_serving()`: Counts members who are serving in any group
- `count_member_app_users()`: Counts members who use the mobile app

## Adding New Migrations

To add a new migration:

1. Create a new file in the migrations directory with a name like `000X_description.sql`
2. Write your SQL statements in the file
3. Run the migration script to apply the changes

## Notes

- All tables include `created_at` and `updated_at` timestamp fields
- Foreign keys use CASCADE for deletion where appropriate
- Indexes are created for frequently queried fields 