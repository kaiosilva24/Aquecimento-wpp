#!/bin/bash
set -e

# Check if client name provided
if [ -z "$1" ]; then
    echo "Usage: $0 <client-name>"
    echo "Example: $0 s7"
    exit 1
fi

CLIENT_NAME="$1"
OUTPUT_DIR="/root/openvpn-clients"
OVPN_FILE="$OUTPUT_DIR/${CLIENT_NAME}.ovpn"

echo "╔════════════════════════════════════════════╗"
echo "║   OpenVPN Client Configuration Generator  ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📱 Generating configuration for: $CLIENT_NAME"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Navigate to Easy-RSA directory
cd ~/openvpn-ca

# Check if client already exists
if [ -f "pki/issued/${CLIENT_NAME}.crt" ]; then
    echo "⚠️  Client '$CLIENT_NAME' already exists. Using existing certificates."
else
    echo "🔑 Generating client certificate..."
    ./easyrsa --batch build-client-full "$CLIENT_NAME" nopass
fi

# Get server public IP
SERVER_IP=$(curl -s ifconfig.me)

echo "📝 Creating .ovpn configuration file..."

# Create base configuration
cat > "$OVPN_FILE" << EOF
client
dev tun
proto udp
remote $SERVER_IP 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
compress lz4-v2
verb 3
key-direction 1

<ca>
EOF

# Append CA certificate
cat pki/ca.crt >> "$OVPN_FILE"

cat >> "$OVPN_FILE" << EOF
</ca>

<cert>
EOF

# Append client certificate
sed -n '/BEGIN CERTIFICATE/,/END CERTIFICATE/p' pki/issued/${CLIENT_NAME}.crt >> "$OVPN_FILE"

cat >> "$OVPN_FILE" << EOF
</cert>

<key>
EOF

# Append client private key
cat pki/private/${CLIENT_NAME}.key >> "$OVPN_FILE"

cat >> "$OVPN_FILE" << EOF
</key>

<tls-auth>
EOF

# Append TLS-Auth key
cat pki/ta.key >> "$OVPN_FILE"

cat >> "$OVPN_FILE" << EOF
</tls-auth>
EOF

echo ""
echo "✅ Client configuration created successfully!"
echo ""
echo "📄 File location: $OVPN_FILE"
echo "📱 Server IP: $SERVER_IP"
echo ""
echo "🔧 Next steps:"
echo "1. Download this file to your mobile device"
echo "2. Install 'OpenVPN Connect' app from Play Store"
echo "3. Import the .ovpn file"
echo "4. Connect with one tap!"
echo ""
echo "💡 To download the file:"
echo "   scp ubuntu@$SERVER_IP:$OVPN_FILE ."
echo ""
