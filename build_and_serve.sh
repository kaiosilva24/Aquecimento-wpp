#!/bin/bash
# Build and serve frontend with simple HTTP server

echo "Building frontend..."
cd ~/frontend
npm run build

echo "Killing any existing servers on port 5173..."
pkill -f "python.*5173" || true
pkill -f "http-server.*5173" || true
sleep 2

echo "Starting HTTP server on port 5173..."
cd ~/frontend/dist
nohup python3 -m http.server 5173 > ../../frontend_http.log 2>&1 &

sleep 3
echo "HTTP server started!"
tail -20 ../../frontend_http.log

echo ""
echo "Testing connection..."
curl -s http://localhost:5173 | head -5
