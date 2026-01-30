#!/bin/bash
# Start frontend dev server on port 5173

echo "Killing any existing processes on port 5173..."
pkill -f "vite.*5173" || true
pkill -f "npm.*dev" || true
sleep 2

echo "Starting frontend dev server..."
cd ~/frontend
nohup npm run dev -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &

sleep 5
echo "Frontend started!"
echo ""
echo "Checking logs..."
tail -30 ../frontend.log

echo ""
echo "Checking if port is listening..."
ss -tlnp 2>/dev/null | grep 5173 || echo "Port may still be starting..."
