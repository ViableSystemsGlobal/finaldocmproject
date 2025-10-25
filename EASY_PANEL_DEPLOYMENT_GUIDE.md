# Easy Panel Deployment Guide for DOCM Church

Complete guide to deploy your DOCM Church Management System to Hostinger VPS using Easy Panel and Docker.

---

## 📋 **Prerequisites**

✅ Hostinger VPS with Easy Panel installed  
✅ GitHub repository: `https://github.com/ViableSystemsGlobal/finaldocmproject`  
✅ Domain names configured:
   - `admin.docmchurch.org` → Admin Panel
   - `docmchurch.org` → Church Website
✅ Supabase database (already set up)  
✅ All API keys ready (Stripe, Google Maps, SMTP, etc.)

---

## 🚀 **Deployment Architecture**

You'll create **2 separate applications** in Easy Panel:

1. **DOCM Admin** (`admin.docmchurch.org`)
2. **DOCM Website** (`docmchurch.org`)

Both apps will be built from the same GitHub repository but different directories.

---

## 📦 **Step 1: Create Admin Application**

### 1.1 Add New Application
1. Log into Easy Panel (usually at `https://your-vps-ip:3000`)
2. Click **"Create Application"**
3. Choose **"GitHub Repository"**

### 1.2 Configure Repository
- **Repository URL:** `https://github.com/ViableSystemsGlobal/finaldocmproject`
- **Branch:** `main`
- **Build Type:** `Dockerfile`
- **Dockerfile Path:** `apps/admin/Dockerfile`
- **Build Context:** `/` (root)

