#!/bin/bash

echo "🔄 Restoring Oracle Proxy Services..."

# 1. Restart WireGuard
echo "🔌 Restarting WireGuard..."
sudo systemctl restart wg-quick@wg0
sudo wg show

# 2. Refresh Socat Tunnels
echo "🔀 Refreshing Port Forwarding (Socat)..."
# Ensure script is executable
chmod +x ./oracle_scripts/refresh_gateway.sh
sudo ./oracle_scripts/refresh_gateway.sh

# 3. Restart Proxy Manager (UI)
echo "💻 Restarting Proxy Manager UI..."
sudo pkill -f "node server.js"
cd proxy_manager
sudo nohup node server.js > server.log 2>&1 &
echo "✅ Proxy Manager started on Port 3000"

echo "🚀 All Services Restored!"
echo "Check connection now."
