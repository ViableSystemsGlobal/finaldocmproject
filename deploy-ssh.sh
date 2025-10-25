#!/bin/bash

# DOCM CICS SSH Deployment Script
# This script deploys your application directly to your server via SSH

echo "🚀 DOCM CICS SSH Deployment to docmchurch.org"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server details are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Usage: ./deploy-ssh.sh <server-ip> <username>${NC}"
    echo "Example: ./deploy-ssh.sh 192.168.1.100 ubuntu"
    echo "Example: ./deploy-ssh.sh your-server.com root"
    exit 1
fi

SERVER_IP=$1
USERNAME=$2
DOMAIN="docmchurch.org"

# Set correct home directory based on username
if [ "$USERNAME" = "root" ]; then
    HOME_DIR="/root"
else
    HOME_DIR="/home/$USERNAME"
fi

echo -e "${GREEN}Deploying to: $USERNAME@$SERVER_IP${NC}"
echo -e "${GREEN}Domain: admin.$DOMAIN${NC}"
echo -e "${GREEN}Home directory: $HOME_DIR${NC}"

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
ssh -o ConnectTimeout=10 -o BatchMode=yes $USERNAME@$SERVER_IP exit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ SSH connection failed. Please check:${NC}"
    echo "1. Server IP/hostname is correct"
    echo "2. SSH key is set up: ssh-copy-id $USERNAME@$SERVER_IP"
    echo "3. Server is running and accessible"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"

# Build application locally
echo -e "${YELLOW}Building application locally...${NC}"
cd apps/admin
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
cd ../..
echo -e "${GREEN}✅ Build completed${NC}"

# Create deployment package
echo -e "${YELLOW}Creating deployment package...${NC}"
tar --exclude='node_modules' --exclude='.git' --exclude='*.log' -czf deployment/docm-cics-production.tar.gz \
    apps/admin/.next \
    apps/admin/package.json \
    apps/admin/next.config.ts \
    apps/admin/next.config.js \
    apps/admin/public \
    apps/admin/src \
    apps/mobile/src \
    apps/mobile/app.json \
    apps/mobile/package.json \
    package.json \
    env.production.docmchurch.template \
    DOCM_CHURCH_DEPLOYMENT_INSTRUCTIONS.md

echo -e "${GREEN}✅ Deployment package created${NC}"

# Upload to server
echo -e "${YELLOW}Uploading to server...${NC}"
scp deployment/docm-cics-production.tar.gz $USERNAME@$SERVER_IP:$HOME_DIR/
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Upload completed${NC}"

# Deploy on server
echo -e "${YELLOW}Deploying on server...${NC}"
ssh $USERNAME@$SERVER_IP << ENDSSH
    set -e
    cd $HOME_DIR
    
    echo "🔧 Setting up server environment..."
    
    # Update system
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js, nginx, and certbot
    sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
    
    # Install PM2 for process management
    sudo npm install -g pm2
    
    # Extract deployment package
    echo "📦 Extracting deployment package..."
    tar -xzf docm-cics-production.tar.gz
    
    # Set up environment file
    cp env.production.docmchurch.template apps/admin/.env.production
    
    # Install dependencies
    echo "📥 Installing dependencies..."
    cd apps/admin
    npm install --production
    
    # Stop existing process if running
    pm2 stop docm-cics-admin 2>/dev/null || true
    pm2 delete docm-cics-admin 2>/dev/null || true
    
    # Start application
    echo "🚀 Starting application..."
    pm2 start npm --name "docm-cics-admin" -- start
    pm2 startup
    pm2 save
    
    echo "✅ Application started successfully!"
    
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Server deployment failed${NC}"
    exit 1
fi

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
ssh $USERNAME@$SERVER_IP << ENDSSH
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/docm-cics > /dev/null << 'EOF'
server {
    listen 80;
    server_name admin.docmchurch.org;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/docm-cics /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    echo "✅ Nginx configured successfully!"
ENDSSH

# Set up SSL
echo -e "${YELLOW}Setting up SSL certificate...${NC}"
ssh $USERNAME@$SERVER_IP << ENDSSH
    # Install SSL certificate
    sudo certbot --nginx -d admin.docmchurch.org --non-interactive --agree-tos --email admin@docmchurch.org
    
    echo "✅ SSL certificate installed!"
ENDSSH

# Final checks
echo -e "${YELLOW}Running final checks...${NC}"
ssh $USERNAME@$SERVER_IP << ENDSSH
    # Check if application is running
    pm2 list
    
    # Check Nginx status
    sudo systemctl status nginx --no-pager
    
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "Your application is now available at:"
    echo "https://admin.docmchurch.org"
    echo ""
    echo "Next steps:"
    echo "1. Update DNS to point admin.docmchurch.org to this server"
    echo "2. Test the application in your browser"
    echo "3. Update environment variables in apps/admin/.env.production if needed"
    echo "4. Switch to live Stripe keys when ready to accept real payments"
    
ENDSSH

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "Your DOCM CICS application is now running at:"
echo "https://admin.docmchurch.org"
echo ""
echo "Don't forget to:"
echo "1. Update DNS A record: admin.docmchurch.org → $SERVER_IP"
echo "2. Test all functionality"
echo "3. Update Stripe to live keys when ready" 