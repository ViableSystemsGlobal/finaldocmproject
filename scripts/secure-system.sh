#!/bin/bash

# System Security Hardening Script
# Run this after removing malware

echo "🔒 Securing System After Malware Detection"
echo "=========================================="

# 1. Remove suspicious Docker images/containers
echo ""
echo "🧹 Cleaning Docker..."
docker system prune -f
docker image prune -a -f

# 2. Check for unauthorized SSH keys
echo ""
echo "🔍 Checking SSH authorized_keys..."
if [ -f ~/.ssh/authorized_keys ]; then
    echo "Current authorized keys:"
    cat ~/.ssh/authorized_keys
    echo ""
    read -p "Review and remove any suspicious keys. Press Enter when done..."
fi

# 3. Check cron jobs
echo ""
echo "🔍 Checking cron jobs..."
crontab -l
echo ""
read -p "Review cron jobs above. Remove any suspicious entries. Press Enter when done..."

# 4. Check systemd services
echo ""
echo "🔍 Checking systemd services..."
systemctl list-units --type=service --state=running | grep -v "systemd\|dbus\|network"

# 5. Update system
echo ""
echo "🔄 Updating system packages..."
apt update && apt upgrade -y

# 6. Install security tools
echo ""
echo "🛡️  Installing security tools..."
apt install -y fail2ban ufw

# 7. Configure firewall
echo ""
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 8. Check for rootkits
echo ""
echo "🔍 Installing and running rootkit scanner..."
apt install -y rkhunter
rkhunter --update
rkhunter --check --skip-keypress

echo ""
echo "✅ Security hardening complete!"
echo ""
echo "Next steps:"
echo "1. Change all passwords"
echo "2. Rotate all API keys and secrets"
echo "3. Rebuild Docker images from scratch"
echo "4. Review system logs: journalctl -xe"
echo "5. Monitor CPU usage: watch -n 1 'top -bn1 | head -20'"

