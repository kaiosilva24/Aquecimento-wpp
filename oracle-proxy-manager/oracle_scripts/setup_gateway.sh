#!/bin/bash

# Configuration
# Format: PUBLIC_PORT:MOBILE_IP:MOBILE_SOCKS_PORT
# Example: 3001:10.0.0.3:1080 (Traffic to Oracle:3001 goes to Mobile 10.0.0.3 port 1080)
MAPPINGS=(
    "3001:10.0.0.2:1080"
    "3002:10.0.0.3:1080"
    "3003:10.0.0.4:1080"
    "3004:10.0.0.5:1080"
)

echo "🔧 Configuring Proxy Gateway Forwarding..."

# Install socat if missing
if ! command -v socat &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y socat
fi

# Kill existing socat processes to refresh
sudo pkill socat

for mapping in "${MAPPINGS[@]}"; do
    IFS=':' read -r PUBLIC_PORT MOBILE_IP MOBILE_PORT <<< "$mapping"
    
    echo "🔀 Forwarding Public :$PUBLIC_PORT -> $MOBILE_IP:$MOBILE_PORT"
    
    # Start socat in background
    # TCP4-LISTEN: Listen on public port
    # TCP4: Connect to mobile IP through VPN
    # fork: Handle multiple connections
    # reuseaddr: Allow quick restart
    sudo socat TCP4-LISTEN:$PUBLIC_PORT,fork,reuseaddr TCP4:$MOBILE_IP:$MOBILE_PORT &
done

echo "✅ Gateway is active!"
echo "⚠️  Ensure ports 3001-3004 are open in Oracle Cloud Security List (Ingress Rules)"
