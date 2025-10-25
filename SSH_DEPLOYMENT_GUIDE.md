# 🚀 SSH Deployment Guide for DOCM CICS

## **Perfect! You're right - let's deploy directly via SSH**

Instead of manually uploading files, we'll deploy directly from your local machine to your server using SSH. This is much more efficient and automated.

## **📋 Prerequisites**

1. **A VPS Server** (DigitalOcean, AWS, Linode, etc.)
2. **Server IP address** or hostname
3. **SSH access** to your server
4. **Root or sudo access** on the server

## **🔧 Step-by-Step SSH Deployment**

### **Step 1: Set Up SSH Connection**

First, let's set up SSH keys for secure, passwordless connection:

```bash
# Set up SSH keys and connection
./setup-ssh.sh YOUR_SERVER_IP USERNAME

# Examples:
./setup-ssh.sh 192.168.1.100 ubuntu     # For Ubuntu server
./setup-ssh.sh your-server.com root      # For root access
./setup-ssh.sh 134.195.196.26 ubuntu    # With IP address
```

This script will:
- Create SSH keys if needed
- Copy your key to the server
- Test the connection
- Confirm everything is working

### **Step 2: Deploy Your Application**

Once SSH is set up, deploy with a single command:

```bash
# Deploy to your server
./deploy-ssh.sh YOUR_SERVER_IP USERNAME

# Examples:
./deploy-ssh.sh 192.168.1.100 ubuntu
./deploy-ssh.sh your-server.com root
```

## **🎯 What the SSH Deployment Does**

The deployment script automatically:

1. **✅ Builds your app locally** - Compiles the admin panel
2. **✅ Creates deployment package** - Packages all necessary files
3. **✅ Uploads to server** - Transfers files via SSH
4. **✅ Sets up server** - Installs Node.js, nginx, PM2, certbot
5. **✅ Configures environment** - Sets up production environment
6. **✅ Starts application** - Runs your app with PM2
7. **✅ Configures nginx** - Sets up reverse proxy
8. **✅ Installs SSL** - Automatically gets Let's Encrypt certificate
9. **✅ Verifies deployment** - Checks everything is running

## **🌐 DNS Configuration**

After deployment, update your DNS:

- **A Record:** `admin.docmchurch.org` → `YOUR_SERVER_IP`
- **A Record:** `docmchurch.org` → `YOUR_SERVER_IP`

## **📱 Your URLs After Deployment**

- **Admin Panel:** `https://admin.docmchurch.org`
- **Mobile App API:** `https://admin.docmchurch.org/api/`

## **🔧 Post-Deployment Configuration**

After deployment, you may want to update:

1. **Email Settings** - Update SMTP credentials
2. **Stripe Keys** - Switch to live keys when ready
3. **Database** - Verify all connections work
4. **SSL Certificate** - Should be automatic with Let's Encrypt

## **🎯 Example Complete Deployment**

```bash
# 1. Set up SSH (one-time setup)
./setup-ssh.sh 192.168.1.100 ubuntu

# 2. Deploy application
./deploy-ssh.sh 192.168.1.100 ubuntu

# 3. Update DNS to point to 192.168.1.100
# 4. Visit https://admin.docmchurch.org
```

## **🔍 Troubleshooting**

### **SSH Connection Issues:**
```bash
# Test SSH manually
ssh ubuntu@192.168.1.100

# Copy SSH key manually if needed
ssh-copy-id ubuntu@192.168.1.100
```

### **Check Server Status:**
```bash
# SSH into server and check
ssh ubuntu@192.168.1.100
pm2 list                    # Check app status
sudo systemctl status nginx # Check nginx
sudo certbot certificates   # Check SSL
```

### **View Logs:**
```bash
# On server
pm2 logs docm-cics-admin   # Application logs
sudo tail -f /var/log/nginx/error.log  # Nginx logs
```

## **🎉 Your App Features (Ready to Go)**

Your DOCM CICS application includes:
- ✅ **Admin Panel** - Complete church management system
- ✅ **Mobile App API** - All endpoints for mobile app
- ✅ **User Management** - Admin/member separation
- ✅ **Stripe Integration** - Payment processing
- ✅ **Profile Pictures** - File upload functionality
- ✅ **Prayer & Ride Requests** - Community features
- ✅ **Giving History** - Financial tracking

## **💡 Pro Tips**

1. **Keep SSH Keys Safe** - Your private key allows server access
2. **Regular Updates** - Re-run deployment script for updates
3. **Monitor Resources** - Watch CPU/memory usage on server
4. **Backup Data** - Regular database backups recommended
5. **Test Payments** - Use Stripe test keys before going live

---

**Ready to deploy? Let's start with setting up SSH!**

```bash
./setup-ssh.sh YOUR_SERVER_IP USERNAME
``` 