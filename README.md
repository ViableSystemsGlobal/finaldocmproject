# CICS - Complete Integrated Church System

A modern church administration system built with Next.js and Supabase.

## Features

- **Member Management**: Track church members, their information, and membership status
- **Contact Management**: Maintain a database of all contacts and their details
- **Group Management**: Organize church members into groups and ministries
- **Mobile App Integration**: Connect with church members through a mobile application

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Hooks and Context
- **Package Manager**: pnpm

## Project Structure

This is a monorepo managed with Turborepo:

- `apps/admin` - Admin dashboard for church staff
- `apps/mobile` - Mobile app for church members (coming soon)
- `packages/ui` - Shared UI components
- `migrations` - Database migrations

## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/docm-cics.git
   cd docm-cics
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Set up the database in Supabase
   - Open your Supabase dashboard
   - Go to the SQL Editor
   - Run each migration file (in the `migrations` folder) in order
   - See `migrations/README.md` for detailed instructions

5. Start the development server
   ```bash
   pnpm dev
   ```

## Database Schema

The system uses the following main tables:

- `people.contacts` - All individuals in the system
- `people.members` - Church members (references contacts)
- `people.groups` - Church groups and ministries
- `people.group_memberships` - Tracks which contacts belong to which groups
- `people.mobile_app_users` - Mobile app users

See `migrations/README.md` for more details about the database schema.

## Development

### Running the Admin Dashboard

```bash
pnpm dev
```

This will start the admin dashboard at http://localhost:3000.

### Creating New Components

Follow the established patterns for creating new components:
1. Use shadcn/ui components where possible
2. Follow the existing styling patterns with Tailwind CSS
3. Create reusable components in the appropriate directory

### Adding API Endpoints

API endpoints are implemented as Next.js API routes in the `apps/admin/src/app/api` directory.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

# DOCM Web - Church Management System

This is the standalone web application for the church management system.

## Environment Variables

Create a `.env.local` file with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Email Configuration
NEXT_PUBLIC_FROM_ADDRESS=your_from_email_here
SMTP_HOST=your_smtp_host_here
SMTP_PORT=587
SMTP_USER=your_smtp_user_here
SMTP_PASS=your_smtp_password_here
SMTP_SECURE=false

# Stripe Configuration (Test Keys)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

This app is ready to deploy to Vercel, Netlify, or any other Next.js hosting platform. 