#!/bin/bash
set -e
sudo systemctl stop wg-quick@wg0 || true
umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key
wg genkey | tee client_private.key | wg pubkey > client_public.key
SERVER_PRIV=$(cat server_private.key)
SERVER_PUB=$(cat server_public.key)
CLIENT_PRIV=$(cat client_private.key)
CLIENT_PUB=$(cat client_public.key)

sudo bash -c "cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIV
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o ens3 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o ens3 -j MASQUERADE

[Peer]
PublicKey = $CLIENT_PUB
AllowedIPs = 10.0.0.2/32
EOF"

sudo systemctl start wg-quick@wg0

echo "---CLIENT_CONFIG_START---"
echo "[Interface]"
echo "PrivateKey = $CLIENT_PRIV"
echo "Address = 10.0.0.2/24"
echo "DNS = 8.8.8.8"
echo ""
echo "[Peer]"
echo "PublicKey = $SERVER_PUB"
echo "Endpoint = 157.151.26.190:51820"
echo "AllowedIPs = 0.0.0.0/0"
echo "PersistentKeepalive = 25"
echo "---CLIENT_CONFIG_END---"
