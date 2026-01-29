#!/bin/bash
# Build frontend and serve with Python HTTP server

cd ~/frontend

echo "Building frontend..."
npm run build

echo "Starting HTTP server on port 5173..."
cd dist
nohup python3 -m http.server 5173 > ../../frontend_http.log 2>&1 &

sleep 3
echo "Server started!"
echo ""
echo "Testing..."
curl -s http://localhost:5173 | head -10
