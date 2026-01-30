#!/bin/bash
PRIV_FILE=$(sudo cat /etc/wireguard/server_private.key)
PRIV_CONF=$(sudo grep PrivateKey /etc/wireguard/wg0.conf | cut -d " " -f 3)
PUB_FILE=$(sudo cat /etc/wireguard/server_public.key)
PUB_CALC=$(echo $PRIV_FILE | wg pubkey)
CLIENT_PEER_PUB=$(cat ~/oracle_scripts/a32.conf | grep PublicKey | cut -d " " -f 3)

echo "--- DIAGNOSTIC RESULTS ---"
if [ "$PRIV_FILE" == "$PRIV_CONF" ]; then 
    echo "✅ wg0.conf PrivateKey MATCHES file"
else 
    echo "❌ wg0.conf PrivateKey MISMATCH"
    echo "File: $PRIV_FILE"
    echo "Conf: $PRIV_CONF"
fi

if [ "$PUB_FILE" == "$PUB_CALC" ]; then 
    echo "✅ Server Public Key File MATCHES Private Key"
else 
    echo "❌ Server Public Key File MISMATCH"
    echo "File: $PUB_FILE"
    echo "Calc: $PUB_CALC"
fi

if [ "$CLIENT_PEER_PUB" == "$PUB_CALC" ]; then 
    echo "✅ Client Config uses CORRECT Server PubKey"
else 
    echo "❌ Client Config uses WRONG Server PubKey"
    echo "Client has: $CLIENT_PEER_PUB"
    echo "Server is: $PUB_CALC"
fi
