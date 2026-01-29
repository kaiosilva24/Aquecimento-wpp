#!/bin/bash
# Restart backend server

echo "Stopping existing backend..."
pkill -f "node.*server.js" || true
sleep 2

echo "Starting backend..."
cd ~/backend
nohup node server.js > ../server.log 2>&1 &

sleep 3
echo "Backend started!"
echo ""
echo "Checking if it's running..."
ps aux | grep "node.*server.js" | grep -v grep
echo ""
echo "Testing API..."
curl -s http://localhost:3000/api/accounts
