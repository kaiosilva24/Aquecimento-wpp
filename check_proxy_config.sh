#!/bin/bash
cd ~/whatsapp-warming
echo "=== Proxies in Database ==="
sqlite3 warming.db "SELECT id, name, host, port, protocol, active FROM proxies;"

echo -e "\n=== Accounts and their Proxies ==="
sqlite3 warming.db "SELECT id, name, network_mode, proxy_id, status FROM accounts;"

echo -e "\n=== Testing Proxy API ==="
curl -s http://localhost:3000/api/proxy | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/proxy
