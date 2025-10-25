#!/bin/bash

echo "🚀 Deploying Admin App to Production Server..."

# Build the application
echo "📦 Building application..."
cd apps/admin
pnpm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd ../..
tar -czf admin-deploy.tar.gz -C apps/admin .next package.json next.config.js public src

# Upload to server
echo "🌐 Uploading to server..."
scp admin-deploy.tar.gz root@5.183.11.252:/tmp/

# Deploy on server
echo "🔄 Deploying on server..."
ssh root@5.183.11.252 << 'EOF'
cd /root/docm-cics/apps/admin
tar -xzf /tmp/admin-deploy.tar.gz
pm2 restart docm-cics-admin
rm /tmp/admin-deploy.tar.gz
EOF

# Cleanup
rm admin-deploy.tar.gz

echo "✅ Admin app deployed successfully!"
echo "🌐 Visit: https://admin.docmchurch.org" 