#!/bin/bash

# Kill all existing socat forwards to refresh
sudo pkill -f "socat TCP4-LISTEN"

echo "🔄 Refreshing Gateway Ports..."
ulimit -n 65535

# Iterates through lines mapping IPs.
# We assume standard config format: AllowedIPs = 10.0.0.X/32
grep "AllowedIPs = 10.0.0." /etc/wireguard/wg0.conf | while read -r line ; do
    # Extract IP: 10.0.0.X
    IP=$(echo $line | awk -F '[ /]' '{print $3}')
    SUFFIX=$(echo $IP | awk -F '.' '{print $4}')
    
    # Calculate Port: 3000 + (Suffix - 1)
    PORT=$((3000 + SUFFIX - 1))
    
    # Remove potential Windows line endings
    IP=$(echo "$IP" | tr -d '\r')
    
    echo "DEBUG: Forwarding $IP (Suffix $SUFFIX) -> Port $PORT"
    
    # Start socat with nohup to persist after shell closes
    # Forward to HTTP proxy (Tinyproxy) on port 8888 with Keepalive
    sudo nohup socat -d -d TCP4-LISTEN:$PORT,fork,reuseaddr,keepalive,keepidle=60,keepintvl=10,keepcnt=3 TCP4:$IP:8888,keepalive,keepidle=60,keepintvl=10,keepcnt=3 >> /var/log/socat.log 2>&1 &
    
    # Open Firewall Port (if not already open)
    sudo iptables -C INPUT -p tcp --dport $PORT -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport $PORT -j ACCEPT
done

sudo netfilter-persistent save

echo "✅ Gateway Refreshed!"
