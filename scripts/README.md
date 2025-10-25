# DOCM Scripts

Utility scripts for the DOCM Church Management System

## Email Queue Fix Script

This script fixes schema cache issues with the email queue system.

### Setup

1. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```

2. Create a `.env` file in the `scripts` directory with the following content:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   > **Important**: Get the service role key from your Supabase dashboard. This is a powerful admin key, so keep it secure.

### Running the Script

To fix email queue schema cache issues:

```bash
cd scripts
npm run fix-email-queue
```

## Error Handling Guide

If you encounter schema cache errors like:

```
Could not find the 'from_address' column of 'email_queue' in the schema cache
```

1. Run the fix-email-queue script
2. If the script can't run, use the Queue Diagnostics in your admin dashboard
3. As a workaround, campaigns will automatically fall back to direct API sending 