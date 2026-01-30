#!/bin/bash
PRIV=$(sudo cat /etc/wireguard/server_private.key)
sudo sed -i "s|^PrivateKey = .*|PrivateKey = $PRIV|" /etc/wireguard/wg0.conf
echo "Updated PrivateKey in wg0.conf"
sudo head -n 5 /etc/wireguard/wg0.conf
sudo systemctl restart wg-quick@wg0
echo "Restarted WireGuard"
