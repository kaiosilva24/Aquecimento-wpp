#!/bin/bash
# Rebuild frontend with production API URL and restart server

echo "Stopping HTTP server..."
pkill -f "python3 -m http.server 5173" || true
sleep 2

echo "Rebuilding frontend with production settings..."
cd ~/frontend
npm run build

echo "Starting HTTP server on port 5173..."
cd dist
nohup python3 -m http.server 5173 > /tmp/frontend.log 2>&1 &

sleep 3
echo "Server restarted!"
echo ""
echo "Testing..."
curl -s http://localhost:5173 | head -10
