#!/bin/bash

# Get the keys
SERVER_PRIVATE=$(sudo cat /etc/wireguard/server_private.key)
CLIENT_PUBLIC=$(sudo cat /etc/wireguard/client_public.key)

# Create server config
sudo bash -c "cat > /etc/wireguard/wg0.conf << 'EOF'
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = ${SERVER_PRIVATE}
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

[Peer]
PublicKey = ${CLIENT_PUBLIC}
AllowedIPs = 10.0.0.2/32
EOF"

# Replace placeholders
sudo sed -i "s|\${SERVER_PRIVATE}|${SERVER_PRIVATE}|g" /etc/wireguard/wg0.conf
sudo sed -i "s|\${CLIENT_PUBLIC}|${CLIENT_PUBLIC}|g" /etc/wireguard/wg0.conf

# Set permissions
sudo chmod 600 /etc/wireguard/wg0.conf

# Enable IP forwarding
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Start WireGuard
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

echo "WireGuard server configured and started!"
sudo wg show
