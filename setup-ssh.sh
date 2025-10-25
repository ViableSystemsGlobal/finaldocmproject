#!/bin/bash

# SSH Setup Helper for DOCM CICS Deployment

echo "🔑 SSH Setup Helper for DOCM CICS"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server details are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Usage: ./setup-ssh.sh <server-ip> <username>${NC}"
    echo "Example: ./setup-ssh.sh 192.168.1.100 ubuntu"
    echo "Example: ./setup-ssh.sh your-server.com root"
    exit 1
fi

SERVER_IP=$1
USERNAME=$2

echo -e "${GREEN}Setting up SSH for: $USERNAME@$SERVER_IP${NC}"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo -e "${YELLOW}No SSH key found. Creating new SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -C "docm-cics-deployment" -f ~/.ssh/id_rsa -N ""
    echo -e "${GREEN}✅ SSH key created${NC}"
else
    echo -e "${GREEN}✅ SSH key already exists${NC}"
fi

# Copy SSH key to server
echo -e "${YELLOW}Copying SSH key to server...${NC}"
echo "You'll need to enter your server password:"
ssh-copy-id $USERNAME@$SERVER_IP

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSH key copied successfully${NC}"
else
    echo -e "${RED}❌ Failed to copy SSH key${NC}"
    echo "Please make sure:"
    echo "1. Server IP/hostname is correct"
    echo "2. Username is correct"
    echo "3. Server is running and accessible"
    echo "4. SSH service is running on the server"
    exit 1
fi

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
ssh -o ConnectTimeout=10 $USERNAME@$SERVER_IP exit

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSH connection successful!${NC}"
    echo ""
    echo "🎉 SSH setup complete!"
    echo ""
    echo "You can now deploy using:"
    echo -e "${GREEN}./deploy-ssh.sh $SERVER_IP $USERNAME${NC}"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo "Please check your server configuration and try again."
    exit 1
fi 