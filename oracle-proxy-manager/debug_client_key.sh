#!/bin/bash
CLIENT_PRIV="qLyDObUNdQF59PGQDMVuYt177/kUh9PUwAl8XyLFfG0="
CLIENT_PUB=$(echo $CLIENT_PRIV | wg pubkey)
echo "--- CLIENT CALC ---"
echo "Client Private: $CLIENT_PRIV"
echo "Client Public:  $CLIENT_PUB"

echo "--- SERVER WG0.CONF SEARCH ---"
# Find the block for 10.0.0.2
grep -B 2 "AllowedIPs = 10.0.0.2/32" /etc/wireguard/wg0.conf

SERVER_PEER_PUB=$(grep -B 2 "AllowedIPs = 10.0.0.2/32" /etc/wireguard/wg0.conf | grep PublicKey | awk '{print $3}')
echo "Server Configured PubKey: $SERVER_PEER_PUB"

if [ "$CLIENT_PUB" == "$SERVER_PEER_PUB" ]; then
    echo "✅ KEYS MATCH!"
else
    echo "❌ KEY MISMATCH!"
fi

echo "--- ACTIVE WG STATUS ---"
sudo wg show wg0 | grep -A 4 "$SERVER_PEER_PUB"
