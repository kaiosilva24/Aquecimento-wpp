#!/bin/bash

echo "🔧 Tuning Oracle Server for High Concurrency..."

# 1. Increase System File Descriptor Limits
echo "📂 Increasing File Descriptors..."
sudo sh -c 'echo "fs.file-max = 100000" >> /etc/sysctl.conf'
sudo sh -c 'echo "* soft nofile 65535" >> /etc/security/limits.conf'
sudo sh -c 'echo "* hard nofile 65535" >> /etc/security/limits.conf'
sudo sh -c 'echo "root soft nofile 65535" >> /etc/security/limits.conf'
sudo sh -c 'echo "root hard nofile 65535" >> /etc/security/limits.conf'

# 2. Optimize Kernel Network Parameters
echo "🌐 Optimizing TCP Stack..."
sudo sh -c 'cat >> /etc/sysctl.conf <<EOF
# Network Tuning
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65000
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 5
EOF'

# Apply changes
sudo sysctl -p

# 3. Apply ulimit immediately for current session
ulimit -n 65535

echo "✅ Server Tuned! Restarting services recommended."
