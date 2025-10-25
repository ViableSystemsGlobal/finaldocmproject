#!/bin/bash

echo "🚀 Deploying Web App to Production Server..."

# Build the application
echo "📦 Building application..."
cd apps/web
pnpm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd ../..
tar -czf web-deploy.tar.gz -C apps/web .next package.json next.config.ts public src

# Upload to server
echo "🌐 Uploading to server..."
scp web-deploy.tar.gz root@5.183.11.252:/tmp/

# Deploy on server
echo "🔄 Deploying on server..."
ssh root@5.183.11.252 << 'EOF'
cd /root/docm-cics/apps/web
tar -xzf /tmp/web-deploy.tar.gz
pm2 restart docm-cics-web
rm /tmp/web-deploy.tar.gz
EOF

# Cleanup
rm web-deploy.tar.gz

echo "✅ Web app deployed successfully!"
echo "🌐 Visit: https://www.docmchurch.org" 