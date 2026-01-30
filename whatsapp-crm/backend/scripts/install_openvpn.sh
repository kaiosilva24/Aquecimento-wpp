#!/bin/bash
set -e

echo "╔════════════════════════════════════════════╗"
echo "║   OpenVPN Server Installation Script      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "📦 Installing OpenVPN and Easy-RSA..."
apt-get update -qq
apt-get install -y openvpn easy-rsa iptables-persistent

echo "📁 Setting up PKI directory..."
make-cadir ~/openvpn-ca
cd ~/openvpn-ca

echo "🔧 Configuring Easy-RSA..."
cat > vars << 'EOF'
set_var EASYRSA_REQ_COUNTRY    "BR"
set_var EASYRSA_REQ_PROVINCE   "SP"
set_var EASYRSA_REQ_CITY       "SaoPaulo"
set_var EASYRSA_REQ_ORG        "WhatsAppWarming"
set_var EASYRSA_REQ_EMAIL      "admin@whatsappwarming.local"
set_var EASYRSA_REQ_OU         "VPN"
set_var EASYRSA_ALGO           "ec"
set_var EASYRSA_DIGEST         "sha512"
EOF

echo "🔐 Initializing PKI..."
./easyrsa init-pki

echo "🔑 Building CA..."
./easyrsa --batch build-ca nopass

echo "🔑 Generating server certificate..."
./easyrsa --batch build-server-full server nopass

echo "🔑 Generating Diffie-Hellman parameters..."
./easyrsa gen-dh

echo "🔑 Generating TLS-Auth key..."
openvpn --genkey secret pki/ta.key

echo "📋 Copying certificates to OpenVPN directory..."
cp pki/ca.crt pki/private/ca.key pki/issued/server.crt pki/private/server.key pki/dh.pem pki/ta.key /etc/openvpn/server/

echo "⚙️  Creating server configuration..."
cat > /etc/openvpn/server/server.conf << 'EOF'
# OpenVPN Server Configuration
port 1194
proto udp
dev tun

# Certificates and keys
ca ca.crt
cert server.crt
key server.key
dh dh.pem
tls-auth ta.key 0

# Network configuration
server 10.8.0.0 255.255.255.0
topology subnet

# Push routes to clients
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Client configuration
client-to-client
keepalive 10 120
cipher AES-256-GCM
auth SHA256
compress lz4-v2
push "compress lz4-v2"

# Performance
max-clients 100
user nobody
group nogroup
persist-key
persist-tun

# Logging
status /var/log/openvpn/openvpn-status.log
log-append /var/log/openvpn/openvpn.log
verb 3
explicit-exit-notify 1
EOF

echo "📁 Creating log directory..."
mkdir -p /var/log/openvpn

echo "🌐 Enabling IP forwarding..."
echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
sysctl -p

echo "🔥 Configuring firewall..."
# Get primary network interface
PRIMARY_INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)

# Add NAT rule for OpenVPN
iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o $PRIMARY_INTERFACE -j MASQUERADE

# Allow OpenVPN traffic
iptables -A INPUT -p udp --dport 1194 -j ACCEPT
iptables -A FORWARD -i tun0 -j ACCEPT
iptables -A FORWARD -o tun0 -j ACCEPT

# Save iptables rules
netfilter-persistent save

echo "🚀 Starting OpenVPN service..."
systemctl enable openvpn-server@server
systemctl start openvpn-server@server

echo ""
echo "✅ OpenVPN server installed successfully!"
echo ""
echo "📊 Server Status:"
systemctl status openvpn-server@server --no-pager | head -n 10
echo ""
echo "🔧 Next steps:"
echo "1. Generate client configurations"
echo "2. Download .ovpn file to mobile device"
echo "3. Import into OpenVPN Connect app"
echo ""
