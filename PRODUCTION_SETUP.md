# 🚀 DOCM CICS Production Setup Guide

## Quick Start

Your application is ready for production! Follow these steps to deploy:

### 1. Run the deployment script
```bash
./deploy.sh your-domain.com
```

### 2. Create production environment file
Create `apps/admin/.env.production` with the following content:

```bash
# Production Environment Configuration
# Update these values for your production deployment

# Domain Configuration
NEXTAUTH_URL=https://admin.your-domain.com
NEXT_PUBLIC_SITE_URL=https://admin.your-domain.com

# Supabase Configuration (keep these as they are for production)
NEXT_PUBLIC_SUPABASE_URL=https://ufjfafcfkalaasdhgcbi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmamZhZmNma2FsYWFzZGhnY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTQ3MTMsImV4cCI6MjA2MzI5MDcxM30.PzwQAeRUJDK8llZf0awLwgW6j-pAmZPOgz55USsOnyo
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Database
DATABASE_URL=postgresql://postgres:[password]@db.ufjfafcfkalaasdhgcbi.supabase.co:5432/postgres

# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyBzrY9ppQ9LhCbAKDU-L8cmUHaI23cAZkQ
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBzrY9ppQ9LhCbAKDU-L8cmUHaI23cAZkQ

# Stripe (START WITH TEST KEYS - SWITCH TO LIVE WHEN READY)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51M3A4oL5sFi7cbV9s5n3hemWG43sjUMzZTdfB8D6qwGCooBKUi4BXv3D6tOpfuNv0GNA1s1bZtaezrymznltEQBx000dN4XLHR
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (Update for production)
NEXT_PUBLIC_EMAIL_PROVIDER=smtp
NEXT_PUBLIC_FROM_ADDRESS=admin@your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@your-domain.com
SMTP_PASS=your_app_password_here
SMTP_SECURE=true

# SendGrid (Alternative email provider)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here

# Additional Production Settings
NODE_ENV=production
EXPO_ACCESS_TOKEN=your_expo_access_token_here
```

### 3. VPS Server Setup

#### Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js, npm, nginx, and certbot
sudo apt install nodejs npm nginx certbot python3-certbot-nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### Upload and Setup Application
```bash
# Upload your deployment package to server
scp deployment/docm-cics-production.tar.gz user@your-server:/home/user/

# On server, extract and setup
tar -xzf docm-cics-production.tar.gz
cd apps/admin
npm install --production
```

#### Configure Nginx
Create `/etc/nginx/sites-available/docm-cics`:
```nginx
server {
    listen 80;
    server_name admin.your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/docm-cics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Setup SSL Certificate
```bash
sudo certbot --nginx -d admin.your-domain.com
```

#### Start Application with PM2
```bash
cd apps/admin
pm2 start npm --name "docm-cics-admin" -- start
pm2 startup
pm2 save
```

## 📱 Mobile App Production Build

### Update app.json for production
```json
{
  "expo": {
    "name": "DOCM CICS",
    "slug": "docm-cics",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.docm.cics"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.docm.cics"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### Build for Production
```bash
cd apps/mobile

# Install EAS CLI if not already installed
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

## 🔧 DNS Configuration

Point your domain to your server:
- **A Record**: `admin.your-domain.com` → `your-server-ip`
- **CNAME Record** (optional): `www.admin.your-domain.com` → `admin.your-domain.com`

## ✅ Testing Your Production Deployment

### Admin Panel Tests
1. Visit `https://admin.your-domain.com`
2. Login with admin credentials
3. Check settings → integrations (Stripe should be connected)
4. Verify roles page shows admin users only
5. Test creating/editing content

### Mobile App Tests
1. Update mobile app to production build
2. Test user registration/login
3. Verify profile picture upload works
4. Test prayer requests submission
5. Test ride requests
6. Test giving/donations functionality
7. Check giving history displays correctly

### Integration Tests
1. Submit prayer request from mobile → check admin panel
2. Process donation → verify in admin finance section
3. Test email notifications
4. Verify API connectivity between mobile and admin

## 🚨 Go Live Checklist

### Before Accepting Real Payments
- [ ] Update Stripe to live keys in admin settings
- [ ] Test small donation amount
- [ ] Verify webhook endpoints are working
- [ ] Check tax-deductible receipt generation

### Ongoing Monitoring
- [ ] Set up server monitoring (CPU, memory, disk space)
- [ ] Monitor application logs for errors
- [ ] Track user registrations and activity
- [ ] Monitor payment processing
- [ ] Regular database backups

## 🎉 You're Ready to Go Live!

Your DOCM CICS application is production-ready with:
- ✅ User management and roles working
- ✅ Mobile app with full functionality
- ✅ Stripe integration connected
- ✅ Profile pictures and file uploads
- ✅ Prayer requests and ride requests
- ✅ Giving history and donations
- ✅ Admin panel for management

Simply update the environment variables with your production values and deploy! 