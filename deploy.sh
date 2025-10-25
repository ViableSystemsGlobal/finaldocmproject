#!/bin/bash

# DOCM CICS Production Deployment Script
# This script helps deploy your application to production

echo "🚀 DOCM CICS Production Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide your domain name${NC}"
    echo "Usage: ./deploy.sh your-domain.com"
    exit 1
fi

DOMAIN=$1
echo -e "${GREEN}Deploying to domain: $DOMAIN${NC}"

# Step 1: Create production environment file
echo -e "${YELLOW}Step 1: Creating production environment file...${NC}"
cp apps/admin/.env.production.template apps/admin/.env.production
sed -i "s/your-domain.com/$DOMAIN/g" apps/admin/.env.production
echo "✅ Environment file created at apps/admin/.env.production"
echo "   Please update it with your actual values before proceeding"

# Step 2: Update mobile app environment for production
echo -e "${YELLOW}Step 2: Mobile app environment already configured for production${NC}"
echo "✅ Mobile app will use https://admin.$DOMAIN in production"

# Step 3: Build admin application
echo -e "${YELLOW}Step 3: Building admin application...${NC}"
cd apps/admin
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Admin app built successfully"
else
    echo -e "${RED}❌ Admin app build failed${NC}"
    exit 1
fi
cd ../..

# Step 4: Create deployment package
echo -e "${YELLOW}Step 4: Creating deployment package...${NC}"
mkdir -p deployment
tar -czf deployment/docm-cics-production.tar.gz \
    apps/admin/.next \
    apps/admin/package.json \
    apps/admin/next.config.* \
    apps/admin/public \
    apps/admin/.env.production \
    apps/mobile/src \
    apps/mobile/app.json \
    apps/mobile/package.json \
    package.json \
    --exclude=node_modules \
    --exclude=.git
echo "✅ Deployment package created: deployment/docm-cics-production.tar.gz"

# Step 5: Display next steps
echo -e "${GREEN}🎉 Deployment package ready!${NC}"
echo ""
echo "Next steps:"
echo "1. Update apps/admin/.env.production with your actual values"
echo "2. Upload deployment/docm-cics-production.tar.gz to your server"
echo "3. Run the server setup commands (see below)"
echo ""
echo "Server setup commands:"
echo "======================"
echo "# On your server:"
echo "tar -xzf docm-cics-production.tar.gz"
echo "cd apps/admin"
echo "npm install --production"
echo "npm run start"
echo ""
echo "Nginx configuration needed:"
echo "=========================="
echo "server {"
echo "    listen 80;"
echo "    server_name admin.$DOMAIN;"
echo "    location / {"
echo "        proxy_pass http://localhost:3000;"
echo "        proxy_set_header Host \$host;"
echo "        proxy_set_header X-Real-IP \$remote_addr;"
echo "    }"
echo "}"
echo ""
echo "Don't forget to:"
echo "- Set up SSL with Let's Encrypt"
echo "- Configure DNS A record for admin.$DOMAIN"
echo "- Update Stripe settings to live keys when ready"
echo "- Test all functionality after deployment" 