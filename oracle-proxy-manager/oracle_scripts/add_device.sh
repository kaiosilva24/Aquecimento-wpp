#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./add_device.sh <device_name> <device_ip_suffix>"
    exit 1
fi

DEVICE_NAME=$1
IP_SUFFIX=$2
CLIENT_IP="10.0.0.${IP_SUFFIX}"
SERVER_PUB_KEY=$(sudo cat /etc/wireguard/server_public.key)
SERVER_ENDPOINT=$(curl -s ifconfig.me):51820
CONF_FILE="/etc/wireguard/wg0.conf"

# 1. Check if Name already exists
if grep -q "# Name: $DEVICE_NAME" "$CONF_FILE"; then
    echo "Error: Device name '$DEVICE_NAME' already exists!"
    exit 1
fi

# 2. Check if IP already exists (avoid port conflict)
if grep -q "AllowedIPs = $CLIENT_IP/32" "$CONF_FILE"; then
    echo "Error: IP 10.0.0.$IP_SUFFIX is already in use!"
    exit 1
fi

echo "📱 Adding Device: $DEVICE_NAME ($CLIENT_IP)"

# Generate Client Keys
CLIENT_PRIV_KEY=$(wg genkey)
CLIENT_PUB_KEY=$(echo "$CLIENT_PRIV_KEY" | wg pubkey)

# Add Peer to Server Config
sudo bash -c "cat >> $CONF_FILE << EOF

[Peer]
# Name: $DEVICE_NAME
PublicKey = $CLIENT_PUB_KEY
AllowedIPs = $CLIENT_IP/32
EOF"

# Reload Server
# Use reload or restart to ensure config is picked up
sudo systemctl restart wg-quick@wg0

# Create Client Config File
cat > "${DEVICE_NAME}.conf" << EOF
[Interface]
PrivateKey = $CLIENT_PRIV_KEY
Address = $CLIENT_IP/24
DNS = 8.8.8.8

[Peer]
PublicKey = $SERVER_PUB_KEY
Endpoint = $SERVER_ENDPOINT
AllowedIPs = 10.0.0.0/24, 0.0.0.0/0
PersistentKeepalive = 25
EOF

# Install qrencode if missing
if ! command -v qrencode &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y qrencode
fi

# Show QR Code
echo ""
echo "📷 Scan this QR Code with the WireGuard App on your phone:"
qrencode -t ansiutf8 < "${DEVICE_NAME}.conf"
echo ""
echo "✅ Config saved to ${DEVICE_NAME}.conf"

# Refresh Gateway to open new port
sudo ./refresh_gateway.sh
