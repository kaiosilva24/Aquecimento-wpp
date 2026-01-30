#!/bin/bash
# Start frontend in dev mode on Oracle server

echo "Killing any existing vite processes..."
pkill -f vite || true
sleep 2

echo "Starting frontend dev server..."
cd ~/frontend
nohup npm run dev -- --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &

sleep 5
echo "Frontend dev server started!"
tail -30 ../frontend.log

echo ""
echo "Checking if port 5173 is listening..."
ss -tlnp | grep 5173 || echo "Port not yet open, may need more time to start"
