#!/bin/bash

# Script to update email configuration in .env.local
# Run with: bash update-email-config.sh

ENV_FILE="apps/admin/.env.local"

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE does not exist"
  exit 1
fi

# Make a backup
cp "$ENV_FILE" "${ENV_FILE}.bak"
echo "Created backup at ${ENV_FILE}.bak"

# Get existing Supabase and other non-email variables
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" | cut -d= -f2-)
SUPABASE_ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ENV_FILE" | cut -d= -f2-)
SUPABASE_SERVICE_KEY=$(grep "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE" | cut -d= -f2-)
GOOGLE_MAPS_API_KEY=$(grep "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" "$ENV_FILE" | cut -d= -f2-)

# Create new .env.local file
cat > "$ENV_FILE" << EOL
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY

# Email Configuration
NEXT_PUBLIC_EMAIL_PROVIDER=hostinger
NEXT_PUBLIC_FROM_ADDRESS=admin@docmchurch.org

# Hostinger SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=admin@docmchurch.org
SMTP_PASS=h:PF?0~H
SMTP_SECURE=true

# SendGrid Configuration (if needed in future)
SENDGRID_API_KEY=your-api-key
EOL

echo "Updated $ENV_FILE with new email configuration"
echo "NEXT_PUBLIC_EMAIL_PROVIDER=hostinger"
echo "SMTP_HOST=smtp.hostinger.com"
echo "SMTP_PORT=465"
echo "SMTP_USER=admin@docmchurch.org"
echo "SMTP_SECURE=true"

echo "You should now restart your development server for changes to take effect" 