#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./add_device.sh <device_name> <device_ip_suffix>"
    echo "Example: ./add_device.sh myphone 10"
    exit 1
fi

DEVICE_NAME=$1
IP_SUFFIX=$2
CLIENT_IP="10.0.0.${IP_SUFFIX}"

# Get Server Details
SERVER_PUB_KEY=$(sudo cat /etc/wireguard/server_public.key)
# UPDATED: Use Port 443 (UDP) to secure connection against blocking
SERVER_ENDPOINT="157.151.26.190:443"

# Generate Client Keys
CLIENT_PRIV_KEY=$(wg genkey)
CLIENT_PUB_KEY=$(echo $CLIENT_PRIV_KEY | wg pubkey)

echo "📱 Adding Device: $DEVICE_NAME ($CLIENT_IP)"

# Add Peer to Server Config (Appends to wg0.conf)
sudo bash -c "cat >> /etc/wireguard/wg0.conf << EOF

[Peer]
# Name: $DEVICE_NAME
PublicKey = $CLIENT_PUB_KEY
AllowedIPs = ${CLIENT_IP}/32
EOF"

# Create Client Config File
# UPDATED: AllowedIPs 10.0.0.0/24 (VPN only, no DNS needed)
cat > ${DEVICE_NAME}.conf << EOF
[Interface]
PrivateKey = $CLIENT_PRIV_KEY
Address = $CLIENT_IP/24
MTU = 1280
# DNS Removed to use mobile carrier DNS

[Peer]
PublicKey = $SERVER_PUB_KEY
Endpoint = $SERVER_ENDPOINT
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
EOF

# Restart WireGuard Interface to apply changes
sudo systemctl restart wg-quick@wg0

# Refresh Gateway Ports (socat)
sudo ./refresh_gateway.sh

# Display QR Code
if command -v qrencode &> /dev/null; then
    qrencode -t ansiutf8 < ${DEVICE_NAME}.conf
else
    echo "Instalando qrencode..."
    sudo apt-get install -y qrencode
    qrencode -t ansiutf8 < ${DEVICE_NAME}.conf
fi

echo "✅ Device $DEVICE_NAME added!"
echo "📄 Config file saved to: ${DEVICE_NAME}.conf"
