#!/bin/bash
# Start Vite dev server with proxy

echo "Stopping Python HTTP server..."
pkill -f "python3 -m http.server 5173" || true
sleep 2

echo "Starting Vite dev server..."
cd ~/frontend
nohup npm run dev -- --host 0.0.0.0 --port 5173 > ../frontend_vite.log 2>&1 &

sleep 5
echo "Vite dev server started!"
echo ""
echo "Checking logs..."
tail -30 ../frontend_vite.log