### 1.3 Configure Domain
- **Domain:** `admin.docmchurch.org`
- **SSL:** Enable automatic SSL (Let's Encrypt)
- **Force HTTPS:** ✅ Enabled

### 1.4 Set Environment Variables

Click "Environment Variables" and add all of these:

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Domain Configuration
NEXTAUTH_URL=https://admin.docmchurch.org
NEXT_PUBLIC_SITE_URL=https://admin.docmchurch.org

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ufjfafcfkalaasdhgcbi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=your_database_url_here

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Email Configuration
NEXT_PUBLIC_EMAIL_PROVIDER=hostinger
NEXT_PUBLIC_FROM_ADDRESS=admin@docmchurch.org
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=admin@docmchurch.org
SMTP_PASS=your_smtp_password
SENDGRID_API_KEY=your_sendgrid_key

# Stripe (Use your actual keys)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 1.5 Deploy
1. Click **"Create Application"**
2. Easy Panel will:
   - Clone your repository
   - Build the Docker image (10-15 minutes first time)
   - Start the container
   - Set up SSL certificate
3. Monitor the build logs for any errors

---

## 🌐 **Step 2: Create Website Application**

### 2.1 Add New Application
1. Click **"Create Application"** again
2. Choose **"GitHub Repository"**

### 2.2 Configure Repository
- **Repository URL:** `https://github.com/ViableSystemsGlobal/finaldocmproject`
- **Branch:** `main`
- **Build Type:** `Dockerfile`
- **Dockerfile Path:** `apps/web/Dockerfile`
- **Build Context:** `/` (root)

### 2.3 Configure Domain
- **Domain:** `docmchurch.org`
- **SSL:** Enable automatic SSL (Let's Encrypt)
- **Force HTTPS:** ✅ Enabled

### 2.4 Set Environment Variables

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Domain Configuration
NEXT_PUBLIC_SITE_URL=https://docmchurch.org

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ufjfafcfkalaasdhgcbi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=your_database_url_here

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

### 2.5 Deploy
1. Click **"Create Application"**
2. Wait for the build to complete
3. Monitor build logs

---

## 🔧 **Step 3: Configure DNS**

If not already done, update your DNS records:

### At Your Domain Registrar:
```
Type    Name    Value               TTL
A       @       5.183.11.252       3600
A       admin   5.183.11.252       3600
A       www     5.183.11.252       3600
```

**Wait 5-10 minutes** for DNS propagation.

---

## ✅ **Step 4: Verify Deployment**

### 4.1 Check Admin Panel
1. Visit `https://admin.docmchurch.org`
2. You should see the login page
3. Log in with your credentials
4. Check that all features work

### 4.2 Check Website
1. Visit `https://docmchurch.org`
2. You should see the homepage
3. Navigate through different pages
4. Test the contact form

### 4.3 Check SSL
Both sites should have:
- 🔒 Padlock icon in browser
- Valid SSL certificate
- No mixed content warnings

---

## 📊 **Step 5: Monitoring & Maintenance**

### Application Logs
- In Easy Panel, click on each app
- Go to **"Logs"** tab
- Monitor for errors

### Resource Usage
- Check **"Metrics"** tab
- Monitor CPU, Memory, and Disk usage
- Adjust if needed

### Restart Apps
If you need to restart:
1. Go to application page
2. Click **"Restart"**
3. Wait for the app to come back online

---

## 🔄 **Step 6: Auto-Deploy on Git Push**

Easy Panel can automatically redeploy when you push to GitHub:

### Enable Webhooks
1. In Easy Panel app settings
2. Enable **"Auto Deploy"**
3. Copy the webhook URL
4. Go to GitHub repository settings
5. Add webhook:
   - **Payload URL:** (paste Easy Panel webhook)
   - **Content type:** `application/json`
   - **Events:** Just the push event
6. Save webhook

Now every time you push to `main`, Easy Panel will:
1. Pull latest code
2. Rebuild Docker image
3. Restart the application

---

## 🚨 **Troubleshooting**

### Build Fails
**Issue:** Docker build fails  
**Solution:**
- Check build logs in Easy Panel
- Ensure all dependencies are in `package.json`
- Verify `next.config.ts` has `output: 'standalone'`

### App Won't Start
**Issue:** Container crashes on startup  
**Solution:**
- Check environment variables are correct
- Verify database connection strings
- Check app logs for specific errors

### SSL Certificate Issues
**Issue:** SSL not working  
**Solution:**
- Ensure DNS is pointing to correct IP
- Wait 10 minutes for Let's Encrypt
- Check domain configuration in Easy Panel

### Can't Access Admin/Website
**Issue:** Domain doesn't resolve  
**Solution:**
- Verify DNS records are correct
- Use `nslookup admin.docmchurch.org` to check
- Wait for DNS propagation (up to 24 hours)

### Database Connection Errors
**Issue:** Apps can't connect to Supabase  
**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid
- Test connection from VPS: `curl https://your-supabase-url.supabase.co`

---

## 📝 **Important Notes**

### Memory Requirements
- **Admin App:** ~800MB RAM
- **Website App:** ~700MB RAM
- **Total:** ~1.5GB minimum
- **Recommended:** 2GB+ VPS

### Build Time
- **First build:** 10-15 minutes (downloads dependencies)
- **Subsequent builds:** 5-10 minutes (uses cache)

### Database Migrations
Run these **once** before deploying:
```sql
-- In Supabase SQL Editor:
-- 1. Run SIMPLE_WORD_OF_YEAR_SQL.sql
-- 2. Run create_contact_submissions_table.sql
-- 3. Run add_lifecycle_to_contact_submissions.sql
```

### Stripe Webhooks
After deployment, update Stripe webhook URLs:
1. Go to Stripe Dashboard
2. Add webhook endpoint: `https://admin.docmchurch.org/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `customer.subscription.created`, etc.

---

## 🎯 **Success Checklist**

Before going live, verify:

- ✅ Both apps are running without errors
- ✅ SSL certificates are valid on both domains
- ✅ Admin panel login works
- ✅ Database connections are working
- ✅ All environment variables are set
- ✅ Email sending works
- ✅ Stripe payments work (test mode first!)
- ✅ Google Maps displays correctly
- ✅ QR code system works
- ✅ Word of the Year displays on homepage
- ✅ Mobile app can connect to admin API

---

## 🆘 **Support**

If you run into issues:

1. **Check Easy Panel Logs** (most issues show here)
2. **Check Browser Console** for frontend errors
3. **Check Supabase Logs** for database errors
4. **Verify Environment Variables** (90% of issues!)

---

## 🎉 **You're Done!**

Your DOCM Church Management System is now live on Easy Panel!

**Next Steps:**
1. Test all features thoroughly
2. Switch Stripe to live mode
3. Train your team on the admin panel
4. Share the QR code for member submissions
5. Monitor logs for the first few days

**Happy Managing! 🙏**

