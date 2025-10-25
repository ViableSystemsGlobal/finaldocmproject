# 🚀 DOCM Church - Deployment Guide

## Quick Deploy Commands

### Deploy Church Website
```bash
./deploy-web.sh
```

### Deploy Admin Panel
```bash
./deploy-admin.sh
```

## 📝 Making Changes

### 1. Church Website Changes
**Location**: `apps/web/src/`

**Common Files to Edit**:
- `src/app/page.tsx` - Homepage content
- `src/components/sections/` - Individual sections
- `src/app/about/page.tsx` - About page
- `src/app/events/page.tsx` - Events page
- `src/app/globals.css` - Global styles

**After making changes**:
```bash
./deploy-web.sh
```

### 2. Admin Panel Changes
**Location**: `apps/admin/src/`

**Common Files to Edit**:
- `src/app/(admin)/dashboard/page.tsx` - Dashboard
- `src/app/(admin)/people/page.tsx` - People management
- `src/app/(admin)/events/page.tsx` - Events management
- `src/components/` - Reusable components

**After making changes**:
```bash
./deploy-admin.sh
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### Web App
```bash
# 1. Build locally
cd apps/web
npm run build

# 2. Create package
cd ../..
tar -czf web-deploy.tar.gz -C apps/web .next package.json next.config.ts public src

# 3. Upload and deploy
scp web-deploy.tar.gz root@5.183.11.252:/tmp/
ssh root@5.183.11.252 'cd /root/docm-cics/apps/web && tar -xzf /tmp/web-deploy.tar.gz && pm2 restart docm-cics-web'
```

### Admin App
```bash
# 1. Build locally
cd apps/admin
npm run build

# 2. Create package
cd ../..
tar -czf admin-deploy.tar.gz -C apps/admin .next package.json next.config.js public src

# 3. Upload and deploy
scp admin-deploy.tar.gz root@5.183.11.252:/tmp/
ssh root@5.183.11.252 'cd /root/docm-cics/apps/admin && tar -xzf /tmp/admin-deploy.tar.gz && pm2 restart docm-cics-admin'
```

## 🖥️ Server Management

### Check Server Status
```bash
ssh root@5.183.11.252 'pm2 status'
```

### View Logs
```bash
ssh root@5.183.11.252 'pm2 logs docm-cics-web'
ssh root@5.183.11.252 'pm2 logs docm-cics-admin'
```

### Restart Services
```bash
ssh root@5.183.11.252 'pm2 restart docm-cics-web'
ssh root@5.183.11.252 'pm2 restart docm-cics-admin'
```

## 🌐 Live URLs

- **Church Website**: https://www.docmchurch.org
- **Admin Panel**: https://admin.docmchurch.org
- **Mobile App API**: Connected to admin panel

## 📱 For Mobile App Changes

The mobile app connects to the admin panel API, so:
1. Make changes in `apps/mobile/`
2. Build using `expo build` or `eas build`
3. No server deployment needed - just app store updates

## 🛠️ Development Tips

### Local Development
```bash
# Web app
cd apps/web
npm run dev

# Admin app
cd apps/admin
npm run dev

# Mobile app
cd apps/mobile
npx expo start
```

### Testing Changes
Always test locally before deploying:
1. Run `npm run dev` in the respective app folder
2. Test your changes thoroughly
3. Run `npm run build` to ensure it builds successfully
4. Deploy using the deployment scripts

## 🔄 Rollback

If something goes wrong:
```bash
ssh root@5.183.11.252 'pm2 restart docm-cics-web'
ssh root@5.183.11.252 'pm2 restart docm-cics-admin'
```

## 📞 Support

- Server IP: 5.183.11.252
- PM2 Process Names: `docm-cics-web`, `docm-cics-admin`
- SSL Certificates: Auto-renewing Let's Encrypt
- Database: Supabase (managed externally) 